# Automy

Automy — Plataforma inteligente para controle e gestão operacional.

## Visão Geral

Aplicação web SaaS para gestão, automação e controle operacional de empresas de logística e transportadoras.

Este projeto e a aplicacao oficial da Automy. Nao utilize mocks, dados ficticios ou placeholders de desenvolvimento.

## Current Project Status

- Release baseline: `v1.0.0-rc2`.
- Design System Automy consolidado e aplicado.
- Brand Kit Automy aplicado nos assets publicos.
- Login Premium Automy consolidado e congelado.
- Arquitetura feature-first consolidada com repositories, services, React Query e API interna.
- Railway PostgreSQL e o banco oficial definido em codigo e migrations.
- Vercel esta conectado ao repositorio `ofmrmatte/Automy_Dashboard` e realiza deploys de `main`.
- Ambiente local nao possui `.env.local` neste checkout.
- Ambiente Vercel ainda precisa receber as variaveis Railway oficiais e remover variaveis antigas do provedor anterior.
- Autenticacao atual e temporaria, baseada em `AUTOMY_ADMIN_EMAIL` e `AUTOMY_ADMIN_PASSWORD`, ate a implementacao da autenticacao definitiva em PostgreSQL.

# BASELINE v1.0.0-RC2

- Design System esta congelado.
- Brand Kit esta congelado.
- Login Premium esta congelado.
- Arquitetura Feature First esta consolidada.
- Railway PostgreSQL e o banco oficial.
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

## Scripts

```bash
npm install
npm run dev
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

Configure as variaveis de ambiente no ambiente de deploy:

```bash
DATABASE_URL=
PGSSLMODE=require
AUTOMY_ADMIN_EMAIL=
AUTOMY_ADMIN_PASSWORD=
AUTOMY_ADMIN_USER_ID=
```

`AUTOMY_ADMIN_USER_ID` e opcional. Quando ausente, a aplicacao deriva um UUID estavel a partir do e-mail administrativo configurado.

Use `.env.example` como referencia de nomes de variaveis. Nunca versionar `.env.local` ou valores reais.

### URLs por ambiente

- LOCAL: usar a URL publica/proxy do Railway, pois o host `*.railway.internal` nao e acessivel fora da rede privada Railway.
- Vercel: usar a URL publica/proxy do Railway, com `PGSSLMODE=require` quando TLS for exigido.
- Railway: pode usar a URL interna `*.railway.internal` somente quando a aplicacao estiver rodando dentro da propria rede Railway.

As migrations oficiais ficam em:

```bash
railway/migrations
```

Rotas de autenticacao:

- `/login`
- `/recuperar-senha`
- `/redefinir-senha`
