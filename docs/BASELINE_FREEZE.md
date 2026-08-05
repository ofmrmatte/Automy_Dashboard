# BASELINE v1.0.0-RC2

Esta versao representa o ponto oficial de partida para o desenvolvimento dos modulos de negocio da Automy.

Nenhuma nova funcionalidade foi implementada neste freeze. A finalidade desta etapa e consolidar o estado atual do projeto, registrar as decisoes tecnicas oficiais e bloquear alteracoes estruturais sem aprovacao explicita.

## Escopo Congelado

- Arquitetura consolidada.
- Railway PostgreSQL definido como banco oficial.
- Login Premium consolidado.
- Design System consolidado.
- Brand Kit aplicado.
- Deploy Vercel preparado via GitHub.
- Projeto preparado para continuidade em producao.

## Estado Oficial

- A aplicacao segue arquitetura Feature First.
- Paginas consomem dados por React Query ou hooks de aplicacao.
- Services concentram regras de aplicacao.
- Repositories concentram persistencia.
- A API interna e a fronteira com Railway PostgreSQL.
- Componentes visuais nao acessam banco, Prisma, fetch ou contratos externos diretamente.
- Mocks, dados ficticios e placeholders de desenvolvimento nao devem ser adicionados.

## Infraestrutura

Railway PostgreSQL e a fonte oficial de dados.

Variaveis esperadas por ambiente:

- `DATABASE_URL`
- `PGSSLMODE`
- `AUTOMY_ADMIN_EMAIL`
- `AUTOMY_ADMIN_PASSWORD`
- `AUTOMY_ADMIN_USER_ID` opcional

Hosts `*.railway.internal` devem ser usados apenas dentro da rede privada Railway. Local e Vercel devem utilizar a URL publica/proxy do Railway.

## Autenticacao

A autenticacao atual por `AUTOMY_ADMIN_EMAIL` e `AUTOMY_ADMIN_PASSWORD` e temporaria. Ela deve ser mantida nesta baseline para preservar acesso ao sistema, mas nao deve ser expandida para multiusuario.

A autenticacao definitiva devera utilizar PostgreSQL, senha com hash, sessoes persistidas, recuperacao de senha, auditoria e politicas de permissao.

## Checklist da Baseline

- Arquitetura consolidada.
- Railway PostgreSQL.
- Login Premium.
- Design System.
- Brand Kit.
- Deploy Vercel.
- Projeto preparado para producao.

## Proxima Fase

O proximo ciclo deve focar exclusivamente nos modulos de negocio:

- Usuarios.
- Clientes.
- Produtos.
- Contratos.
- Financeiro.
- Agenda.
- Suporte.
