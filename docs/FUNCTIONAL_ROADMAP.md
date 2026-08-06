# Functional Roadmap

Data: 2026-08-05.

Este roadmap parte da baseline `v1.0.0-rc6`. O objetivo e continuar a evolucao do ERP operacional, sem alterar Design System, Brand Kit, Login Premium, Better Auth, runtime Vercel ou Railway PostgreSQL.

## Atualizacao RC7

- CRM Leads implementado como entrada oficial dos contatos da Landing.
- Endpoint publico de leads e tela interna `/leads` entram na foundation funcional.
- Storage privado Railway preparado para avatares e proximos anexos.
- Proximas etapas: validar dominio da Landing, CAPTCHA oficial, testes por role e automacoes de notificacao/atribuicao.

## Atualizacao hotfix pos-RC9

- CNPJ.ws passa a ser o provider oficial de consulta cadastral em `/api/company-lookup/cnpj`.
- Cache e rate limit de consulta cadastral foram persistidos no Railway PostgreSQL.
- PDF de contratos voltou a funcionar no runtime Vercel para preview e download autenticados.
- Proximas etapas: validar volume real de consultas CNPJ.ws, decidir modo comercial com token se necessario e ampliar testes autenticados por role.

## Sprint RC6 - Manutencao de Producao

Status: implementado como consolidacao tecnica.

- Vercel definido como runtime canonico.
- Railway PostgreSQL mantido como banco oficial.
- Consulta CNPJ server-side preparada com provider configuravel.
- AvatarStorageProvider criado, com adapters preparados e metadados persistidos.
- Contratos documentais preparados com snapshot, versao, hash e PDF sob demanda.
- ElectronicSignatureProvider permanece em modo `noop` ate definicao do provedor oficial.

## Sprint 1 - Usuarios, permissoes e RBAC completo

Objetivo: permitir que o administrador gerencie usuarios reais com seguranca.

Status nesta branch: implementado como Fase 1 funcional inicial. Falta validar com usuarios reais por role no ambiente Railway apos aplicar a migration de status.

Escopo:

- Criar tela funcional de Usuarios.
- Criar endpoint `/api/users`.
- Criar endpoint `/api/permissions`.
- Criar usuario via fluxo transacional Better Auth + `users` + `user_profiles` + `user_preferences`.
- Suportar convite por e-mail ou senha temporaria.
- Definir role: admin, manager, operator, read_only.
- Definir status: active, invited, suspended, inactive.
- Vincular sempre ao `company_id` do admin autenticado.
- Tratar e-mail duplicado.
- Editar role/status.
- Ativar e inativar usuario.
- Implementar soft delete.
- Listar sessoes do usuario quando suportado.
- Revogar sessoes.
- Bloquear usuario inativo.
- Impedir que o ultimo admin ativo remova a propria permissao administrativa.
- Aplicar RBAC tambem na UI para esconder/desabilitar acoes.
- Gerar `audit_logs` para criacao, alteracao, inativacao e reset.

Critério de pronto:

- Admin cria manager/operator/read_only.
- Manager/operator/read_only conseguem logar.
- Cada role recebe 401/403 corretos.
- `npm run security:verify` valida cenarios autenticados.

## Sprint 2 - Perfil, preferencias, saudacao e regionalizacao

Objetivo: tornar a experiencia personalizada por usuario.

Status nesta branch: implementado como Fase 2 funcional inicial. Falta validar fluxo autenticado real e definir storage persistente oficial para upload binario de avatar.

Escopo:

- Migrar perfil de `app_settings` para `user_profiles`.
- Migrar preferencias de `app_settings` para `user_preferences`.
- Implementar saudacao dinamica:
  - 05:00 a 11:59: Bom dia.
  - 12:00 a 17:59: Boa tarde.
  - 18:00 a 04:59: Boa noite.
- Usar primeiro nome do usuario autenticado.
- Usar timezone salvo em preferencias.
- Fallback para timezone do navegador.
- Fallback final `America/Sao_Paulo`.
- Aplicar idioma preferido.
- Aplicar moeda preferida.
- Aplicar formato de data/hora.
- Atualizar header com role traduzida, cargo, empresa e avatar real.
- Implementar upload de avatar em storage aprovado.
- Validar refresh e sessao persistente.

Critério de pronto:

- Dashboard mostra `Boa tarde, Matheus!` conforme horario real do usuario.
- Alterar timezone muda exibicao de datas/horarios.
- Preferencias persistem apos refresh.

## Sprint 2.1 - Configuracoes corporativas

Objetivo: remover empty states de Configuracoes e persistir dados administrativos reais.

Status nesta branch: implementado para Empresa, Seguranca, Integracoes e Notificacoes.

Escopo entregue:

- Empresa em `companies`: dados institucionais, endereco, preferencias organizacionais, identidade e faturamento.
- Seguranca em `company_security_settings` e `login_history`: senha/sessoes Better Auth, politica corporativa e historico.
- Integracoes em `company_integrations`: status seguro, metadados publicos e teste controlado sem exposicao de secrets.
- Notificacoes em `notification_preferences`, `company_notification_settings`, `notifications` e `notification_deliveries`.
- Centro de notificacoes no header com contagem real de nao lidas, marcacao como lida e arquivamento.
- RBAC server-side com `settings.read` e `settings.manage`.

Pendencias:

- Provider de e-mail transacional para convites, recuperacao e verificacao.
- Storage binario oficial para avatar/logo.
- MFA real no Better Auth.
- Lembretes automaticos por scheduler e envio por e-mail quando houver provedor transacional aprovado.

## Sprint 2.2 - Dashboard real

Objetivo: transformar o Dashboard em leitura operacional real sobre Railway PostgreSQL.

Status nesta branch: implementado.

Escopo entregue:

- Metricas reais agregadas server-side por `company_id` e `deleted_at`.
- Cards para clientes ativos, em implantacao e inativos.
- Cards para contratos ativos, vencimento em 30/60 dias, MRR e ARR.
- Cards para cobrancas pendentes/vencidas, chamados abertos/criticos, agendamentos futuros e usuarios ativos.
- Graficos reais para crescimento de clientes, receita recorrente, contratos por status, tickets por prioridade, produtos por utilizacao e cobrancas por status.
- Clientes recentes via endpoint dedicado e atividades recentes via `activity_logs`.
- Empty states reais quando nao houver dados de dominio.

Pendencias:

- Gerar `activity_logs` em todos os CRUDs dos modulos seguintes.
- Validar o Dashboard com usuarios reais manager/operator/read_only.
- Evoluir filtros por periodo quando os modulos de negocio estiverem completos.

## Sprint 3 - Clientes

Objetivo: completar o cadastro e relacionamento de clientes.

Status nesta branch: implementado para cadastro operacional completo.

Escopo entregue:

- Criar, listar, detalhar e editar cliente.
- Inativar, reativar e excluir logicamente.
- Persistir campos oficiais de cadastro, inscricoes, segmento, contato principal, endereco principal, site, observacoes e logo por URL.
- Busca, filtro por status e paginacao inicial.
- Validacao com React Hook Form + Zod.
- Audit log e activity log nas escritas.
- Isolamento por `company_id` e RBAC em backend.

Pendencias:

- Produtos, contratos, cobrancas, tickets e agenda vinculados serao completados nos modulos correspondentes.
- Documentos/anexos dependem de storage oficial aprovado.
- Paginacao server-side podera substituir a paginacao client-side quando houver volume operacional.

Critério de pronto:

- CRUD completo com loading, empty, error, toast e confirmacao.
- Dados persistem apos refresh.
- Outro `company_id` nao acessa o cliente.

## Sprint 4 - Produtos

Objetivo: consolidar o portfolio comercial e operacional.

Status nesta branch: implementado como Fase 6 funcional inicial. Falta validar o fluxo completo com usuarios reais por role e aprofundar versionamento historico quando houver contratos reais.

Escopo:

- Criacao/edicao revisada com React Hook Form + Zod.
- Confirmacao de exclusao usando modal do Design System.
- Ativacao e inativacao completas.
- Soft delete com auditoria.
- Vinculo com clientes e contratos calculado por contratos reais.
- Categorias reais persistidas.
- Quantidade de clientes e contratos por produto.
- Audit logs e activity logs.
- Paginacao client-side inicial com componente compartilhado.

Critério de pronto:

- CRUD completo validado tecnicamente com usuario admin.
- Produto removido nao aparece em listagens operacionais.
- Pendencias: validacao por role e versionamento historico.

## Sprint 5 - Contratos

Objetivo: criar ciclo de vida real de contratos.

Status nesta branch: implementado como Fase 7 funcional inicial. Falta validar com usuarios reais por role e definir assinatura/anexos/versionamento juridico.

Escopo:

- Edicao de contrato.
- Alteracao de status.
- Vigencia real.
- Valor mensal, implantacao e ARR derivado pelo Dashboard.
- Renovacao, suspensao, cancelamento e encerramento.
- Vinculo obrigatorio com cliente/produto.
- Item de contrato em `contract_items`.
- Contratos a vencer refletidos pelo Dashboard.
- Auditoria e activity logs.
- Visualizacao da minuta.

Critério de pronto:

- Dashboard reflete contratos e receita.
- Contratos a vencer batem com banco.
- Pendencias: validacao por role, assinatura digital, anexos e versionamento juridico.

## Sprint 6 - Financeiro

Objetivo: transformar o financeiro em modulo operacional.

Status nesta branch: implementado como Fase 8 funcional inicial. Falta validar Mercado Pago em sandbox/producao com credenciais oficiais e definir se a geracao de pagamentos externos sera feita pela Automy ou por fluxo operacional externo.

Escopo entregue:

- CRUD de cobrancas.
- Baixa manual.
- Cancelamento.
- Vencimento/inadimplencia.
- Receita mensal/anual real.
- Recebimentos previstos.
- Endpoint protegido com RBAC `finance.read` e `finance.manage`.
- Audit logs e activity logs.
- Webhook Mercado Pago com assinatura obrigatoria em producao, protecao contra replay, idempotencia e eventos persistidos.
- Conciliacao de webhook contra cobranca existente por referencia externa ou pagamento ja conhecido.

Pendencias:

- Credenciais Mercado Pago sandbox/producao.
- Fluxo comercial para geracao de pagamento externo.
- Relatorios financeiros avancados.
- Permissoes `finance.read` e `finance.manage`.

Critério de pronto:

- Metric cards financeiros nao usam zero hardcoded.
- Cobrancas persistem apos refresh/login.
- Webhook atualiza cobranca real quando a referencia externa corresponde a uma cobranca existente.

## Sprint 7 - Agenda e timezone de agendamentos

Objetivo: tornar a agenda confiavel por fuso horario.

Status nesta branch: implementado como Fase 9 funcional inicial. Falta ativar lembretes por scheduler e validar por usuarios reais de cada role.

Escopo entregue:

- Agendamentos armazenam `start_at` e `end_at` em UTC.
- Timezone original do agendamento e persistido.
- Interface converte exibicao para timezone do usuario.
- Criar, visualizar, editar, reagendar, concluir, cancelar e excluir logicamente.
- Responsavel e cliente vinculado reais.
- Participantes, link, status, observacoes e lembrete em minutos.
- Endpoint protegido com RBAC `schedule.read` e `schedule.manage`.
- Audit logs e activity logs.

Pendencias:

- Disparo real de lembretes por scheduler/event worker.
- Validacao por manager/operator/read_only.

Critério de pronto:

- Agendamento criado em um timezone aparece corretamente para outro usuario.
- Backend nunca depende do timezone local do servidor para regras de agenda.

## Sprint 8 - Suporte

Objetivo: completar operacao de tickets.

Status nesta branch: implementado como Fase 10 funcional inicial. Falta ativar storage binario, automacoes de SLA e validacao por usuarios reais de cada role.

Escopo entregue:

- Criar, visualizar, editar, atribuir e excluir logicamente.
- Alterar prioridade e status.
- Resolver, reabrir e cancelar ticket.
- Mensagens internas.
- Historico operacional em eventos.
- SLA de primeira resposta e resolucao.
- Anexos por URL/metadados, sem filesystem efemero.
- Cliente e responsavel vinculados.
- Audit logs e activity logs.

Pendencias:

- Storage oficial para upload binario.
- Automacoes de SLA.
- Validacao por manager/operator/read_only.
- Encerramento.
- Permissoes por role.
- Audit logs e activity logs.

Critério de pronto:

- Ticket possui ciclo completo de abertura a encerramento.
- Dashboard mostra chamados abertos reais.

## Sprint 9 - Relatorios e configuracoes avancadas

Objetivo: entregar administracao e analise operacional.

Status nesta branch: Relatorios implementado como Fase 11 funcional inicial; Configuracoes avancadas ja foram entregues na Fase 3. Falta validar exports por role e evoluir envio/agendamento automatico.

Escopo entregue:

- Filtros reais por periodo.
- Exportacao CSV, XLSX e PDF.
- Relatorios por modulo: Clientes, Produtos, Contratos, Financeiro, Agenda, Suporte, Usuarios, Permissoes e Auditoria.
- Configuracoes da empresa.
- Configuracoes de seguranca.
- Integracoes.
- Notificacoes.
- Preferencias organizacionais.
- Dominio e dados institucionais.

Pendencias:

- Validacao por manager/operator/read_only.
- Agendamento e envio automatico de relatorios quando houver provedor transacional aprovado.

Critério de pronto:

- Relatorios usam dados reais, filtros server-side e respeitam permissoes.
- Configuracoes deixam de ser empty states.

## Sprint 10 - Busca Global

Objetivo: permitir localizacao rapida de registros reais sem duplicar logica de cada modulo.

Status nesta branch: implementado como Fase 12 funcional inicial. Falta validar comportamento por manager/operator/read_only com usuarios reais.

Escopo entregue:

- Command palette no header.
- Atalho `Ctrl/Cmd+K`.
- Endpoint protegido `/api/search`.
- Busca por Clientes, Produtos, Contratos, Financeiro, Agenda, Suporte, Usuarios e Auditoria.
- RBAC por dominio antes de consultar cada fonte.
- Estados de carregamento, vazio e erro na interface.

Pendencias:

- Ranking avancado por relevancia com volume real.
- Testes autenticados por todos os perfis.

## Sprint 11 - Notificacoes operacionais

Objetivo: conectar o centro de notificacoes a eventos reais dos modulos de negocio.

Status nesta branch: implementado como Fase 13 funcional inicial. Falta scheduler de lembretes e provider de e-mail transacional.

Escopo entregue:

- Emissao in-app real para eventos de Clientes, Produtos, Contratos, Financeiro, Agenda e Suporte.
- Respeito a `company_notification_settings` e `notification_preferences`.
- Criacao automatica das preferencias padrao do usuario quando necessario.
- Persistencia em `notifications` e rastreio em `notification_deliveries`.
- Centro de notificacoes com contagem de nao lidas, marcar como lida, marcar todas e arquivar.
- Endpoints protegidos para listar, ler e arquivar notificacoes.

Pendencias:

- Scheduler/event worker para lembretes futuros de agenda, contrato, cobranca e SLA.
- Envio por e-mail quando houver provider transacional aprovado.
- Testes autenticados por todos os perfis.

## Dependencias transversais

- Massa de teste controlada por ambiente.
- Usuarios de teste por role.
- Credenciais de teste em variaveis seguras.
- Audit log padronizado.
- Activity log padronizado.
- Repository Pattern mantido.
- Service Layer mantido.
- React Hook Form + Zod em todos os formularios.
- Nenhuma cor hardcoded.
- Nenhum mock novo.
