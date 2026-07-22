---
name: magic-resume
description: How AI agents integrate with Magic Resume — read and safely edit a user's resumes through the native MCP server (@magic-resume/mcp). Covers install, auth (PAT), and the patch-based editing contract.
---

# Magic Resume integration skill

Magic Resume is an open-source, AI-native resume platform. AI tools integrate
through its **native MCP server** (`@magic-resume/mcp`), a stdio process your
tool spawns — the same data layer the web app uses. These docs are for
**developers/integrators**, not end users of the hosted product.

## Connect

```bash
# 1. Create a Personal Access Token in the web app:
#    Settings → Personal Access Tokens → Create  (value shown once, starts with mr_pat_)
# 2. Configure the MCP server once:
npx -y @magic-resume/mcp config set \
  --api-url "https://api.magic-resume.cn" \
  --pat "mr_pat_xxx"
# writes ~/.magic-resume/mcp.json  (point --api-url at http://localhost:3111 for local Core API)

# 3. Register with your tool, e.g. Claude Code:
claude mcp add magic-resume -- npx -y @magic-resume/mcp mcp
```

Cursor / Windsurf and any stdio MCP client work too — see `mcp/setup`.

## Auth

- The MCP server talks to the **Core API** with a **Personal Access Token**
  (`mr_pat_…`) as a Bearer token. A PAT grants read/write to all of that user's
  resumes — treat it like a password.
- The browser app uses Clerk JWTs instead; the CLI/MCP path uses PATs. Same
  backend, two auth modes.

## Editing contract — this is the important part

- Resumes are a **typed Zod value** (`@magic-resume/resume-schema`). Every field
  has a known shape; don't guess.
- Mutations are **JSON Patch only** — the MCP tools apply RFC-6902 patches
  against the schema and the server re-validates. Never do full-document
  rewrites, and never invent fields not in the schema.
- Read the current resume first, compute a minimal patch, apply it. Tool
  reference: `mcp/tools`; internals (validation, patch flow): `mcp/internals`.

## Boundaries — what agents can vs cannot do

- ✅ Read resumes, apply schema-valid JSON Patches, list/select resumes via MCP.
- ⚠️ **PDF export is client-side** (the frontend renders from the shared template
  package) — there is no server "export PDF" tool.
- ⚠️ Cloud sync is **opt-in**; in self-hosted/local-first mode data lives only in
  the browser's IndexedDB and there may be no Core API to call.
- ⚠️ Don't invent commands, endpoints, env vars, or template IDs — if it's not in
  these docs it doesn't exist.

## Full docs
See the navigation: Getting Started, MCP Server (setup, tools, internals),
Architecture (resume schema, templates), Development.
