# Automy Infrastructure

## Status

Esta foundation reconstrói apenas a infraestrutura de dados da Automy. A aplicação, Design System, Brand Kit, Login Premium, TanStack Start, Better Auth e arquitetura Feature First permanecem preservados.

## Fonte Oficial de Dados

Railway PostgreSQL é o banco oficial da Automy.

O runtime oficial do ERP e Vercel. Railway permanece somente como PostgreSQL e infraestrutura de dados necessaria.

O projeto não deve utilizar Supabase, bancos antigos, mocks ou dados fictícios como fonte da aplicação.

## Estrutura

- `railway/migrations`: migrations versionadas da nova base limpa.
- `railway/seeds`: seeds de configuração de sistema, sem dados de negócio fictícios.
- `scripts/db/run-sql-directory.mjs`: executor local/CI para migrations e seeds.
- `src/shared/server/postgres.ts`: adapter server-side para conexão PostgreSQL.
- `src/shared/server/app-urls.ts`: resolucao centralizada de URL canonica e origens confiaveis.
- `src/shared/server/authz.ts`: sessao, RBAC minimo e contexto de empresa para APIs internas.
- `src/features/identity/server/better-auth.ts`: configuração oficial Better Auth.

## Migration Foundation

Migration ativa:

- `railway/migrations/20260805010000_automy_foundation_schema.sql`
- `railway/migrations/20260805012000_align_better_auth_column_names.sql`
- `railway/migrations/20260805140000_align_rate_limit_primary_key.sql`

Ela cria:

- Better Auth: `user`, `session`, `account`, `verification`, `rate_limit`.
- Organização e RBAC: `companies`, `users`, `roles`, `permissions`, `role_permissions`.
- Operação ERP: `clients`, `contacts`, `addresses`, `products`, `contracts`, `activities`, `activity_logs`, `audit_logs`.
- Suporte ao app atual: `user_profiles`, `user_preferences`, `support_tickets`, `scheduled_calls`, `charges`, `app_settings`.

Todas as entidades de domínio usam UUID, timestamps, soft delete, índices, constraints e foreign keys.

A segunda migration alinha os nomes físicos das colunas base do Better Auth ao contrato observado pelo adapter PostgreSQL oficial, preservando os campos adicionais Automy em snake_case.

A terceira migration adiciona a coluna `id` na tabela `rate_limit`, exigida pelo adapter de banco do Better Auth durante o controle de tentativas de autenticação.

## Seeds

Seed ativa:

- `railway/seeds/20260805011000_foundation_rbac.sql`

Ela cria apenas papéis e permissões oficiais do sistema:

- `admin`
- `manager`
- `operator`
- `read_only`

Não cria clientes, produtos, contratos, tickets, cobranças ou dados demonstrativos.

## Better Auth

Better Auth é o provedor oficial de autenticação.

- Endpoint: `/api/auth/*`.
- Sessões: cookies HttpOnly.
- Banco: Railway PostgreSQL.
- Login: e-mail e senha.
- Cadastro público: desabilitado.
- Recuperação de senha: estrutura pronta; envio depende de provedor transacional.
- Verificação de e-mail: estrutura pronta; envio depende de provedor transacional.
- Better Auth Infra: `dash()` habilitado somente quando `BETTER_AUTH_API_KEY` existir.
- URL canonica atual do ERP: `https://app.automy.dev.br`.
- Origem temporaria raiz: `https://automy.dev.br`, reservada para a Landing Page em projeto Vercel separado.
- Origem temporaria com www: `https://www.automy.dev.br`.
- Origem secundaria Vercel: `https://automy-dashboard.vercel.app`.

## Variáveis por Ambiente

### Development

Usar a URL pública/TCP Proxy do Railway:

```bash
DATABASE_URL=
PGSSLMODE=disable
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5173
AUTOMY_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
BETTER_AUTH_API_KEY=
BETTER_AUTH_API_URL=
BETTER_AUTH_KV_URL=
```

### Preview

Usar a URL pública/TCP Proxy do Railway:

```bash
DATABASE_URL=
PGSSLMODE=disable
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://preview-url.vercel.app
AUTOMY_TRUSTED_ORIGINS=https://preview-url.vercel.app,https://app.automy.dev.br,https://automy.dev.br,https://www.automy.dev.br,https://automy-dashboard.vercel.app
BETTER_AUTH_API_KEY=
BETTER_AUTH_API_URL=
BETTER_AUTH_KV_URL=
```

### Production Vercel

Usar Vercel como runtime canonico. A URL interna `*.railway.internal` só deve ser usada por servicos dentro da própria rede Railway; Vercel deve usar a URL publica/TCP Proxy do Railway PostgreSQL.

```bash
DATABASE_URL=
PGSSLMODE=require
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://app.automy.dev.br
AUTOMY_TRUSTED_ORIGINS=https://app.automy.dev.br,https://automy.dev.br,https://www.automy.dev.br,https://automy-dashboard.vercel.app
BETTER_AUTH_API_KEY=
BETTER_AUTH_API_URL=
BETTER_AUTH_KV_URL=
AVATAR_STORAGE_PROVIDER=cloudflare_r2
```

### Railway PostgreSQL

Railway hospeda apenas o PostgreSQL oficial. Nao hospedar a aplicacao web no Railway enquanto Vercel for o runtime canonico.

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
PGHOST=${{Postgres.PGHOST}}
PGDATABASE=${{Postgres.PGDATABASE}}
PGUSER=${{Postgres.PGUSER}}
PGPORT=${{Postgres.PGPORT}}
```

O host `*.railway.internal` não deve ser usado em Vercel nem em desenvolvimento local.

## Dominios

- `https://app.automy.dev.br`: ERP Automy, projeto Vercel `automy-dashboard`.
- `https://automy.dev.br`: Landing Page, projeto Vercel separado.
- `https://www.automy.dev.br`: futuro redirect para a Landing Page.
- `https://automy-dashboard.vercel.app`: fallback tecnico temporario do ERP.

Rollback: enquanto a Landing Page nao estiver validada, manter `automy.dev.br`, `www.automy.dev.br` e `automy-dashboard.vercel.app` como origens confiaveis no ERP. Nao alterar registros MX, TXT, SPF, DKIM ou qualquer registro de e-mail durante ajustes de dominio web.

## Aplicar Banco

```bash
npm run db:migrate
npm run db:seed
npm run db:validate
npm run db:inspect
```

O executor registra arquivos aplicados em `public.schema_migrations` e falha se uma migration já aplicada for alterada.

## Primeiro Administrador

O primeiro usuário administrador deve ser criado por bootstrap controlado:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@empresa.com BOOTSTRAP_ADMIN_PASSWORD=senha-forte npm run auth:bootstrap-admin
```

O script bloqueia nova execução quando já existe um administrador ativo. A senha nunca deve ser registrada em documentação, logs ou commits.

## Backup e Recovery

- Usar backups/snapshots do serviço PostgreSQL Railway antes de migrations estruturais.
- Exportar dumps manuais antes de alterações de alto risco.
- Validar restore em ambiente Preview antes de qualquer procedimento operacional em Production.
- Nunca alterar migrations já aplicadas; criar uma nova migration incremental.
- Manter `schema_migrations` como trilha operacional de arquivos aplicados.

## Checklist Railway

- Criar novo projeto Railway na nova conta.
- Adicionar PostgreSQL.
- Garantir que o serviço PostgreSQL esteja online.
- Habilitar TCP Proxy para o Postgres quando houver acesso fora da rede Railway.
- Usar a URL pública construída com host e porta do TCP Proxy para local e Vercel.
- Configurar `DATABASE_URL` com a URL pública/proxy para uso local e Vercel.
- Configurar `PGSSLMODE=require` no runtime Railway interno.
- Configurar `PGSSLMODE=disable` para o TCP Proxy público validado nesta foundation.
- Gerar `BETTER_AUTH_SECRET` forte e exclusivo.
- Aplicar `npm run db:migrate`.
- Aplicar `npm run db:seed`.
- Criar o primeiro administrador por fluxo controlado.

## Checklist Vercel

- Configurar `DATABASE_URL` com a URL pública/TCP Proxy do novo Railway.
- Configurar `PGSSLMODE=disable` para o TCP Proxy público validado nesta foundation.
- Configurar `BETTER_AUTH_SECRET`.
- Configurar `BETTER_AUTH_URL` com a URL canônica de produção.
- Configurar `BETTER_AUTH_API_KEY` se Better Auth Infra estiver ativo.
- Remover variáveis legadas de bancos antigos e Supabase.
- Executar novo deploy.
- Validar login, sessão persistente, logout e rotas protegidas.
