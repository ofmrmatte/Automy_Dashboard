# Roadmap

## Current Project Status

- `v1.0.0-rc3` congela a baseline oficial da Automy antes dos modulos reais.
- `v1.0.0-rc4` deve ser criada apos merge das correcoes criticas de seguranca e origem Railway.
- O codigo esta preparado e validado contra a nova foundation Railway PostgreSQL.
- O projeto Vercel esta conectado ao GitHub e recebeu as variaveis da nova foundation.
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

- Validar Fase 4 autenticada em producao apos deploy da branch.
- Seguir para Clientes completo sem reintroduzir mocks.
- Validar Fase 3 autenticada em producao apos deploy da branch.
- Validar Fase 2 autenticada em producao com usuario admin real.
- Concluir validacao operacional da Fase 1 com usuarios reais por role.
- Aplicar a migration `20260805190000_align_user_statuses.sql` no ambiente Railway apos checklist de banco.
- Fazer merge da branch `fix/security-and-railway-origin` e publicar `v1.0.0-rc4`.
- Continuar desenvolvimento dos modulos de negocio: Clientes, Produtos, Contratos, Financeiro, Agenda e Suporte.
- Manter migrations incrementais para qualquer evolucao de schema.
- Validar cada deploy de producao com login, sessao e rotas protegidas.
- Definir o fluxo administrativo de criacao de usuarios antes de expandir usuarios e permissoes.
- Monitorar o primeiro ciclo de uso real apos o deploy da nova foundation.
- Criar onboarding da primeira empresa.
- Implementar formularios reais com React Hook Form e Zod.
- Implementar CRUDs reais para clientes, produtos e contratos.

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
- Avatar aceita URL HTTPS persistida; upload binario possui adapter preparado e valida MIME/tamanho, mas depende de storage persistente oficial.
- Geolocalizacao precisa segue desabilitada; GPS so sera adotado se houver caso funcional real.
- Pendencias: definir storage oficial de arquivos e rodar testes autenticados por role.

## Fase 3 - Configuracoes

- Implementada aba Empresa com dados institucionais, endereco, preferencias organizacionais, identidade e faturamento em `companies`.
- Implementada aba Seguranca com alteracao de senha Better Auth, sessoes reais, historico de login e politica corporativa em `company_security_settings`.
- Implementada aba Integracoes com providers reais/preparados, status seguro por variaveis de ambiente, teste controlado e tabela `company_integrations`.
- Implementada aba Notificacoes com preferencias individuais em `notification_preferences`, regras da empresa em `company_notification_settings` e centro in-app em `notifications`.
- Implementado RBAC server-side: admin edita tudo; manager/read_only visualizam conforme `settings.read`; acoes sensiveis exigem `settings.manage`.
- Pendencias: provider transacional de e-mail, storage binario oficial, MFA real e eventos de notificacao gerados pelos modulos de negocio.

## Fase 4 - Dashboard real

- Implementadas metricas reais via Railway PostgreSQL para clientes ativos/em implantacao/inativos, contratos ativos/a vencer, MRR, ARR, cobrancas pendentes/vencidas, chamados abertos/criticos, agendamentos futuros e usuarios ativos.
- Implementados graficos reais para crescimento de clientes, evolucao de receita, contratos por status, tickets por prioridade, produtos por utilizacao e cobrancas por status.
- Criados endpoints protegidos `/api/dashboard/summary`, `/api/dashboard/charts`, `/api/dashboard/recent-clients` e `/api/dashboard/activity` com `company_id` derivado da sessao.
- Mantidos empty states quando a empresa ainda nao possui dados reais.
- Pendencias: gerar `activity_logs` em todos os CRUDs dos proximos modulos e validar RBAC com usuarios reais por role.

## Dados e Permissoes

- Expandir a autorizacao server-side para fluxo administrativo completo de Usuarios e Permissoes.
- Formalizar a matriz de permissoes por role antes dos CRUDs reais.
- Definir fluxo administrativo para permissions globais.
- Adicionar auditoria automatica de `created_by` e `updated_by`.
- Avaliar endpoint administrativo para auditoria completa de sessoes, caso o produto precise listar todos os dispositivos conectados.
- Conectar provedor de e-mail transacional ao Better Auth.

## Modulos

- Clientes: CRUD, contatos, enderecos e historico.
- Produtos: CRUD e vinculacao com contratos.
- Contratos: vigencia, valores e renovacoes.
- Financeiro: modelagem propria antes de exibir cobrancas.
- Suporte: modelagem propria antes de exibir tickets.
- Relatorios: exportacao somente com dados reais.

## Qualidade

- Adicionar testes unitarios para services e repositories.
- Adicionar testes de integracao para fluxos criticos.
- Criar pipeline de lint, typecheck e build.
- Adicionar monitoramento de erros em producao.
