# Architecture

## Status

Automy Dashboard e a aplicacao oficial da Automy. A partir desta fase, o projeto nao utiliza dados ficticios nem mocks como fonte de UI.

## Current Project Status

- Baseline oficial congelada em `v1.0.0-rc3`; a tag nao foi movida.
- `v1.0.0-rc4` deve consolidar as correcoes criticas de seguranca e origem Railway.
- A identidade visual, Design System e Brand Kit estao consolidados.
- O Login Premium esta consolidado e nao deve receber alteracoes visuais sem aprovacao explicita.
- O banco oficial e Railway PostgreSQL, acessado somente pelo servidor/API interna.
- Railway e o runtime oficial. Vercel permanece somente como rollback temporario ate o cutover final.
- Better Auth e o provedor oficial de autenticacao.
- O projeto Vercel `automy-dashboard` esta conectado ao GitHub e configurado com as variaveis da nova foundation.
- A persistencia real em Railway PostgreSQL foi validada por TCP Proxy fora da rede Railway e por runtime interno Railway.
- Cadastro publico esta desabilitado; criacao de usuarios deve ocorrer por fluxo administrativo controlado.

# BASELINE v1.0.0-RC3

- Design System esta congelado.
- Brand Kit esta congelado.
- Login Premium esta congelado.
- Arquitetura Feature First esta consolidada.
- Railway PostgreSQL e o banco oficial.
- Foundation operacional ativada na nova conta Railway.
- Vercel configurado com as variaveis da nova foundation.
- Toda nova funcionalidade devera respeitar `PROJECT_RULES.md`.
- Paginas, componentes e modulos de negocio devem manter o fluxo: Pagina -> React Query -> Service -> Repository -> API interna -> Railway PostgreSQL.
- Autenticacao deve permanecer em Better Auth salvo aprovacao explicita para mudanca estrutural.

## Frontend

- React 19
- TanStack Router
- TanStack React Query
- Vite
- TypeScript
- Tailwind CSS 4
- Design System Automy em `src/shared/components`, `src/shared/design` e `src/styles.css`

## Organizacao

- `src/features`: modulos de negocio por dominio.
- `src/features/*/pages`: telas do modulo.
- `src/features/*/api`: query keys e query options.
- `src/features/*/services`: regras de aplicacao e filtros.
- `src/features/*/repositories`: acesso a persistencia.
- `src/features/*/types.ts`: tipos do dominio.
- `src/shared`: componentes, tokens, constantes, utilitarios e infraestrutura compartilhada.
- `src/shared/server/authz.ts`: sessao Better Auth, RBAC minimo e contexto de empresa para APIs internas.
- `src/shared/server/app-urls.ts`: URL canonica e origens confiaveis do Better Auth.
- `railway/migrations`: schema versionado da foundation oficial.
- `railway/seeds`: configuracoes iniciais de sistema, sem dados ficticios.

## Fluxo de Dados

Pagina -> React Query -> Service -> Repository -> API interna -> Railway PostgreSQL

Componentes visuais nao acessam APIs, Railway, Prisma ou outros contratos externos diretamente.

## Seguranca das APIs Internas

Todas as APIs internas conhecidas passam por sessao Better Auth antes de qualquer consulta de dominio.

O contexto server-side deriva:

- `authUserId` da sessao Better Auth.
- `domainUserId` e `companyId` da tabela `users`.
- `role` da role de dominio, com fallback seguro para `read_only`.
- `status`, bloqueando usuarios nao ativos.

As regras minimas aplicadas nesta etapa sao:

- `admin`: leitura e escrita.
- `manager`: leitura e escrita nos modulos operacionais atuais, incluindo financeiro.
- `operator`: leitura nos modulos liberados e escrita apenas onde a seed atual ja permite operacao.
- `read_only`: somente leitura.

Endpoints de negocio nao aceitam `company_id` vindo do cliente. Leituras e escritas usam o `companyId` vinculado ao usuario autenticado.

## Identidade

O modulo `src/features/identity` centraliza autenticacao, perfil e preferencias do usuario.

- Auth: Better Auth em `src/features/identity/server/better-auth.ts`.
- Cliente: `src/features/identity/auth-client.ts`.
- Sessao: `IdentityProvider` consome o service de identidade e carrega a sessao via cookie HttpOnly.
- Rotas publicas: `/login`, `/recuperar-senha`, `/redefinir-senha`.
- Rotas privadas: todas as demais rotas sao protegidas no root route.
- Perfil: dados de usuario Better Auth, dados complementares de perfil, avatar, senha, preferencias e sessoes ativas.
- Avatar: estrutura mantida no dominio de identidade; upload definitivo sera conectado a storage dedicado em etapa futura.

## Configuracoes

O modulo `src/features/settings` centraliza configuracoes reais de empresa, seguranca, integracoes e notificacoes.

- UI: `src/features/settings/components`.
- Queries: `src/features/settings/api/settings.queries.ts`.
- Repository: `src/features/settings/repositories/settings.repository.ts`.
- Service: `src/features/settings/services/settings.service.ts`.
- API interna: `src/features/settings/server/settings-api.ts`.
- Validacao: `src/features/settings/validation.ts`.

Endpoints protegidos:

- `GET/PATCH /api/settings/company`
- `GET/PATCH /api/settings/security`
- `GET /api/settings/integrations`
- `PATCH /api/settings/integrations/:provider`
- `POST /api/settings/integrations/:provider/test`
- `GET/PATCH /api/settings/notifications`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/read-all`

Regras:

- `company_id` sempre e derivado da sessao.
- `settings.manage` e obrigatorio para edicao de Empresa, Seguranca corporativa e Integracoes.
- Preferencias pessoais de notificacao sao gravadas apenas para o usuario autenticado.
- Secrets de integracoes nao sao retornados ao frontend; o status usa metadados seguros e presenca de variaveis de ambiente.
- Alteracoes relevantes geram `audit_logs`.

## Railway PostgreSQL

O acesso server-side fica em `src/shared/server/postgres.ts` e le:

- `DATABASE_URL`
- `PGSSLMODE=require` no runtime Railway interno
- `PGSSLMODE=disable` para o TCP Proxy publico validado em local/Vercel
- `RAILWAY_ENVIRONMENT` para identificar runtime Railway

Sem `DATABASE_URL`, os endpoints de leitura retornam colecoes vazias quando possivel e os fluxos de escrita retornam erro operacional claro.

`DATABASE_URL` com host `*.railway.internal` deve ser usada apenas em runtimes dentro da rede privada Railway. Para desenvolvimento local e Vercel, usar a URL publica/TCP Proxy do Railway.

## Banco Foundation

As migrations ativas da foundation sao:

- `20260805010000_automy_foundation_schema.sql`
- `20260805012000_align_better_auth_column_names.sql`
- `20260805140000_align_rate_limit_primary_key.sql`
- `20260805190000_align_user_statuses.sql`
- `20260805200000_identity_preferences_foundation.sql`
- `20260805213000_settings_foundation.sql`

A migration foundation cria:

- `companies`
- `users`
- `roles`
- `permissions`
- `role_permissions`
- `clients`
- `contacts`
- `addresses`
- `products`
- `contracts`
- `activities`
- `activity_logs`
- `audit_logs`
- `user_profiles`
- `user_preferences`
- `support_tickets`
- `scheduled_calls`
- `charges`
- `app_settings`
- Better Auth: `user`, `session`, `account`, `verification`, `rate_limit`

As entidades usam UUID, auditoria e soft delete. Como o acesso ao banco ocorre por API server-side propria, controles de permissao devem ser aplicados na camada de API/service. RLS pode ser adotado posteriormente caso o banco passe a ser exposto diretamente a clientes ou gateways externos.

A migration de alinhamento Better Auth ajusta os nomes fisicos das colunas base exigidas pelo adapter PostgreSQL e mantem os campos adicionais Automy como extensoes de dominio.

A migration de rate limit adiciona a coluna `id` exigida pelo adapter Better Auth para o armazenamento em banco das tentativas de autenticacao.

## Better Auth

Better Auth substitui a autenticacao temporaria por env vars.

- Senhas usam o hash padrao do Better Auth.
- Sessoes usam cookies HttpOnly.
- `rememberMe` usa o payload oficial do endpoint de login.
- Recuperacao de senha e verificacao de e-mail estao preparadas, com envio transacional pendente de provedor aprovado.
- `last_login` e atualizado quando uma sessao e criada.
- RBAC inicial fica no campo `role` da tabela `user`: `admin`, `manager`, `operator`, `read_only`.
- `status` controla o ciclo de vida do usuario: `active`, `inactive`, `invited`, `suspended`.

### Perfil e preferencias

- Perfil pessoal deve usar `user_profiles`.
- Preferencias pessoais devem usar `user_preferences`.
- Identidade, e-mail, sessoes e senha usam Better Auth.
- Vínculo empresarial e RBAC usam `users`, `roles`, `permissions` e `companies`.
- `app_settings` nao deve ser usado para dados pessoais novos.
- Timezone segue a ordem: preferencia do usuario, timezone do navegador, timezone da empresa, `America/Sao_Paulo`.
- Geolocalizacao precisa permanece desabilitada; nao solicitar GPS sem caso funcional aprovado.
- Avatar por arquivo depende de adapter de storage persistente; enquanto isso, usar URL HTTPS persistida em `user_profiles.avatar_path`.
- Better Auth Infra usa `@better-auth/infra` e habilita `dash()` apenas quando `BETTER_AUTH_API_KEY` estiver configurada.

## Prisma

Prisma ainda nao foi implementado. Quando for adotado, deve ficar atras dos repositories e nao pode ser acessado por paginas ou componentes.
