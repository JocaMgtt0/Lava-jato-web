# Garage WM Lava Car

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA">
</p>

Sistema web de gestão para lava-car: calendário de lavagens, controle de gastos (avulsos e fixos), equipe (fixa e temporária) e relatório financeiro com gráficos. Feito para uso diário no celular, com dados reais no Supabase (não fica só no navegador).

Essa é a versão web/React do projeto — existe também uma versão desktop em Java/JavaFX, feita antes como prática. Aqui o modelo foi repensado do zero: **não existe conceito de "Agenda"**. Lavagem é um registro solto com uma data, exatamente como gasto sempre foi — você abre o calendário, clica no dia, lança. Sem passo de "criar agenda" antes.

## Stack

- **React 19** + **Vite** + **React Router**
- **Supabase** (Postgres + Auth) como backend — sem servidor próprio
- CSS puro, sem framework de UI (design próprio, inspirado nos princípios da Apple)
- PWA (instalável na tela inicial do celular)

## Funcionalidades

- **Calendário** (mês/semana, estilo Google Agenda) como tela inicial — clique num dia abre uma página dedicada de cadastro, não um modal, pensada para uso contínuo enquanto se trabalha
- **Lavagens**: cliente, veículo, placa, serviço e valor — com busca e filtro por serviço
- **Gastos**: avulsos (do dia) ou fixos (lançados na competência do mês), com uma categoria separada para mão de obra (funcionário temporário/freelance)
- **Equipe**: funcionários fixos com salário e periodicidade (mensal/semanal/diário), convertido automaticamente em custo mensal equivalente
- **Serviços padrão**: atalhos de preço para lançar lavagens em um toque
- **Relatório**: dois modos (detalhado/simples), gráfico de composição do faturamento (lucro/despesas/equipe), receita por serviço, picos de venda e de gasto por dia, dias com lucro vs. prejuízo, comparativo com o mês anterior, exportação em PDF
- **Tema claro/escuro** com transição suave
- Confirmação obrigatória antes de qualquer exclusão, e aviso visual após salvar

## Como rodar localmente

Pré-requisitos: Node.js 18+.

```bash
npm install
```

Copie `.env.example` para `.env` e preencha com as credenciais do seu projeto Supabase (veja a seção abaixo):

```bash
cp .env.example .env
```

```bash
npm run dev
```

## Configurando o Supabase

O projeto não tem backend próprio — o frontend fala direto com o Supabase, protegido por Row Level Security (RLS) e login.

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie a **Project URL** e a chave **anon/publishable** para o `.env`:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
   ```
   Essa chave é pública por natureza (vai embutida no código do navegador) — quem protege os dados é o RLS, não o segredo dela. **Nunca** use a chave `service_role` no frontend.
3. Rode o script `supabase/schema.sql` inteiro no **SQL Editor** do painel. Ele cria as 4 tabelas (`lavagens`, `gastos`, `valores_padrao`, `funcionarios`), os privilégios de acesso e as policies de RLS — só usuários autenticados têm acesso, e nenhum usuário anônimo enxerga nada.
4. Em **Authentication → Sign In / Providers → User Signups**, desligue **"Allow new users to sign up"** e salve. Isso é essencial: sem esse passo, qualquer pessoa que descobrisse a URL do site conseguiria criar a própria conta pela API e teria acesso total aos dados (a policy libera qualquer usuário autenticado, de propósito — é ferramenta de um único negócio, não precisa de permissão por usuário).
5. Crie as contas de quem vai usar o sistema manualmente em **Authentication → Users → Add user**. Não existe cadastro público — é assim, de propósito, que se controla quem tem acesso.

## Estrutura

```
src/
├── context/          → Auth, Dados (Supabase), Tema, Avisos, Confirmação
├── components/        → Layout, Sidebar, Calendário, formulários, gráficos
├── pages/              → Calendário, Dia, Gastos, Relatório, Serviços/Equipe, Login
├── lib/
│   ├── supabaseClient.js  → cliente Supabase (lê do .env)
│   ├── api.js              → CRUD genérico por tabela
│   ├── dates.js             → utilitários de data (sempre local, nunca UTC)
│   └── format.js
supabase/
└── schema.sql        → tabelas + RLS + policies
```

## Segurança

- Todas as rotas exigem login (Supabase Auth, e-mail/senha).
- Row Level Security ativo nas 4 tabelas — sem policy para o papel `anon`, então requisição sem login não retorna nada.
- Cadastro público desligado — contas só são criadas manualmente pelo painel do Supabase.
- `noindex`/`robots.txt` — o site não deve aparecer em buscadores (não impede acesso de quem tem o link, só evita ser encontrado à toa).

## Deploy

Frontend estático — funciona em qualquer host de sites estáticos (Vercel, Netlify). Não precisa de servidor próprio.

Ao publicar, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como variáveis de ambiente no painel do host — elas não vêm do `.env` local, cada plataforma tem seu próprio jeito de declarar isso.
