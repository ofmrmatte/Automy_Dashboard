# Roadmap

## Current Project Status

- `v1.0.0-rc1` consolida a baseline oficial da Automy.
- O codigo esta preparado para Railway PostgreSQL.
- O projeto Vercel esta conectado ao GitHub.
- As variaveis Railway precisam ser configuradas no Vercel antes de considerar persistencia de producao validada.
- A autenticacao atual e temporaria e deve ser migrada para um fluxo definitivo em PostgreSQL.

## Proxima Etapa

- Aplicar a migration inicial em Railway PostgreSQL.
- Validar variaveis `DATABASE_URL`, `PGSSLMODE`, `AUTOMY_ADMIN_EMAIL` e `AUTOMY_ADMIN_PASSWORD` em producao.
- Definir o provedor definitivo de autenticacao antes de expandir usuarios e permissoes.
- Remover variaveis legadas do provedor anterior no Vercel apos confirmar que a aplicacao usa somente Railway.
- Criar onboarding da primeira empresa.
- Implementar formularios reais com React Hook Form e Zod.
- Implementar CRUDs reais para clientes, produtos e contratos.

## Dados e Permissoes

- Revisar autorizacao server-side com usuarios reais.
- Criar matriz de permissoes por role.
- Definir fluxo administrativo para permissions globais.
- Adicionar auditoria automatica de `created_by` e `updated_by`.
- Avaliar endpoint administrativo para auditoria completa de sessoes, caso o produto precise listar todos os dispositivos conectados.

## Modulos

- Clientes: CRUD, contatos, enderecos e historico.
- Produtos: CRUD e vinculacao com contratos.
- Contratos: vigencia, valores e renovacoes.
- Financeiro: modelagem propria antes de exibir cobrancas.
- Suporte: modelagem propria antes de exibir tickets.
- Relatorios: exportacao somente com dados reais.

## Qualidade

- Adicionar testes unitarios para services e repositories.
- Adicionar testes de integracao para fluxos criticos.
- Criar pipeline de lint, typecheck e build.
- Adicionar monitoramento de erros em producao.
