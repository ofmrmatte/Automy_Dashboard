# BASELINE v1.0.0-RC3

Esta versao representa o ponto oficial de partida para o desenvolvimento dos modulos de negocio da Automy.

Nenhuma nova funcionalidade foi implementada neste freeze. A finalidade desta etapa e consolidar o estado atual do projeto, registrar as decisoes tecnicas oficiais e bloquear alteracoes estruturais sem aprovacao explicita.

Esta baseline substitui a `v1.0.0-rc2` como referencia operacional porque a nova foundation Railway foi ativada, validada e conectada ao Vercel.

## Escopo Congelado

- Arquitetura consolidada.
- Railway PostgreSQL definido como banco oficial.
- Foundation operacional ativada na nova conta Railway.
- Vercel configurado com as variaveis da nova foundation.
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
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

Hosts `*.railway.internal` devem ser usados apenas dentro da rede privada Railway. Local e Vercel devem utilizar a URL publica/TCP Proxy do Railway.

## Autenticacao

Better Auth e a autenticacao oficial da Automy. A autenticacao atual usa Railway PostgreSQL, cookies HttpOnly, hash padrao do Better Auth e RBAC inicial.

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
