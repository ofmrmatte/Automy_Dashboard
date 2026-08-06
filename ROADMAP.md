# Roadmap

## Current Project Status

- `v1.0.0-rc3` congela a baseline oficial da Automy antes dos modulos reais.
- `v1.0.0-rc4` consolida as correcoes criticas de seguranca e origem Railway.
- `v1.0.0-rc5` consolida a foundation funcional completa na `main`.
- `v1.0.0-rc6` consolida manutencao de producao: Vercel canonico, CNPJ, avatar storage e documentos contratuais.
- `v1.0.0-rc8` consolida Landing separada, dominio `app.automy.dev.br`, CRM Leads, Railway Storage e resposta publica segura para validacao de Leads.
- `v1.0.0-rc9` finaliza a migracao de dominios: Landing no apex `https://automy.dev.br` e ERP em `https://app.automy.dev.br`.
- Hotfix pos-RC9 corrige CNPJ.ws em producao e restaura PDF de contratos autenticado no runtime Vercel.
- O codigo esta preparado e validado contra a nova foundation Railway PostgreSQL.
- O projeto Vercel esta conectado ao GitHub e recebeu as variaveis da nova foundation.
- O dominio canonico do ERP e `https://app.automy.dev.br`.
- `https://automy.dev.br` e o dominio canonico da Landing Page em repositório/projeto Vercel separado.
- `https://www.automy.dev.br` redireciona para a Landing Page apex.
- Design System, Brand Kit e Login Premium estao congelados.
- A arquitetura Feature First esta consolidada.
- Better Auth e a autenticacao oficial da Automy.
- A persistencia foi validada via TCP Proxy Railway em ambiente local e as variaveis foram configuradas no Vercel.
- Envio de e-mail transacional para recuperacao de senha e verificacao de e-mail ainda precisa de provedor aprovado.

# BASELINE v1.0.0-RC3

- Design System esta congelado.
- Brand Kit esta congelado.
- Login Premium esta congelado.
- Arquitetura Feature First esta consolidada.
- Railway PostgreSQL e o banco oficial.
- Foundation operacional ativada na nova conta Railway.
- Vercel configurado com as variaveis da nova foundation.
- Toda nova funcionalidade devera respeitar `PROJECT_RULES.md`.

## Proxima Etapa

- Seguir para Auditoria administrativa sem reintroduzir mocks.
- Validar os modulos consolidados em producao apos deploy da RC5.
- Concluir validacao operacional da Fase 1 com usuarios reais por role.
- Continuar desenvolvimento dos modulos de negocio: Auditoria administrativa e validacoes autenticadas por role.
- Manter migrations incrementais para qualquer evolucao de schema.
- Validar cada deploy de producao com login, sessao e rotas protegidas.
- Definir o fluxo administrativo de criacao de usuarios antes de expandir usuarios e permissoes.
- Monitorar o primeiro ciclo de uso real apos o deploy da nova foundation.
- Criar onboarding da primeira empresa.
- Evoluir automacoes de agenda, SLA, e-mail transacional e storage oficial.

## Fase 1 - Usuarios e Permissoes

- Implementada gestao administrativa de usuarios reais com Better Auth + Railway PostgreSQL.
- Implementados filtros, paginacao, criacao, edicao, alteracao de senha, listagem/revogacao de sessoes e soft delete.
- Implementada matriz de permissoes somente leitura baseada nas tabelas `roles`, `permissions` e `role_permissions`.
- Mantida protecao server-side por `users.read`, `users.manage` e `settings.read`.
- Pendencias: validar fluxo autenticado com usuarios reais por role e expandir testes automatizados de RBAC.

## Fase 2 - Perfil, Preferencias e Timezone

- Implementado perfil real com Better Auth, `users`, `user_profiles`, `user_preferences` e `companies`.
- Implementada persistencia real de preferencias: tema, idioma, timezone, formatos, moeda, primeiro dia da semana e notificacoes.
- Implementada saudacao dinamica por timezone e primeiro nome.
- Implementado header com dados reais, avatar, role, empresa e menu do usuario.
- Implementada listagem/revogacao de sessoes e alteracao de senha auditada.
- Avatar por URL foi removido do formulario. Upload binario usa `AvatarStorageProvider`, valida MIME/tamanho, gera WebP 256/512 e depende de provider persistente configurado em producao.
- Geolocalizacao precisa segue desabilitada; GPS so sera adotado se houver caso funcional real.
- Pendencias: definir storage oficial de arquivos e rodar testes autenticados por role.

## Fase RC6 - Manutencao de Producao

- Implementar provider real de storage em producao, preferencialmente Cloudflare R2 ou S3 compativel.
- Evoluir `ElectronicSignatureProvider` de Noop para provedor oficial de assinatura.
- Adicionar versionamento juridico detalhado com revisoes, aprovadores e anexos.
- Avaliar modo comercial CNPJ.ws com token oficial se o limite publico de 3 consultas por minuto nao atender operacao.
- Expandir testes autenticados por role para CNPJ, avatar e contratos PDF.

## Fase RC7 - Dominio, Landing, CRM Leads e Storage

- Implementado endpoint publico `POST /api/public/leads` no ERP para receber leads da Landing.
- Implementada tela interna `Leads` com busca, filtro, paginacao, detalhe, status e conversao em cliente.
- Adicionadas tabelas `leads` e `file_assets` ao Railway PostgreSQL.
- Configurado contrato `StorageProvider` com adapter Railway S3-compatible.
- Landing Page integrada ao CRM via funcao serverless `/api/leads`, sem acesso direto ao banco.
- Pendencias: validar CAPTCHA/Turnstile com chave oficial e ampliar testes reais por role.

## Fase RC8 - Ajuste Pos-validacao

- Corrigida resposta publica de payload invalido em `POST /api/public/leads` para evitar exposicao de mensagens tecnicas do Zod.
- Mantidas as entregas da RC7 sem mover tags antigas.

## Fase 3 - Configuracoes

- Implementada aba Empresa com dados institucionais, endereco, preferencias organizacionais, identidade e faturamento em `companies`.
- Implementada aba Seguranca com alteracao de senha Better Auth, sessoes reais, historico de login e politica corporativa em `company_security_settings`.
- Implementada aba Integracoes com providers reais/preparados, status seguro por variaveis de ambiente, teste controlado e tabela `company_integrations`.
- Implementada aba Notificacoes com preferencias individuais em `notification_preferences`, regras da empresa em `company_notification_settings` e centro in-app em `notifications`.
- Implementado RBAC server-side: admin edita tudo; manager/read_only visualizam conforme `settings.read`; acoes sensiveis exigem `settings.manage`.
- Pendencias: provider transacional de e-mail, storage binario oficial, MFA real e lembretes automatizados por scheduler.

## Fase 4 - Dashboard real

- Implementadas metricas reais via Railway PostgreSQL para clientes ativos/em implantacao/inativos, contratos ativos/a vencer, MRR, ARR, cobrancas pendentes/vencidas, chamados abertos/criticos, agendamentos futuros e usuarios ativos.
- Implementados graficos reais para crescimento de clientes, evolucao de receita, contratos por status, tickets por prioridade, produtos por utilizacao e cobrancas por status.
- Criados endpoints protegidos `/api/dashboard/summary`, `/api/dashboard/charts`, `/api/dashboard/recent-clients` e `/api/dashboard/activity` com `company_id` derivado da sessao.
- Mantidos empty states quando a empresa ainda nao possui dados reais.
- Pendencias: gerar `activity_logs` em todos os CRUDs dos proximos modulos e validar RBAC com usuarios reais por role.

## Fase 5 - Clientes

- Implementado CRUD real de clientes com criar, listar, detalhar, editar, inativar, reativar e excluir logicamente.
- Adicionados campos oficiais: inscricoes, segmento, e-mail, telefone, site, observacoes e logo por URL.
- Integrados contato principal e endereco principal em `contacts` e `addresses`.
- Implementadas validacoes com React Hook Form + Zod, busca, filtro por status, paginação inicial e confirmaçao de exclusao.
- Endpoints `/api/clients` aplicam `company_id` da sessao, soft delete, RBAC, `audit_logs` e `activity_logs`.
- Pendencias: documentos/anexos dependem de storage oficial e relacoes operacionais completas serao aprofundadas nos modulos Produtos, Contratos, Financeiro, Agenda e Suporte.
- Hotfix pos-RC9: consulta cadastral CNPJ.ws server-side restaurada com cache persistente, rate limit e preenchimento seguro dos campos vazios.

## Fase 6 - Produtos

- Implementado CRUD real de produtos com criar, listar, visualizar, editar, ativar, inativar e excluir logicamente.
- Persistidos campos oficiais: nome, descricao, categoria, versao, status, preco-base, modalidade, observacoes, termos comerciais e modelo de contrato.
- Implementados busca, filtros por status/categoria, paginacao compartilhada, empty/error/loading states, toast e confirmacao de exclusao.
- Endpoints `/api/products` aplicam `company_id` da sessao, soft delete, RBAC, `audit_logs` e `activity_logs`.
- Quantidade de clientes e contratos por produto e calculada por vinculos reais em `contracts`.
- Pendencias: versionamento historico e relacoes operacionais serao aprofundados no ciclo de Contratos.

## Fase 7 - Contratos

- Implementado ciclo real de contratos com criar, listar, visualizar, editar, ativar, suspender, renovar, cancelar, encerrar e excluir logicamente.
- Persistidos campos oficiais: cliente, produto, plano, valor mensal, valor de implantacao, inicio, vencimento, renovacao, periodicidade, status, observacoes e minuta.
- Criada tabela `contract_items` para itens do contrato vinculados ao produto.
- Endpoints `/api/contracts` aplicam `company_id` da sessao, soft delete, RBAC, `audit_logs` e `activity_logs`.
- Dashboard passa a refletir contratos ativos, a vencer, MRR e ARR a partir do ciclo real de contratos.
- Pendencias: assinatura digital, anexos e renovacao com versionamento juridico dependem de decisoes posteriores.
- Hotfix pos-RC9: preview e download de PDF autenticados restaurados, com headers apropriados e erros tratados por toast.

## Fase 8 - Financeiro

- Implementado CRUD real de cobrancas com criar, listar, visualizar, editar, marcar como paga, cancelar, detectar atraso e excluir logicamente.
- Persistidos status oficiais `pending`, `paid`, `overdue`, `canceled` e `failed`, com labels traduzidos apenas na interface.
- Implementadas metricas reais: receita mensal, receita anual, inadimplencia, recebimentos previstos, valores pagos, valores em aberto e clientes inadimplentes.
- Endpoint `/api/finance/charges` aplica `company_id` da sessao, soft delete, RBAC, `audit_logs` e `activity_logs`.
- Finalizada base Mercado Pago com assinatura de webhook, janela anti-replay, idempotencia por evento e tabela `payment_webhook_events`.
- Pendencias: validar sandbox/producao Mercado Pago com credenciais oficiais e ativar geracao externa de pagamentos quando a decisao comercial estiver definida.

## Fase 9 - Agenda

- Implementado CRUD real de calls com criar, listar, visualizar, editar, reagendar, concluir, cancelar e excluir logicamente.
- Persistidos cliente vinculado, responsavel, participantes, inicio, fim, timezone, link, lembretes, status e observacoes.
- Datas sao armazenadas em UTC (`start_at`/`end_at`) e exibidas no timezone resolvido do usuario.
- Endpoint `/api/scheduled-calls` aplica `company_id` da sessao, soft delete, RBAC, `audit_logs` e `activity_logs`.
- Implementados busca, filtro por status, paginacao compartilhada, empty/error/loading states, toast e confirmacao de exclusao.
- Pendencias: disparo agendado de lembretes depende de scheduler/event worker e validacao por usuarios reais de cada role.

## Fase 10 - Suporte

- Implementado fluxo real de tickets com criar, listar, visualizar, editar, atribuir, alterar prioridade/status, resolver, reabrir, cancelar e excluir logicamente.
- Persistidos cliente vinculado, responsavel, categoria, SLA de primeira resposta/resolucao, tags, mensagens, eventos e anexos por metadados.
- Endpoint `/api/support/tickets` aplica `company_id` da sessao, soft delete, RBAC, `audit_logs` e `activity_logs`.
- Implementados busca, filtros por prioridade/status, paginacao compartilhada, empty/error/loading states, toast e confirmacao de exclusao.
- Pendencias: storage oficial para anexos binarios, automacoes de SLA e validacao por usuarios reais de cada role.

## Fase 11 - Relatorios

- Implementado endpoint unico `/api/reports` com `kind` e `period`.
- Relatorios disponiveis: Clientes, Produtos, Contratos, Financeiro, Agenda, Suporte, Usuarios, Permissoes e Auditoria.
- Exportacoes CSV, XLSX e PDF usam dados reais do Railway PostgreSQL e respeitam RBAC por dominio.
- Arquivos vazios sao gerados com estrutura valida e mensagem de ausencia de registros.
- Filtros por periodo sao aplicados server-side com `company_id` derivado da sessao.
- Pendencias: validacao por usuarios reais de cada role e evolucao futura para agendamento/envio automatico de relatorios.

## Fase 12 - Busca Global

- Implementado endpoint protegido `/api/search` com consultas parametrizadas e `company_id` derivado da sessao.
- Busca disponivel no header via command palette e atalho `Ctrl/Cmd+K`.
- Fontes pesquisadas: Clientes, Produtos, Contratos, Financeiro, Agenda, Suporte, Usuarios e Auditoria.
- Resultados respeitam RBAC de leitura por dominio e nao exibem dados de modulos sem permissao.
- Pendencias: validacao por usuarios reais de cada role e refinamento futuro de relevancia/ranking com volume real.

## Fase 13 - Notificacoes operacionais

- Implementada emissao in-app real para eventos de Clientes, Produtos, Contratos, Financeiro, Agenda e Suporte.
- Notificacoes respeitam preferencias do usuario e regras da empresa.
- Centro de notificacoes permite listar, marcar como lida, marcar todas e arquivar.
- Persistencia usa `notifications` e `notification_deliveries`.
- Pendencias: scheduler de lembretes, envio por e-mail e validacao por usuarios reais de cada role.

## Dados e Permissoes

- Expandir a autorizacao server-side para fluxo administrativo completo de Usuarios e Permissoes.
- Formalizar a matriz de permissoes por role antes dos CRUDs reais.
- Definir fluxo administrativo para permissions globais.
- Adicionar auditoria automatica de `created_by` e `updated_by`.
- Avaliar endpoint administrativo para auditoria completa de sessoes, caso o produto precise listar todos os dispositivos conectados.
- Conectar provedor de e-mail transacional ao Better Auth.

## Modulos

- Clientes: CRUD, contatos, enderecos e historico.
- Produtos: CRUD, termos comerciais, modelo de contrato e vinculacao real com contratos.
- Contratos: ciclo de vida, valores, renovacoes e itens de contrato.
- Financeiro: CRUD de cobrancas, baixa manual, cancelamento, metricas e conciliacao Mercado Pago preparada.
- Agenda: CRUD de calls com UTC/timezone, cliente vinculado, responsavel e lembretes preparados.
- Suporte: ciclo real de tickets, mensagens, eventos, SLA e anexos por metadados.
- Relatorios: endpoint real com filtros por periodo e exportacao CSV/XLSX/PDF.
- Busca Global: endpoint real com command palette e RBAC por dominio.
- Notificacoes: emissao in-app real por eventos operacionais e centro no header.

## Qualidade

- Adicionar testes unitarios para services e repositories.
- Adicionar testes de integracao para fluxos criticos.
- Criar pipeline de lint, typecheck e build.
- Adicionar monitoramento de erros em producao.
