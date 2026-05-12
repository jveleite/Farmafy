-- ════════════════════════════════════════════════════════════════════════════
-- Vincular dados pré-existentes à SUA farmácia (script único, depois do signup)
-- ════════════════════════════════════════════════════════════════════════════
--
-- CONTEXTO:
--   A migração multi-tenant criou uma "Farmácia Inicial (legado)" com id=1
--   e marcou todos os seus produtos/clientes/vendas/etc com farmacia_id=1.
--   Quando você se cadastrou pelo app, ganhou uma farmácia NOVA com OUTRO id
--   (ex: 2). Por isso, ao logar, você não enxerga seus dados antigos — RLS
--   tá filtrando por farmacia_id e seu profile aponta pra outra.
--
-- O QUE ESTE SCRIPT FAZ:
--   Move todos os dados da Farmácia Inicial (id=1) pra SUA farmácia (a do
--   seu user logado). Depois disso, dá pra deletar a Farmácia Inicial.
--
-- COMO RODAR:
--   1. Cadastra-se primeiro no app (tela Signup)
--   2. Confirma que conseguiu logar
--   3. Painel Supabase → SQL Editor → + New query → cola este arquivo → RUN
--   4. Volta no app, recarrega — produtos/clientes/vendas/etc devem aparecer
--   5. (Opcional) Roda o passo final pra deletar a "Farmácia Inicial"
--
-- RODE UMA VEZ SÓ. Depois disso, o id=1 fica sem dados associados.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Pega a sua farmacia_id (é a única que NÃO é a id=1)
do $$
declare
  v_minha_farmacia bigint;
begin
  select id into v_minha_farmacia
  from farmacias
  where id <> 1
  order by created_at desc
  limit 1;

  if v_minha_farmacia is null then
    raise exception
      'Não encontrei sua farmácia. Você se cadastrou pelo app antes de rodar este script?';
  end if;

  raise notice 'Movendo dados de id=1 pra farmacia_id=%', v_minha_farmacia;

  update produtos             set farmacia_id = v_minha_farmacia where farmacia_id = 1;
  update clientes             set farmacia_id = v_minha_farmacia where farmacia_id = 1;
  update vendas               set farmacia_id = v_minha_farmacia where farmacia_id = 1;
  update itens_venda          set farmacia_id = v_minha_farmacia where farmacia_id = 1;
  update despesas             set farmacia_id = v_minha_farmacia where farmacia_id = 1;
  update caixa_sessoes        set farmacia_id = v_minha_farmacia where farmacia_id = 1;
  update caixa_movimentacoes  set farmacia_id = v_minha_farmacia where farmacia_id = 1;

  raise notice 'Pronto. Recarregue o app pra ver os dados.';
end $$;

-- 2. (Opcional) deletar a Farmácia Inicial agora que tá vazia
-- Descomente a linha abaixo se quiser remover.
-- delete from farmacias where id = 1;
