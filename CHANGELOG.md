# Changelog

## v1.0.0-rc9

- Finalizada a migracao de dominios entre os projetos Vercel da Automy.
- Mantido o ERP no projeto `automy-dashboard` com dominio canonico `https://app.automy.dev.br`.
- Mantido `https://automy-dashboard.vercel.app` como fallback tecnico do ERP.
- Movidos `https://automy.dev.br` e `https://www.automy.dev.br` para o projeto Vercel `automy-landing`.
- Configurado `https://www.automy.dev.br` com redirect 308 para `https://automy.dev.br`.
- Removidas as origens da Landing das origens confiaveis padrao do Better Auth no ERP.
- Documentada a separacao final entre Landing publica, ERP autenticado e endpoint publico de Leads.

## v1.0.0-rc8

- Mantida a consolidacao da RC7 e publicada correcao pos-validacao sem mover tags anteriores.
- Corrigida resposta publica de payload invalido em `POST /api/public/leads`, substituindo mensagens tecnicas do Zod por mensagem segura e apropriada.
- Mantida a normalizacao server-side de `revokeOtherSessions` no fluxo de alteracao de senha para evitar payload booleano ausente.

## v1.0.0-rc7

- Consolidado `https://app.automy.dev.br` como dominio canonico do ERP.
- Integrada Landing Page separada ao ERP por `POST /api/public/leads`.
- Criada foundation de CRM Leads com tabela `leads`, RBAC `leads.read`/`leads.manage`, auditoria, filtro, detalhe e conversao em cliente.
- Criada tabela `file_assets` e adapter `StorageProvider` para Railway Storage S3-compatible.
- Avatares passam a suportar `STORAGE_PROVIDER=railway_s3` com arquivos privados servidos por rota autenticada.
- Aplicado `automy-brand-kit-completo` nos assets publicos do ERP e da Landing.
- Atualizada a documentacao de infraestrutura, arquitetura e roadmap para Railway PostgreSQL + Railway Storage.

## Current Project Status

- Release Candidate atual em consolidacao: `v1.0.0-rc9`.
- `v1.0.0-rc4` permanece como release de correcao critica de seguranca e origem Railway.
- Railway PostgreSQL definido como banco oficial.
- Design System, Brand Kit e Login Premium congelados.
- Arquitetura Feature First consolidada.
- Better Auth definido como provedor oficial de autenticacao.
- Vercel conectado ao GitHub e configurado com variaveis da nova foundation.
- TCP Proxy Railway configurado para acesso local/Vercel.
- ERP canonico em `https://app.automy.dev.br`.
- Landing canonica em `https://automy.dev.br`, com `https://www.automy.dev.br` redirecionando para o apex.
- Envio transacional de e-mails de autenticacao pendente de provedor aprovado.

## Unreleased

- Corrigida consulta CNPJ em producao substituindo provider hardcoded antigo por CNPJ.ws server-side.
- Adicionadas tabelas `company_registry_cache` e `company_registry_rate_limits` para cache persistente e rate limit operacional.
- Frontend de Clientes passa a acionar apenas a API interna, com debounce, consulta manual, abort de requisicao anterior e preenchimento sem sobrescrever campos ja digitados.
- Restaurado preview/download de PDF de contratos no runtime serverless Vercel usando bundle standalone do PDFKit.
- Endpoint de PDF de contratos passa a retornar headers seguros, erros JSON apropriados e auditoria distinta para preview/download.
- Adicionado teste automatizado focado para normalizacao/mapeamento CNPJ.ws, cache, 429, headers e geracao minima de PDF.
- Corrigido envio de confirmacao no fluxo de alteracao de senha para evitar erro tecnico de validacao do Zod.
- Documentado Vercel como runtime oficial do ERP e Railway como PostgreSQL/infraestrutura de dados.

## v1.0.0-rc6

- Alterada a arquitetura canonica para Vercel como runtime oficial da aplicacao, APIs internas e Better Auth.
- Railway permanece como PostgreSQL oficial; runtime web Railway foi documentado como nao operacional para a aplicacao.
- Atualizada resolucao de URL canonica para `https://automy.dev.br`, com `https://www.automy.dev.br` e `https://automy-dashboard.vercel.app` como origens secundarias confiaveis.
- Removido o campo de avatar por URL do perfil.
- Criado `AvatarStorageProvider` com adapters `noop`, `local`, `railway_volume`, `s3` e `cloudflare_r2` preparados.
- Implementado processamento de avatar com MIME seguro, limite de 5 MB, imagem quadrada, WebP 256/512 e metadados em `avatar_assets`.
- Criado endpoint backend de consulta CNPJ com provider configuravel, cache e rate limit.
- Cliente passa a preencher dados fiscais/endereco a partir do provider de CNPJ sem chamada direta do frontend ao provider externo.
- Adicionados campos fiscais reais em clientes: natureza juridica, CNAE, situacao cadastral, data de abertura e snapshot fiscal.
- Contratos passam a preservar snapshot completo, termos originais do produto, termos negociados, versao e hash.
- Criado `ContractPdfService` para gerar PDF A4 sob demanda a partir de `contract_text` usando o SVG oficial da Automy.
- Adicionadas acoes de contrato: visualizar PDF, baixar PDF, gerar nova versao, preparar envio para assinatura e baixar contrato assinado quando existir storage futuro.
- Criada base de `ElectronicSignatureProvider` via provider `noop`, sem sobrescrever contratos assinados.

## v1.0.0-rc5

- Consolidada a foundation funcional completa na `main` por merge preservando historico da branch `feature/complete-functional-foundation`.

- Implementadas notificacoes operacionais in-app para eventos reais de Clientes, Produtos, Contratos, Financeiro, Agenda e Suporte.
- Adicionado helper server-side compartilhado para gerar notificacoes respeitando `company_notification_settings` e `notification_preferences`.
- Adicionado arquivamento de notificacoes no centro do header e endpoint protegido `PATCH /api/notifications/:id/archive`.
- Adicionado teste funcional autenticado para emissao, leitura e arquivamento de notificacoes reais.
- Implementada Busca Global real no header com command palette, atalho `Ctrl/Cmd+K`, endpoint protegido `/api/search`, RBAC por dominio e consultas parametrizadas no Railway PostgreSQL.
- Busca Global agora cobre Clientes, Produtos, Contratos, Financeiro, Agenda, Suporte, Usuarios e Auditoria conforme permissoes do usuario autenticado.
- Implementado modulo Relatorios com endpoint protegido `/api/reports`, filtros reais por periodo, RBAC por dominio e exportacao CSV, XLSX e PDF a partir de dados reais do Railway PostgreSQL.
- Relatorios agora cobrem Clientes, Produtos, Contratos, Financeiro, Agenda, Suporte, Usuarios, Permissoes e Auditoria, sempre com `company_id` derivado da sessao.
- Criado exportador client-side reutilizavel para gerar arquivos vazios validos quando nao houver registros, sem mocks ou placeholders.
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
