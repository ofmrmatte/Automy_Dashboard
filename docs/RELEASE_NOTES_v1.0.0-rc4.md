# Release Notes v1.0.0-rc4

Data: 2026-08-05.

## Resumo

Esta release consolida a correcao critica de seguranca antes do inicio dos modulos reais da Automy.

## Inclui

- Railway como runtime canonico da aplicacao.
- Better Auth alinhado a origem Railway.
- `trustedOrigins` centralizado e sem wildcard amplo.
- Vercel mantido apenas como rollback temporario.
- APIs internas protegidas por sessao Better Auth.
- `/api/finance/charges` corrigida para nunca retornar dados anonimamente.
- RBAC minimo aplicado nas APIs atuais.
- `company_id` derivado da sessao/usuario de dominio, sem aceitar empresa enviada pelo cliente.
- Script `npm run security:verify` para validacao operacional.
- `v1.0.0-rc3` preservada sem alteracao.

## Merge

- PR: `#1`
- Branch: `fix/security-and-railway-origin`
- Commit de seguranca: `8a8df1f`
- Merge commit na `main`: `c9ccfd5`

## Deploy Railway

- Projeto: `Automy_ERP`
- Project ID: `25fc59a3-eed9-485c-b8fe-9b47a9278a52`
- Ambiente: `production`
- Environment ID: `e91e2abc-b63a-4a4e-852a-452697e8856c`
- URL validada: `https://automydashboard-production.up.railway.app`
- Deployment validado: `8d6660b5-f130-4494-94eb-6cae4267bf43`
- Status: `SUCCESS`

## Validacoes

- `npm install`: OK.
- `npm run lint`: OK, com 9 warnings antigos de Fast Refresh.
- `npx tsc --noEmit`: OK.
- `npm run build`: OK, com warning informativo antigo de `vite-tsconfig-paths`.
- `npm run db:validate`: OK.
- `npm run db:inspect`: OK.
- `npm run security:verify`: OK para protecoes anonimas e origem nao confiavel.
- `git diff --check`: OK, apenas avisos LF/CRLF do Windows.
- `/login` na Railway: 200.
- `/api/auth/get-session` na Railway: 200.
- Origem Railway: nao retorna `INVALID_ORIGIN`.
- Origem externa nao confiavel: 403.
- `/api/finance/charges` sem sessao: 401.
- APIs internas sem sessao: 401.

## Validacoes Nao Executadas

- Login real, refresh de sessao autenticada, logout autenticado e dashboard apos login nao foram executados porque nao havia credenciais seguras em variaveis de ambiente.
- O script `security:verify` esta preparado para validar admin/read_only quando `SECURITY_ADMIN_EMAIL`, `SECURITY_ADMIN_PASSWORD`, `SECURITY_READ_ONLY_EMAIL` e `SECURITY_READ_ONLY_PASSWORD` forem fornecidas fora do codigo.

## Pendencias Restantes

- Criar credenciais de teste seguras para validacao autenticada automatizada.
- Configurar dominio final `automy.dev.br` no Railway.
- Expandir RBAC para fluxo completo de Usuarios e Permissoes.
- Criar fixtures multiempresa para testar isolamento entre empresas.
- Migrar perfil/preferencias de `app_settings` para tabelas dedicadas.
- Corrigir warnings Fast Refresh em refactor proprio.
- Avaliar substituicao futura de `vite-tsconfig-paths` por `resolve.tsconfigPaths`.
