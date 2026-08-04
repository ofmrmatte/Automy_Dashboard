# Automy Core Console

Crie uma aplicação web moderna e responsiva para uma software house chamada Automy.

IMPORTANTE:

Não implemente backend ou banco de dados. Utilize apenas dados fictícios (mock). O objetivo é criar um protótipo de alta fidelidade focado em UX/UI e arquitetura das telas.

O sistema será o painel administrativo interno da empresa para gerenciamento de clientes, contratos, produtos, suporte e financeiro.

### Estilo visual

Quero um design premium inspirado em Stripe, Linear, Vercel e Notion.

Características:

- Minimalista

- Profissional

- Elegante

- Muito espaço em branco

- Bordas arredondadas

- Sombras suaves

- Componentes modernos

- Tema claro e escuro

- Totalmente responsivo

- Ícones Lucide

- Tipografia limpa

- Animações discretas

- Interface extremamente organizada

Não utilize aparência antiga ou semelhante a ERPs tradicionais.

---

### Estrutura da aplicação

Sidebar fixa recolhível contendo:

• Dashboard

• Clientes

• Contratos

• Produtos

• Financeiro

• Suporte

• Relatórios

• Configurações

Topbar contendo:

- Campo de pesquisa global

- Alternador de tema

- Notificações

- Perfil do usuário

---

### Dashboard

Criar um dashboard executivo contendo cards de indicadores:

- Clientes ativos

- Clientes em implantação

- Receita mensal

- Receita anual

- Chamados abertos

- Contratos próximos do vencimento

Adicionar:

- gráfico de crescimento de clientes

- gráfico de receita

- últimos clientes cadastrados

- atividades recentes

---

### Tela Clientes

Criar uma tabela moderna contendo:

- Logo

- Nome Fantasia

- Razão Social

- CNPJ

- Cidade

- Estado

- Responsável

- Plano contratado

- Status

- Data de cadastro

- Botão visualizar

Adicionar:

- pesquisa

- filtros

- paginação

- botão Novo Cliente

Ao clicar em um cliente abrir uma página completa contendo:

Dados gerais

Contatos

Produtos contratados

Contratos

Financeiro

Documentos

Histórico

---

### Tela Produtos

Tabela contendo:

- Nome

- Categoria

- Versão

- Clientes utilizando

- Status

Botão Novo Produto

---

### Tela Contratos

Tabela contendo:

- Cliente

- Plano

- Valor mensal

- Início

- Renovação

- Status

---

### Financeiro

Cards:

Receita Mensal

Receita Anual

Clientes inadimplentes

Recebimentos previstos

Tabela de cobranças.

---

### Suporte

Tabela contendo:

- Ticket

- Cliente

- Prioridade

- Responsável

- Status

- Data

Adicionar filtros e busca.

---

### Relatórios

Criar página contendo cards para exportação:

Clientes

Financeiro

Contratos

Suporte

Produtos

---

### Configurações

Criar seções:

Empresa

Usuários

Permissões

Segurança

Integrações

Notificações

Perfil

---

### Componentes

Criar componentes reutilizáveis para:

Cards

Tabelas

Modal

Formulários

Inputs

Select

Badge

Alertas

Toast

Loader

Sidebar

Topbar

Breadcrumb

---

### Requisitos

Utilizar React + TypeScript.

Criar uma estrutura escalável com componentes reutilizáveis.

Utilizar dados simulados para todas as telas.

Todas as páginas devem estar navegáveis.

Criar uma experiência de produto SaaS profissional, semelhante a softwares utilizados por empresas de tecnologia de alto nível.

O resultado deve parecer um sistema pronto para produção, mesmo utilizando apenas dados fictícios.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://authomi-zenith.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d503aba9-3cb5-415f-9f83-3b26b811844a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
