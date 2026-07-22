# Magic Resume docs

The contributor & integrator handbook for **Magic Resume** — running it, hacking
on it, and wiring AI tools (MCP) into it. Built with [Mintlify](https://mintlify.com),
bilingual (English / 中文). Migrated off Nextra.

All content and config live under `content/`:

```text
apps/docs/content/
├── docs.json          # Mintlify config: theme, colors, logo, bilingual navigation
├── .mintignore        # files excluded from the docs build
├── ASSISTANT.md       # context for the hosted AI assistant
├── skill.md           # agent-discovery skill (served at /skill.md)
├── logo/              # brand mark used by docs.json
├── en/                # English docs (.mdx)
└── zh/                # 中文文档 (mirror of en/)
```

## Local preview

```bash
# from apps/docs/content (where docs.json lives)
cd apps/docs/content
npx mint dev            # http://localhost:3000
```

This docs site is **not** part of `turbo dev` — it is a standalone Mintlify
project with no build step (no `package.json`, no Next.js).

## Deploy

Hosted by **Mintlify** via its GitHub app — it builds and publishes on push
(production branch + PR previews). One-time dashboard setup: connect the
`Magic-Resume/Magic-Resume` repo and set the **content directory to
`apps/docs/content`** (where `docs.json` lives). No repo secret or workflow is
needed.

## Authoring

- Each locale lives under `content/<locale>/`. Keep `en/` and `zh/` in sync — same file names, same structure.
- **Navigation** (order, groups, labels) is defined in `docs.json` under `navigation.languages[]`, not per-folder files.
- Pages are `.mdx` with frontmatter (`title`, `description`) and may use [Mintlify components](https://mintlify.com/docs): `<Card>`/`<CardGroup>`, `<Note>`/`<Warning>`/`<Info>`/`<Tip>`, `<Steps>`/`<Step>`, `<Tabs>`/`<Tab>`.
- Internal links use the locale-prefixed absolute path — `/en/mcp/setup`, `/zh/mcp/setup`.
