# Roadmap

## Proxima Etapa

- Conectar o projeto ao Supabase oficial.
- Aplicar a migration inicial.
- Configurar autenticacao e onboarding da primeira empresa.
- Implementar formularios reais com React Hook Form e Zod.
- Implementar CRUDs reais para clientes, produtos e contratos.

## Dados e Permissoes

- Revisar policies com usuarios reais.
- Criar matriz de permissoes por role.
- Definir fluxo administrativo para permissions globais.
- Adicionar auditoria automatica de `created_by` e `updated_by`.

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
