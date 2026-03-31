# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm run dev        # Start dev server on http://localhost:3000
pnpm run build      # Vite client build + esbuild server bundle → dist/
pnpm run start      # Run production build (NODE_ENV=production)
pnpm run check      # TypeScript type check (tsc --noEmit)
pnpm run format     # Format all files with Prettier
```

No test runner is configured yet (vitest is installed but unused).

## Architecture

**PsicoGestión** is a practice management system for psychology clinics. The current MVP is a **frontend-only prototype** — the Express server only serves the SPA bundle; there are no backend API endpoints or database.

### Stack
- **Frontend**: React 19 + Vite, Tailwind CSS 4, Radix UI (shadcn/ui style), Wouter routing, React Hook Form + Zod, Recharts
- **Server**: Express 4 (SPA file server only), TypeScript via tsx/esbuild
- **Package manager**: pnpm

### Build output
- `dist/public/` — Vite client bundle
- `dist/index.js` — esbuild server bundle (ESM)

### Frontend structure
- `client/src/pages/Home.tsx` — root layout; owns `currentView` state and renders the active view
- `client/src/components/Sidebar.tsx` — navigation; drives view switching in `Home.tsx`
- `client/src/components/DashboardView.tsx` — stats cards and alerts (hardcoded mock data)
- `client/src/components/AgendaView.tsx` — weekly calendar grid
- `client/src/components/PacientesView.tsx` — patient list with search and tutor support for minors
- `client/src/components/PagosView.tsx` — three-tab payment/debt management
- `client/src/components/ui/` — Radix UI primitive wrappers (shadcn components)
- `client/src/contexts/ThemeContext.tsx` — light/dark theme provider

### Path aliases (tsconfig)
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

### Styling conventions
- Tailwind utility classes + CSS custom properties in `client/src/index.css`
- Color space: oklch; theme tokens in `:root` / `.dark`
- Prettier: double quotes, semicolons, 2-space indent, `arrowParens: "avoid"`, LF endings

### Data model (planned, not yet implemented)
Key entities defined in `ARCHITECTURE.md`: `Paciente`, `Tutor` (guardian for minors), `Cita` (appointment), `Pago` (payment), `Deuda` (debt). All data is currently hardcoded mock state inside components.

### What's missing before backend integration
- API routes on the Express server
- ORM + database (no driver configured)
- Auth/session management
- Real form submissions (forms are wired with RHF+Zod but submit handlers are stubs)
