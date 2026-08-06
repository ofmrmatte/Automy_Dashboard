# Release Notes v1.0.0-rc5

Data: 2026-08-05.

## Resumo

Esta release candidate consolida na `main` a foundation funcional da Automy, preservando o historico da branch `feature/complete-functional-foundation` e mantendo Railway PostgreSQL, Better Auth, Design System, Brand Kit e Login Premium como bases oficiais.

## Inclui

- Merge preservando historico da branch `feature/complete-functional-foundation`.
- Configuracoes reais de Empresa, Seguranca, Integracoes e Notificacoes.
- Dashboard com metricas, graficos, clientes recentes e atividades usando dados reais.
- CRUD real de Clientes, Produtos, Contratos, Financeiro, Agenda e Suporte.
- Relatorios reais por modulo com exportacao CSV, XLSX e PDF.
- Busca Global no header com endpoint protegido e RBAC por dominio.
- Notificacoes operacionais in-app geradas por eventos reais dos modulos.
- Perfil, preferencias, timezone, saudacao dinamica, sessoes e alteracao de senha integrados ao Better Auth.
- Migrations incrementais para settings, clientes, produtos, contratos, financeiro, agenda e suporte.
- Scripts funcionais autenticados para financeiro, agenda, suporte, relatorios, busca e notificacoes.

## Commits Incorporados

- `3da5d57` `feat(settings): add persistent settings foundation`
- `0f4de27` `feat(settings): complete functional settings panels`
- `dba7a65` `chore(settings): document settings foundation validation`
- `e1adb53` `feat(dashboard): connect real business metrics`
- `75a71cd` `feat(clients): complete client management`
- `69c0cb8` `feat(products): complete product management`
- `9640897` `feat(contracts): complete contract lifecycle`
- `7e8c4fe` `feat(finance): complete billing management`
- `c7df56d` `feat(scheduling): complete timezone-aware scheduling`
- `01b5276` `feat(support): complete ticket management lifecycle`
- `b4e769b` `feat(reports): implement real operational exports`
- `8fb88da` `feat(search): implement global operational search`
- `536deee` `feat(notifications): emit operational in-app notifications`

## Banco e Migrations

- `20260805213000_settings_foundation.sql`
- `20260805223000_clients_operational_fields.sql`
- `20260805233000_products_operational_fields.sql`
- `20260806000000_contracts_lifecycle_fields.sql`
- `20260806010000_finance_billing_lifecycle.sql`
- `20260806020000_scheduling_timezone_lifecycle.sql`
- `20260806030000_support_ticket_lifecycle.sql`

## Validacoes Esperadas

- `npm install`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run db:validate`
- `npm run db:inspect`
- `npm run security:verify`

## Pendencias Restantes

- Testes autenticados completos por `manager`, `operator` e `read_only`.
- Scheduler/event worker para lembretes de agenda, contratos, cobrancas e SLA.
- Provider transacional de e-mail para recuperacao, verificacao e convites.
- Storage oficial para uploads binarios.
- Auditoria administrativa como proximo modulo operacional.
