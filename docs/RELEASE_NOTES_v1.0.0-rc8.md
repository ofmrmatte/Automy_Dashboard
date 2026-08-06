# Automy v1.0.0-rc8

## Resumo

Esta Release Candidate substitui a `v1.0.0-rc7` como baseline mais recente da sprint de consolidacao, sem mover tags antigas.

## Alteracoes

- Preservada a consolidacao de dominio do ERP em `https://app.automy.dev.br`.
- Preservada a integracao da Landing separada com o CRM Leads.
- Preservado o adapter Railway Storage S3-compatible.
- Corrigida a resposta publica de payload invalido em `POST /api/public/leads` para nao expor mensagens tecnicas de validacao.
- Mantida a protecao de APIs internas por sessao e RBAC.

## Validacoes

- `npm install`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:validate`
- `npm run db:inspect`
- `npm run security:verify`
- `git diff --check`

## Pendencias Externas

- A URL temporaria da Landing no Vercel esta protegida por Vercel Authentication, bloqueando validacao publica completa antes da migracao de dominios.
- A migracao final de `automy.dev.br` e `www.automy.dev.br` para o projeto Landing deve ocorrer somente apos liberar/validar a Landing publicamente.
- CAPTCHA/Turnstile deve ser validado com chave oficial antes de habilitar protecao anti-spam completa.
