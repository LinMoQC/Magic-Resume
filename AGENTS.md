# AGENTS.md

## Project

Magic Resume is a Turborepo monorepo for the frontend app, resume schema, resume templates, and MCP package.

## Workspaces

- `apps/web`: Next.js app. Keep Clerk, middleware, cloud sync, and PAT UI behavior intact unless explicitly requested.
- `packages/resume-schema`: shared resume data contracts. Prefer adding shared schema/type changes here instead of duplicating shapes in apps.
- `packages/resume-templates`: template DSL, renderer, registry, manifests, and template assets convention.
- `packages/mcp`: local stdio MCP CLI/server. It talks to Core API through PATs and must not depend on Next.js runtime, React components, browser APIs, or IndexedDB.
- `packages/tsconfig`: shared TypeScript configs.

## Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run lint
pnpm run test
```

Targeted checks:

```bash
pnpm --filter @magic-resume/resume-schema test
pnpm --filter @magic-resume/resume-templates build
pnpm --filter @magic-resume/mcp test
pnpm --filter @magic-resume/web lint
```

## Guardrails

- Do not add a local/cloud/self-hosted deployment mode unless explicitly requested.
- Do not change Clerk auth, `clerkMiddleware`, `ClerkProvider`, `useAuth`, or cloud sync behavior unless explicitly requested.
- Keep MCP tools schema-aware and patch-based. Avoid full resume rewrites.
- Keep template IDs aligned between `templateSchema` and `templateRegistry`.
