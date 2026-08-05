# Automy

Automy — Plataforma inteligente para controle e gestão operacional.

## Visão Geral

Aplicação web SaaS para gestão, automação e controle operacional de empresas de logística e transportadoras.

Este projeto e a aplicacao oficial da Automy. Nao utilize mocks, dados ficticios ou placeholders de desenvolvimento.

## Current Project Status

- Foundation atual: infraestrutura Railway reconstruida e ativada na nova conta.
- Design System Automy consolidado e aplicado.
- Brand Kit Automy aplicado nos assets publicos.
- Login Premium Automy consolidado e congelado.
- Arquitetura feature-first consolidada com repositories, services, React Query e API interna.
- Railway PostgreSQL e o banco oficial definido em codigo e migrations.
- Better Auth e o provedor oficial de autenticacao, usando Railway PostgreSQL.
- Vercel esta conectado ao repositorio `ofmrmatte/Automy_Dashboard` e configurado com variaveis da nova foundation.
- Ambiente local possui `.env.local` nao versionado para desenvolvimento com TCP Proxy Railway.
- Variaveis legadas do provedor anterior foram removidas do Vercel.
- Cadastro publico permanece desabilitado; usuarios devem ser criados por fluxo administrativo controlado.
- Branch funcional em andamento: `feature/complete-functional-foundation`.
- Fase 1 implementa gestão real de usuarios e consulta de permissoes usando Better Auth + Railway PostgreSQL.

# BASELINE v1.0.0-RC3

- Design System esta congelado.
- Brand Kit esta congelado.
- Login Premium esta congelado.
- Arquitetura Feature First esta consolidada.
- Railway PostgreSQL e o banco oficial.
- Foundation operacional ativada na nova conta Railway.
- Vercel configurado com as variaveis da nova foundation.
- Toda nova funcionalidade devera respeitar `PROJECT_RULES.md`.
- Alteracoes estruturais apos esta baseline exigem aprovacao explicita.

## Stack

- React
- TypeScript
- TanStack Router
- TanStack React Query
- TanStack Start
- Vite
- Tailwind CSS
- Lucide React
- Recharts
- Railway PostgreSQL
- Node Postgres (`pg`)
- Better Auth

## Scripts

```bash
npm install
npm run dev
npm run db:migrate
npm run db:seed
npm run db:validate
npm run db:inspect
npm run lint
npx tsc --noEmit
npm run build
```

## Brand Kit

Os assets oficiais da marca ficam em `brand-kit/`.

Os assets usados pela aplicação ficam em `public/`:

- `automy-logo-horizontal.svg`
- `automy-symbol.svg`
- `automy-logo-white.svg`
- `automy-logo-black.svg`
- `favicon.svg`
- `favicon-16.png`
- `favicon-32.png`
- `favicon-48.png`
- `apple-touch-icon.png`
- `android-chrome-192.png`
- `android-chrome-512.png`
- `pwa-icon.svg`
- `manifest.webmanifest`

## Design System

O Design System está documentado em `docs/DESIGN_SYSTEM.md`.

As cores, raios, sombras, tipografia e tokens semânticos estão centralizados em:

- `src/styles.css`
- `src/shared/design/tokens.ts`

## Estrutura

A aplicação segue organização feature-first em `src/features`, com componentes compartilhados em `src/shared`.

## Railway PostgreSQL

Railway PostgreSQL e a fonte oficial de dados da Automy.

Configure as variaveis de ambiente no ambiente de deploy.

Para Railway runtime interno:

```bash
DATABASE_URL=
PGSSLMODE=require
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
BETTER_AUTH_API_KEY=
BETTER_AUTH_API_URL=
BETTER_AUTH_KV_URL=
```

Para local e Vercel via TCP Proxy Railway:

```bash
DATABASE_URL=
PGSSLMODE=disable
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
BETTER_AUTH_API_KEY=
BETTER_AUTH_API_URL=
BETTER_AUTH_KV_URL=
```

`BETTER_AUTH_SECRET` deve ser um valor forte e exclusivo por ambiente. Gere com `openssl rand -base64 32`.

Use `.env.example` como referencia de nomes de variaveis. Nunca versionar `.env.local` ou valores reais.

### URLs por ambiente

- LOCAL: usar a URL publica/TCP Proxy do Railway, pois o host `*.railway.internal` nao e acessivel fora da rede privada Railway.
- Vercel: usar a URL publica/TCP Proxy do Railway, com `PGSSLMODE=disable` para o proxy validado nesta foundation.
- Railway: pode usar a URL interna `*.railway.internal` somente quando a aplicacao estiver rodando dentro da propria rede Railway.

As migrations oficiais ficam em:

```bash
railway/migrations
```

Seeds de configuração de sistema ficam em:

```bash
railway/seeds
```

Detalhes completos da nova foundation estão em `INFRASTRUCTURE.md`.

Rotas de autenticacao:

- `/login`
- `/recuperar-senha`
- `/redefinir-senha`

## Autenticacao

Better Auth e a autenticacao oficial da Automy.

- Endpoint: `/api/auth/*`.
- Banco: Railway PostgreSQL.
- Sessao: cookies HttpOnly.
- Login: e-mail e senha.
- Remember Me: integrado ao endpoint oficial do Better Auth.
- Recuperacao de senha: estrutura configurada; envio transacional deve ser conectado ao provedor de e-mail aprovado.
- Verificacao de e-mail: estrutura configurada; envio permanece desabilitado ate ativacao do provedor de e-mail.
- RBAC inicial: `admin`, `manager`, `operator`, `read_only`.
- Better Auth Infra: `dash()` habilitado quando `BETTER_AUTH_API_KEY` estiver configurada.

## Usuarios e Permissoes

- Tela: `Configuracoes > Usuarios`.
- Rotas diretas preparadas: `/usuarios` e `/permissoes`.
- Endpoints internos:
  - `GET /api/users`
  - `POST /api/users`
  - `PATCH /api/users`
  - `DELETE /api/users`
  - `POST /api/users/password`
  - `GET /api/users/sessions`
  - `DELETE /api/users/sessions`
  - `GET /api/permissions`
- Criacao administrativa grava Better Auth, usuario de dominio, perfil, preferencias e audit log em transacao.
- Status oficiais de usuario: `active`, `inactive`, `invited`, `suspended`.
- Roles oficiais: `admin`, `manager`, `operator`, `read_only`.
- A API impede remover, suspender ou rebaixar o ultimo administrador ativo.
