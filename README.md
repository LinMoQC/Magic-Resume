# Magic Resume

Magic Resume is an AI-assisted resume editor built with Next.js, Turborepo, shared resume schemas, reusable templates, and a local stdio MCP package for AI coding tools.

The current open-source repository focuses on the frontend monorepo and MCP integration. Cloud resume storage, Clerk authentication, personal access tokens, and sync behavior continue to run through the existing Magic Resume Core API.

## Monorepo Structure

```text
Magic-Resume/
├── apps/
│   └── web/                  # Next.js app and resume editor
├── packages/
│   ├── mcp/                  # @magic-resume/mcp CLI and stdio MCP server
│   ├── resume-schema/        # shared Zod schema, sample resume, JSON schema
│   ├── resume-templates/     # template DSL, renderer, registry, manifests
│   └── tsconfig/             # shared TypeScript configs
├── docs/                     # architecture and contributor docs
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Local Development

Use pnpm from the repository root:

```bash
pnpm install
pnpm run dev
```

Run a single workspace when needed:

```bash
pnpm --filter @magic-resume/web dev
pnpm --filter @magic-resume/mcp build
pnpm --filter @magic-resume/resume-schema test
pnpm --filter @magic-resume/resume-templates build
```

Root scripts are Turborepo orchestrators:

```bash
pnpm run dev
pnpm run build
pnpm run lint
pnpm run test
```

## Core API Dependency

The web app still expects the existing Magic Resume Core API for cloud features, Clerk-authenticated routes, PAT creation, and resume sync. Configure environment variables from `.env.example`.

Important values:

- `NEXT_PUBLIC_CLOUD_API_URL`: browser-facing Core API URL.
- `BACKEND_URL`: server-side Core API URL.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk browser key.
- `CLERK_SECRET_KEY`: Clerk server key.
- `NEXT_PUBLIC_IF_USE_BACKEND`: preserves the current backend API routing behavior.

This round does not introduce a local/cloud deployment switch.

## MCP Usage

`@magic-resume/mcp` runs as a local stdio MCP server. It does not open an independent production server port.

Configure it with a Magic Resume personal access token:

```bash
npx -y @magic-resume/mcp config set --api-url "https://your-core.example.com/api" --pat "mr_pat_xxx"
claude mcp add magic-resume -- npx -y @magic-resume/mcp mcp
```

The MCP exposes agent-ready tools for safe resume editing:

- `list_resumes`
- `get_resume`
- `get_resume_schema`
- `get_resume_editing_guide`
- `preview_resume_patch`
- `update_resume_content`

It also exposes resources and prompts so AI tools know how to edit resumes without guessing the JSON shape. See [docs/mcp.md](./docs/mcp.md).

## Template System

Templates live in `packages/resume-templates` and are registered through a single `templateRegistry`. The web app and API route derive template lists from that registry.

Preview assets follow this convention:

```text
apps/web/public/templates/jpg/{templateId}.jpg
```

See [docs/template-system.md](./docs/template-system.md) for the template contribution flow.

## Schema

`packages/resume-schema` is the shared source of truth for resume content. It exports:

- `resumeSchema`
- `templateSchema`
- `templateIds`
- `defaultResume`
- `sampleResume`
- generated `dist/schema.json`

See [docs/schema.md](./docs/schema.md).

## Architecture Docs

- [Monorepo & MCP Architecture](./docs/monorepo-mcp-architecture.md)
- [Template System](./docs/template-system.md)
- [MCP](./docs/mcp.md)
- [Schema](./docs/schema.md)

## License

MIT
