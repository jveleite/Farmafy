-- ════════════════════════════════════════════════════════════════════════════
-- Migração: campos de configuração na tabela farmacias
-- ════════════════════════════════════════════════════════════════════════════
-- Adiciona endereco, telefone e chave_pix.
-- COMO RODAR: SQL Editor → cole → Run.
-- ════════════════════════════════════════════════════════════════════════════

alter table farmacias add column if not exists endereco  text;
alter table farmacias add column if not exists telefone  text;
alter table farmacias add column if not exists chave_pix text;
