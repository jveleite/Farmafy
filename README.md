<div align="center">

<img src="src/assets/logo.svg" alt="Farmafy Logo" width="60" />

# Farmafy

**Sistema web completo de gerenciamento de farmácia**

PDV · Estoque · Financeiro · Equipe · Relatórios

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[🔗 Ver demo ao vivo](https://farmafy-rust.vercel.app) · [📸 Screenshots](#-screenshots) · [🚀 Como rodar](#-como-rodar)

</div>

---

## 📋 Sobre o projeto

O **Farmafy** é um sistema de gestão comercial para farmácias, desenvolvido como projeto de portfólio. Simula funcionalidades de um sistema real de PDV — desde a venda até o controle financeiro, com multiusuário, controle de acesso por cargo e isolamento completo de dados por organização.

> **Stack principal:** React 19 + Vite + Supabase (PostgreSQL + Auth + Edge Functions)

---

## ✨ Funcionalidades

### 🛒 PDV (Ponto de Venda)
- Busca rápida de produtos com seleção por teclado
- Carrinho com adição/remoção e atualização de quantidades
- Seleção de cliente na venda
- **4 formas de pagamento:**
  - 💵 Dinheiro — com cálculo de troco automático
  - 💳 Cartão — crédito e débito
  - 📱 PIX — com geração de QR Code dinâmico
  - 📒 Fiado — registra débito na conta do cliente
- Confirmação antes de finalizar a venda
- Desconto automático do estoque ao finalizar (transação atômica via RPC)

### 📦 Estoque & Produtos
- CRUD completo de produtos
- Alertas de baixo estoque
- Integração com API Anvisa para validação de medicamentos

### 👥 Clientes
- CRUD de clientes
- Controle de débitos (fiados)

### 💰 Financeiro *(acesso restrito a owner)*
- Dashboard com resumo do dia
- Movimentação de caixa (abertura, sangria, suprimento, fechamento)
- Registro de despesas com vencimento e status de pagamento
- Contas a receber (fiados pendentes)

### 📊 Relatórios
- Gráficos de faturamento por período
- Produtos mais vendidos
- Resumo de vendas

### 👨‍💼 Equipe & Permissões
- Convite de colaboradores por email (Edge Function + Resend)
- 3 níveis de acesso:
  | Role | Acesso |
  |---|---|
  | `owner` | Total — PDV, Financeiro, Equipe, Configurações |
  | `farmaceutico` | PDV, Produtos, Clientes, Relatórios |
  | `atendente` | PDV, leitura de produtos, Clientes (sem excluir) |

### ⚙️ Configurações
- Dados da farmácia (nome, endereço, CNPJ, telefone)
- Chave PIX configurável

---

## 🏗️ Arquitetura

```
src/
├── components/        # Componentes por domínio (pdv, pagamento, financeiro...)
├── services/          # Camada de API — toda lógica de acesso ao Supabase
├── lib/               # Utilitários puros (format, supabase client, pagamentos)
├── ui/                # Primitives: Button, Input, Modal, Toast, Auth context
└── styles/tokens.js   # Design tokens (paleta, tipografia, sombras)

supabase/
├── *.sql              # Migrações (RLS, RPC, roles, financeiro, equipe)
└── functions/         # Edge Functions (envio de convite por email)
```

**Padrões usados:**
- **Service Layer** — toda lógica de acesso a dados centralizada em `services/`
- **Multi-tenancy** — RLS estrito no Supabase, dados isolados por `farmacia_id`
- **RPC atômica** — venda + itens + desconto de estoque em uma única transação SQL
- **React Context** — sessão e perfil do usuário globais via `useAuth()`
- **Role-based access** — permissões validadas no frontend e reforçadas por policies no banco

---

## 🚀 Como rodar

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)

### 1. Clone e instale

```bash
git clone https://github.com/jveleite/Farmafy.git
cd farmafy
npm install
```

### 2. Configure o ambiente

```bash
cp .env.example .env.local
```

Preencha o `.env.local` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Configure o banco de dados

Execute os arquivos SQL na ordem abaixo no **SQL Editor** do Supabase:

```
supabase/auth_multitenant.sql
supabase/finalizar_venda.sql
supabase/financeiro.sql
supabase/equipe.sql
supabase/roles.sql
supabase/configuracoes.sql
```

### 4. Rode em desenvolvimento

```bash
npm run dev
# http://localhost:5173
```

---

## 🔐 Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave pública (anon key) do Supabase |

> A chave PIX fica em `farmacias.chave_pix`, editável na tela de Configurações — não é variável de ambiente.

**Edge Function (opcional — para convites por email):**
Configure em Supabase → Edge Functions → Secrets:
- `RESEND_API_KEY` — chave da conta [Resend](https://resend.com)
- `APP_URL` — URL do app (ex: `http://localhost:5173`)

---

## 🛠️ Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Pré-visualizar o build
npm run lint     # Verificar erros com ESLint
```

---

## 📈 Roadmap

- [x] PDV completo com 4 formas de pagamento
- [x] Controle de estoque
- [x] Financeiro (caixa, despesas, a receber)
- [x] Multi-tenancy + RBAC
- [x] Convites de equipe por email
- [x] Relatórios e gráficos
- [ ] Exclusão soft de produtos
- [ ] Alertas de validade de medicamentos
- [ ] Importação em lote via CSV
- [ ] Responsivo para mobile
- [ ] Integração fiscal (NFe)

---

## 📄 Licença

Este projeto foi desenvolvido para fins de portfólio. Livre para uso e referência.

---

<div align="center">
Feito com React, Supabase e muita vontade de aprender.
</div>
