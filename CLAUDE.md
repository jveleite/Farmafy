# CLAUDE.md - Farmafy

**Última atualização:** 2026-05-13  
**Versão do projeto:** 0.0.0 (development)

---

## 📋 Visão Geral

**Farmafy** é um sistema web de gerenciamento de farmácia (PDV + administrativo) desenvolvido para portfólio. Simula funcionalidades reais de um sistema comercial completo, com foco em arquitetura escalável e experiência do usuário.

**Status:** Em desenvolvimento ativo | **Produção:** Não (localhost apenas)

---

## 🏗️ Stack Tecnológico

| Componente | Tecnologia | Versão |
|-----------|-----------|---------|
| Frontend | React | ^19.2.5 |
| Build Tool | Vite | ^8.0.10 |
| Backend | Supabase (PostgreSQL) | ^2.105.3 |
| Linguagem | JavaScript (ES Modules) | - |
| Autenticação | Supabase Auth | Built-in |
| Linter | ESLint | ^10.2.1 |

**Recursos especiais:**
- QR Code para pagamentos PIX (`react-qr-code`)
- RLS (Row Level Security) no Supabase
- Multi-tenancy com autenticação por organização
- Role-based access control (RBAC)

---

## 📁 Estrutura de Pastas

```
src/
├── App.jsx                          # Root component (roteamento, auth check)
├── assets/                          # Imagens, ícones
├── components/
│   ├── auth/
│   │   └── TelaAuth.jsx            # Login/Signup
│   ├── pdv/
│   │   ├── PDV.jsx                 # Tela principal de vendas
│   │   ├── Carrinho.jsx            # Carrinho de compras
│   │   ├── ListaProdutos.jsx       # Busca/listagem de produtos
│   │   ├── SeletorCliente.jsx      # Seleção de cliente
│   │   ├── SeletorPagamento.jsx    # Seleção do tipo de pagamento
│   │   └── RodapeTotal.jsx         # Resumo de valores
│   ├── pagamento/
│   │   ├── ModalPagamento.jsx      # Orquestrador de formas de pagamento
│   │   ├── PagamentoDinheiro.jsx   # Dinheiro + troco
│   │   ├── PagamentoCartao.jsx     # Cartão de crédito/débito
│   │   ├── PagamentoPix.jsx        # PIX
│   │   ├── PagamentoFiado.jsx      # Fiado (conta do cliente)
│   │   ├── QRCodePix.jsx           # Gerador de QR Code
│   │   └── ResumoConfirmacao.jsx   # Confirmação antes de finalizar
│   ├── financeiro/
│   │   ├── Financeiro.jsx          # Container principal
│   │   ├── Caixa.jsx               # Movimentação de caixa
│   │   ├── Despesas.jsx            # Registro de despesas
│   │   ├── FiadoAReceber.jsx       # Contas a receber
│   │   └── VisaoGeral.jsx          # Dashboard financeiro
│   ├── relatorios/
│   │   ├── Relatorios.jsx          # Container
│   │   ├── BarraSimples.jsx        # Gráficos
│   │   └── CardsResumo.jsx         # Cards de resumo
│   ├── equipe/
│   │   └── Equipe.jsx              # Gestão de usuários + convites
│   ├── configuracoes/
│   │   └── Configuracoes.jsx       # Dados da farmácia (chave PIX, etc)
│   ├── Produtos.jsx                # CRUD de produtos
│   ├── Clientes.jsx                # CRUD de clientes
│   ├── BuscaProduto.jsx            # Busca global
│   └── HistoricoVendas.jsx         # Log de vendas
├── services/                        # Camada de API/dados
│   ├── auth.service.js             # Login, signup, logout
│   ├── vendas.service.js           # Criar/finalizar vendas (RPC atômica)
│   ├── produtos.service.js         # CRUD produtos
│   ├── clientes.service.js         # CRUD clientes
│   ├── financeiro.service.js       # Caixa, despesas, relatórios
│   ├── relatorios.service.js       # Queries de BI
│   ├── equipe.service.js           # Convites, roles, permissões
│   ├── farmacia.service.js         # Dados da organização
│   └── anvisa.service.js           # Validações de medicamentos
├── lib/                             # Utilitários puros
│   ├── supabase.js                 # Cliente Supabase instanciado
│   ├── format.js                   # Formatação (BRL, datas, etc)
│   └── pagamentos.js               # Helpers de formas pagamento
├── ui/                              # Custom hooks + componentes simples
│   ├── Auth.jsx                    # useAuth() hook (context)
│   ├── Toast.jsx                   # useToast() hook (notificações)
│   ├── Logo.jsx                    # Logo do app
│   └── ...outros primitivos
├── styles/                          # CSS global
└── main.jsx                         # Entry point
```

---

## 🎯 Funcionalidades Principais

### ✅ Implementadas

**Autenticação & Segurança:**
- Signup/Login com email + senha
- Multi-tenancy (cada usuário = uma farmácia)
- Supabase Auth + RLS
- Role-based permissions (admin, gerente, vendedor)
- Convites de equipe por email

**PDV (Ponto de Venda):**
- Busca rápida de produtos
- Carrinho com adição/remoção de itens
- Seleção dinâmica de cliente
- 4 formas de pagamento:
  - Dinheiro (com cálculo de troco)
  - Cartão (crédito/débito)
  - PIX (com QR Code gerado dinamicamente)
  - Fiado (com registro de devedor)
- Confirmação antes de finalizar venda

**Estoque:**
- Listagem de produtos com quantidades
- Desconto automático ao vender
- Alertas de baixo estoque

**Financeiro:**
- Dashboard com resumo do dia
- Movimentação de caixa
- Registro de despesas
- Contas a receber (fiados)
- Gráficos de vendas por período

**Produtos:**
- CRUD completo
- Integração com API Anvisa (validação)
- Histórico de preços

**Clientes:**
- CRUD
- Controle de débitos/fiados

**Relatórios:**
- Vendas por período
- Gráficos de faturamento
- Produtos mais vendidos

**Configurações:**
- Dados da farmácia
- Chave PIX configurável

### ⏳ Em desenvolvimento/planejado

- [ ] Exclusão soft de produtos
- [ ] Edição de produtos vendidos
- [ ] Alertas de validade
- [ ] Importação em lote (CSV)
- [ ] Backup automático
- [ ] Mobile responsivo (otimizado)
- [ ] Notificações push
- [ ] Integração com fiscal (NFe)

---

## 🔧 Arquitetura

### Padrões usados

**1. Component-based UI**
- React functional components + hooks
- Custom hooks para lógica (useAuth, useToast)
- Separação de concerns: UI vs lógica

**2. Service Layer**
- `services/` contém toda lógica de API
- Supabase como fonte única de verdade
- RPC (Stored Procedures) para operações atômicas

**3. Multi-tenancy**
- Supabase RLS: cada usuário só vê seus dados
- Owner-only access no financeiro
- Permissões por role validadas no frontend e backend

**4. Autenticação**
- Supabase Auth gerencia sessão
- Context global (Auth.jsx) sincroniza sessão
- Profile carregado ao login (owner_id, farmacia_id, role)

### Fluxo de dados

```
User Action → Component → Service → Supabase → RLS check → DB
    ↓                                              ↓
  Toast/Estado ← useAuth/useState ← Supabase response
```

### Decisões arquiteturais

| Decisão | Motivo |
|---------|--------|
| **Supabase** | Backend "zero-config", autenticação built-in, RLS nativo |
| **Vite** | Build rápido, dev server ótimo, cold start rápido |
| **React Context para Auth** | Simples, evita prop drilling, sincroniza sessão globalmente |
| **Services centralizadas** | Reutilização de queries, testes mais fáceis |
| **RPC para vendas** | Transação atômica: desconta estoque + insere venda simultaneamente |

---

## 🚀 Como rodar

### Pré-requisitos
- Node.js 18+
- Conta Supabase (gratuita)

### Setup inicial

```bash
cd Farmafy
npm install

# Criar arquivo .env.local (copiar de .env.example)
cp .env.example .env.local

# Preencher com suas credenciais Supabase:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_KEY=eyJhbGc...
```

### Desenvolvimento

```bash
npm run dev
# Acessa em http://localhost:5173
```

### Build para produção

```bash
npm run build
# Gera /dist pronto para deploy
npm run preview
```

---

## 📊 Banco de Dados (Supabase)

### Tabelas principais

| Tabela | Descrição | Owner |
|--------|-----------|-------|
| `auth.users` | Usuários (Supabase Auth) | Sistema |
| `profiles` | Profile de cada usuário (farmacia_id, role) | User |
| `farmacias` | Dados das organizações (nome, chave PIX) | User (owner) |
| `produtos` | Catálogo (nome, preço, estoque) | Farmacia |
| `clientes` | Clientes (nome, CPF, contato) | Farmacia |
| `vendas` | Histórico de vendas | Farmacia |
| `itens_venda` | Itens de cada venda | Venda |
| `forma_pagamento` | Dinheiro/cartão/PIX/fiado de cada venda | Venda |
| `caixa` | Movimentação de caixa | Farmacia |
| `despesas` | Registro de despesas | Farmacia |
| `equipe` | Membros (com roles) | Farmacia |
| `convites_equipe` | Convites pendentes | Farmacia |

### RLS (Row Level Security)
- **Vendedor:** Só lê/cria vendas próprias
- **Gerente:** Acesso total à farmácia
- **Admin:** Acesso total (inclusive financeiro)

---

## 🔐 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Nunca commitar `.env.local` — adicionar ao `.gitignore` ✓

---

## 📈 Roadmap Futuro (Prioridade)

1. **MVP v1** (Agora)
   - PDV funcional ✓
   - Financeiro básico ✓
   - Equipe + permissões ✓

2. **v1.1** (Próximo)
   - Melhorias UI/UX
   - Testes automatizados
   - Performance optimization

3. **v1.2** (Médio prazo)
   - Fiscal (NFe)
   - Mobile app (React Native)
   - API pública para integrações

4. **v2.0** (Longo prazo)
   - Deployment em produção
   - Plano pago + free tier
   - Marketplace de integrações

---

## 🐛 Debug e troubleshooting

### "Sua conta existe mas não tem farmácia vinculada"
→ Logout e refaça cadastro completo, OU insira manualmente no Supabase:
```sql
INSERT INTO farmacias (owner_id, nome) 
VALUES ('user-uuid', 'Minha Farmácia');
```

### Permissão negada ao acessar dados
→ Verificar RLS no Supabase console
→ Confirmar `farmacia_id` correto no profile

### Estoque não desconta após venda
→ Verificar se RPC `finalizarVenda` foi executada com sucesso
→ Checar logs de erro no console do navegador

---

## 👥 Contribuições futuras

Ao trabalhar nesse projeto:
1. Criar branch descritiva: `feat/` ou `fix/`
2. Commits atômicos com mensagens claras
3. Testar localmente antes de push
4. Atualizar este CLAUDE.md se mudar arquitetura

---

## 📝 Notas importantes

- **Tokens de sessão:** Supabase gerencia automaticamente
- **Rates do Supabase:** Free tier com limites generosos (até 50k requisições/mês)
- **Dados sensíveis:** PIX key, CPF guardados no Supabase (usar HTTPS em produção)
- **Offline:** App requer conexão (não há sync offline)
- **Moeda:** Tudo em BRL, formatação em `lib/format.js`

---

## 🔗 Referências rápidas

- Documentação Supabase: https://supabase.com/docs
- React 19 Docs: https://react.dev
- Vite Guide: https://vitejs.dev/guide/
- ESLint Config: `/eslint.config.js`

---

**Criado com ❤️ para manter contexto do projeto e diminuir consumo de tokens.**
