# Automy Design System

Design System oficial da Automy para produtos SaaS voltados a logística e transportadoras.

## Identidade

A interface da Automy deve parecer moderna, minimalista, premium, tecnológica, confiável, limpa e elegante. A referência visual é próxima de Stripe, Linear, Vercel, Notion e Raycast, sem aparência de ERP tradicional.

## Tokens

Os tokens visuais ficam centralizados em:

- `src/styles.css`: tokens CSS usados pelo Tailwind.
- `src/shared/design/tokens.ts`: referência TypeScript para documentação, validações e futuras automações.

### Cores

| Token            | Valor     | Uso                                             |
| ---------------- | --------- | ----------------------------------------------- |
| Primary          | `#2563EB` | Ações principais, foco, destaques de navegação  |
| Secondary        | `#0F172A` | Marca, navegação, textos fortes                 |
| Accent           | `#14B8A6` | Destaques complementares, gráficos, indicadores |
| Success          | `#22C55E` | Estados positivos                               |
| Warning          | `#F59E0B` | Atenção e pendências                            |
| Danger           | `#EF4444` | Erros e ações destrutivas                       |
| Background Light | `#F8FAFC` | Fundo principal claro                           |
| Background Dark  | `#020617` | Fundo principal escuro                          |
| Surface Light    | `#FFFFFF` | Cards, modais e superfícies claras              |
| Surface Dark     | `#0F172A` | Cards, modais e superfícies escuras             |
| Text Primary     | `#0F172A` | Texto principal                                 |
| Text Secondary   | `#64748B` | Texto auxiliar                                  |

Use sempre classes semânticas (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`) em vez de cores hexadecimais dentro de componentes.

## Tipografia

Fonte principal: `Geist`.

Fallback: `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`.

Pesos permitidos: `400`, `500`, `600`, `700`.

## Espaçamento

O espaçamento segue múltiplos de 4px:

`4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`, `64`.

No Tailwind, use a escala padrão equivalente (`p-4`, `gap-3`, `mt-6`) e evite valores arbitrários quando houver equivalente semântico.

## Radius

| Elemento | Token            | Valor  |
| -------- | ---------------- | ------ |
| Cards    | `rounded-card`   | `16px` |
| Buttons  | `rounded-button` | `12px` |
| Inputs   | `rounded-input`  | `12px` |
| Modals   | `rounded-modal`  | `20px` |

## Componentes

Componentes compartilhados ficam em `src/shared/components`.

### Button

Use `Button` para qualquer ação.

Variantes:

- `primary`
- `secondary`
- `ghost`
- `outline`
- `danger`

Estados:

- `disabled`
- `loading`

```tsx
<Button>Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger" loading>
  Remover
</Button>
```

### Inputs

Componentes disponíveis:

- `Input`
- `SearchInput`
- `Textarea`
- `Select`
- `Checkbox`
- `Switch`
- `DateInput`
- `UploadInput`
- `Field`

```tsx
<Field label="Cliente">
  <Input placeholder="Nome do cliente" />
</Field>
```

### Badge

Use `Badge` para status e classificações.

Variantes:

- `active`
- `inactive`
- `pending`
- `success`
- `warning`
- `danger`
- `info`

```tsx
<Badge variant="active">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
```

### Card

Use `Card` para superfícies de conteúdo. Subcomponentes:

- `CardHeader`
- `CardBody`
- `CardFooter`
- `CardTitle`
- `CardDescription`
- `CardActions`

```tsx
<Card>
  <CardHeader>
    <CardTitle>Receita mensal</CardTitle>
    <CardDescription>Últimos 30 dias</CardDescription>
  </CardHeader>
  <CardBody>...</CardBody>
</Card>
```

### DataTable

`DataTable` padroniza tabelas com:

- colunas tipadas
- toolbar
- actions
- paginação
- loading
- empty state
- erro

```tsx
<DataTable
  columns={columns}
  data={rows}
  getRowKey={(row) => row.id}
  toolbar={<FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar..." />}
/>
```

### Loading

Componentes:

- `Spinner`
- `Loader`
- `LoadingScreen`
- `Skeleton`

### Toast

Use `toast` e `ToastViewport` de `src/shared/components/toast`.

```tsx
toast.success("Alterações salvas.");
toast.danger("Não foi possível concluir.");
```

## Sidebar

A sidebar usa:

- largura expandida: `w-64`
- largura recolhida: `w-18`
- ícones Lucide
- item ativo com `bg-sidebar-primary`
- hover com `bg-sidebar-accent`
- espaçamentos em múltiplos de 4px

Novos itens devem ser adicionados em `src/shared/constants/app.ts`.

## Dashboard

Use:

- `MetricCard` para indicadores.
- `Card` para widgets.
- tokens `--chart-*` para gráficos.
- `DataTable` para listas e tabelas.

## Boas Práticas

- Não use cores hardcoded dentro de componentes.
- Não crie variantes visuais fora dos componentes compartilhados.
- Não duplique tabelas, filtros, badges ou botões.
- Prefira componentes de `src/shared/components`.
- Componentes específicos de domínio devem ficar em `src/features/<feature>/components`.
- Mocks, services, repositories e queries devem continuar separados por módulo.
- Toda nova tela deve funcionar em light e dark theme.
- Use Lucide para ícones.
- Preserve espaçamentos em múltiplos de 4px.

## Evolução

Próximos passos recomendados:

- Criar Storybook ou página interna de catálogo visual.
- Mapear estados de formulário com React Hook Form e Zod.
- Integrar tokens com testes visuais.
- Adicionar verificações de contraste automatizadas.
- Criar snapshots visuais para light e dark theme.
