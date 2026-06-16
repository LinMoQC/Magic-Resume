<div align="center">
  <a href="https://magic-resume.cn">
    <img width="160" alt="Magic Resume Logo" src="./apps/web/public/simple-logo.png">
  </a>

  <h1>Magic Resume</h1>

  <p><strong>AI 原生简历平台 — 构建、分析、优化，并通过 AI 编程工具直接编辑简历。</strong></p>

[English](./README.md) · **简体中文** · [官方网站][official-site] · [问题反馈][github-issues-link]

  <!-- SHIELD GROUP -->

[![][vercel-shield]][vercel-link]
[![][github-contributors-shield]][github-contributors-link]
[![][github-forks-shield]][github-forks-link]
[![][github-stars-shield]][github-stars-link]
[![][github-issues-shield]][github-issues-link]
[![][github-license-shield]][github-license-link]

</div>

<details>
<summary><kbd>目录</kbd></summary>

#### TOC

- [👋🏻 快速开始](#-快速开始)
- [✨ 功能特性](#-功能特性)
  - [制作：可视化模板自定义](#制作可视化模板自定义)
  - [分析：Lighthouse 风格报告](#分析lighthouse-风格报告)
  - [优化：AI 驱动的 JD 匹配](#优化ai-驱动的-jd-匹配)
  - [AI Lab：面试练习与翻译](#ai-lab面试练习与翻译)
  - [隐私：本地优先的数据安全](#隐私本地优先的数据安全)
- [🤖 MCP 集成](#-mcp-集成)
- [⚙️ 环境变量](#️-环境变量)
- [🛳 私有化部署](#-私有化部署)
  - [自托管模式（无需后端）](#自托管模式无需后端)
  - [使用 Vercel 部署](#使用-vercel-部署)
- [📦 生态系统](#-生态系统)
- [⌨️ 本地开发](#️-本地开发)
- [🤝 参与贡献](#-参与贡献)
- [📈 Star 历史](#-star-历史)

####

<br/>

</details>

<br/>

![Banner](./apps/web/public/magic-resume-preview.png)

## 👋🏻 快速开始

**Magic Resume** 是一款基于 Turborepo monorepo 构建的现代化 AI 原生简历平台。它将实时可视化编辑器与多模型 AI 能力相结合——并更进一步，提供原生 **MCP 服务器**，让 AI 编程工具（Claude Code、Cursor、Windsurf）无需猜测数据结构，即可安全地读取和编辑简历。

## ✨ 功能特性

### 制作：可视化模板自定义

使用直观的可视化编辑器，在几分钟内创建专业简历。

- **实时预览**：输入即可立即看到变化。
- **12 款专业模板**：对 ATS 友好，支持完整的颜色、字体和布局控制。
- **丰富定制**：轻松调整颜色、字体（22+ 种样式）、间距和布局。
- **版本历史**：保存快照并随时恢复任意历史版本。
- **简历分享**：通过专属链接分享，支持查看者 / 评论者 / 编辑者权限控制。

### 分析：Lighthouse 风格报告

获取关于简历健康状况的专业反馈。

- **总体评分**：对简历影响力的全面评价。
- **详细分析**：深入了解关键词匹配、可行动性和可读性。
- **可操作建议**：提供具体建议，让您的简历脱颖而出。

### 优化：AI 驱动的 JD 匹配

使用 AI 为特定职位描述量身定制简历。

- **智能对齐**：AI 分析职位描述 (JD) 并建议针对性的内容优化。
- **多模型支持**：兼容 OpenAI、Google Gemini、Anthropic Claude 及任意 OpenAI 兼容 API。

### AI Lab：面试练习与翻译

超越编辑，探索 AI 驱动的职业工具。

- **面试练习**：模拟真实面试场景，AI 对回答给出即时反馈。
- **简历翻译**：在保留格式的前提下，将简历翻译成任意语言。

### 隐私：本地优先的数据安全

您的数据由您掌握。

- **本地存储**：默认将所有简历数据存储在浏览器 IndexedDB 中，无需注册账号。
- **可选云端同步**：选择性地跨设备安全同步数据。
- **多格式导出**：导出为高质量 PDF 或结构化 JSON。

---

## 🤖 MCP 集成

Magic Resume 提供原生 **Model Context Protocol (MCP) 服务器**（`@magic-resume/mcp`）——为 AI 编程工具打造的一等公民集成。

配置一次个人访问令牌，您的 AI 助手即可安全地读取和修补简历，无需接触原始数据库：

```bash
npx -y @magic-resume/mcp config set --api-url "https://your-api.example.com/api" --pat "mr_pat_xxx"
claude mcp add magic-resume -- npx -y @magic-resume/mcp mcp
```

**可用 MCP 工具：**

| 工具 | 说明 |
|---|---|
| `list_resumes` | 列出账户中的所有简历 |
| `get_resume` | 获取简历的完整内容 |
| `get_resume_schema` | 获取用于验证的 JSON Schema |
| `get_resume_editing_guide` | 获取 AI 可读的简历编辑指南 |
| `preview_resume_patch` | 预览 JSON Patch 而不实际应用 |
| `update_resume_content` | 应用 JSON Patch 更新简历内容 |

MCP 服务器具备 schema 感知能力，采用基于 Patch 的操作方式——AI 工具进行精准修改而非全量覆盖。

---

## 🛠 技术栈

| 层次 | 技术 |
|---|---|
| Monorepo | [Turborepo](https://turbo.build/)、[pnpm](https://pnpm.io/) |
| 框架 | [Next.js 15](https://nextjs.org/)（App Router） |
| 语言 | [TypeScript](https://www.typescriptlang.org/) |
| AI / 大模型 | [LangChain](https://www.langchain.com/)、[LangGraph](https://www.langchain.com/langgraph)、[Google GenAI](https://ai.google.dev/)、[Anthropic](https://www.anthropic.com/) |
| 身份认证 | [Clerk](https://clerk.com/)（仅云端模式） |
| 样式方案 | [Tailwind CSS 4](https://tailwindcss.com/) |
| 组件库 | [Radix UI](https://www.radix-ui.com/)、[Lucide Icons](https://lucide.dev/) |
| 动画 | [Framer Motion](https://www.framer.com/motion/)、[GSAP](https://gsap.com/) |
| 状态管理 | [Zustand](https://zustand-demo.pmnd.rs/) |
| 本地存储 | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| 富文本编辑器 | [Tiptap](https://tiptap.dev/)、[Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| MCP | [@modelcontextprotocol/sdk](https://modelcontextprotocol.io/) |
| Schema | [Zod](https://zod.dev/) |
| 国际化 | [i18next](https://www.i18next.com/) |

---

## ⚙️ 环境变量

所有环境变量集中在 `apps/web/.env.local`（从 `apps/web/.env.example` 复制而来）。带 `NEXT_PUBLIC_` 前缀的会被打进前端 bundle，其余仅服务端可见。

| 变量 | 适用模式 | 默认值 | 作用 |
|---|---|---|---|
| `NEXT_PUBLIC_APP_MODE` | 全部 | 自动 | `self-hosted` 或 `cloud`。未设置时自动判定：检测到 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 则为 `cloud`，否则 `self-hosted`。 |
| `NEXT_PUBLIC_APP_URL` | 全部 | `https://magic-resume.cn` | 站点 canonical URL，用于 `metadataBase`（OG / SEO）。本地开发设为 `http://localhost:3000`，线上设为你的真实域名。 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | cloud | — | Clerk 前端公钥（`pk_...`），由 `@clerk/nextjs` 自动读取。 |
| `CLERK_SECRET_KEY` | cloud | — | Clerk 服务端密钥（`sk_...`），由 `@clerk/nextjs` 自动读取。 |
| `NEXT_PUBLIC_CLOUD_API_URL` | cloud | `http://localhost:3111` | NestJS Core API 地址，`httpClient.api` 用它请求简历、设置、分享、PAT 等。 |
| `BACKEND_URL` | AI 功能 | `http://localhost:8000` | Python Agent 后端地址，`httpClient.agent` 与 Next.js `/api/interview/*` rewrite 转发均使用（面试、翻译、AI 优化/分析）。 |

**模式说明**

- **`self-hosted`** — 纯浏览器，无 Clerk、无 Core API，所有数据存在 IndexedDB；仅 `NEXT_PUBLIC_APP_URL` 有意义。
- **`cloud`** — 必须配齐两个 Clerk Key 和 `NEXT_PUBLIC_CLOUD_API_URL`；若要使用 AI 功能再加 `BACKEND_URL`。

**注意事项**

- `.env.local` 已被 gitignore，不要提交，模板用 `.env.example`。
- `NEXT_PUBLIC_` 开头的值会在构建时硬编码进 JS，**任何秘钥都不要加这个前缀**。
- 之前的 PostHog / Google Analytics 环境变量已移除，业务埋点统一通过 `apps/web/src/lib/analytics/core-events.ts` 的自建 SDK 上报。

---

## 🛳 私有化部署

### 自托管模式（无需后端）

Magic Resume 可以完全在浏览器中运行，无需后端、数据库或账号注册。设置 `NEXT_PUBLIC_APP_MODE=self-hosted`（或留空），所有数据将持久化在 IndexedDB 中。

```bash
git clone https://github.com/LinMoQC/Magic-Resume.git
cd Magic-Resume
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local：设置 NEXT_PUBLIC_APP_MODE=self-hosted
pnpm install
pnpm run dev
```

### 使用 Vercel 部署

如需完整的云端体验（认证、云同步、分享功能），点击下方按钮一键部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLinMoQC%2FMagic-Resume)

> [!TIP]
> 云端模式需在 Vercel 控制面板中配置 `NEXT_PUBLIC_APP_MODE=cloud`、`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 和 `CLERK_SECRET_KEY`。

---

## 📦 生态系统

本仓库是一个 Turborepo monorepo，核心包如下：

| 包 | 说明 |
|---|---|
| `apps/web` | Next.js 前端——编辑器、仪表盘、AI Lab |
| `packages/mcp` | `@magic-resume/mcp`——stdio MCP 服务器和 CLI |
| `packages/resume-schema` | 共享 Zod Schema、类型定义和示例数据 |
| `packages/resume-templates` | 模板 DSL、渲染器和注册表 |

---

## ⌨️ 本地开发

```bash
# 安装依赖
pnpm install

# 启动所有工作区
pnpm run dev

# 或针对单个工作区
pnpm --filter @magic-resume/web dev
pnpm --filter @magic-resume/mcp build

# 代码检查与测试
pnpm run lint
pnpm run test
```

---

## 🤝 参与贡献

欢迎贡献！请随时提交 Pull Request。

如需报告 Bug 或提交功能建议，请[提交 Issue][github-issues-link]。

<a href="https://github.com/LinMoQC/Magic-Resume/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LinMoQC/Magic-Resume" alt="contributors" />
</a>

---

## 📈 Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=LinMoQC/Magic-Resume&type=Date)](https://star-history.com/#LinMoQC/Magic-Resume&Date)

---

Copyright © 2026 [Magic Resume Team](https://github.com/LinMoQC). <br />
本项目采用 [MIT](./LICENSE) 开源协议。

<!-- LINK GROUP -->

[official-site]: https://magic-resume.cn
[github-issues-link]: https://github.com/LinMoQC/Magic-Resume/issues
[vercel-shield]: https://img.shields.io/badge/vercel-online-55b467?labelColor=black&logo=vercel&style=flat-square
[vercel-link]: https://magic-resume.cn
[github-contributors-shield]: https://img.shields.io/github/contributors/LinMoQC/Magic-Resume?color=c4f042&labelColor=black&style=flat-square
[github-contributors-link]: https://github.com/LinMoQC/Magic-Resume/graphs/contributors
[github-forks-shield]: https://img.shields.io/github/forks/LinMoQC/Magic-Resume?color=8ae8ff&labelColor=black&style=flat-square
[github-forks-link]: https://github.com/LinMoQC/Magic-Resume/network/members
[github-stars-shield]: https://img.shields.io/github/stars/LinMoQC/Magic-Resume?color=ffcb47&labelColor=black&style=flat-square
[github-stars-link]: https://github.com/LinMoQC/Magic-Resume/stargazers
[github-issues-shield]: https://img.shields.io/github/issues/LinMoQC/Magic-Resume?color=ff80eb&labelColor=black&style=flat-square
[github-license-shield]: https://img.shields.io/badge/license-MIT-white?labelColor=black&style=flat-square
[github-license-link]: https://github.com/LinMoQC/Magic-Resume/blob/master/LICENSE
