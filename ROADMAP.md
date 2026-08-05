# Roadmap

## Current Project Status

- `v1.0.0-rc2` congela a baseline oficial da Automy antes dos modulos reais.
- O codigo esta preparado para Railway PostgreSQL.
- O projeto Vercel esta conectado ao GitHub.
- Design System, Brand Kit e Login Premium estao congelados.
- A arquitetura Feature First esta consolidada.
- Better Auth e a autenticacao oficial da Automy.
- As variaveis Railway precisam ser configuradas no Vercel antes de considerar persistencia de producao validada.
- Envio de e-mail transacional para recuperacao de senha e verificacao de e-mail ainda precisa de provedor aprovado.

# BASELINE v1.0.0-RC2

- Design System esta congelado.
- Brand Kit esta congelado.
- Login Premium esta congelado.
- Arquitetura Feature First esta consolidada.
- Railway PostgreSQL e o banco oficial.
- Toda nova funcionalidade devera respeitar `PROJECT_RULES.md`.

## Proxima Etapa

- Iniciar desenvolvimento dos modulos de negocio: Usuarios, Clientes, Produtos, Contratos, Financeiro, Agenda e Suporte.
- Aplicar a migration inicial em Railway PostgreSQL.
- Aplicar a migration Better Auth em Railway PostgreSQL.
- Validar variaveis `DATABASE_URL`, `PGSSLMODE`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` em producao.
- Definir o fluxo administrativo de criacao de usuarios antes de expandir usuarios e permissoes.
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
- Conectar provedor de e-mail transacional ao Better Auth.

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
