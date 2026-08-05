# Architecture

## Status

Automy Dashboard e a aplicacao oficial da Automy. A partir desta fase, o projeto nao utiliza dados ficticios nem mocks como fonte de UI.

## Current Project Status

- Baseline oficial congelada em `v1.0.0-rc2`.
- A identidade visual, Design System e Brand Kit estao consolidados.
- O Login Premium esta consolidado e nao deve receber alteracoes visuais sem aprovacao explicita.
- O banco oficial e Railway PostgreSQL, acessado somente pelo servidor/API interna.
- Better Auth e o provedor oficial de autenticacao.
- O projeto Vercel `automy-dashboard` esta conectado ao GitHub e possui deployment de producao pronto.
- As variaveis Railway ainda devem ser configuradas no Vercel antes de validar persistencia real em producao.
- Cadastro publico esta desabilitado; criacao de usuarios deve ocorrer por fluxo administrativo controlado.

# BASELINE v1.0.0-RC2

- Design System esta congelado.
- Brand Kit esta congelado.
- Login Premium esta congelado.
- Arquitetura Feature First esta consolidada.
- Railway PostgreSQL e o banco oficial.
- Toda nova funcionalidade devera respeitar `PROJECT_RULES.md`.
- Paginas, componentes e modulos de negocio devem manter o fluxo: Pagina -> React Query -> Service -> Repository -> API interna -> Railway PostgreSQL.
- Autenticacao deve permanecer em Better Auth salvo aprovacao explicita para mudanca estrutural.

## Frontend

- React 19
- TanStack Router
- TanStack React Query
- Vite
- TypeScript
- Tailwind CSS 4
- Design System Automy em `src/shared/components`, `src/shared/design` e `src/styles.css`

## Organizacao

- `src/features`: modulos de negocio por dominio.
- `src/features/*/pages`: telas do modulo.
- `src/features/*/api`: query keys e query options.
- `src/features/*/services`: regras de aplicacao e filtros.
- `src/features/*/repositories`: acesso a persistencia.
- `src/features/*/types.ts`: tipos do dominio.
- `src/shared`: componentes, tokens, constantes, utilitarios e infraestrutura compartilhada.
- `railway/migrations`: schema versionado do banco oficial.

## Fluxo de Dados

Pagina -> React Query -> Service -> Repository -> API interna -> Railway PostgreSQL

Componentes visuais nao acessam APIs, Railway, Prisma ou outros contratos externos diretamente.

## Identidade

O modulo `src/features/identity` centraliza autenticacao, perfil e preferencias do usuario.

- Auth: Better Auth em `src/features/identity/server/better-auth.ts`.
- Cliente: `src/features/identity/auth-client.ts`.
- Sessao: `IdentityProvider` consome o service de identidade e carrega a sessao via cookie HttpOnly.
- Rotas publicas: `/login`, `/recuperar-senha`, `/redefinir-senha`.
- Rotas privadas: todas as demais rotas sao protegidas no root route.
- Perfil: dados de usuario Better Auth, dados complementares de perfil, avatar, senha, preferencias e sessoes ativas.
- Avatar: estrutura mantida no dominio de identidade; upload definitivo sera conectado a storage dedicado em etapa futura.

## Railway PostgreSQL

O acesso server-side fica em `src/shared/server/postgres.ts` e le:

- `DATABASE_URL`
- `PGSSLMODE=require` quando o ambiente exigir TLS
- `RAILWAY_ENVIRONMENT` para identificar runtime Railway

Sem `DATABASE_URL`, os endpoints de leitura retornam colecoes vazias quando possivel e os fluxos de escrita retornam erro operacional claro.

`DATABASE_URL` com host `*.railway.internal` deve ser usada apenas em runtimes dentro da rede privada Railway. Para desenvolvimento local e Vercel, usar a URL publica/proxy do Railway.

## Banco Inicial

A migration inicial cria:

- `companies`
- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_profiles`
- `user_preferences`
- `clients`
- `contacts`
- `addresses`
- `products`
- `contracts`
- `activity_logs`
- `support_tickets`
- `scheduled_calls`
- `charges`
- `app_settings`

A migration Better Auth cria:

- `user`
- `session`
- `account`
- `verification`
- `rate_limit`

As entidades usam UUID, auditoria e soft delete. Como o acesso ao banco ocorre por API server-side propria, controles de permissao devem ser aplicados na camada de API/service. RLS pode ser adotado posteriormente caso o banco passe a ser exposto diretamente a clientes ou gateways externos.

## Better Auth

Better Auth substitui a autenticacao temporaria por env vars.

- Senhas usam o hash padrao do Better Auth.
- Sessoes usam cookies HttpOnly.
- `rememberMe` usa o payload oficial do endpoint de login.
- Recuperacao de senha e verificacao de e-mail estao preparadas, com envio transacional pendente de provedor aprovado.
- `last_login` e atualizado quando uma sessao e criada.
- RBAC inicial fica no campo `role` da tabela `user`: `admin`, `manager`, `operator`, `read_only`.
- `status` controla o ciclo de vida do usuario: `active`, `inactive`, `pending`, `blocked`.

## Prisma

Prisma ainda nao foi implementado. Quando for adotado, deve ficar atras dos repositories e nao pode ser acessado por paginas ou componentes.
