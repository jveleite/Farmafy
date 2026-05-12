-- ════════════════════════════════════════════════════════════════════════════
-- Migração: tabelas pro módulo Financeiro do FarmaFy
-- ════════════════════════════════════════════════════════════════════════════
--
-- O QUE ESTE SCRIPT FAZ:
--   1. Adiciona coluna `fiado_quitado_em` em vendas (pra marcar fiados pagos)
--   2. Cria tabela `despesas` (contas a pagar / despesas operacionais)
--   3. Cria tabela `caixa_sessoes` (abertura/fechamento de caixa do dia)
--   4. Cria tabela `caixa_movimentacoes` (sangrias e suprimentos)
--
-- COMO RODAR:
--   1. Painel Supabase → SQL Editor → + New query
--   2. Cole TODO o conteúdo abaixo e clique RUN
--   3. Tem que aparecer "Success. No rows returned"
--
-- É seguro rodar várias vezes (usa IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Coluna fiado_quitado_em em vendas ────────────────────────────────────
alter table vendas
  add column if not exists fiado_quitado_em timestamptz;

-- ── 2. Tabela despesas ──────────────────────────────────────────────────────
create table if not exists despesas (
  id              bigserial primary key,
  descricao       text not null,
  valor           numeric(10,2) not null check (valor > 0),
  categoria       text default 'Outros',
  data_vencimento date,
  pago            boolean default false,
  pago_em         timestamptz,
  observacao      text,
  created_at      timestamptz default now()
);

create index if not exists despesas_pago_idx           on despesas (pago);
create index if not exists despesas_data_venc_idx      on despesas (data_vencimento);

-- ── 3. Caixa: sessões (abertura/fechamento) ─────────────────────────────────
create table if not exists caixa_sessoes (
  id               bigserial primary key,
  abertura_em      timestamptz default now(),
  valor_abertura   numeric(10,2) not null default 0,
  fechamento_em    timestamptz,
  valor_contado    numeric(10,2),    -- valor físico contado no fechamento
  diferenca        numeric(10,2),    -- contado − esperado
  observacao       text,
  status           text not null default 'aberta'
                    check (status in ('aberta','fechada'))
);

create index if not exists caixa_sessoes_status_idx on caixa_sessoes (status);

-- ── 4. Caixa: movimentações (sangria/suprimento) ────────────────────────────
create table if not exists caixa_movimentacoes (
  id           bigserial primary key,
  sessao_id    bigint not null references caixa_sessoes(id) on delete cascade,
  tipo         text not null check (tipo in ('sangria','suprimento')),
  valor        numeric(10,2) not null check (valor > 0),
  observacao   text,
  created_at   timestamptz default now()
);

create index if not exists caixa_mov_sessao_idx on caixa_movimentacoes (sessao_id);

-- ── 5. RLS ──────────────────────────────────────────────────────────────────
-- Desligado pra ficar consistente com produtos/clientes/vendas (que também
-- não têm RLS porque o sistema ainda é single-user, sem login).
-- Quando entrar autenticação, religue com policies próprias.

alter table despesas             disable row level security;
alter table caixa_sessoes        disable row level security;
alter table caixa_movimentacoes  disable row level security;
