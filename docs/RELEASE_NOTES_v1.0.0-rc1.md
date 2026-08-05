# Automy v1.0.0-rc1 Release Notes

## Current Project Status

`v1.0.0-rc1` e a primeira baseline oficial da Automy. Esta release consolida arquitetura, identidade visual, Design System, Brand Kit, persistencia Railway PostgreSQL e deploy Vercel antes do desenvolvimento dos modulos reais.

## Migração Railway

- Railway PostgreSQL passa a ser o banco oficial do projeto.
- Dependencia `pg` adicionada para conexao server-side.
- Migrations oficiais movidas para `railway/migrations`.
- Configuracoes antigas do provedor anterior foram removidas do codigo versionado.

## Design System

- Design System Automy mantido sem alteracoes visuais nesta release.
- Componentes reutilizaveis continuam centralizados em `src/shared/components`.
- Tokens de design seguem em `src/styles.css` e `src/shared/design/tokens.ts`.

## Brand Kit

- Brand Kit Automy permanece aplicado em `public/`.
- Logo, simbolo, favicon e manifest seguem os assets oficiais da marca.

## Arquitetura

- Organizacao feature-first mantida.
- Fluxo consolidado: Pagina -> React Query -> Service -> Repository -> API interna -> Railway PostgreSQL.
- Componentes visuais nao acessam banco, Prisma, fetch ou contratos externos diretamente.

## Railway PostgreSQL

- `DATABASE_URL` e a variavel principal de conexao.
- `PGSSLMODE=require` deve ser configurado quando o ambiente exigir TLS.
- Host `*.railway.internal` deve ser usado apenas dentro da rede privada Railway.
- Local e Vercel devem usar URL publica/proxy do Railway.

## Deploy

- Projeto Vercel: `automy-dashboard`.
- Repositorio conectado: `ofmrmatte/Automy_Dashboard`.
- Ultimo deployment consultado antes da release estava `READY` em producao para o commit Railway anterior.
- O checkout local nao possui `.vercel/project.json`; a validacao foi feita pelo conector/CLI Vercel.

## Autenticação Temporária

- A autenticacao atual usa `AUTOMY_ADMIN_EMAIL` e `AUTOMY_ADMIN_PASSWORD`.
- Essa abordagem e temporaria e nao deve ser expandida para multiusuario.
- A autenticacao definitiva deve usar PostgreSQL com usuarios, senhas com hash, sessoes, recuperacao de senha, auditoria e politicas de acesso.

## Próximos Passos

- Configurar `DATABASE_URL`, `PGSSLMODE`, `AUTOMY_ADMIN_EMAIL` e `AUTOMY_ADMIN_PASSWORD` no Vercel.
- Aplicar `railway/migrations/20260805000000_initial_railway_schema.sql` no Railway.
- Remover variaveis legadas do provedor anterior no Vercel apos validar Railway.
- Implementar autenticacao definitiva em PostgreSQL.
- Criar a issue GitHub correspondente ao item de autenticacao quando a integracao tiver permissao de escrita.
- Adicionar testes unitarios e de integracao para services, repositories e APIs internas.
