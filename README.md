# Automy

Automy — Plataforma inteligente para controle e gestão operacional.

## Visão Geral

Aplicação web SaaS para gestão, automação e controle operacional de empresas de logística e transportadoras.

## Stack

- React
- TypeScript
- TanStack Router
- TanStack React Query
- TanStack Start
- Vite
- Tailwind CSS
- Lucide React
- Recharts

## Scripts

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## Brand Kit

Os assets oficiais da marca ficam em `brand-kit/`.

Os assets usados pela aplicação ficam em `public/`:

- `automy-logo-horizontal.svg`
- `automy-symbol.svg`
- `automy-logo-white.svg`
- `automy-logo-black.svg`
- `favicon.svg`
- `favicon-16.png`
- `favicon-32.png`
- `favicon-48.png`
- `apple-touch-icon.png`
- `android-chrome-192.png`
- `android-chrome-512.png`
- `pwa-icon.svg`
- `manifest.webmanifest`

## Design System

O Design System está documentado em `docs/DESIGN_SYSTEM.md`.

As cores, raios, sombras, tipografia e tokens semânticos estão centralizados em:

- `src/styles.css`
- `src/shared/design/tokens.ts`

## Estrutura

A aplicação segue organização feature-first em `src/features`, com componentes compartilhados em `src/shared`.
