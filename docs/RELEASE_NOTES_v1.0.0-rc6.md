# Release Notes v1.0.0-rc6

Data: 2026-08-06.

## Resumo

A RC6 executa a Sprint de Manutencao de Producao da Automy. A aplicacao passa a considerar Vercel como runtime canonico, Railway exclusivamente como PostgreSQL oficial, e adiciona bases operacionais para avatar real, consulta CNPJ e contratos documentais.

## Infraestrutura

- Runtime oficial: Vercel.
- Banco oficial: Railway PostgreSQL.
- Dominio principal: `https://automy.dev.br`.
- Origens secundarias confiaveis: `https://www.automy.dev.br` e `https://automy-dashboard.vercel.app`.
- Better Auth continua como provedor oficial de autenticacao.

## Avatar

- Removido avatar por URL do formulario.
- Criado `AvatarStorageProvider`.
- Adapters preparados: `noop`, `local`, `railway_volume`, `s3` e `cloudflare_r2`.
- Upload aceita PNG, JPG, JPEG e WebP ate 5 MB.
- Imagens sao reprocessadas em WebP 256/512, quadradas e sem EXIF.
- Metadados persistidos em `avatar_assets`.

## Clientes

- Criado endpoint backend de consulta CNPJ.
- Provider inicial: BrasilAPI, configuravel por env.
- Consulta protegida por sessao, RBAC, debounce no frontend, cache e rate limit no backend.
- Clientes armazenam natureza juridica, CNAE, situacao cadastral, data de abertura e snapshot fiscal.

## Contratos

- Contratos preservam snapshot completo por empresa, cliente, produto, termos originais e termos negociados.
- Criados `contract_version`, `contract_hash`, snapshots e tabela `contract_versions`.
- PDF A4 gerado sob demanda pelo servidor a partir de `contract_text`.
- PDF usa `automy-logo-horizontal.svg`; PDFs nao sao armazenados no PostgreSQL.
- Acoes adicionadas: visualizar PDF, baixar PDF, gerar nova versao, preparar assinatura e baixar assinado quando houver storage.
- Provider de assinatura permanece `noop` ate escolha do provedor oficial.

## Migrations

- `20260806100000_avatar_assets_foundation.sql`
- `20260806110000_contract_document_lifecycle.sql`
- `20260806120000_client_fiscal_lookup_fields.sql`

## Pendencias

- Configurar storage oficial em producao, preferencialmente Cloudflare R2 ou S3 compativel.
- Configurar provedor transacional de e-mail.
- Escolher provedor oficial de assinatura eletronica.
- Validar login real no dominio `https://automy.dev.br` apos deploy.
- Expandir testes autenticados por role para novos fluxos RC6.
