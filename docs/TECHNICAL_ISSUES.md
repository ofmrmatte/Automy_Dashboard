# Technical Issues

## Autenticacao oficial com Better Auth

Status: implementado.

### Contexto

A autenticacao temporaria por variaveis administrativas foi substituida por Better Auth usando Railway PostgreSQL como fonte oficial.

### Escopo implementado

- Login por e-mail e senha.
- Logout.
- Sessao persistente com cookies HttpOnly.
- Remember Me.
- Alteracao de senha.
- Recuperacao e redefinicao de senha.
- Estrutura de verificacao de e-mail.
- Perfil integrado aos dados reais do Better Auth.
- RBAC inicial com `admin`, `manager`, `operator` e `read_only`.
- Tabelas Better Auth versionadas em `railway/migrations`.

### Pendencias

- Conectar provedor transacional de e-mail para envio real de recuperacao de senha e verificacao de e-mail.
- Criar fluxo administrativo para cadastro e gestao de usuarios.
- Adicionar auditoria de eventos de autenticacao em `activity_logs`.
- Adicionar testes automatizados para fluxos criticos de autenticacao.
