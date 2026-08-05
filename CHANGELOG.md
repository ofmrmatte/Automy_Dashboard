# Changelog

## Current Project Status

- Baseline oficial publicada: `v1.0.0-rc3`.
- Correcoes criticas em preparacao para `v1.0.0-rc4`.
- Railway PostgreSQL definido como banco oficial.
- Design System, Brand Kit e Login Premium congelados.
- Arquitetura Feature First consolidada.
- Better Auth definido como provedor oficial de autenticacao.
- Vercel conectado ao GitHub e configurado com variaveis da nova foundation.
- TCP Proxy Railway configurado para acesso local/Vercel.
- Envio transacional de e-mails de autenticacao pendente de provedor aprovado.

## Unreleased

- Implementado modulo Suporte completo com criar, listar, visualizar, editar, atribuir, alterar prioridade/status, mensagens internas, resolver, reabrir, cancelar, soft delete, busca, filtro, paginacao, auditoria e activity log.
- Criada migration `20260806030000_support_ticket_lifecycle.sql` para ciclo de vida de tickets, SLA, responsavel, tags, mensagens, eventos e anexos por metadados.
- Finalizado endpoint protegido `/api/support/tickets` com `GET`, `POST`, `PATCH` e `DELETE`, sempre com `company_id` derivado da sessao e RBAC `support.read`/`support.manage`.
- Implementado modulo Agenda completo com criar, listar, visualizar, editar, reagendar, concluir, cancelar, soft delete, busca, filtro, paginacao, validacao RHF+Zod, auditoria e activity log.
- Criada migration `20260806020000_scheduling_timezone_lifecycle.sql` para persistencia UTC em `start_at`/`end_at`, timezone original, responsavel, participantes, lembretes, cliente vinculado e indices operacionais.
- Finalizado endpoint protegido `/api/scheduled-calls` com `GET`, `POST`, `PATCH` e `DELETE`, sempre com `company_id` derivado da sessao e RBAC `schedule.read`/`schedule.manage`.
- Agenda passou a apresentar horarios no timezone do usuario, mantendo armazenamento em UTC e evitando dependencia do timezone local do servidor.
- Implementado modulo Financeiro completo com criar, listar, visualizar, editar, marcar como paga, cancelar, detectar atraso, soft delete, filtros, paginacao, validacao RHF+Zod, auditoria e activity log.
- Criada migration `20260806010000_finance_billing_lifecycle.sql` para status oficiais `pending/paid/overdue/canceled/failed`, campos de conciliacao, indices financeiros e eventos de webhook.
- Finalizado endpoint protegido `/api/finance/charges` com `GET`, `POST`, `PATCH` e `DELETE`, sempre com `company_id` derivado da sessao e RBAC `finance.read`/`finance.manage`.
- Preservada integracao Mercado Pago com assinatura de webhook, janela anti-replay, idempotencia por evento, registro de eventos e conciliacao apenas quando houver cobranca correspondente.
- Implementado modulo Contratos completo com CRUD real, visualizar, editar, ativar, suspender, renovar, cancelar, encerrar, soft delete, filtros, paginacao, validação RHF+Zod, itens de contrato, auditoria e activity log.
- Criada migration `20260806000000_contracts_lifecycle_fields.sql` para ciclo de vida, campos comerciais e `contract_items`.
- Implementado modulo Produtos completo com CRUD real, visualizar, editar, ativar/inativar, soft delete, busca, filtros, paginacao, validação RHF+Zod, termos comerciais, modelo de contrato, auditoria e activity log.
- Criada migration `20260805233000_products_operational_fields.sql` para campos operacionais e indices de produtos.
- Implementado módulo Clientes completo com CRUD real, edição, inativação/reativação, soft delete, busca, filtro, paginação client-side, validação RHF+Zod, contato/endereço principal, auditoria e activity log.
- Criada migration `20260805223000_clients_operational_fields.sql` para campos operacionais de clientes.
- Implementada Fase 4 do Dashboard real com agregacoes server-side no Railway PostgreSQL.
- Adicionados endpoints protegidos `/api/dashboard/charts` e `/api/dashboard/recent-clients`.
- Dashboard passou a exibir metricas reais de clientes, contratos, receita, cobrancas, tickets, agendamentos e usuarios ativos conforme permissoes do usuario autenticado.
- Graficos de crescimento de clientes, receita recorrente, contratos por status, tickets por prioridade, produtos por utilizacao e cobrancas por status passaram a usar dados reais com empty states.
- Implementada Fase 3 das Configuracoes: Empresa, Seguranca, Integracoes e Notificacoes.
- Criada migration `20260805213000_settings_foundation.sql` com colunas corporativas em `companies` e tabelas dedicadas para seguranca, integracoes, preferencias e notificacoes.
- Adicionados endpoints protegidos `/api/settings/company`, `/api/settings/security`, `/api/settings/integrations`, `/api/settings/notifications` e `/api/notifications`.
- Conectado o sino do header ao centro real de notificacoes in-app com contagem de nao lidas e marcacao como lida.
- Adicionado registro de login bem-sucedido em `login_history`.
- Ajustado o runner de migrations para checksum estavel entre CRLF e LF.
- Implementada Fase 2 da fundacao funcional: Perfil, Preferencias, timezone e personalizacao regional.
- Substituido o fluxo de perfil/preferencias em `app_settings` por endpoints reais em `user_profiles` e `user_preferences`.
- Adicionados endpoints protegidos `/api/identity/profile`, `/api/identity/preferences`, `/api/identity/avatar`, `/api/identity/password` e `/api/identity/sessions`.
- Adicionada migration `20260805200000_identity_preferences_foundation.sql` para `first_day_of_week`, timezone de empresa e metadados de avatar.
- Implementada saudacao dinamica por primeiro nome e timezone.
- Atualizado header para usar nome, avatar, role, empresa e menu de usuario reais.
- Implementada listagem e revogacao de sessoes do usuario autenticado.
- Alteracao de senha passou a auditar e permitir revogar outras sessoes.
- Geolocalizacao precisa permanece desabilitada por decisao arquitetural; a aplicacao usa apenas locale/timezone do navegador.
- Implementada Fase 1 da fundacao funcional: Usuarios e Permissoes.
- Criado modulo feature-first `src/features/users` com types, validations, repository, service, React Query, componentes e paginas.
- Criada API interna protegida para usuarios, senha, sessoes e matriz de permissoes.
- Criada migration `20260805190000_align_user_statuses.sql` para status oficiais `active`, `inactive`, `invited`, `suspended`.
- Adicionada regra server-side para preservar ao menos um administrador ativo.
- Adicionada auditoria em `audit_logs` para criacao, atualizacao, senha, revogacao de sessoes e soft delete de usuarios.
- Conectadas as secoes `Usuarios` e `Permissoes` em Configuracoes.
- Preparadas rotas diretas `/usuarios` e `/permissoes`.

## v1.0.0-rc4

- Protegida a rota `/api/finance/charges` com sessao Better Auth antes de qualquer consulta financeira.
- Aplicado RBAC server-side minimo nas APIs internas existentes.
- Derivado `company_id` pelo usuario autenticado, sem aceitar empresa enviada pelo cliente.
- Centralizada a resolucao de URL canonica e origens confiaveis para Better Auth.
- Ajustado Railway para ser runtime canonico via `BETTER_AUTH_URL`.
- Adicionado script `npm run security:verify` para validar protecoes criticas sem credenciais hardcoded.
- Documentado que `v1.0.0-rc3` nao foi movida e que `v1.0.0-rc4` devera representar a correcao critica.
- Validado deployment Railway `8d6660b5-f130-4494-94eb-6cae4267bf43` com status `SUCCESS`.
- Adicionadas release notes em `docs/RELEASE_NOTES_v1.0.0-rc4.md`.

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
