# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (run from repo root)
pnpm install

# Dev / build / lint / test — all workspaces via Turborepo
pnpm run dev
pnpm run build
pnpm run lint
pnpm run test

# Target a single workspace
pnpm --filter @magic-resume/web dev
pnpm --filter @magic-resume/web lint
pnpm --filter @magic-resume/resume-schema test
pnpm --filter @magic-resume/resume-templates build
pnpm --filter @magic-resume/mcp test

# i18n validation (runs automatically on staged files via lint-staged)
pnpm --filter @magic-resume/web i18n:check
```

## Monorepo Structure

This is a **pnpm + Turborepo** monorepo. The package manager is `pnpm@10.28.1`.

| Workspace | Package name | Purpose |
|---|---|---|
| `apps/web` | `@magic-resume/web` | Next.js 15 App Router frontend |
| `packages/mcp` | `@magic-resume/mcp` | stdio MCP server + CLI (Node ESM) |
| `packages/resume-schema` | `@magic-resume/resume-schema` | Shared Zod schemas, types, sample data |
| `packages/resume-templates` | `@magic-resume/resume-templates` | Template DSL, renderer, registry |
| `packages/tsconfig` | `@magic-resume/tsconfig` | Shared TypeScript configs |

## Architecture

### Deployment modes (`apps/web`)

The web app supports two modes, controlled by `NEXT_PUBLIC_APP_MODE`:

- **`self-hosted`** (default): no auth, no backend required. All data stored in IndexedDB.
- **`cloud`**: Clerk authentication, cloud sync to NestJS Core API.

Mode is auto-detected in `src/lib/config/app.ts`: if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set and `NEXT_PUBLIC_APP_MODE` is unset, the app defaults to `cloud`. The middleware (`src/middleware.ts`) switches between Clerk's `clerkMiddleware` and a no-op handler based on this.

### HTTP clients (`src/lib/api/httpClient.ts`)

Two Axios instances share a single auth interceptor (Clerk JWT via `configureHttpClient`):

- `httpClient.api` → NestJS Core API (`NEXT_PUBLIC_CLOUD_API_URL`, default `localhost:3111`)
- `httpClient.agent` → Python agent backend (`BACKEND_URL`, default `localhost:8000`)

All Core API paths are centralized in `src/lib/api/routes.ts` (`API_ROUTES`). Python agent paths are in `AGENT_ROUTES`.

### State management (`apps/web`)

Zustand + Immer stores in `src/store/`:

- **`useResumeStore`**: primary resume state. Persists to IndexedDB, optionally syncs to cloud. Tracks `syncStatus` ('saved' | 'syncing' | 'modified' | 'local' | 'error').
- **`useSettingStore`**: user settings including `cloudSync` toggle and AI API key. Persists to IndexedDB.
- Other stores: `useMessageStore`, `useResumeDraftStore`, `useResumeAnalyzerStore`, `useResumeOptimizerStore`.

IndexedDB persistence is handled by `src/lib/api/IndexDBClient.ts` (db name: `MagicResumeDB`).

### Resume schema (`packages/resume-schema`)

Single source of truth for the resume data shape. Exports:
- `resumeSchema` (Zod), `Resume` type, and all sub-schemas
- `templateIds` / `templateSchema` — the canonical list of valid template IDs
- `defaultResume`, `sampleResume`
- `resumeJsonSchema` (JSON Schema for MCP resources)

Build generates `dist/` and also runs `scripts/write-schema.mjs` to emit `dist/schema.json`.

### Template system (`packages/resume-templates`)

Templates are defined using the `MagicTemplateDSL` interface, which includes `designTokens`, layout config, and section definitions. All templates are registered in `src/registry.ts` (`templateRegistry`).

**Template IDs must remain in sync** between `packages/resume-schema` (`templateIds`) and `packages/resume-templates` (`templateRegistry`).

Preview thumbnails are static assets at `apps/web/public/templates/jpg/{templateId}.jpg`.

### MCP package (`packages/mcp`)

A **Node.js ESM** package — no React, no browser APIs, no IndexedDB. It communicates with the Core API using Personal Access Tokens (PATs).

Config is stored at `~/.magic-resume/mcp.json` (set via `magic-resume config set --api-url <url> --pat <token>`).

The MCP server (`src/server.ts`) exposes tools via `@modelcontextprotocol/sdk`. Resume mutations use JSON Patch (`fast-json-patch`) — always patch-based, never full rewrites. Key helper logic is in `src/resume-tools.ts`.

## Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local`.

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_MODE` | Both | `self-hosted` or `cloud`; auto-detected if omitted |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Cloud | Triggers cloud mode auto-detection |
| `CLERK_SECRET_KEY` | Cloud | Server-side Clerk key |
| `NEXT_PUBLIC_CLOUD_API_URL` | Cloud | Browser-facing NestJS Core API |
| `BACKEND_URL` | AI features | Python agent server (interview, translate, AI optimize) |

## Guardrails

- Do not modify Clerk auth (`clerkMiddleware`, `ClerkProvider`, `useAuth`, cloud sync) unless explicitly requested.
- Do not add new deployment modes or local/cloud switches unless explicitly requested.
- MCP tools must remain schema-aware and patch-based. The `@magic-resume/mcp` package must not import from Next.js, React components, browser APIs, or IndexedDB.
- When adding shared schema or type changes, prefer `packages/resume-schema` over duplicating shapes in `apps/web`.
- Keep template IDs aligned: any new `templateId` added to `packages/resume-schema` must have a corresponding entry in `packages/resume-templates/src/registry.ts`, and a thumbnail at `apps/web/public/templates/jpg/{id}.jpg`.
