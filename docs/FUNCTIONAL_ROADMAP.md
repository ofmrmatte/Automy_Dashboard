# Functional Roadmap

Data: 2026-08-05.

Este roadmap parte da baseline `v1.0.0-rc4`. O objetivo e transformar a foundation atual em ERP operacional, sem alterar Design System, Brand Kit, Login Premium ou infraestrutura Railway.

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
- Centro de notificacoes no header com contagem real de nao lidas e marcacao como lida.
- RBAC server-side com `settings.read` e `settings.manage`.

Pendencias:

- Provider de e-mail transacional para convites, recuperacao e verificacao.
- Storage binario oficial para avatar/logo.
- MFA real no Better Auth.
- Eventos reais de notificacao gerados pelos modulos de negocio.

## Sprint 3 - Clientes

Objetivo: completar o cadastro e relacionamento de clientes.

Escopo:

- Editar cliente.
- Soft delete/inativacao.
- Contatos vinculados.
- Enderecos vinculados.
- Produtos vinculados.
- Contratos vinculados.
- Documentos.
- Historico.
- Logo/avatar da empresa.
- Busca server-side.
- Filtros persistentes.
- Paginacao server-side.
- Audit logs.
- Isolamento por `company_id`.

Critério de pronto:

- CRUD completo com loading, empty, error, toast e confirmacao.
- Dados persistem apos refresh.
- Outro `company_id` nao acessa o cliente.

## Sprint 4 - Produtos

Objetivo: consolidar o portfolio comercial e operacional.

Escopo:

- Revisar criacao/edicao atual com RHF + Zod.
- Substituir `window.confirm` por modal do Design System.
- Completar ativacao/inativacao.
- Soft delete com confirmacao.
- Vincular clientes e contratos.
- Versionamento.
- Categorias reais.
- Quantidade de clientes por produto.
- Audit logs.
- Paginacao server-side.

Critério de pronto:

- CRUD completo testado por role.
- Produto removido nao aparece em novos contratos.

## Sprint 5 - Contratos

Objetivo: criar ciclo de vida real de contratos.

Escopo:

- Editar contrato.
- Alterar status.
- Vigencia real.
- Valor mensal e anual.
- Renovacao.
- Cancelamento.
- Vinculo obrigatorio com cliente/produto.
- Historico.
- Contratos a vencer.
- Auditoria.
- Exportacao/visualizacao da minuta.

Critério de pronto:

- Dashboard reflete contratos e receita.
- Contratos a vencer batem com banco.

## Sprint 6 - Financeiro

Objetivo: transformar o financeiro em modulo operacional.

Escopo:

- CRUD de cobrancas.
- Baixa manual.
- Cancelamento.
- Vencimento/inadimplencia.
- Receita mensal/anual real.
- Recebimentos previstos.
- Integracao Mercado Pago sandbox e producao.
- Webhook com assinatura obrigatoria em producao.
- Relatorios financeiros.
- Permissoes `finance.read` e `finance.manage`.
- Audit logs.

Critério de pronto:

- Metric cards financeiros nao usam zero hardcoded.
- Webhook cria/atualiza cobranca real.

## Sprint 7 - Agenda e timezone de agendamentos

Objetivo: tornar a agenda confiavel por fuso horario.

Escopo:

- Remodelar agendamento para armazenar timestamp UTC.
- Persistir timezone original do usuario.
- Converter exibicao para timezone do usuario.
- Criar/editar/cancelar call.
- Responsaveis.
- Cliente vinculado.
- Lembretes.
- Status.
- Permissoes.
- Audit logs.

Critério de pronto:

- Agendamento criado em um timezone aparece corretamente para outro usuario.
- Backend nunca depende do timezone local do servidor para regras de agenda.

## Sprint 8 - Suporte

Objetivo: completar operacao de tickets.

Escopo:

- Editar ticket.
- Alterar status.
- Prioridade.
- Responsavel.
- Mensagens/comentarios.
- Historico.
- SLA.
- Anexos.
- Encerramento.
- Permissoes por role.
- Audit logs e activity logs.

Critério de pronto:

- Ticket possui ciclo completo de abertura a encerramento.
- Dashboard mostra chamados abertos reais.

## Sprint 9 - Relatorios e configuracoes avancadas

Objetivo: entregar administracao e analise operacional.

Escopo:

- Filtros reais por periodo.
- Exportacao XLSX.
- Exportacao PDF.
- Relatorios por modulo.
- Configuracoes da empresa.
- Configuracoes de seguranca.
- Integracoes.
- Notificacoes.
- Preferencias organizacionais.
- Dominio e dados institucionais.

Critério de pronto:

- Relatorios usam dados reais, filtros server-side e respeitam permissoes.
- Configuracoes deixam de ser empty states.

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
