# Changelog

## Current Project Status

- Baseline oficial: `v1.0.0-rc1`.
- Railway PostgreSQL definido como banco oficial.
- Vercel conectado ao GitHub, com deploy de `main`.
- Variaveis Railway pendentes no Vercel/local.
- Autenticacao temporaria por env vars mantida ate a migracao definitiva para PostgreSQL.

## 2026-08-05

- Consolidada a migration Railway em `railway/migrations`.
- Removidas configuracoes locais antigas do provedor anterior.
- Atualizada documentacao de Railway, Vercel, autenticacao temporaria e estado atual do projeto.
- Adicionadas release notes da baseline `v1.0.0-rc1`.
- Corrigido warning de dependencia de hook na pagina de Produtos.

## 2026-08-04

- Migrada a persistencia oficial para Railway PostgreSQL.
- Adicionada migration inicial em `railway/migrations`.
- Removidas configuracoes e migrations antigas do provedor anterior.
- Implementado modulo de Identidade com fluxo interno de e-mail e senha.
- Adicionadas rotas de login, recuperacao e redefinicao de senha.
- Adicionada protecao de rotas privadas.
- Criada tela real de Perfil em Configuracoes.
- Adicionadas preferencias por usuario.
- Removidos mocks e dados ficticios dos modulos principais.
- Repositories preparados para leitura e escrita via API interna.
- Paginas convertidas para consumo via React Query.
- Adicionados Empty States para telas sem registros reais.
- Adicionados tipos compartilhados para entidades auditaveis.
- Criada migration inicial com UUID, auditoria e soft delete.
- Atualizado shell para remover usuario e notificacao ficticios.
- Atualizada documentacao de arquitetura, regras e roadmap.
