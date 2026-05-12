-- ════════════════════════════════════════════════════════════════════════════
-- Migração: EQUIPE — convidar usuários pra mesma farmácia
-- ════════════════════════════════════════════════════════════════════════════
--
-- O QUE FAZ:
--   1. Cria tabela `convites` (email + farmacia_id + role)
--   2. Relaxa RLS de `profiles` pra membros verem outros da mesma farmácia
--   3. Substitui `setup_nova_farmacia` por `setup_inicial`, que detecta convite
--      pendente pelo email do user logado e linka à farmácia existente. Sem
--      convite, cria farmácia nova como antes.
--
-- COMO RODAR:
--   1. Painel Supabase → SQL Editor → + New query
--   2. Cole TODO o conteúdo abaixo e clique RUN
--   3. Tem que aparecer "Success. No rows returned"
--
-- É SEGURO rodar várias vezes.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabela convites ──────────────────────────────────────────────────────
create table if not exists convites (
  id           bigserial primary key,
  email        text not null,
  farmacia_id  bigint not null references farmacias(id) on delete cascade,
  role         text not null default 'atendente'
                check (role in ('farmaceutico','atendente')),
  created_by   uuid references auth.users(id),
  created_at   timestamptz default now(),
  used_at      timestamptz,
  unique (email, farmacia_id)
);

-- Default dinâmico: INSERT vindo do frontend não precisa mencionar farmacia_id.
alter table convites alter column farmacia_id set default current_user_farmacia_id();

create index if not exists convites_email_idx      on convites (lower(email));
create index if not exists convites_farmacia_idx   on convites (farmacia_id);

alter table convites enable row level security;

drop policy if exists "tenant" on convites;
create policy "tenant" on convites for all to authenticated
  using (farmacia_id = current_user_farmacia_id())
  with check (farmacia_id = current_user_farmacia_id());

-- ── 2. Relax RLS de profiles ────────────────────────────────────────────────
-- Antes: cada user só via o próprio profile.
-- Agora: membros da mesma farmácia se enxergam (necessário pra listar Equipe).

drop policy if exists "self"         on profiles;
drop policy if exists "same_farmacia" on profiles;
drop policy if exists "self_update"  on profiles;
drop policy if exists "self_insert"  on profiles;

create policy "same_farmacia" on profiles for select to authenticated
  using (farmacia_id = current_user_farmacia_id());

create policy "self_update"  on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "self_insert"  on profiles for insert to authenticated
  with check (id = auth.uid());

create policy "self_delete"  on profiles for delete to authenticated
  using (id = auth.uid());

-- ── 3. setup_inicial: detecta convite ou cria farmácia ─────────────────────-
-- Substitui setup_nova_farmacia. Chama do frontend após auth.signUp.

drop function if exists setup_nova_farmacia(text, text);
drop function if exists setup_inicial(text, text);

create or replace function setup_inicial(
  p_nome_user     text,
  p_nome_farmacia text default null
)
returns table (
  farmacia_id   bigint,
  farmacia_nome text,
  role          text,
  veio_de_convite boolean
)
language plpgsql
security definer
as $$
declare
  v_email           text;
  v_convite         record;
  v_farmacia_id     bigint;
  v_farmacia_nome   text;
  v_role            text;
  v_veio_de_convite boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- Profile já existe? aborta (signup duplicado)
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Você já tem uma farmácia vinculada';
  end if;

  -- Pega email do user logado
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    raise exception 'Email do usuário não encontrado';
  end if;

  -- Tem convite pendente?
  select * into v_convite
  from convites
  where lower(email) = lower(v_email)
    and used_at is null
  order by created_at desc
  limit 1;

  if v_convite.id is not null then
    -- ENTRA via convite
    v_farmacia_id := v_convite.farmacia_id;
    v_role        := v_convite.role;
    v_veio_de_convite := true;

    update convites set used_at = now() where id = v_convite.id;
  else
    -- Sem convite → precisa de nome_farmacia
    if p_nome_farmacia is null or btrim(p_nome_farmacia) = '' then
      raise exception 'Informe o nome da farmácia (não há convite pendente para %)', v_email;
    end if;

    insert into farmacias (nome) values (btrim(p_nome_farmacia))
      returning id into v_farmacia_id;

    v_role := 'owner';
  end if;

  -- Cria profile
  insert into profiles (id, farmacia_id, nome, role)
  values (auth.uid(), v_farmacia_id, p_nome_user, v_role);

  -- Devolve dados
  select nome into v_farmacia_nome from farmacias where id = v_farmacia_id;
  return query select v_farmacia_id, v_farmacia_nome, v_role, v_veio_de_convite;
end;
$$;

grant execute on function setup_inicial(text, text) to authenticated;
