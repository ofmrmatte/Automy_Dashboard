# Automy v1.0.0-rc9

Esta release candidate finaliza a migracao de dominios entre os dois projetos Vercel oficiais da Automy, preservando a arquitetura, Design System, Brand Kit, Login Premium, Better Auth, Railway PostgreSQL e modulos existentes.

## Dominios

- ERP: `https://app.automy.dev.br`.
- Fallback tecnico do ERP: `https://automy-dashboard.vercel.app`.
- Landing: `https://automy.dev.br`.
- Redirect da Landing: `https://www.automy.dev.br` -> `https://automy.dev.br` com status 308.

## Vercel

- Projeto ERP: `automy-dashboard`.
- Projeto Landing: `automy-landing`.
- Apex e `www` foram removidos do projeto ERP e associados ao projeto Landing.
- `app.automy.dev.br` foi preservado no projeto ERP.

## Better Auth

- URL canonica do ERP: `https://app.automy.dev.br`.
- Origens confiaveis de producao do ERP: `https://app.automy.dev.br,https://automy-dashboard.vercel.app`.
- Landing nao participa do fluxo Better Auth.

## Leads

- A Landing continua enviando o formulario para `/api/leads`.
- A funcao serverless da Landing encaminha para `POST https://app.automy.dev.br/api/public/leads`.
- O endpoint publico do ERP permanece protegido por validacao, honeypot, rate limit e origens publicas permitidas.

## Infraestrutura

- Railway segue como PostgreSQL oficial e Storage S3-compatible privado.
- Vercel segue como runtime oficial da aplicacao e da Landing.
- Nenhum registro de e-mail deve ser alterado por esta release.

## Validacoes Esperadas

- `https://automy.dev.br` responde 200.
- `https://www.automy.dev.br` redireciona para `https://automy.dev.br` com 308 e preserva path/query.
- `https://app.automy.dev.br/login` responde 200.
- `https://automy-dashboard.vercel.app/login` responde 200.
- Landing envia leads para o CRM do ERP via endpoint publico.
