<div align="center">
  <a href="https://magic-resume.cn">
    <img width="128" alt="Magic Resume" src="./apps/web/public/magic-resume-mark.png">
  </a>

  <h1>Magic Resume</h1>

  <p><strong>The AI-native resume platform.</strong><br/>Build, analyze, and optimize your resume — and let AI coding tools edit it for you.</p>

  <p>
    <a href="https://magic-resume.cn"><strong>Get Started »</strong></a>
    &nbsp;·&nbsp;
    <a href="./README.zh-CN.md">简体中文</a>
    &nbsp;·&nbsp;
    <a href="https://magic-resume.cn">Official Site</a>
    &nbsp;·&nbsp;
    <a href="https://github.com/LinMoQC/Magic-Resume/issues">Feedback</a>
  </p>

  <!-- SHIELD GROUP -->

  [![][vercel-shield]][vercel-link]
  [![][github-stars-shield]][github-stars-link]
  [![][github-forks-shield]][github-forks-link]
  [![][github-contributors-shield]][github-contributors-link]
  [![][github-issues-shield]][github-issues-link]
  [![][github-license-shield]][github-license-link]

</div>

<br/>

![Banner](./apps/web/public/magic-resume-preview.png)

<br/>

**Magic Resume** is a modern, AI-native resume platform. It pairs a real-time visual editor with multi-model AI — and goes one step further with a native **MCP server** that lets AI coding tools (Claude Code, Cursor, Windsurf) read and safely patch your resumes without ever guessing the data shape.

It's free, open source, and works fully in your browser — no account, no backend, no database required.

> [!NOTE]
> Everything runs locally by default. Your resume data lives in your browser (IndexedDB) unless you explicitly opt into cloud sync.

---

## Features

**Build — visual editing that just works**

- **Real-time preview** — see every change the instant you type.
- **12 professional templates** — ATS-friendly, with full color, font, and layout control.
- **Deep customization** — 22+ font styles, spacing, and layout controls.
- **Version history** — snapshot and restore any previous version.
- **Sharing** — share via a unique link with Viewer / Commenter / Editor permissions.

**Analyze — Lighthouse-style resume health**

- **Overall score** — a single, honest rating of your resume's impact.
- **Detailed breakdown** — keyword matching, actionability, and readability.
- **Actionable fixes** — specific, targeted suggestions, not vague advice.

**Optimize — tailor to any job**

- **JD matching** — AI reads a job description and rewrites content to fit.
- **Bring your own model** — OpenAI, Google Gemini, Anthropic Claude, DeepSeek, or any OpenAI-compatible API.

**AI Lab — beyond editing**

- **Mock interviews** — practice with AI feedback on your answers.
- **One-click translation** — translate a resume into any language, formatting preserved.

**Privacy — your data stays yours**

- **Local-first** — stored in IndexedDB by default, no account needed.
- **Optional cloud sync** — securely sync across devices only if you choose.
- **Export anywhere** — high-quality PDF or structured JSON.

---

## Templates

Twelve hand-crafted, ATS-friendly templates, each fully customizable (color, font, spacing, layout):

`classic` · `azurill` · `bronzor` · `chikorita` · `ditto` · `gengar` · `orange-modern` · `clean-minimal` · `teal-professional` · `red-accent` · `golden-elegant` · `product-ops-focus`

---

## MCP Integration

Magic Resume ships a native **Model Context Protocol (MCP) server** (`@magic-resume/mcp`) — a first-class integration for AI coding tools.

Configure it once with a personal access token, and your AI assistant can read and patch resumes safely, without touching the raw database:

```bash
npx -y @magic-resume/mcp config set --api-url "https://your-api.example.com/api" --pat "mr_pat_xxx"
claude mcp add magic-resume -- npx -y @magic-resume/mcp mcp
```

| Tool | Description |
|---|---|
| `list_resumes` | List all resumes in your account |
| `get_resume` | Fetch a resume's full content |
| `get_resume_schema` | Get the JSON schema for validation |
| `get_resume_editing_guide` | AI-readable guide on how to edit resumes |
| `preview_resume_patch` | Preview a JSON Patch without applying it |
| `update_resume_content` | Apply a JSON Patch to update resume content |

> [!TIP]
> The server is schema-aware and patch-based — AI tools make surgical edits rather than risky full rewrites.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | [Turborepo](https://turbo.build/), [pnpm](https://pnpm.io/) |
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| AI / LLM | [LangChain](https://www.langchain.com/), [LangGraph](https://www.langchain.com/langgraph), [Google GenAI](https://ai.google.dev/), [Anthropic](https://www.anthropic.com/) |
| Auth | [Clerk](https://clerk.com/) (cloud mode only) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| UI | [Radix UI](https://www.radix-ui.com/), [Lucide](https://lucide.dev/) |
| Animation | [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Storage | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| Editor | [Tiptap](https://tiptap.dev/), [Monaco](https://microsoft.github.io/monaco-editor/) |
| MCP | [@modelcontextprotocol/sdk](https://modelcontextprotocol.io/) |
| Schema | [Zod](https://zod.dev/) |
| i18n | [i18next](https://www.i18next.com/) |

---

## Quick Start

Magic Resume runs fully in the browser — no backend, no database, no account.

```bash
git clone https://github.com/LinMoQC/Magic-Resume.git
cd Magic-Resume
cp apps/web/.env.example apps/web/.env.local   # set NEXT_PUBLIC_APP_MODE=self-hosted
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building.

---

## Self-Hosting

**Self-hosted mode** needs nothing but the browser — set `NEXT_PUBLIC_APP_MODE=self-hosted` (or leave it unset) and all data persists in IndexedDB. The open-source self-hosted build sends no product analytics.

**Cloud mode** (auth, cloud sync, sharing) deploys in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLinMoQC%2FMagic-Resume)

> [!TIP]
> For cloud mode, set `NEXT_PUBLIC_APP_MODE=cloud`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` in your Vercel dashboard.

<details>
<summary><strong>Environment variables</strong></summary>

<br/>

All variables live in `apps/web/.env.local` (copy from `apps/web/.env.example`). Values prefixed with `NEXT_PUBLIC_` are inlined into the browser bundle — never put secrets behind that prefix.

| Variable | Required in | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_MODE` | both | auto | `self-hosted` or `cloud`. Auto-detected: `cloud` when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set, else `self-hosted`. |
| `NEXT_PUBLIC_APP_URL` | both | `https://magic-resume.cn` | Canonical base URL for OG tags / SEO. Set to your origin (e.g. `http://localhost:3000` in dev). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | cloud | — | Clerk publishable key (`pk_...`). |
| `CLERK_SECRET_KEY` | cloud | — | Clerk secret key (`sk_...`). |
| `NEXT_PUBLIC_CLOUD_API_URL` | cloud | `http://localhost:3111` | NestJS Core API — resumes, settings, sharing, PATs. |
| `BACKEND_URL` | AI features | `http://localhost:8000` | Agent server — interview, translate, AI optimize/analyze. |

- **`self-hosted`** — pure browser. No Clerk, no Core API; only `NEXT_PUBLIC_APP_URL` matters.
- **`cloud`** — requires the two Clerk keys plus `NEXT_PUBLIC_CLOUD_API_URL`; AI features additionally require `BACKEND_URL`.

</details>

---

## Monorepo

This repository is a Turborepo + pnpm monorepo.

| Package | Description |
|---|---|
| `apps/web` | Next.js frontend — editor, dashboard, AI Lab |
| `packages/mcp` | `@magic-resume/mcp` — stdio MCP server and CLI |
| `packages/resume-schema` | Shared Zod schemas, types, and sample data |
| `packages/resume-templates` | Template DSL, renderer, and registry |

```bash
pnpm install            # install everything
pnpm run dev            # start all workspaces
pnpm run lint           # lint
pnpm run test           # test

# target a single workspace
pnpm --filter @magic-resume/web dev
pnpm --filter @magic-resume/mcp build
```

---

## Contributing

Contributions of every size are welcome — bug fixes, new templates, docs, translations, or features.

Please read the **[Contributing Guide](./CONTRIBUTING.md)** for local setup, the branch workflow, and the enforced **gitmoji + Conventional Commits** convention. For bugs or ideas, feel free to file an [issue](https://github.com/LinMoQC/Magic-Resume/issues) first.

<a href="https://github.com/LinMoQC/Magic-Resume/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LinMoQC/Magic-Resume" alt="contributors" />
</a>

---

## Star History

<a href="https://star-history.com/#LinMoQC/Magic-Resume&Date">
  <img src="https://api.star-history.com/svg?repos=LinMoQC/Magic-Resume&type=Date" alt="Star History Chart" width="600" />
</a>

---

<div align="center">

Copyright © 2026 [Magic Resume Team](https://github.com/LinMoQC) · [MIT](./LICENSE) licensed.

</div>

<!-- LINK GROUP -->

[official-site]: https://magic-resume.cn
[vercel-shield]: https://img.shields.io/badge/vercel-online-55b467?labelColor=black&logo=vercel&style=flat-square
[vercel-link]: https://magic-resume.cn
[github-contributors-shield]: https://img.shields.io/github/contributors/LinMoQC/Magic-Resume?color=c4f042&labelColor=black&style=flat-square
[github-contributors-link]: https://github.com/LinMoQC/Magic-Resume/graphs/contributors
[github-forks-shield]: https://img.shields.io/github/forks/LinMoQC/Magic-Resume?color=8ae8ff&labelColor=black&style=flat-square
[github-forks-link]: https://github.com/LinMoQC/Magic-Resume/network/members
[github-stars-shield]: https://img.shields.io/github/stars/LinMoQC/Magic-Resume?color=ffcb47&labelColor=black&style=flat-square
[github-stars-link]: https://github.com/LinMoQC/Magic-Resume/stargazers
[github-issues-shield]: https://img.shields.io/github/issues/LinMoQC/Magic-Resume?color=ff80eb&labelColor=black&style=flat-square
[github-issues-link]: https://github.com/LinMoQC/Magic-Resume/issues
[github-license-shield]: https://img.shields.io/badge/license-MIT-white?labelColor=black&style=flat-square
[github-license-link]: https://github.com/LinMoQC/Magic-Resume/blob/master/LICENSE
