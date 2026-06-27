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

## Commit messages

This repo enforces gitmoji + conventional-type commits via Husky `commit-msg` → `commitlint`.

Format: `<emoji> <type>(<scope>?): <subject>` — e.g. `:sparkles: feat(web): add resume share link generator`. Type must be one of `build|ci|chore|docs|feat|fix|perf|refactor|revert|style|test|wip`. See `.claude/skills/commit/SKILL.md` for the emoji map, examples, and the dry-run command. **Do not use `--no-verify`** — fix the message instead.

## Guardrails

- Do not modify Clerk auth (`clerkMiddleware`, `ClerkProvider`, `useAuth`, cloud sync) unless explicitly requested.
- Do not add new deployment modes or local/cloud switches unless explicitly requested.
- MCP tools must remain schema-aware and patch-based. The `@magic-resume/mcp` package must not import from Next.js, React components, browser APIs, or IndexedDB.
- When adding shared schema or type changes, prefer `packages/resume-schema` over duplicating shapes in `apps/web`.
- Keep template IDs aligned: any new `templateId` added to `packages/resume-schema` must have a corresponding entry in `packages/resume-templates/src/registry.ts`, and a thumbnail at `apps/web/public/templates/jpg/{id}.jpg`.

## Design Context

> Full version + design principles live in `.impeccable.md` (project root); read it before any UI / UX work. Source: `design/ai-lab-living-canvas.md`.

- **Users**: 求职者(中文市场为主),为某个目标岗位搭建 / 打磨简历。`create`(引导创建)服务"从零 / 另起一份"的人——含经验少需引导者与求快出稿者;其余能力面向已有简历、准备投递的人。
- **Personality**: 锐利、协作、有主见的"搭档"(Codex / Claude 式 agentic),不是被动工具。文案简短、动词开头、不复述用户已见。让用户有掌控感与被理解感。
- **Aesthetic**: 深色工作台 `#0A0A0A` + sky `#38bdf8` 点缀、少 border;简历修订红删 `#dc2626` / 绿增 `#15803d`。动效轻快贴元素,仅 transform / opacity,不弹跳。Anti:花哨空洞、冷冰冰填表、AI 不可控、冗长问卷。
- **Principles**: ①画布是舞台,对话是旁白 ②能力按需浮现 ③AI 是合作者(改动先提案、可拒绝、有理由、可跳过) ④就地而非另开 ⑤脚手架不是栅栏(给起点也允许自由表达 / 跳过)。
