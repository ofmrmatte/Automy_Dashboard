# Functional Audit v1.0.0-rc5

Data: 2026-08-05.

## 1. Resumo executivo

A Automy v1.0.0-rc5 consolida na `main` a foundation funcional completa apos merge da branch `feature/complete-functional-foundation`. O runtime oficial permanece Railway com banco Railway PostgreSQL.

O estado funcional ainda e de foundation, mas os principais modulos ja possuem persistencia real: autenticacao oficial, banco Railway PostgreSQL, RBAC inicial, Design System, Brand Kit, Login Premium, arquitetura feature-first, Usuarios/Permissoes, Perfil/Preferencias, Configuracoes, Dashboard real, Clientes, Produtos, Contratos, Financeiro, Agenda, Suporte, Relatorios, Busca Global e Notificacoes in-app estao consolidados. Ainda faltam automacoes, providers externos finais e testes autenticados por todos os perfis.

Ponto critico originalmente confirmado: o administrador nao conseguia criar outros usuarios porque nao existia implementacao funcional do modulo de Usuarios. A foundation funcional implementa tela, formulario, endpoint, criacao Better Auth com senha temporaria, vinculo de dominio, sessoes, soft delete e matriz de permissoes.

## 2. Sincronizacao e deploy

| Item                | Resultado                                                               |
| ------------------- | ----------------------------------------------------------------------- |
| Branch local        | `main`                                                                  |
| Status local        | `main` com merge da foundation funcional em validacao para `v1.0.0-rc5` |
| Tag                 | `v1.0.0-rc5` preparada apos validacoes finais                           |
| Commit da tag       | definido apos commit final de documentacao RC5                          |
| Railway project     | `Automy_ERP`                                                            |
| Railway environment | `production`                                                            |
| Railway service     | `Automy_Dashboard`                                                      |
| Railway URL         | `https://automydashboard-production.up.railway.app`                     |
| Deploy observado    | sera verificado apos push da `main`                                     |
| Deploy status       | pendente de verificacao pos-push                                        |

## 3. Perfis de teste

Nao foram criados usuarios nesta auditoria.

| Perfil    | Existe usuario de teste? | Evidencia                                 |
| --------- | ------------------------ | ----------------------------------------- |
| admin     | Sim                      | Banco possui 1 usuario `admin` ativo      |
| manager   | Nao                      | Role existe, mas nao ha usuario associado |
| operator  | Nao                      | Role existe, mas nao ha usuario associado |
| read_only | Nao                      | Role existe, mas nao ha usuario associado |

Sem credenciais seguras em variaveis `SECURITY_*`, os testes autenticados por perfil ficaram bloqueados. O script `security:verify` validou acessos anonimos e origem nao confiavel, mas pulou os cenarios autenticados.

## 4. Estado do banco

Contagens funcionais observadas, sem expor dados sensiveis:

| Tabela           |                                    Registros ativos |
| ---------------- | --------------------------------------------------: |
| companies        |                                                   1 |
| user             |                                                   1 |
| users            |                                                   1 |
| roles            |                                                   4 |
| permissions      |                                                  17 |
| role_permissions |                                                  44 |
| user_profiles    |                                                   1 |
| user_preferences |                                                   1 |
| clients          |                                                   0 |
| contacts         |                                                   0 |
| addresses        |                                                   0 |
| products         |                                                   0 |
| contracts        |                                                   0 |
| support_tickets  |                                                   0 |
| scheduled_calls  |                                                   0 |
| charges          |                                                   0 |
| activity_logs    |                                                   0 |
| audit_logs       |                                                   1 |
| app_settings     | 2 entradas, sendo 1 `profile:*` e 1 `preferences:*` |
| session          |                                                   6 |

Observacao: nesta branch, perfil e preferencias passam a usar `user_profiles` e `user_preferences`. As entradas antigas de `app_settings` permanecem como legado de banco ate uma limpeza planejada.

## 5. Matriz funcional por modulo

| Modulo        | Funcionalidade                        | Status            | Severidade | Perfil afetado                | Causa provavel                                                                                                | Dependencia                  | Acao recomendada                              |
| ------------- | ------------------------------------- | ----------------- | ---------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------- |
| Dashboard     | Rota abre                             | FUNCIONAL         | baixa      | todos autenticados            | rota existe                                                                                                   | sessao Better Auth           | manter                                        |
| Dashboard     | Metricas principais                   | FUNCIONAL         | baixa      | todos autenticados            | agregacoes server-side por `company_id`, permissoes e soft delete                                             | dados reais por modulo       | validar com massa controlada                  |
| Dashboard     | Saudacao dinamica                     | FUNCIONAL         | baixa      | todos                         | usa primeiro nome, idioma e timezone resolvido                                                                | perfil/preferencias/timezone | validar autenticado em ambiente real          |
| Dashboard     | Fuso horario no header                | FUNCIONAL         | baixa      | todos                         | datas principais usam helpers regionais com timezone do usuario                                               | user_preferences             | manter e validar por role                     |
| Dashboard     | Graficos                              | FUNCIONAL         | baixa      | todos autenticados            | usa `/api/dashboard/charts` com dados reais e empty states                                                    | historico real               | validar com massa controlada                  |
| Dashboard     | Atividades recentes                   | PARCIAL           | media      | todos                         | le `activity_logs`, mas CRUDs antigos ainda nao geram logs em todos os modulos                                | eventos de dominio           | registrar activity_logs nos proximos CRUDs    |
| Clientes      | Listagem                              | FUNCIONAL         | baixa      | roles com `clients.read`      | endpoint real com `company_id`, contato/endereco principal e soft delete                                      | sessao e company_id          | validar por role                              |
| Clientes      | Busca/filtro/paginacao                | FUNCIONAL         | baixa      | frontend                      | filtro por termo/status e paginacao inicial sobre dados carregados                                            | dados carregados             | evoluir para server-side em alto volume       |
| Clientes      | Criacao                               | FUNCIONAL         | baixa      | admin/manager                 | RHF+Zod, endpoint POST, contato/endereco principal, audit/activity log                                        | `clients.manage`             | manter                                        |
| Clientes      | Edicao/inativacao/reativacao/exclusao | FUNCIONAL         | baixa      | admin/manager                 | PATCH e DELETE soft delete implementados                                                                      | `clients.manage`             | validar por role                              |
| Clientes      | Relacionamentos/documentos            | PARCIAL           | media      | todos                         | produtos/contratos/financeiro/tickets/agenda dependem dos modulos correspondentes                             | modulos externos             | completar nas proximas fases                  |
| Produtos      | Listagem/busca/filtro/paginacao       | FUNCIONAL         | baixa      | roles com `products.read`     | endpoint real, filtros por termo/status/categoria e paginacao client-side                                     | sessao e company_id          | evoluir para server-side em alto volume       |
| Produtos      | Criacao                               | FUNCIONAL         | baixa      | admin/manager                 | RHF+Zod, endpoint POST, termos comerciais, template, audit/activity log                                       | `products.manage`            | validar por role                              |
| Produtos      | Visualizacao/edicao                   | FUNCIONAL         | baixa      | admin/manager                 | modal de detalhe e PATCH com campos operacionais                                                              | `products.manage`            | manter                                        |
| Produtos      | Ativacao/inativacao/soft delete       | FUNCIONAL         | baixa      | admin/manager                 | PATCH status e DELETE soft delete com modal do Design System                                                  | `products.manage`            | validar por role                              |
| Produtos      | Vinculo com clientes                  | FUNCIONAL         | baixa      | todos                         | clientes e contratos sao contados por vinculos reais em `contracts`                                           | contratos reais              | aprofundar no modulo Contratos                |
| Contratos     | Listagem/busca/filtro/paginacao       | FUNCIONAL         | baixa      | roles com `contracts.read`    | endpoint real com cliente/produto, filtro por termo/status e paginacao                                        | produtos/clientes            | evoluir para server-side em alto volume       |
| Contratos     | Criacao                               | FUNCIONAL         | baixa      | admin/manager                 | RHF+Zod, cliente/produto reais, item de contrato, audit/activity log                                          | `contracts.manage`           | validar por role                              |
| Contratos     | Edicao/ciclo de vida                  | FUNCIONAL         | baixa      | admin/manager                 | PATCH cobre ativar, suspender, renovar, cancelar, encerrar e edicao comercial                                 | ciclo de vida de contrato    | validar por role                              |
| Financeiro    | Listagem de cobrancas                 | FUNCIONAL         | baixa      | roles com `finance.read`      | endpoint protegido, company_id aplicado, metricas reais e empty states                                        | charges reais                | validar por role                              |
| Financeiro    | Metricas no Dashboard                 | FUNCIONAL         | baixa      | roles com `finance.read`      | Dashboard agrega `charges` e contratos reais quando permitido                                                 | charges/contratos reais      | manter                                        |
| Financeiro    | Criacao/edicao/baixa/cancelamento     | FUNCIONAL         | baixa      | admin/manager                 | RHF+Zod, endpoint POST/PATCH/DELETE, soft delete, audit/activity log                                          | `finance.manage`             | validar por role                              |
| Financeiro    | Mercado Pago webhook                  | FUNCIONAL/PARCIAL | media      | sistema                       | assinatura, anti-replay, idempotencia e eventos persistidos; sandbox depende env                              | env Mercado Pago             | validar end-to-end com sandbox                |
| Agenda        | Calendario e criacao                  | FUNCIONAL         | baixa      | admin/manager/operator        | endpoint real, cliente vinculado, RHF+Zod, audit/activity log                                                 | `schedule.manage`            | validar por role                              |
| Agenda        | Timezone/UTC                          | FUNCIONAL         | baixa      | todos                         | armazena `start_at`/`end_at` em UTC e exibe no timezone do usuario                                            | user_preferences             | validar com usuarios em fusos diferentes      |
| Agenda        | Edicao/cancelamento/lembretes         | FUNCIONAL/PARCIAL | media      | operadores                    | editar/reagendar/concluir/cancelar existem; notificacoes in-app de CRUD existem; lembretes dependem scheduler | workflow agenda              | implementar scheduler de lembretes            |
| Suporte       | Listagem/criacao                      | FUNCIONAL         | baixa      | admin/manager/operator        | endpoint real, cliente vinculado, RHF+Zod, audit/activity log                                                 | `support.manage`             | validar por role                              |
| Suporte       | Mensagens/SLA/anexos/encerramento     | FUNCIONAL/PARCIAL | media      | suporte                       | mensagens, SLA, anexos por metadados e notificacoes in-app de CRUD existem; automacoes dependem de scheduler  | modelo ticket completo       | integrar storage e automacoes de SLA          |
| Relatorios    | CSV                                   | FUNCIONAL         | baixa      | usuarios autorizados por RBAC | endpoint `/api/reports` usa dados reais por `company_id`                                                      | sessao e RBAC                | validar por role                              |
| Relatorios    | PDF/XLSX                              | FUNCIONAL         | baixa      | usuarios autorizados por RBAC | exportadores client-side geram arquivos reais a partir do payload do Railway                                  | payload real                 | validar abertura nos apps finais              |
| Relatorios    | Filtros por periodo                   | FUNCIONAL         | baixa      | usuarios autorizados por RBAC | `period` filtra server-side por data de criacao/evento quando aplicavel                                       | parametros API               | evoluir filtros avancados                     |
| Busca Global  | Pesquisa no header                    | FUNCIONAL         | baixa      | usuarios autorizados por RBAC | command palette consulta `/api/search` com dados reais e atalho `Ctrl/Cmd+K`                                  | sessao e RBAC                | validar por role                              |
| Busca Global  | Isolamento por modulo                 | FUNCIONAL         | baixa      | todos                         | API consulta apenas dominios em que o usuario possui permissao de leitura                                     | matriz RBAC                  | evoluir ranking com massa real                |
| Configuracoes | Perfil                                | FUNCIONAL         | baixa      | usuario autenticado           | form real com RHF/Zod grava em `user_profiles` e dados somente leitura do backend                             | storage oficial de avatar    | validar autenticado em ambiente real          |
| Configuracoes | Preferencias                          | FUNCIONAL         | baixa      | usuario autenticado           | preferencias gravam em `user_preferences` e afetam tema, saudacao e formatadores                              | cobertura global de modulos  | expandir para Agenda/Financeiro               |
| Configuracoes | Empresa                               | FUNCIONAL         | baixa      | admin/manager/read_only       | formulario real com dados de `companies`, RBAC e audit log                                                    | sessao e company_id          | validar em producao                           |
| Configuracoes | Usuarios                              | FUNCIONAL         | baixa      | admin                         | CRUD administrativo real com Better Auth + dominio                                                            | credenciais por role         | ampliar testes RBAC                           |
| Configuracoes | Permissoes                            | FUNCIONAL         | baixa      | admin/manager/read_only       | matriz somente leitura baseada em `roles` e `role_permissions`                                                | RBAC completo                | avaliar edicao futura                         |
| Configuracoes | Seguranca                             | FUNCIONAL/PARCIAL | media      | usuario/admin                 | senha e sessoes reais; politica corporativa persistida; MFA/e-mail dependem provider                          | Better Auth + providers      | conectar MFA/e-mail                           |
| Configuracoes | Integracoes                           | FUNCIONAL/PARCIAL | media      | admin/manager                 | status seguro real por env e tabela; providers externos aguardam credenciais                                  | providers externos           | configurar Mercado Pago/e-mail/storage        |
| Configuracoes | Notificacoes                          | FUNCIONAL         | baixa      | usuario/admin                 | preferencias, centro in-app, leitura, marcacao como lida, arquivamento e eventos de negocio reais             | eventos de negocio           | evoluir scheduler e envio por e-mail          |
| Perfil        | Dados reais de auth                   | FUNCIONAL         | baixa      | usuario autenticado           | usa Better Auth, `users`, `roles`, `companies`, `user_profiles` e `user_preferences`                          | sessao valida                | testar autenticado                            |
| Perfil        | Avatar upload                         | PARCIAL           | media      | usuario autenticado           | valida arquivo e usa adapter; storage persistente binario ainda nao definido                                  | storage oficial              | conectar S3/R2/Railway Volume quando aprovado |
| Perfil        | Alteracao de senha                    | FUNCIONAL         | baixa      | usuario autenticado           | endpoint protegido integra Better Auth e audit log                                                            | sessao valida                | testar autenticado                            |
| Perfil        | Sessoes                               | FUNCIONAL         | baixa      | usuario autenticado           | lista sessoes Better Auth, mascara IP e permite revogacao                                                     | sessao valida                | testar autenticado                            |
| Usuarios      | Criar usuarios                        | FUNCIONAL         | baixa      | admin                         | UI, endpoint, senha temporaria, Better Auth e vinculo de dominio implementados                                | Better Auth + domain users   | validar por role                              |
| Permissoes    | RBAC server-side                      | FUNCIONAL/PARCIAL | media      | todos                         | enforcement server-side existe; UI ainda nao oculta todas as acoes por role                                   | permissions UI               | expandir RBAC visual                          |

## 6. Historico da impossibilidade de criar usuarios

O administrador nao conseguia criar outros usuarios por ausencia de implementacao, nao por erro pontual. Essa lacuna foi corrigida na Fase 1 da branch funcional.

Estado atual:

- `Configuracoes > Usuarios`, `/usuarios` e `/permissoes` existem.
- `/api/users`, `/api/users/password`, `/api/users/sessions` e `/api/permissions` existem.
- Criacao transacional em Better Auth + `users` + `user_profiles` + `user_preferences` foi implementada.
- Edicao, senha temporaria, status, role, soft delete e bloqueio contra remover o ultimo admin ativo foram implementados.
- Pendencia restante: validar cenarios autenticados com usuarios reais `manager`, `operator` e `read_only`.

## 7. Dashboard e indicadores

| Indicador               | Origem atual                                                | Estado                           |
| ----------------------- | ----------------------------------------------------------- | -------------------------------- |
| clientes ativos         | `clients.status = active` filtrado por `company_id`         | real, mas base vazia             |
| clientes em implantacao | `clients.status = onboarding` filtrado por `company_id`     | real, mas base vazia             |
| clientes inativos       | `clients.status = inactive` filtrado por `company_id`       | real, mas base vazia             |
| contratos ativos        | `contracts.status = active` filtrado por `company_id`       | real, mas depende de contratos   |
| contratos a vencer 30d  | `contracts.ends_at` nos proximos 30 dias                    | real, mas depende de contratos   |
| contratos a vencer 60d  | `contracts.ends_at` nos proximos 60 dias                    | real, mas depende de contratos   |
| receita mensal          | soma de `contracts.monthly_value` filtrada por `company_id` | real, mas depende de contratos   |
| receita anual           | receita mensal * 12                                         | derivado                         |
| cobrancas pendentes     | `charges.status = pending` conforme permissao               | real, mas depende de cobrancas   |
| cobrancas vencidas      | `charges.status = overdue` ou pendente vencida              | real, mas depende de cobrancas   |
| chamados abertos        | `support_tickets.status` nao resolvido                      | real, mas depende de tickets     |
| chamados criticos       | `support_tickets.priority = Critica/Critica` aberto         | real, mas depende de tickets     |
| agendamentos futuros    | `scheduled_calls` agendadas a partir da data atual          | real, mas depende de agenda      |
| usuarios ativos         | `users.status = active` conforme permissao                  | real                             |
| crescimento de clientes | `/api/dashboard/charts`                                     | real, com empty state            |
| receita recorrente      | `/api/dashboard/charts`                                     | real, com empty state            |
| contratos por status    | `/api/dashboard/charts`                                     | real, com empty state            |
| tickets por prioridade  | `/api/dashboard/charts`                                     | real, com empty state            |
| produtos por utilizacao | `/api/dashboard/charts`                                     | real, com empty state            |
| cobrancas por status    | `/api/dashboard/charts`                                     | real, com empty state            |
| clientes recentes       | `/api/dashboard/recent-clients`                             | real, mas base vazia             |
| atividades recentes     | `activity_logs` por `company_id`                            | real, mas sem escrita automatica |

## 8. Personalizacao, saudacao, timezone e localizacao

### Saudacao

Estado: FUNCIONAL nesta branch.

O Dashboard calcula a saudacao com primeiro nome do usuario autenticado, idioma e timezone resolvido por preferencias, navegador, empresa e fallback `America/Sao_Paulo`. O texto complementar permanece: "Acompanhe os principais indicadores e movimentos da operacao."

### Nome do usuario

Estado: FUNCIONAL nesta branch.

O header usa nome, iniciais, avatar, role traduzida, empresa, ultimo acesso e saudacao dinamica derivados da identidade atual.

### Timezone

Estado: FUNCIONAL inicial nesta branch.

Existe deteccao por `Intl.DateTimeFormat().resolvedOptions().timeZone`, persistencia inicial sem sobrescrever escolha manual e helpers compartilhados para converter datas no frontend. A ordem de resolucao e preferencia do usuario, timezone do navegador, timezone da empresa e fallback `America/Sao_Paulo`. Agenda usa timestamps UTC e converte a exibicao para o timezone resolvido do usuario.

### Geolocalizacao

Estado: NAO IMPLEMENTADA.

Nao ha uso de `navigator.geolocation`. Nao ha solicitacao de permissao, coleta de latitude/longitude, cidade, estado, pais ou consentimento. Isso e adequado para login/dashboard neste momento: a saudacao deve usar timezone do navegador/perfil, nao GPS.

## 9. Formatacao regional

| Item                   | Estado                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------- |
| idioma                 | aplicado nos helpers regionais e preferencias de perfil                            |
| moeda                  | aplicado via helper centralizado de moeda                                          |
| data                   | data curta, longa e data/hora usam helper centralizado                             |
| hora                   | respeita preferencia 24h/12h                                                       |
| timezone               | detectado, persistido e usado em saudacao/header/dashboard                         |
| primeiro dia da semana | persistido em `user_preferences`; pronto para ajuste fino do calendario por locale |
| calendario             | Agenda usa locale/timezone do usuario para exibicao operacional                    |

## 10. Permissoes

RBAC server-side existe para APIs internas atuais:

- admin: leitura/gerenciamento amplo;
- manager: gerenciamento operacional sem usuarios/settings.manage;
- operator: leitura + agenda/suporte manage;
- read_only: leitura, incluindo audit/settings.read.

Limitacoes:

- nao ha usuarios de teste para validar manager/operator/read_only;
- UI nao oculta botoes por permissao;
- validacao automatizada por usuarios reais `manager`, `operator` e `read_only` ainda esta pendente;
- alguns botoes podem aparecer para perfis que receberiam 403 no backend;
- testes de isolamento multiempresa exigem fixtures dedicadas.

## 11. Persistencia

Persistencia real implementada:

- clientes: criar/listar/detalhar basico;
- produtos: criar/listar/visualizar/editar/ativar/inativar/soft delete;
- contratos: criar/listar/visualizar/editar/ciclo de vida/soft delete;
- suporte: criar/listar/visualizar/editar/atribuir/resolver/reabrir/cancelar/excluir tickets;
- agenda: criar/listar/visualizar/editar/reagendar/concluir/cancelar/excluir calls;
- financeiro: criar/listar/visualizar/editar/baixar/cancelar/excluir charges e receber webhook Mercado Pago;
- perfil/preferencias: salvar em `user_profiles` e `user_preferences`.

Persistencia ausente ou incompleta:

- documentos/anexos de clientes;
- ciclo completo de contratos;
- geracao externa de pagamentos Mercado Pago;
- automacoes de SLA e upload binario de anexos;
- notificacoes reais de lembrete da agenda por scheduler;
- auditoria automatica em CRUDs ainda nao finalizados.

## 12. Falhas por categoria

### Criticas

- Nenhuma falha critica ativa documentada nesta auditoria funcional.

### Altas

- Validacao Mercado Pago sandbox/producao depende de credenciais oficiais.
- Falta fluxo autenticado automatizado por perfil.
- UI ainda nao aplica RBAC para ocultar/desabilitar acoes.

### Medias

- Activity logs ainda nao sao gerados por todos os CRUDs antigos.
- Graficos do Dashboard usam dados reais, mas dependem de massa operacional para exibicao.
- Relatorios PDF/XLSX e filtros sao apenas visuais.

### Baixas

- 9 warnings antigos de Fast Refresh.
- Warning informativo antigo de `vite-tsconfig-paths`.
- Alguns textos de erro do boundary raiz ainda estao em ingles.

## 13. Validacoes executadas

| Validacao                          | Resultado                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `git fetch origin --tags`          | OK                                                                            |
| `git switch main`                  | OK                                                                            |
| `git pull --ff-only origin main`   | OK                                                                            |
| `railway status`                   | OK, servico online                                                            |
| tag `v1.0.0-rc4`                   | OK, aponta para `3de4647`                                                     |
| consulta de contagens do banco     | OK                                                                            |
| rotas publicas/protegidas via HTTP | paginas retornam 200 SSR; APIs `/api/users` e `/api/permissions` retornam 404 |
| `/api/clients` sem sessao          | validado anteriormente por `security:verify`: 401                             |
| `/api/finance/charges` sem sessao  | validado anteriormente por `security:verify`: 401                             |
| origem externa nao confiavel       | validado anteriormente por `security:verify`: 403                             |

Validacoes autenticadas nao executadas:

- login real;
- refresh autenticado;
- logout autenticado;
- dashboard apos login;
- CRUDs por perfil;
- isolamento por `company_id`.

Motivo: ausencia de credenciais seguras de teste e ausencia de usuarios manager/operator/read_only.

## 14. Ordem recomendada de implementacao

1. Relatorios completos.
2. Suite de usuarios de teste por role, com credenciais em ambiente seguro.
3. Testes autenticados por role para Usuarios, Clientes, Produtos, Contratos, Financeiro, Agenda e Suporte.
4. Auditoria administrativa e activity logs dos modulos restantes.
5. Busca, notificacoes e configuracoes avancadas.
