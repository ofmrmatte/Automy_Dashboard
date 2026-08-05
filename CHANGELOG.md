# Changelog

## Current Project Status

- Baseline oficial: `v1.0.0-rc3`.
- Railway PostgreSQL definido como banco oficial.
- Design System, Brand Kit e Login Premium congelados.
- Arquitetura Feature First consolidada.
- Better Auth definido como provedor oficial de autenticacao.
- Vercel conectado ao GitHub e configurado com variaveis da nova foundation.
- TCP Proxy Railway configurado para acesso local/Vercel.
- Envio transacional de e-mails de autenticacao pendente de provedor aprovado.

# BASELINE v1.0.0-RC3

- Design System esta congelado.
- Brand Kit esta congelado.
- Login Premium esta congelado.
- Arquitetura Feature First esta consolidada.
- Railway PostgreSQL e o banco oficial.
- Foundation operacional ativada na nova conta Railway.
- Vercel configurado com as variaveis da nova foundation.
- Toda nova funcionalidade devera respeitar `PROJECT_RULES.md`.

## 2026-08-05

- Reconstruida a foundation de infraestrutura para nova conta Railway.
- Promovida baseline oficial para `v1.0.0-rc3` apos ativacao operacional da nova foundation.
- Corrigido alinhamento da tabela `rate_limit` do Better Auth para permitir login em producao.
- Removidas migrations Railway antigas.
- Criada migration unica `20260805010000_automy_foundation_schema.sql`.
- Criada migration `20260805012000_align_better_auth_column_names.sql` para alinhamento do adapter PostgreSQL do Better Auth.
- Criado seed `20260805011000_foundation_rbac.sql` para roles e permissions oficiais.
- Adicionado executor `db:migrate`, `db:seed`, `db:validate` e `db:inspect`.
- Adicionado bootstrap controlado do primeiro administrador com bloqueio de reexecucao.
- Configurado TCP Proxy Railway para desenvolvimento local e Vercel.
- Removidas variaveis legadas Supabase do projeto Vercel.
- Adicionado `INFRASTRUCTURE.md` com checklist Railway, Vercel, backup e recovery.
- Integrado Better Auth Infra `dash()` via `@better-auth/infra`.
- Implementado Better Auth como provedor oficial de autenticacao.
- Adicionada migration Railway para tabelas `user`, `session`, `account`, `verification` e `rate_limit`.
- Removida autenticacao temporaria por endpoint local e variaveis administrativas.
- Integrado login, logout, sessao persistente, remember me, alteracao de senha e recuperacao de senha ao Better Auth.
- Preparada estrutura de verificacao de e-mail com envio desabilitado ate configuracao de provedor transacional.
- Protegidos endpoints internos de dados com sessao Better Auth.
- Congelada a baseline `v1.0.0-rc3` antes do desenvolvimento dos modulos de negocio.
- Adicionada documentacao de Baseline Freeze em `docs/BASELINE_FREEZE.md`.
- Documentado que alteracoes estruturais futuras exigem aprovacao explicita.
- Consolidada a migration Railway em `railway/migrations`.
- Removidas configuracoes locais antigas do provedor anterior.
- Atualizada documentacao de Railway, Vercel, autenticacao temporaria e estado atual do projeto.
- Adicionadas release notes da baseline `v1.0.0-rc1`.
- Corrigido warning de dependencia de hook na pagina de Produtos.

## 2026-08-04

- Migrada a persistencia oficial para Railway PostgreSQL.
- Adicionada migration inicial em `railway/migrations`.
- Removidas configuracoes e migrations antigas do provedor anterior.
- Implementado modulo de Identidade com fluxo interno de e-mail e senha.
- Adicionadas rotas de login, recuperacao e redefinicao de senha.
- Adicionada protecao de rotas privadas.
- Criada tela real de Perfil em Configuracoes.
- Adicionadas preferencias por usuario.
- Removidos mocks e dados ficticios dos modulos principais.
- Repositories preparados para leitura e escrita via API interna.
- Paginas convertidas para consumo via React Query.
- Adicionados Empty States para telas sem registros reais.
- Adicionados tipos compartilhados para entidades auditaveis.
- Criada migration inicial com UUID, auditoria e soft delete.
- Atualizado shell para remover usuario e notificacao ficticios.
- Atualizada documentacao de arquitetura, regras e roadmap.
