# Automy v1.0.0-rc7

## Escopo

Esta RC consolida o dominio canonico do ERP, a Landing Page em projeto separado, a entrada de leads no CRM e o storage privado Railway S3-compatible.

## Entregue

- ERP mantido na Vercel com dominio canonico `https://app.automy.dev.br`.
- Landing Page mantida em repositorio/projeto Vercel separado.
- Endpoint publico `POST /api/public/leads` com validacao Zod, honeypot, rate limit, limite de payload, hash de IP e suporte a Turnstile quando configurado.
- CRM Leads com listagem, busca, filtros, paginacao, detalhe, alteracao de status e conversao em cliente.
- Migrations `leads` e `file_assets`.
- RBAC `leads.read` e `leads.manage`.
- Railway Storage Bucket `automy-production-files` preparado como storage privado.
- Adapter `StorageProvider` com Railway S3-compatible.
- Avatares preparados para `STORAGE_PROVIDER=railway_s3`.
- Brand Kit completo reaplicado nos assets publicos.

## Variaveis

ERP:

- `BETTER_AUTH_URL=https://app.automy.dev.br`
- `AUTOMY_TRUSTED_ORIGINS=https://app.automy.dev.br,https://automy-dashboard.vercel.app`
- `DATABASE_URL`
- `PGSSLMODE`
- `STORAGE_PROVIDER=railway_s3`
- `STORAGE_BUCKET`
- `STORAGE_ENDPOINT`
- `STORAGE_REGION`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`

Landing:

- `ERP_PUBLIC_LEADS_ENDPOINT=https://app.automy.dev.br/api/public/leads`

## Pendencias

- Validar Turnstile com chave oficial quando aprovado.
- Migrar `automy.dev.br` e `www.automy.dev.br` para o projeto da Landing somente apos validacao do formulario em producao.
- Executar bateria autenticada por roles reais.
