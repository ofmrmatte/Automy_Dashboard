# Architecture

## Status

Automy Dashboard e a aplicacao oficial da Automy. A partir desta fase, o projeto nao utiliza dados ficticios nem mocks como fonte de UI.

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
- `supabase/migrations`: schema versionado do banco.

## Fluxo de Dados

Pagina -> React Query -> Service -> Repository -> Supabase

Componentes visuais nao acessam APIs, Supabase ou Prisma diretamente.

## Supabase

O client fica em `src/shared/lib/supabase/client.ts` e le:

- `VITE_SUPABASE_URL=https://hpynyyvunyyejjoqvvjw.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY` como compatibilidade

Sem variaveis configuradas, os repositories retornam colecoes vazias para manter a aplicacao navegavel com Empty States.

## Banco Inicial

A migration inicial cria:

- `companies`
- `users`
- `roles`
- `permissions`
- `role_permissions`
- `clients`
- `contacts`
- `addresses`
- `products`
- `contracts`
- `activity_logs`

Todas as entidades usam UUID, auditoria, soft delete e RLS.

## Prisma

Prisma ainda nao foi implementado. Quando for adotado, deve ficar atras dos repositories e nao pode ser acessado por paginas ou componentes.
