# Changelog

## 2026-08-04

- Implementado modulo de Identidade com Supabase Auth.
- Adicionadas rotas de login, recuperacao e redefinicao de senha.
- Adicionada protecao de rotas privadas.
- Criada tela real de Perfil em Configuracoes.
- Adicionado upload de avatar via Supabase Storage.
- Adicionadas preferencias por usuario.
- Criada migration de identidade com `user_profiles`, `user_preferences` e bucket `avatars`.
- Removidos mocks e dados ficticios dos modulos principais.
- Repositories preparados para leitura via Supabase.
- Paginas convertidas para consumo via React Query.
- Adicionados Empty States para telas sem registros reais.
- Adicionado client Supabase compartilhado.
- Adicionados tipos compartilhados para entidades auditaveis.
- Criada migration inicial do Supabase com UUID, auditoria, soft delete e RLS.
- Atualizado shell para remover usuario e notificacao ficticios.
- Atualizada documentacao de arquitetura, regras e roadmap.
