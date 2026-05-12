-- ════════════════════════════════════════════════════════════════════════════
-- finalizar_venda — RPC ATÔMICA para finalizar uma venda no FarmaFy
-- ════════════════════════════════════════════════════════════════════════════
--
-- O QUE FAZ:
--   1. Insere uma linha em `vendas`
--   2. Insere todas as linhas em `itens_venda`
--   3. Debita o estoque de cada produto vendido
--
-- POR QUE ATÔMICA:
--   Antes, o frontend fazia 3 requests separados ao Supabase. Se a request 2
--   ou 3 falhasse, ficavam vendas "órfãs" (sem itens) ou estoque incorreto.
--   Pior: duas vendas simultâneas podiam debitar o MESMO estoque (race
--   condition). Agora tudo roda numa única transação Postgres — se algo
--   falhar no meio, tudo é desfeito automaticamente.
--
-- COMO RODAR:
--   1. Abra https://supabase.com/dashboard → seu projeto → SQL Editor
--   2. Cole TODO o conteúdo abaixo
--   3. Clique em RUN
--   4. Deve aparecer "Success. No rows returned"
--
-- ADAPTAR PRA SEU SCHEMA:
--   Esta função assume que os IDs (clientes.id, produtos.id) são UUID.
--   Se forem bigint, troque `uuid` por `bigint` nas linhas marcadas com [UUID].
-- ════════════════════════════════════════════════════════════════════════════

create or replace function finalizar_venda(
  p_cliente_id   uuid,        -- [UUID] trocar pra bigint se for o caso
  p_cliente_nome text,
  p_total        numeric,
  p_pagamento    text,
  p_recebido     numeric,
  p_troco        numeric,
  p_itens        jsonb        -- array: [{produto_id, quantidade, preco_unitario}]
)
returns uuid                   -- [UUID] devolve o ID da venda criada
language plpgsql
security definer
as $$
declare
  v_venda_id     uuid;         -- [UUID]
  v_item         jsonb;
  v_produto_id   uuid;         -- [UUID]
  v_quantidade   int;
  v_preco        numeric;
begin
  -- ── 1. Cria a venda ────────────────────────────────────────────────────────
  insert into vendas (cliente_id, cliente_nome, total, pagamento, recebido, troco)
  values (p_cliente_id, p_cliente_nome, p_total, p_pagamento, p_recebido, p_troco)
  returning id into v_venda_id;

  -- ── 2. Loop nos itens: insere + debita estoque ─────────────────────────────
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_produto_id := (v_item->>'produto_id')::uuid;     -- [UUID]
    v_quantidade := (v_item->>'quantidade')::int;
    v_preco      := (v_item->>'preco_unitario')::numeric;

    -- Insere o item
    insert into itens_venda (venda_id, produto_id, quantidade, preco_unitario)
    values (v_venda_id, v_produto_id, v_quantidade, v_preco);

    -- Debita o estoque COM GUARDA — só atualiza se houver estoque suficiente.
    -- Se outra venda concorrente já tiver derrubado o estoque, esse update
    -- não acha linha → caímos no `raise exception` e a transação inteira
    -- é desfeita (a venda criada acima some também).
    update produtos
       set estoque = estoque - v_quantidade
     where id = v_produto_id
       and estoque >= v_quantidade;

    if not found then
      raise exception
        'Estoque insuficiente para o produto %', v_produto_id
        using errcode = 'P0001';
    end if;
  end loop;

  return v_venda_id;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- PERMISSÕES — quem pode chamar
-- ════════════════════════════════════════════════════════════════════════════
-- A função usa SECURITY DEFINER, então roda com privilégios do dono.
-- Damos EXECUTE pros roles do Supabase que falam com o PostgREST:

grant execute on function finalizar_venda(uuid, text, numeric, text, numeric, numeric, jsonb)
  to anon, authenticated;
