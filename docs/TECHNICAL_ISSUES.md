# Technical Issues

## Implementar autenticação definitiva com PostgreSQL

Status: pendente de criação no GitHub.

Motivo: a criação via conector GitHub retornou `403 Resource not accessible by integration`, e o GitHub CLI (`gh`) não está instalado neste ambiente.

### Contexto

A baseline `v1.0.0-rc1` mantém autenticação temporária por `AUTOMY_ADMIN_EMAIL` e `AUTOMY_ADMIN_PASSWORD` para preservar acesso durante a consolidação da migração Railway.

Essa solução não deve ser expandida para multiusuario nem tratada como autenticação final de produção.

### Objetivo

Implementar autenticação definitiva usando PostgreSQL como fonte de verdade, mantendo a arquitetura atual da Automy.

### Escopo técnico

- Criar modelagem de usuários, credenciais e sessões em PostgreSQL.
- Armazenar senhas apenas com hash forte e salt.
- Implementar criação, login, logout e expiração de sessão.
- Implementar recuperação e redefinição de senha.
- Implementar bloqueio/rate limit por tentativas inválidas.
- Registrar eventos em `activity_logs`.
- Manter acesso via Repository Pattern e Service Layer.
- Não acessar banco diretamente por páginas ou componentes.
- Atualizar migrations em `railway/migrations`.
- Adicionar testes de unidade e integração para fluxos críticos.

### Critérios de aceite

- Nenhuma credencial administrativa fixa por env var é necessária para login comum.
- Sessões são persistidas e podem ser revogadas.
- Usuários reais são carregados da tabela `users`.
- Fluxo de recuperação de senha funciona sem expor informação sensível.
- Lint, TypeScript e build passam.
