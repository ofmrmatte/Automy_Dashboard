# Plano — Painel administrativo Automy

## Objetivo

Construir um protótipo SaaS interno de alta fidelidade, totalmente navegável e responsivo, usando apenas React, TypeScript e dados fictícios. Nenhum backend, banco de dados ou autenticação real será adicionado.

## Direção visual

- Interface premium e minimalista inspirada em Stripe, Linear, Vercel e Notion, sem aparência de ERP tradicional.
- Paleta neutra clara/escura com acento azul-violeta contido, superfícies limpas, bastante espaço em branco, bordas suaves, sombras discretas e raio consistente.
- Tipografia limpa, ícones Lucide, estados de foco acessíveis e animações curtas com suporte a `prefers-reduced-motion`.
- Tema claro/escuro persistido no navegador, com adaptação inicial à preferência do sistema.

## Estrutura e navegação

- Criar um shell compartilhado com sidebar fixa e recolhível no desktop, drawer no mobile e estado ativo por rota.
- Criar topbar com busca global simulada, tema, notificações e menu de perfil.
- Adicionar cabeçalhos, breadcrumbs e ações específicas em cada página.
- Criar rotas próprias e metadados para:
  - `/` — Dashboard
  - `/clientes` — Lista de clientes
  - `/clientes/$clienteId` — Detalhes completos do cliente
  - `/contratos`
  - `/produtos`
  - `/financeiro`
  - `/suporte`
  - `/relatorios`
  - `/configuracoes`

## Páginas

### Dashboard

- Seis indicadores executivos com variação e contexto.
- Gráfico de crescimento de clientes e gráfico de receita com Recharts.
- Lista de clientes recentes e feed de atividades recentes.
- Composição responsiva que mantém leitura e hierarquia em telas menores.

### Clientes

- Tabela com logo, nome fantasia, razão social, CNPJ, localização, responsável, plano, status, cadastro e ação de visualização.
- Busca, filtros, paginação e botão “Novo cliente”.
- Modal de cadastro mock com formulário validável e toast de confirmação local.
- Detalhe em página completa com abas/seções para dados gerais, contatos, produtos, contratos, financeiro, documentos e histórico.

### Produtos e contratos

- Produtos: tabela com nome, categoria, versão, número de clientes e status, além de modal “Novo produto”.
- Contratos: tabela com cliente, plano, valor mensal, início, renovação e status, com busca/filtros coerentes.

### Financeiro

- Cards de receita mensal, receita anual, clientes inadimplentes e recebimentos previstos.
- Tabela de cobranças com estados financeiros, vencimentos, valores, busca, filtros e paginação mock.

### Suporte

- Tabela de tickets com cliente, prioridade, responsável, status e data.
- Busca e filtros por prioridade/status, com badges semânticos e ação de visualização simulada.

### Relatórios

- Cards de exportação para clientes, financeiro, contratos, suporte e produtos.
- Seletores de período/formato e feedback por toast ao simular uma exportação.

### Configurações

- Navegação interna para Empresa, Usuários, Permissões, Segurança, Integrações, Notificações e Perfil.
- Formulários e controles mock coerentes com cada seção, incluindo switches, selects e estados salvos apenas na sessão da interface.

## Componentes e dados

- Criar componentes reutilizáveis para shell, sidebar, topbar, breadcrumb, page header, metric cards, charts, data table, paginação, filtros, badges, modal, formulários, inputs, selects, alertas, loader/skeleton, empty state e toast.
- Centralizar tipos, formatadores brasileiros e dados mock de clientes, contratos, produtos, cobranças, tickets, atividades e séries dos gráficos.
- Implementar interações locais de alta fidelidade: busca, filtros, ordenação quando útil, paginação, modais, tabs, menus, tema e feedback visual.

## Responsividade e qualidade

- Desktop com sidebar recolhível e tabelas densas; mobile com drawer, ações compactas e tabelas em scroll horizontal ou visualização adaptada sem perder dados.
- Garantir contraste, navegação por teclado, labels, estados de foco, tooltips e textos sem sobreposição.
- Validar todas as rotas, alternância de tema, navegação, modais, filtros e layouts em desktop e mobile.

## Detalhes técnicos

- Manter TanStack Start/Router e Tailwind CSS v4 já presentes no projeto.
- Usar tokens semânticos em `src/styles.css`, componentes React tipados e Recharts/Lucide já instalados.
- Organizar por componentes de layout, componentes de UI, dados mock e arquivos de rota; não criar chamadas de rede nem persistência de negócio.
