# Project Rules

## Design System

- Nunca alterar o Design System sem solicitacao explicita.
- Nunca utilizar cores hardcoded.
- Sempre utilizar tokens oficiais de design.
- Sempre utilizar componentes reutilizaveis.

## Arquitetura

- Sempre utilizar Repository Pattern.
- Sempre utilizar Service Layer.
- Nunca acessar Prisma diretamente pelas paginas.
- Nunca acessar API diretamente pelos componentes.

## Entidades

Toda entidade deve possuir:

- `createdAt`
- `updatedAt`
- `deletedAt`

Toda exclusao deve ser Soft Delete.

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
