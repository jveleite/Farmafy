-- ════════════════════════════════════════════════════════════════════════════
-- finalizar_venda — RPC ATÔMICA para finalizar uma venda no FarmaFy
-- ════════════════════════════════════════════════════════════════════════════
--
-- Schema do FarmaFy (descoberto via information_schema):
--   clientes.id            : bigint
--   vendas.id              : bigint
--   vendas.cliente_id      : bigint  → FK clientes.id
--   produtos.id            : uuid
--   itens_venda.produto_id : uuid    → FK produtos.id
--   itens_venda.venda_id   : bigint  → FK vendas.id
--
-- COMO RODAR:
--   1. Painel Supabase → SQL Editor → + New query
--   2. Cole TODO o conteúdo abaixo e clique RUN
--   3. Tem que aparecer "Success. No rows returned"
--
-- É seguro rodar várias vezes — o DROP no início limpa qualquer versão antiga.
-- ════════════════════════════════════════════════════════════════════════════

drop function if exists finalizar_venda(uuid,   text, numeric, text, numeric, numeric, jsonb);
drop function if exists finalizar_venda(bigint, text, numeric, text, numeric, numeric, jsonb);

create or replace function finalizar_venda(
  p_cliente_id   bigint,        -- nullable
  p_cliente_nome text,
  p_total        numeric,
  p_pagamento    text,
  p_recebido     numeric,
  p_troco        numeric,
  p_itens        jsonb          -- array: [{produto_id (uuid), quantidade, preco_unitario}]
)
returns bigint                   -- id da venda criada
language plpgsql
security definer
as $$
declare
  v_venda_id     bigint;
  v_item         jsonb;
  v_produto_id   uuid;          -- produtos.id é uuid
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
    v_produto_id := (v_item->>'produto_id')::uuid;
    v_quantidade := (v_item->>'quantidade')::int;
    v_preco      := (v_item->>'preco_unitario')::numeric;

    insert into itens_venda (venda_id, produto_id, quantidade, preco_unitario)
    values (v_venda_id, v_produto_id, v_quantidade, v_preco);

    -- Debita estoque com guarda — se outra venda concorrente já zerou,
    -- esse update não acha linha → exceção → transação inteira rola back.
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

grant execute on function finalizar_venda(bigint, text, numeric, text, numeric, numeric, jsonb)
  to anon, authenticated;
