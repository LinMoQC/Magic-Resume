---
title: Magic Resume Frontend Monorepo & MCP Architecture
type: architecture
status: Living
owner: kaihuang
created: 2026-07-03
updated: 2026-07-03
summary: Frontend monorepo workspace layout, dependency direction, MCP package boundary, and migration phases.
scope: [apps/web, packages/mcp, packages/resume-schema, packages/resume-templates, packages/tsconfig]
repos: [Magic-Resume]
related: []
---

# Magic Resume Frontend Monorepo & MCP Architecture

## Summary

Magic Resume's frontend repository will evolve from a single Next.js application into a Turborepo monorepo. The first version keeps the existing product behavior intact while creating clear workspace boundaries for the web app, the official MCP/CLI package, shared resume schemas, and shared TypeScript configuration.

This document defines the target repository shape and the engineering boundaries for the MCP integration. It is a technical architecture note only; it does not change runtime behavior by itself.

## Goals

- Move the current Next.js frontend into a standard `apps/web` workspace.
- Add an official MCP/CLI package under `packages/mcp`.
- Extract resume data contracts into `packages/resume-schema` so both the web app and MCP package share the same structures.
- Extract resume templates into `packages/resume-templates` so template configuration, registry, and rendering contracts can be maintained outside the web app.
- Centralize reusable TypeScript configuration under `packages/tsconfig`.
- Keep the repository root focused on workspace orchestration, CI, documentation, and shared scripts.

## Target Repository Structure

```text
Magic-Resume/
├── apps/
│   └── web/
│       ├── src/
│       ├── public/
│       ├── scripts/
│       ├── next.config.ts
│       ├── postcss.config.mjs
│       ├── tsconfig.json
│       ├── eslint.config.mjs
│       ├── components.json
│       ├── Dockerfile
│       └── package.json
├── packages/
│   ├── mcp/
│   │   ├── src/
│   │   │   ├── cli.ts
│   │   │   ├── server.ts
│   │   │   ├── client.ts
│   │   │   ├── config.ts
│   │   │   └── tools/
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── resume-schema/
│   │   ├── src/
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── resume-templates/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── renderer/
│   │   │   ├── templateLayout/
│   │   │   ├── types/
│   │   │   └── registry.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── tsconfig/
│       ├── base.json
│       ├── nextjs.json
│       ├── node.json
│       └── package.json
├── docs/
├── .github/
├── turbo.json
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── README.md
└── README.zh-CN.md
```

## Workspace Responsibilities

### `apps/web`

`apps/web` owns the existing Magic Resume web application.

It contains the Next.js App Router application, dashboard, resume editor, sharing pages, AI Lab UI, localization files, frontend state stores, and browser-only persistence logic. Existing app-level assets and configuration files move here with the application.

The web app may depend on shared packages, especially `packages/resume-schema` and `packages/resume-templates`, but shared packages must not import from `apps/web`.

### `packages/mcp`

`packages/mcp` owns the official Magic Resume MCP and CLI package.

It provides:

- A CLI binary for local setup and configuration.
- A stdio MCP server for Claude Code, Codex, and other MCP-compatible AI tools.
- A Core API client for authenticated resume operations.
- MCP tools for listing, reading, previewing JSON Patch edits, and updating resume content.
- MCP resources and prompts that teach AI agents the resume schema, template IDs, and safe editing workflow.

The package must not depend on Next.js, React, browser APIs, IndexedDB, or any source file inside `apps/web`.

### `packages/resume-schema`

`packages/resume-schema` owns shared resume contracts.

It should include:

- Resume TypeScript types.
- Zod schemas for validating resume JSON and structured update inputs.
- Section item types and section update DTOs.
- Shared constants needed by both the web app and MCP package.

This package is the contract layer between the web app, MCP package, and Core API. Any resume shape used by multiple workspaces should live here instead of being duplicated.

### `packages/resume-templates`

`packages/resume-templates` owns the template DSL, renderer, layout components, template configs, and template registry.

It should include:

- Individual template configs.
- A single `templateRegistry` manifest list.
- Derived helpers such as `getTemplateById`, `getTemplateManifestList`, and `defaultTemplate`.
- Template renderer and template layout building blocks.

Template IDs must stay aligned with `packages/resume-schema` `templateSchema`. The package may depend on `packages/resume-schema`, but it must not depend on `apps/web`.

### `packages/tsconfig`

`packages/tsconfig` owns shared TypeScript configuration.

It should expose reusable configs such as:

- `base.json` for common strictness and module settings.
- `nextjs.json` for `apps/web`.
- `node.json` for `packages/mcp` and other Node-targeted packages.

## Root Repository Responsibilities

The repository root is for orchestration and shared metadata only.

It owns:

- `turbo.json`
- root `package.json`
- root lockfile
- workspace-level scripts
- CI configuration
- repository documentation
- shared tooling configuration when it truly applies to all workspaces

The root should not contain application source code after migration. The current Next.js application source should live in `apps/web`.

## Dependency Direction

Allowed dependencies:

- `apps/web` can depend on `packages/resume-schema`.
- `apps/web` can depend on `packages/resume-templates`.
- `packages/mcp` can depend on `packages/resume-schema`.
- `packages/mcp` can depend on `packages/resume-templates` for template manifests.
- `packages/resume-templates` can depend on `packages/resume-schema` for template ID types.
- Workspace packages can depend on `packages/tsconfig` for TypeScript configuration.

Disallowed dependencies:

- `packages/*` must not depend on `apps/web`.
- `packages/mcp` must not import frontend stores, React components, Next.js routes, or browser persistence code.
- `packages/resume-schema` must not depend on app runtime code, API clients, or MCP implementation details.
- `packages/resume-templates` must not import web routes, web stores, or web-only persistence code.

This direction keeps shared contracts stable and prevents the MCP package from accidentally becoming coupled to the web application runtime.

## Script Conventions

The root `package.json` should expose Turborepo orchestration scripts:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  }
}
```

Workspace-specific scripts stay inside their own `package.json` files.

Examples:

- `apps/web`: `dev`, `build`, `start`, `lint`, `i18n:check`
- `packages/mcp`: `build`, `dev`, `lint`, `test`
- `packages/resume-schema`: `build`, `lint`, `test`

To run only the web app after migration:

```bash
pnpm --filter @magic-resume/web dev
```

To run a single package build:

```bash
pnpm --filter @magic-resume/mcp build
```

## MCP and Core API Boundary

The MCP package calls `Magic-Resume-Core/api` over HTTP. It does not directly read or write browser IndexedDB and does not depend on Next.js runtime behavior.

The Core API remains the source of truth for cloud resumes, authentication, authorization, encrypted persistence, cache invalidation, sharing state, and version history.

The MCP package should authenticate with a personal access token issued by the Magic Resume web app and verified by the API.

MCP write operations should call structured API endpoints instead of sending arbitrary frontend state mutations. The API should validate ownership, token scope, resume shape, and expected update timestamps before applying changes.

## Initial MCP Tool Surface

The MCP package exposes a small, agent-ready tool surface:

- `list_resumes`
- `get_resume`
- `get_resume_schema`
- `get_resume_editing_guide`
- `preview_resume_patch`
- `update_resume_content`

These tools favor schema-aware reads and small RFC6902 JSON Patch operations over raw full-document rewrites. `preview_resume_patch` applies patches locally without writing to Core; `update_resume_content` reads the latest resume, applies the patch, validates the full schema, serializes `content`, and writes through Core API.

The MCP package also exposes:

- `resume://schema`
- `resume://templates`
- `resume://editing-guide`

Prompts:

- `build_resume`
- `review_resume`
- `tailor_resume`
- `improve_resume`

## Migration Phases

1. Add Turborepo root configuration.
2. Move the existing frontend application into `apps/web`.
3. Extract shared resume contracts into `packages/resume-schema`.
4. Extract templates into `packages/resume-templates`.
5. Add the `packages/mcp` package skeleton.
6. Connect the MCP package to Core API personal access tokens and schema-aware JSON Patch tools.

Each phase should keep the repository buildable before moving to the next one.

## Acceptance Criteria

- The frontend monorepo target structure is explicit.
- Workspace responsibilities are clear.
- Package dependency direction is unambiguous.
- MCP is clearly separated from Next.js, browser storage, and frontend implementation details.
- Future implementation work can proceed without guessing where the web app, MCP package, schema package, template package, and shared config should live.
