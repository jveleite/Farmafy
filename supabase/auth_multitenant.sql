-- ════════════════════════════════════════════════════════════════════════════
-- Migração: AUTH + MULTI-TENANT pro FarmaFy
-- ════════════════════════════════════════════════════════════════════════════
--
-- O QUE FAZ:
--   1. Cria tabelas `farmacias` e `profiles` (perfil do usuário linkado a 1 farmácia)
--   2. Adiciona coluna `farmacia_id` em TODAS as tabelas de dados
--   3. Cria função helper `current_user_farmacia_id()` (lê do profile do user logado)
--   4. Cria função `setup_nova_farmacia()` que o signup chama (SECURITY DEFINER)
--   5. Habilita RLS estrito em todas as tabelas — cada user vê só sua farmácia
--   6. Atualiza a RPC `finalizar_venda` pra propagar farmacia_id
--
-- COMO RODAR:
--   1. Painel Supabase → SQL Editor → + New query
--   2. Cole TODO o conteúdo abaixo e clique RUN
--   3. Tem que aparecer "Success. No rows returned"
--
-- DEPOIS:
--   - Criar conta no app (email + senha + nome da farmácia)
--   - Rodar `vincular_dados_existentes.sql` pra mover seus produtos/clientes/etc
--     pra sua farmácia recém-criada (instruções no arquivo)
--
-- É SEGURO rodar várias vezes (usa IF NOT EXISTS / DROP IF EXISTS).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabela farmacias ─────────────────────────────────────────────────────
create table if not exists farmacias (
  id          bigserial primary key,
  nome        text not null,
  cnpj        text,
  cidade      text,
  uf          text,
  created_at  timestamptz default now()
);

-- ── 2. Tabela profiles (1 user = 1 profile = 1 farmacia) ────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  farmacia_id  bigint not null references farmacias(id),
  nome         text,
  role         text not null default 'owner'
                check (role in ('owner','farmaceutico','atendente')),
  created_at   timestamptz default now()
);

-- ── 3. Função helper: farmacia_id do usuário logado ─────────────────────────
create or replace function current_user_farmacia_id() returns bigint
language sql stable security definer
as $$
  select farmacia_id from profiles where id = auth.uid()
$$;

grant execute on function current_user_farmacia_id() to authenticated;

-- ── 4. Função pro signup criar farmácia + profile atomicamente ──────────────
create or replace function setup_nova_farmacia(
  p_nome_user     text,
  p_nome_farmacia text
)
returns bigint
language plpgsql
security definer
as $$
declare
  v_farmacia_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Você já tem uma farmácia vinculada';
  end if;

  insert into farmacias (nome)
    values (p_nome_farmacia)
    returning id into v_farmacia_id;

  insert into profiles (id, farmacia_id, nome, role)
    values (auth.uid(), v_farmacia_id, p_nome_user, 'owner');

  return v_farmacia_id;
end;
$$;

grant execute on function setup_nova_farmacia(text, text) to authenticated;

-- ── 5. "Farmácia inicial" pra backfill dos dados pré-existentes ─────────────
-- Esta linha só insere se não existir (id=1 reservado pra dados legados).
insert into farmacias (id, nome)
  values (1, 'Farmácia Inicial (legado)')
  on conflict (id) do nothing;

-- Avança a sequence se o insert acima passou de 1
select setval(
  pg_get_serial_sequence('farmacias','id'),
  greatest((select max(id) from farmacias), 1)
);

-- ── 6. Adicionar farmacia_id nas tabelas existentes ─────────────────────────
-- Estratégia: NULLABLE com default 1 → backfill → NOT NULL + default dinâmico

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'produtos','clientes','vendas','itens_venda',
    'despesas','caixa_sessoes','caixa_movimentacoes'
  ])
  loop
    -- Adiciona coluna se não existir
    execute format(
      'alter table %I add column if not exists farmacia_id bigint references farmacias(id) default 1',
      t
    );
    -- Backfill nulls
    execute format(
      'update %I set farmacia_id = 1 where farmacia_id is null',
      t
    );
    -- NOT NULL
    execute format(
      'alter table %I alter column farmacia_id set not null',
      t
    );
    -- Default dinâmico (pra inserts feitos por user logado)
    execute format(
      'alter table %I alter column farmacia_id set default current_user_farmacia_id()',
      t
    );
    -- Index
    execute format(
      'create index if not exists %I on %I (farmacia_id)',
      t || '_farmacia_idx', t
    );
  end loop;
end $$;

-- ── 7. RLS em todas as tabelas ──────────────────────────────────────────────

alter table farmacias            enable row level security;
alter table profiles             enable row level security;
alter table produtos             enable row level security;
alter table clientes             enable row level security;
alter table vendas               enable row level security;
alter table itens_venda          enable row level security;
alter table despesas             enable row level security;
alter table caixa_sessoes        enable row level security;
alter table caixa_movimentacoes  enable row level security;

-- ── 8. Drop policies antigas (se existirem) ─────────────────────────────────
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'farmacias','profiles','produtos','clientes','vendas',
        'itens_venda','despesas','caixa_sessoes','caixa_movimentacoes'
      )
  loop
    execute format('drop policy if exists %I on %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- ── 9. Policies tenant-isoladas ─────────────────────────────────────────────

-- Profile: usuário só vê/edita o próprio
create policy "self" on profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Farmacia: usuário só vê/edita a sua
create policy "minha_farmacia" on farmacias for all to authenticated
  using (id = current_user_farmacia_id())
  with check (id = current_user_farmacia_id());

-- Demais tabelas: filtra por farmacia_id
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'produtos','clientes','vendas','itens_venda',
    'despesas','caixa_sessoes','caixa_movimentacoes'
  ])
  loop
    execute format(
      'create policy "tenant" on %I for all to authenticated
         using (farmacia_id = current_user_farmacia_id())
         with check (farmacia_id = current_user_farmacia_id())',
      t
    );
  end loop;
end $$;

-- ── 10. Atualizar finalizar_venda pra propagar farmacia_id ──────────────────
-- A função roda como SECURITY DEFINER mas dentro dela auth.uid() ainda é o
-- caller original. Como vendas/itens_venda têm default = current_user_farmacia_id(),
-- nada precisa mudar nos INSERTs — eles puxam farmacia_id automaticamente.

-- Se já existe a função, mantemos ela (o default das colunas resolve).
-- Caso queira recriar do zero, rode supabase/finalizar_venda.sql de novo
-- — ele continuará funcionando porque os defaults setam farmacia_id sozinhos.
