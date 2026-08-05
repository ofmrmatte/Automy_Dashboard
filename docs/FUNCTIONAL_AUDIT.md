# Functional Audit v1.0.0-rc4

Data: 2026-08-05.

## 1. Resumo executivo

A Automy v1.0.0-rc4 esta publicada, sincronizada com `origin/main` e rodando no Railway em producao. O deploy atual verificado esta online em `https://automydashboard-production.up.railway.app`.

O estado funcional ainda e de foundation: autenticacao oficial, banco Railway PostgreSQL, RBAC inicial, Design System, Brand Kit, Login Premium e arquitetura feature-first estao consolidados. Os modulos de negocio, porem, estao majoritariamente parciais. Existem telas reais e algumas operacoes persistidas no banco, mas ainda faltam fluxos completos de usuarios, permissoes, edicao/exclusao em varios modulos, auditoria automatica, timezone aplicado em toda a UI e personalizacao real do Dashboard.

Ponto critico originalmente confirmado: o administrador nao conseguia criar outros usuarios porque nao existia implementacao funcional do modulo de Usuarios. Nesta branch, a Fase 1 implementa tela, formulario, endpoint, criacao Better Auth com senha temporaria, vinculo de dominio, sessoes, soft delete e matriz de permissoes.

## 2. Sincronizacao e deploy

| Item                | Resultado                                                                            |
| ------------------- | ------------------------------------------------------------------------------------ |
| Branch local        | `main`                                                                               |
| Status local        | sincronizada com `origin/main`, sem alteracoes antes da documentacao desta auditoria |
| Tag                 | `v1.0.0-rc4` presente                                                                |
| Commit da tag       | `3de4647f77f71403cf997cd972861bb74323f9ed`                                           |
| Railway project     | `Automy_ERP`                                                                         |
| Railway environment | `production`                                                                         |
| Railway service     | `Automy_Dashboard`                                                                   |
| Railway URL         | `https://automydashboard-production.up.railway.app`                                  |
| Deploy observado    | `a6614e58-f5f0-4cb2-8926-add38029a5ce`                                               |
| Deploy status       | `SUCCESS`, servico online                                                            |

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

Observacao: `user_profiles` e `user_preferences` existem, mas a aplicacao ainda le e grava perfil/preferencias em `app_settings`.

## 5. Matriz funcional por modulo

| Modulo        | Funcionalidade                          | Status           | Severidade | Perfil afetado                | Causa provavel                                                                 | Dependencia                      | Acao recomendada                                    |
| ------------- | --------------------------------------- | ---------------- | ---------- | ----------------------------- | ------------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------- |
| Dashboard     | Rota abre                               | FUNCIONAL        | baixa      | todos autenticados            | rota existe                                                                    | sessao Better Auth               | manter                                              |
| Dashboard     | Metricas principais                     | PARCIAL          | media      | todos                         | calcula clientes/contratos reais, mas chamados abertos e graficos ficam vazios | dados reais por modulo           | implementar agregacoes reais por dominio            |
| Dashboard     | Saudacao dinamica                       | QUEBRADA         | alta       | todos                         | `title=\"Bom dia\"` hardcoded                                                  | perfil/preferencias/timezone     | criar util de saudacao com primeiro nome e timezone |
| Dashboard     | Fuso horario no header                  | PARCIAL          | media      | todos                         | data usa `new Date()` e formatador pt-BR sem timezone do usuario               | user_preferences                 | aplicar preference timeZone                         |
| Dashboard     | Graficos                                | SOMENTE VISUAL   | media      | todos                         | repositorios retornam arrays vazios                                            | historico real                   | criar queries agregadas                             |
| Dashboard     | Atividades recentes                     | PARCIAL          | media      | todos                         | le `activity_logs`, mas a tabela esta vazia e CRUDs nao geram logs             | eventos de dominio               | registrar activity_logs em operacoes reais          |
| Clientes      | Listagem                                | PARCIAL          | media      | roles com `clients.read`      | endpoint real, base vazia                                                      | sessao e company_id              | manter e testar com massa controlada                |
| Clientes      | Busca/filtro                            | FUNCIONAL        | baixa      | frontend                      | filtro client-side sobre dados carregados                                      | dados carregados                 | manter                                              |
| Clientes      | Criacao                                 | PARCIAL          | media      | admin/manager                 | endpoint POST existe e persiste cliente basico                                 | `clients.manage`                 | adicionar validacao RHF/Zod e testes                |
| Clientes      | Edicao/exclusao                         | NAO IMPLEMENTADA | alta       | admin/manager                 | nao ha endpoint PATCH/DELETE nem UI                                            | CRUD completo                    | implementar no sprint de Clientes                   |
| Clientes      | Contatos/enderecos/documentos/historico | SOMENTE VISUAL   | media      | todos                         | detalhe exibe abas e empty state; botao `Adicionar registro` sem acao          | submodulos                       | implementar entidades vinculadas                    |
| Produtos      | Listagem                                | PARCIAL          | media      | roles com `products.read`     | endpoint real, base vazia                                                      | sessao e company_id              | manter                                              |
| Produtos      | Criacao                                 | PARCIAL          | media      | admin/manager                 | endpoint POST existe e persiste produto/modelo                                 | `products.manage`                | adicionar validacao e testes                        |
| Produtos      | Edicao                                  | PARCIAL          | media      | admin/manager                 | endpoint PATCH existe                                                          | `products.manage`                | testar com usuario real                             |
| Produtos      | Inativacao/soft delete                  | PARCIAL          | media      | admin/manager                 | pause PATCH e DELETE soft delete existem                                       | `products.manage`                | trocar `window.confirm` por modal DS                |
| Produtos      | Vinculo com clientes                    | PARCIAL          | media      | todos                         | conta contratos por produto                                                    | contratos reais                  | completar fluxo cliente-produto                     |
| Contratos     | Listagem                                | PARCIAL          | media      | roles com `contracts.read`    | endpoint real, base vazia                                                      | produtos/clientes                | manter                                              |
| Contratos     | Criacao                                 | PARCIAL          | alta       | admin/manager                 | cria cliente se necessario e contrato pendente                                 | produto existente                | validar constraints e auditoria                     |
| Contratos     | Edicao/renovacao/cancelamento           | NAO IMPLEMENTADA | alta       | admin/manager                 | sem endpoints e sem UI                                                         | ciclo de vida de contrato        | implementar no sprint de Contratos                  |
| Financeiro    | Listagem de cobrancas                   | PARCIAL          | alta       | roles com `finance.read`      | endpoint protegido e company_id aplicado                                       | charges reais                    | manter                                              |
| Financeiro    | Metricas da tela                        | SOMENTE VISUAL   | alta       | todos                         | `formatCurrency(0)` hardcoded                                                  | agregacao financeira             | conectar a `charges`/contratos                      |
| Financeiro    | Criacao/edicao/baixa/cancelamento       | NAO IMPLEMENTADA | alta       | admin                         | endpoint rejeita metodos nao GET                                               | CRUD financeiro                  | implementar depois da modelagem                     |
| Financeiro    | Mercado Pago webhook                    | PARCIAL          | media      | sistema                       | webhook existe e valida assinatura quando secret configurado                   | env Mercado Pago                 | validar end-to-end com sandbox                      |
| Agenda        | Calendario e criacao                    | PARCIAL          | media      | admin/manager/operator        | endpoint POST e listagem existem                                               | `schedule.manage`                | manter e testar                                     |
| Agenda        | Timezone/UTC                            | QUEBRADA         | alta       | todos                         | armazena `scheduled_date` e `scheduled_time` separados, sem timezone/UTC       | user_preferences                 | remodelar agendamentos com timezone                 |
| Agenda        | Edicao/cancelamento/lembretes           | NAO IMPLEMENTADA | media      | operadores                    | sem endpoints                                                                  | workflow agenda                  | implementar sprint 7                                |
| Suporte       | Listagem/criacao                        | PARCIAL          | media      | admin/manager/operator        | endpoint real e form basico                                                    | `support.manage`                 | manter e testar                                     |
| Suporte       | Mensagens/SLA/anexos/encerramento       | NAO IMPLEMENTADA | alta       | suporte                       | sem UI/endpoint                                                                | modelo ticket completo           | implementar sprint 8                                |
| Relatorios    | CSV                                     | PARCIAL          | media      | usuarios autorizados pela API | exporta endpoints reais em CSV                                                 | sessao e APIs                    | manter                                              |
| Relatorios    | PDF/XLSX                                | SOMENTE VISUAL   | media      | todos                         | toast informa futuro                                                           | exportador                       | implementar depois                                  |
| Relatorios    | Filtros por periodo                     | SOMENTE VISUAL   | media      | todos                         | select nao altera query                                                        | parametros API                   | implementar filtros reais                           |
| Configuracoes | Perfil                                  | PARCIAL          | media      | usuario autenticado           | form real com RHF/Zod, mas grava em `app_settings`                             | migracao para tabelas dedicadas  | migrar para `user_profiles`                         |
| Configuracoes | Preferencias                            | PARCIAL          | media      | usuario autenticado           | form real, mas preferencias nao afetam dashboard/formatadores                  | aplicacao global de preferencias | aplicar em layout e formatadores                    |
| Configuracoes | Empresa                                 | SOMENTE VISUAL   | alta       | admin                         | empty state                                                                    | modulo empresa                   | implementar                                         |
| Configuracoes | Usuarios                                | NAO IMPLEMENTADA | critica    | admin                         | empty state, sem endpoint `/api/users`                                         | Better Auth admin flow           | implementar sprint 1                                |
| Configuracoes | Permissoes                              | NAO IMPLEMENTADA | critica    | admin                         | empty state, sem endpoint `/api/permissions`                                   | RBAC completo                    | implementar sprint 1                                |
| Perfil        | Dados reais de auth                     | PARCIAL          | media      | usuario autenticado           | usa sessao Better Auth e app_settings                                          | perfil oficial                   | migrar armazenamento                                |
| Perfil        | Avatar upload                           | NAO IMPLEMENTADA | media      | usuario autenticado           | repository lanca erro                                                          | storage                          | implementar storage                                 |
| Perfil        | Alteracao de senha                      | PARCIAL          | media      | usuario autenticado           | Better Auth client integrado                                                   | sessao valida                    | testar autenticado                                  |
| Perfil        | Sessoes                                 | PARCIAL          | media      | usuario autenticado           | mostra sessao atual e chama revoke, sem listagem real                          | Better Auth session API          | adicionar listagem real                             |
| Usuarios      | Criar usuarios                          | NAO IMPLEMENTADA | critica    | admin                         | nao ha UI ativa, formulario, endpoint, convite ou senha temporaria             | Better Auth + domain users       | implementar primeiro                                |
| Permissoes    | RBAC server-side                        | PARCIAL          | alta       | todos                         | helper estatico e tabela populada, sem UI/edicao                               | permissions UI                   | expandir enforcement                                |

## 6. Causa da impossibilidade de criar usuarios

O administrador nao consegue criar outros usuarios por ausencia de implementacao, nao por erro pontual.

Evidencias:

- A navegacao nao possui rota dedicada de Usuarios.
- `Configuracoes > Usuarios` renderiza apenas `EmptyState` com mensagem de area sem configuracao ativa.
- Nao existe componente `UserCreateModal`, formulario de convite ou tela de listagem de usuarios.
- Nao existe endpoint `/api/users`; producao retornou 404.
- Nao existe endpoint `/api/permissions`; producao retornou 404.
- Better Auth esta configurado para login/sessao/perfil, mas nao ha fluxo admin para criar conta.
- As tabelas `user`, `users`, `roles`, `permissions`, `user_profiles` e `user_preferences` existem.
- Permissoes `users.read` e `users.manage` existem e sao atribuidas ao role `admin`, mas ainda nao sao usadas por nenhuma API de usuarios.

Fluxos ausentes:

- convite por e-mail;
- criacao direta com senha temporaria;
- definicao de role/status;
- vinculo com `company_id`;
- criacao transacional em Better Auth + `users` + `user_profiles` + `user_preferences`;
- tratamento de e-mail duplicado;
- edicao, ativacao, inativacao e soft delete;
- redefinicao de senha administrativa;
- listagem/revogacao de sessoes;
- bloqueio contra remover a ultima permissao administrativa.

## 7. Dashboard e indicadores

| Indicador               | Origem atual                                                | Estado                           |
| ----------------------- | ----------------------------------------------------------- | -------------------------------- |
| clientes ativos         | `clients.status = active` filtrado por `company_id`         | real, mas base vazia             |
| clientes em implantacao | `clients.status = onboarding` filtrado por `company_id`     | real, mas base vazia             |
| receita mensal          | soma de `contracts.monthly_value` filtrada por `company_id` | real, mas depende de contratos   |
| receita anual           | receita mensal * 12                                         | derivado                         |
| chamados abertos        | hardcoded `0` no repository                                 | quebrado/incompleto              |
| contratos a vencer      | `contracts.ends_at` nos proximos 60 dias                    | real, mas depende de contratos   |
| crescimento de clientes | repository retorna `[]`                                     | somente visual                   |
| receita recorrente      | repository retorna `[]`                                     | somente visual                   |
| clientes recentes       | lista `/api/clients`, slice 4                               | real, mas base vazia             |
| atividades recentes     | `activity_logs` por `company_id`                            | real, mas sem escrita automatica |

## 8. Personalizacao, saudacao, timezone e localizacao

### Saudacao

Estado: QUEBRADA.

O Dashboard usa `title=\"Bom dia\"` diretamente em `DashboardPage`. Nao usa primeiro nome, horario, idioma nem timezone do usuario.

Necessario:

- calcular saudacao por horario local do usuario;
- usar primeiro nome de `profile.firstName` ou `session.user.name`;
- fallback para `Conta` ou e-mail quando nome vazio;
- respeitar `preferences.language`;
- reavaliar ao mudar horario ou ao carregar preferencias.

### Nome do usuario

Estado: PARCIAL.

O header usa `profile.firstName + profile.lastName`, fallback para e-mail. Isso funciona para o menu resumido, mas o Dashboard nao consome esses dados.

### Timezone

Estado: PARCIAL.

Existe deteccao por `Intl.DateTimeFormat().resolvedOptions().timeZone` em preferencias, com fallback `America/Sao_Paulo`. O valor pode ser salvo em preferencias, mas:

- formatadores compartilhados sao fixos em `pt-BR`;
- nao recebem `timeZone`;
- Dashboard usa `new Date()` diretamente;
- Agenda nao converte para UTC;
- `last_login` e expiracao de sessao usam formatador fixo;
- o backend armazena timestamps em banco, mas a UI nao aplica timezone do usuario consistentemente.

### Geolocalizacao

Estado: NAO IMPLEMENTADA.

Nao ha uso de `navigator.geolocation`. Nao ha solicitacao de permissao, coleta de latitude/longitude, cidade, estado, pais ou consentimento. Isso e adequado para login/dashboard neste momento: a saudacao deve usar timezone do navegador/perfil, nao GPS.

## 9. Formatacao regional

| Item                   | Estado                                                             |
| ---------------------- | ------------------------------------------------------------------ |
| idioma                 | preferencia existe, mas nao e aplicada globalmente                 |
| moeda                  | formatador fixo `pt-BR`/`BRL`; preferencia de moeda nao e aplicada |
| data                   | formatador fixo `pt-BR`                                            |
| hora                   | formatador fixo `pt-BR`, sem preference `12h/24h`                  |
| timezone               | detectado/salvo parcialmente, nao aplicado nos formatadores        |
| primeiro dia da semana | Agenda usa domingo fixo                                            |
| calendario             | pt-BR fixo                                                         |

## 10. Permissoes

RBAC server-side existe para APIs internas atuais:

- admin: leitura/gerenciamento amplo;
- manager: gerenciamento operacional sem usuarios/settings.manage;
- operator: leitura + agenda/suporte manage;
- read_only: leitura, incluindo audit/settings.read.

Limitacoes:

- nao ha usuarios de teste para validar manager/operator/read_only;
- UI nao oculta botoes por permissao;
- endpoints de Usuarios/Permissoes nao existem;
- alguns botoes podem aparecer para perfis que receberiam 403 no backend;
- testes de isolamento multiempresa exigem fixtures dedicadas.

## 11. Persistencia

Persistencia real implementada:

- clientes: criar/listar/detalhar basico;
- produtos: criar/listar/editar/pausar/soft delete;
- contratos: criar/listar basico;
- suporte: criar/listar tickets basicos;
- agenda: criar/listar calls basicas;
- financeiro: listar charges e receber webhook Mercado Pago;
- perfil/preferencias: salvar em `app_settings`.

Persistencia ausente ou incompleta:

- edicao/exclusao de clientes;
- contatos e enderecos vinculados;
- ciclo completo de contratos;
- CRUD financeiro;
- ticket messages/SLA/anexos;
- agenda com timezone/UTC;
- auditoria automatica em CRUDs;
- perfil/preferencias nas tabelas oficiais `user_profiles` e `user_preferences`.

## 12. Falhas por categoria

### Criticas

- Modulo de Usuarios nao implementado.
- Modulo de Permissoes nao implementado.
- Admin nao consegue criar usuarios.

### Altas

- Saudacao hardcoded.
- Agenda sem timezone/UTC.
- Financeiro com metricas hardcoded em zero.
- Falta fluxo autenticado automatizado por perfil.
- UI ainda nao aplica RBAC para ocultar/desabilitar acoes.

### Medias

- Perfil/preferencias usando `app_settings`.
- Activity logs nao sao gerados pelos CRUDs.
- Graficos do Dashboard retornam arrays vazios.
- Relatorios PDF/XLSX e filtros sao apenas visuais.
- Produtos usa `window.confirm`.

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

1. Usuarios e permissoes reais.
2. Suite de usuarios de teste por role, com credenciais em ambiente seguro.
3. Perfil/preferencias oficiais em `user_profiles` e `user_preferences`.
4. Saudacao dinamica, timezone e formatadores regionais.
5. Auditoria automatica e activity logs.
6. CRUD completo de Clientes.
7. CRUD completo de Produtos.
8. Ciclo completo de Contratos.
9. Financeiro real.
10. Agenda com UTC/timezone.
11. Suporte completo.
12. Relatorios e configuracoes avancadas.
