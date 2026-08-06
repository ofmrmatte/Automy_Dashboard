# Automy Pending Audit

Data da auditoria: 2026-08-05.

Escopo: auditoria tecnica completa antes de novas implementacoes. Nenhuma funcionalidade nova foi implementada, nenhum layout foi alterado, nenhum schema foi alterado, nenhuma migration/seed foi aplicada nesta etapa e nenhum push foi realizado.

Atualizacao de correcao critica: branch `fix/security-and-railway-origin`.

- `/api/finance/charges` foi protegido com sessao Better Auth e RBAC antes da consulta financeira.
- APIs internas existentes passaram a usar helper centralizado de sessao/RBAC.
- `company_id` passou a ser derivado do usuario autenticado nos endpoints de negocio alterados.
- Railway foi configurado como URL canonica operacional em `BETTER_AUTH_URL`.
- `trustedOrigins` passou a ser resolvido centralmente sem wildcard amplo.
- `v1.0.0-rc3` nao foi movida; `v1.0.0-rc4` deve ser criada apos merge.

## 1. Resumo executivo

O projeto esta sincronizado com `origin/main` no commit `5db7d01 fix(auth): align Better Auth rate limit schema`. A branch atual e `main`, sem alteracoes locais antes da criacao deste relatorio. A tag mais recente publicada e `v1.0.0-rc3`, porem ela aponta para `32f12ea`, commit anterior a correcao `5db7d01`; portanto a tag RC3 nao representa integralmente o estado atual de `main`.

Railway PostgreSQL esta online, com Postgres, TCP Proxy e migrations aplicadas. A partir da RC6, Vercel e o runtime canonico e o dominio oficial da aplicacao e `https://automy.dev.br`. Railway nao deve ser usado para hospedar a aplicacao web enquanto esta arquitetura estiver vigente.

O login Better Auth em Vercel foi validado com sucesso. O banco possui um usuario admin, uma linha correspondente de dominio e auditoria inicial. As APIs principais exigem sessao, mas `/api/finance/charges` ainda responde sem autenticacao.

## 2. Pendencias criticas

Nenhum risco critico confirmado de secret versionado, build quebrado ou banco indisponivel foi encontrado.

Pendencias de maior prioridade apos a correcao:

- Alta: validar login autenticado real no Railway apos deploy da branch, com credenciais fornecidas fora do codigo.
- Alta: `v1.0.0-rc3` nao aponta para o commit mais recente de baseline funcional.
- Media: RBAC existe e foi aplicado de forma minima nas APIs atuais; fluxo completo de Usuarios/Permissoes ainda nao existe.
- Media: escopo por `company_id` foi aplicado nos endpoints atuais, mas o modelo multiempresa completo ainda precisa de fixtures e testes dedicados.

## 3. Pendencias antes da migracao Railway

- Configurar dominio final `automy.dev.br` no Railway quando DNS/SSL estiverem prontos.
- Garantir deploy Railway do commit mais recente de `main`.
- Validar login, logout, sessao e rotas protegidas diretamente no dominio Railway/final.
- Configurar healthcheck/readiness no Railway.
- Definir rollback operacional para Railway.
- Decidir se Vercel sera mantida como fallback ou removida apos migracao.
- Atualizar cookies e links absolutos apos troca de dominio.

## 4. Pendencias depois da migracao Railway

- Remover variaveis Vercel que deixarem de ser usadas.
- Remover dependencia operacional do TCP Proxy para runtime interno, mantendo o host privado Railway.
- Atualizar documentacao para marcar Vercel como legado/fallback, se aplicavel.
- Monitorar logs Railway apos primeiras sessoes reais.
- Validar SSL no dominio final.
- Criar rotina formal de backup/restore antes de CRUDs reais.

## 5. Pendencias de autenticacao

Funcionando:

- Login por e-mail e senha na Vercel.
- Sessao persistente via cookie HttpOnly.
- Remember Me enviado ao Better Auth.
- `last_login` atualizado em criacao de sessao.
- Logout local.
- Rate limit em banco apos migration `20260805140000_align_rate_limit_primary_key.sql`.
- Cadastro publico desabilitado.

Estruturado mas incompleto:

- Recuperacao de senha: fluxo de tela e chamada Better Auth existem, mas envio de e-mail transacional esta desabilitado.
- Verificacao de e-mail: configuracao existe, mas envio esta desabilitado.
- Logout global/outros dispositivos: chamadas existem quando disponiveis no client, mas precisam de teste funcional de produto.
- Perfil: dados sao carregados, mas perfil/preferencias persistem em `app_settings`, apesar de existirem tabelas `user_profiles` e `user_preferences`.
- Avatar: interface existe, mas upload retorna erro controlado.

Implementado nesta branch funcional:

- Fluxo administrativo de criacao/edicao de usuarios.
- UI de Usuarios e Permissoes.
- Endpoints `/api/users`, `/api/users/password`, `/api/users/sessions` e `/api/permissions`.
- Regra para impedir remocao, suspensao ou rebaixamento do ultimo administrador ativo.

Nao implementado ou nao aplicado:

- Aplicar e validar a migration de status `active`, `inactive`, `invited`, `suspended` no ambiente Railway.
- Bloqueio por `status` do usuario foi aplicado no helper central de APIs internas.

## 6. Pendencias de banco

Concluido:

- Migrations registradas em `schema_migrations`.
- Seed RBAC aplicado.
- Tabelas foundation existem.
- FKs, indices, constraints, triggers, UUID e soft delete foram inspecionados.
- `rate_limit` possui `id`, `key`, `count` e `last_request`.

Pendencias:

- `user` Better Auth e `users` dominio coexistem corretamente por intencao, mas a estrategia precisa ser formalizada antes de CRUD de Usuarios.
- `user_profiles` e `user_preferences` existem, mas o app usa `app_settings` para perfil/preferencias.
- `activity_logs` esta vazia e nao ha registro automatico para operacoes de CRUD.
- `created_by` e `updated_by` nem sempre sao preenchidos nas insercoes atuais.
- Leituras globais dos endpoints atuais filtram por `company_id` do usuario autenticado.
- RLS nao foi implementado; a seguranca depende da API server-side.
- Queries de dashboard fazem agregacao em memoria e podem escalar mal.

## 7. Pendencias de seguranca

Alta:

- Validar login autenticado real no Railway apos deploy da branch.
- Criar `v1.0.0-rc4` apos merge, sem mover tags antigas.

Media:

- Expandir autorizacao por role/permissao para fluxo administrativo completo.
- Criar fixtures/testes multiempresa para confirmar isolamento entre empresas.
- Validar `status` do usuario em toda requisicao protegida.
- Substituir `window.confirm` em Produtos pelo componente padrao de confirmacao.
- Validar payloads server-side com Zod nos handlers da API.
- Definir politica para logs de erro em producao, evitando vazamento indireto de detalhes.
- Revisar CORS/origin para dominio final.
- Definir cabecalhos de seguranca adicionais quando a plataforma final for Railway.
- Configurar provedor de e-mail seguro para reset/verificacao.

Baixa:

- Logs operacionais em scripts usam `console.log`; aceitavel, mas manter sem secrets.
- `console.error` server-side e intencional para observabilidade basica, mas deve ser substituido por ferramenta de monitoramento.

## 8. Pendencias de codigo

- Warnings Fast Refresh em componentes que exportam variantes/helpers junto de componentes.
- Aviso Vite: `vite-tsconfig-paths` pode ser removido futuramente em favor de `resolve.tsconfigPaths`.
- `tsconfig` mantem `noUnusedLocals` e `noUnusedParameters` como `false`; isso limita a deteccao de codigo morto.
- Alguns formularios de criacao usam `FormData` sem React Hook Form + Zod.
- Services ainda concentram filtros simples, mas validacao de regras reais deve ser ampliada.
- `reports-page` faz fetch direto dos endpoints a partir da pagina; isso viola a regra ideal Pagina -> Service -> Repository.
- `dashboardRepository.getClientGrowth` e `getRevenueGrowth` retornam arrays vazios; e estado vazio intencional, mas ainda nao ha backend analitico real.
- `financeRepository` consome endpoint agora protegido por sessao/RBAC.

## 9. Pendencias de documentacao

- Atualizar baseline/tag: `v1.0.0-rc3` nao inclui o commit `5db7d01`.
- Documentar dominio alvo `automy.dev.br` e registros DNS necessarios.
- Documentar se Vercel sera producao, fallback ou legado.
- Documentar runbook de rollback Railway.
- Documentar politicas de RBAC antes de Usuarios/Permissoes.
- Documentar como trocar `BETTER_AUTH_URL` e `trustedOrigins` no cutover de dominio.

## 10. Pendencias dos modulos

| Modulo        | Estado real               | Observacoes                                                                                 |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| Dashboard     | Parcial                   | Dados reais para resumo basico; graficos de crescimento vazios; sem analytics real.         |
| Clientes      | Parcial                   | Listagem, detalhe e criacao conectados; sem update/delete, contatos, enderecos e historico. |
| Produtos      | Parcial                   | Listagem, criacao, update, pause e soft delete; confirmacao ainda via `window.confirm`.     |
| Contratos     | Parcial                   | Listagem e criacao com produto/cliente; sem ciclo completo, renovacao ou assinatura.        |
| Financeiro    | Parcial                   | Cobrancas via Mercado Pago e leitura protegida por sessao/RBAC; sem CRUD financeiro.        |
| Agenda        | Parcial                   | Listagem e criacao de calls; sem update/delete/integracao calendario.                       |
| Suporte       | Parcial                   | Listagem e criacao de tickets; sem update, SLA, comentarios ou atribuicao real.             |
| Relatorios    | Somente parcial           | Exporta CSV de dados reais; PDF/XLSX avisados como futuro.                                  |
| Configuracoes | Parcial                   | Perfil, preferencias e senha; storage de perfil/preferencias ainda em `app_settings`.       |
| Perfil        | Parcial                   | Dados reais de auth; upload de avatar nao disponivel.                                       |
| Usuarios      | Implementado nesta branch | CRUD administrativo inicial, senha, sessoes, soft delete e auditoria.                       |
| Permissoes    | Implementado nesta branch | Matriz real de roles/permissoes em modo leitura; edicao fica para ciclo posterior.          |

## 11. Melhorias opcionais

- Adicionar testes unitarios para services/repositories.
- Adicionar testes de integracao para login e APIs protegidas.
- Configurar CI GitHub Actions com lint, typecheck, build e db validation sem secrets.
- Integrar monitoramento de erros.
- Definir OpenAPI ou contrato tipado para API interna.
- Criar migration generator/checker para evitar divergencia Better Auth.
- Avaliar `pg` pooling adequado para serverless Vercel e runtime Railway.
- Configurar cache de leitura com React Query de forma mais granular.
- Revisar bundle server, especialmente libs grandes em runtime.

## 12. Ordem recomendada de execucao

1. Fazer merge da branch `fix/security-and-railway-origin`.
2. Deployar Railway no commit mergeado e validar login autenticado real.
3. Criar a tag `v1.0.0-rc4`.
4. Configurar dominio final `automy.dev.br` no Railway.
5. Migrar perfil/preferencias de `app_settings` para tabelas dedicadas.
6. Adicionar auditoria automatica em CRUDs.
7. Padronizar formularios restantes com React Hook Form + Zod.
8. Planejar CRUDs reais dos modulos de negocio.

## Tabela de pendencias

| Item                                    | Categoria       | Severidade | Status                 | Dependencia                 | Responsavel sugerido | Acao recomendada                                                        |
| --------------------------------------- | --------------- | ---------- | ---------------------- | --------------------------- | -------------------- | ----------------------------------------------------------------------- |
| `/api/finance/charges` sem auth         | Seguranca       | Alta       | Resolvido nesta branch | Better Auth session helper  | Backend              | Exige sessao e RBAC antes de listar cobrancas.                          |
| Railway login `INVALID_ORIGIN`          | Deploy/Auth     | Alta       | Parcialmente resolvido | Dominio canonico e env vars | DevOps/Backend       | `BETTER_AUTH_URL` Railway aplicado; validar login real apos deploy.     |
| Tag `v1.0.0-rc3` anterior ao fix auth   | Git/Release     | Alta       | Pendente               | Decisao de versionamento    | Tech lead            | Criar nova tag ou release note corretiva.                               |
| RBAC sem enforcement                    | Seguranca       | Media      | Parcialmente resolvido | Matriz de permissoes        | Backend              | Helper minimo criado; expandir para Usuarios/Permissoes.                |
| Sem escopo por `company_id`             | Banco/Seguranca | Media      | Parcialmente resolvido | Modelo multiempresa         | Backend              | Endpoints atuais derivam empresa do usuario; criar testes multiempresa. |
| Perfil em `app_settings`                | Banco/Auth      | Media      | Pendente               | Decisao de migracao         | Backend              | Usar `user_profiles` e `user_preferences`.                              |
| E-mail reset/verificacao desabilitado   | Auth            | Media      | Estruturado incompleto | Provedor transacional       | Backend/DevOps       | Integrar provedor de e-mail aprovado.                                   |
| `created_by`/`updated_by` incompletos   | Banco/Auditoria | Media      | Pendente               | Auth context nas APIs       | Backend              | Preencher campos pelo usuario autenticado.                              |
| `activity_logs` sem escrita automatica  | Auditoria       | Media      | Pendente               | Eventos de dominio          | Backend              | Registrar eventos em CRUDs.                                             |
| Healthcheck Railway ausente             | Deploy          | Media      | Pendente               | Config Railway              | DevOps               | Criar endpoint/healthcheck.                                             |
| Dominio `automy.dev.br` sem alias ativo | DNS             | Media      | Pendente               | DNS/Vercel/Railway          | DevOps               | Configurar registros e SSL no destino escolhido.                        |
| Forms sem RHF+Zod                       | Codigo          | Baixa      | Pendente               | Refino de formularios       | Frontend             | Padronizar modais de criacao.                                           |
| Fast Refresh warnings                   | Codigo          | Baixa      | Pendente               | Refactor leve UI exports    | Frontend             | Separar exports nao-componentes.                                        |
| `vite-tsconfig-paths` warning           | Build           | Baixa      | Pendente               | Vite config                 | Frontend             | Migrar para `resolve.tsconfigPaths`.                                    |
| Dependencias com updates disponiveis    | Dependencias    | Baixa      | Pendente               | Janela de manutencao        | Frontend/DevOps      | Atualizar em PR proprio com testes.                                     |

## Evidencias de validacao

- Git sincronizado: `main...origin/main`, sem ahead/behind.
- Branch remota unica observada: `origin/main`.
- Tags observadas: `v1.0.0-rc1`, `v1.0.0-rc2`, `v1.0.0-rc3`.
- Railway: app e Postgres online.
- Railway TCP Proxy: ativo.
- Vercel: deployment production `Ready`.
- Vercel envs: `DATABASE_URL`, `PGSSLMODE`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_API_KEY` configuradas em Development, Preview e Production.
- Local `.env.local`: existe e esta ignorado.
- Login Vercel: sucesso.
- Login Railway direto: bloqueado por origem invalida.
- APIs sem sessao: principais retornam `401`; financeiro retorna `200`.
- `npm install`: OK, 0 vulnerabilidades.
- `npm run lint`: OK, 0 erros, 9 warnings de Fast Refresh.
- `npx tsc --noEmit`: OK.
- `npm run build`: OK, com warning informativo sobre `vite-tsconfig-paths`.
- `npm run db:validate`: OK.
- `npm run db:inspect`: OK.
- `git diff --check`: OK, apenas aviso de conversao LF/CRLF no Windows para `ARCHITECTURE.md`.
- Start de producao local via `.output/server/index.mjs`: OK, `/login` respondeu `200`.
- Railway origin check: origem Railway retorna erro de credenciais invalidas, nao `INVALID_ORIGIN`.
- Railway untrusted origin check: origem externa retorna `403 INVALID_ORIGIN`.
- `security:verify` local: APIs internas sem sessao retornam `401`, incluindo `/api/finance/charges`.
- `security:verify` local: `POST /api/finance/charges` sem sessao retorna `401`.
- `security:verify` local: origem nao confiavel retorna `403`.
- `security:verify` local: validacoes admin/read_only ficaram `skipped` por ausencia de credenciais de teste em env.
- PR `#1`: mergeado em `c9ccfd5`.
- Deployment Railway `8d6660b5-f130-4494-94eb-6cae4267bf43`: `SUCCESS`.
- `security:verify` em Railway: protecoes anonimas e origem nao confiavel passaram.
- Login real, sessao autenticada e logout autenticado em Railway: nao executados por ausencia de credenciais seguras em env.
