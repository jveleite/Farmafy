-- ════════════════════════════════════════════════════════════════════════════
-- Migração: ROLES FUNCIONAIS — endurecer RLS por role
-- ════════════════════════════════════════════════════════════════════════════
--
-- O QUE FAZ:
--   1. Cria função helper `current_user_role()` (lê role do profile do user logado)
--   2. Substitui policy "tenant" em despesas, caixa_sessoes e caixa_movimentacoes
--      por uma versão "owner_only" — só o dono da farmácia acessa.
--
-- POR QUÊ:
--   A UI já esconde menus/botões pra atendentes/farmacêuticos. Esta camada
--   garante que mesmo se alguém burlar a UI (DevTools, curl), o banco não
--   devolve linhas dessas tabelas pra quem não é dono.
--
-- COMO RODAR:
--   1. Painel Supabase → SQL Editor → + New query
--   2. Cole TODO o conteúdo abaixo e clique RUN
--   3. Tem que aparecer "Success. No rows returned"
--
-- É SEGURO rodar várias vezes.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Helper: role do usuário logado ──────────────────────────────────────-
create or replace function current_user_role() returns text
language sql stable security definer
as $$
  select role from profiles where id = auth.uid()
$$;

grant execute on function current_user_role() to authenticated;

-- ── 2. Policies "owner_only" pras tabelas financeiras ──────────────────────-
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'despesas','caixa_sessoes','caixa_movimentacoes'
  ])
  loop
    -- Remove policy tenant (que era for all)
    execute format('drop policy if exists "tenant" on %I', t);
    execute format('drop policy if exists "owner_only" on %I', t);

    -- Recria como owner_only
    execute format(
      'create policy "owner_only" on %I for all to authenticated
         using (
           farmacia_id = current_user_farmacia_id()
           and current_user_role() = ''owner''
         )
         with check (
           farmacia_id = current_user_farmacia_id()
           and current_user_role() = ''owner''
         )',
      t
    );
  end loop;
end $$;
