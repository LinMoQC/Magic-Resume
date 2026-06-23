# Magic Resume MCP

`@magic-resume/mcp` is a local stdio MCP package for Claude Code, Codex, and other MCP-compatible AI tools. It does not require Magic Resume to run a separate public MCP server port.

## Setup

Create a personal access token in the Magic Resume web app, then configure the CLI:

```bash
npx -y @magic-resume/mcp config set --api-url "https://your-core.example.com/api" --pat "mr_pat_xxx"
```

Add it to Claude Code:

```bash
claude mcp add magic-resume -- npx -y @magic-resume/mcp mcp
```

For local Core development:

```bash
npx -y @magic-resume/mcp config set --api-url "http://localhost:3111/api" --pat "mr_pat_xxx"
```

## Tools

- `list_resumes`: returns resume summaries only.
- `get_resume`: reads the latest resume and parses `content` into an object.
- `get_resume_schema`: returns schema, default resume, sample resume, editable paths, and valid template IDs.
- `get_resume_editing_guide`: returns the safe editing workflow for agents.
- `preview_resume_patch`: applies RFC6902 JSON Patch locally without writing to Core.
- `update_resume_content`: reads the latest resume, applies JSON Patch, validates schema, stringifies content, and writes through Core API.

The old generic full-document update surface should not be exposed to agents.

## Resources

- `resume://schema`
- `resume://templates`
- `resume://editing-guide`

These resources give AI clients stable context without forcing every prompt to rediscover the resume shape.

## Prompts

- `build_resume`
- `review_resume`
- `tailor_resume`
- `improve_resume`

Prompts tell AI clients to follow the same safe flow: list, read, preview patch, update.

## Editing Rules

- Do not rewrite the whole resume for small edits.
- Do not delete unknown fields.
- Do not remove `id`, `visible`, `sectionOrder`, or `customTemplate`.
- Keep `summary` fields as HTML strings.
- Only use template IDs from `templateSchema`.
- Do not fabricate employers, schools, dates, or metrics.

## Boundary

MCP calls Magic Resume Core API over HTTP using PAT authentication:

```text
Authorization: Bearer <personal-access-token>
```

It must not import from `apps/web`, read IndexedDB, depend on Next.js runtime, or access browser-only storage.
