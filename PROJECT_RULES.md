# Project Rules

Este projeto e a aplicacao oficial da Automy em fase de producao. Codigo temporario, mocks e dados ficticios nao devem ser adicionados.

## Design System

- Nunca alterar o Design System sem solicitacao explicita.
- Nunca utilizar cores hardcoded.
- Sempre utilizar tokens oficiais de design.
- Sempre utilizar componentes reutilizaveis.
- Nunca alterar identidade visual, Brand Kit, rotas ou experiencia de usuario sem solicitacao explicita.

## Arquitetura

- Sempre utilizar Repository Pattern.
- Sempre utilizar Service Layer.
- Nunca acessar Prisma diretamente pelas paginas.
- Nunca acessar API diretamente pelos componentes.
- Nunca acessar Railway PostgreSQL diretamente pelas paginas ou componentes.
- Paginas devem consumir services via React Query ou hooks de aplicacao.
- Componentes visuais nao devem conhecer Railway, Prisma, fetch ou contratos externos.
- Repositories sao a fronteira de persistencia.
- Services sao a fronteira de regras de aplicacao.
- Prisma, quando adotado, deve ficar atras de repositories.
- Railway PostgreSQL e a fonte oficial de dados.
- Nao criar novos mocks.
- Nao criar dados ficticios.
- Quando nao houver dados reais, utilizar Empty State profissional.

## Entidades

Toda entidade deve possuir:

- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`

Toda exclusao deve ser Soft Delete.
No banco, os campos equivalentes devem usar snake_case:

- `created_at`
- `updated_at`
- `deleted_at`
- `created_by`
- `updated_by`

## Formularios

Todo formulario deve utilizar:

- React Hook Form
- Zod

## CRUD

Todo CRUD deve possuir:

- Loading
- Empty State
- Error State
- Toast
- Confirmacao de exclusao

## Banco de Dados

- O banco oficial e Railway PostgreSQL.
- Toda tabela exposta diretamente fora da API interna deve ter Row Level Security ou controle equivalente habilitado.
- Nao conceder hard delete para fluxos de usuario final.
- Toda leitura de entidade ativa deve filtrar `deleted_at is null`.
- Migrations devem ficar em `railway/migrations`.
- Novas tabelas devem receber indices para `company_id` e filtros frequentes quando aplicavel.
- Dados globais somente podem ser alterados por fluxos administrativos controlados.
