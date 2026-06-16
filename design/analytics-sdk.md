# Magic Analytics — In‑house Tracking System v1 设计方案

> 状态：v1 设计稿，待评审
> 范围：**新私有仓 `magic-analytics`** + 已有 Core / Admin / OSS Web 四仓协同
> 替代：PostHog / GA / 现有 `core-events.ts`

---

## 0. Context & Goals

### 0.1 背景

- 已移除 PostHog / GA（见 commit history）。
- 当前自建埋点：`apps/web/src/lib/analytics/core-events.ts` 单函数 + `useTrace` 20 个 traceXxx + `PageViewTracker`；后端 `POST /api/analytics/events` 直写 PG（DTO 写死 38 个枚举）；Admin 漏斗/异常页全是 mock。
- 仓库现状：
  - `LinMoQC/Magic-Resume`（OSS public）= Next.js Web + monorepo
  - `LinMoQC/Magic-Core`（私有）= NestJS Core API
  - `Magic-Resume-Admin`（私有）= Vue 3 中台

### 0.2 目标

1. 一套 SDK 覆盖三类信号：业务 (biz) / 错误 (error) / 性能 (perf)。
2. 强类型契约：事件名/字段编译期对齐前后端。
3. 可扩展存储：PG + Prisma + BullMQ 队列；明细 90d + 聚合长期。
4. 中台开箱即用：流量 / 漏斗 / 日志 / 异常 / 性能 五块全部接真实数据。
5. 隐私默认收敛：PII 自动清洗、IP 不落原文。
6. **业务信号不进 OSS 仓库**：事件目录、漏斗定义、异常分组逻辑等"路线图信号"全部隔离到私有仓。OSS Web 仓库通过 optional dep 兼容（无私有包时自动 noop）。

### 0.3 非目标

A/B 实验 / Feature Flag / Session Replay / 服务端业务埋点（access log 已有）不在 v1。

---

## 1. 仓库拓扑

新增独立私有仓 **`magic-analytics`**，作为 SDK + schema + 后端模块 + 中台组件的单一上游：

```
┌──────────────────────────────────────────────────────────────────────────┐
│  magic-analytics  (NEW, private)                                          │
│   pnpm + turbo monorepo                                                   │
│   ├─ packages/                                                            │
│   │   schema/             @magic/analytics-schema                         │
│   │   sdk/                @magic/analytics-sdk                            │
│   │   nest-module/        @magic/analytics-nest    (NestJS DynamicModule) │
│   │   admin-vue/          @magic/analytics-admin   (Vue plugin + 视图)    │
│   │   sourcemap-cli/      @magic/analytics-sourcemap  (Next postbuild)    │
│   │   prisma-fragment/    @magic/analytics-prisma    (.prisma 片段)       │
│   ├─ apps/                                                                │
│   │   playground-api/     独立 NestJS 启动，本地集成测试                  │
│   │   playground-admin/   独立 Vue 启动                                   │
│   ├─ e2e/                 跨端 e2e (Playwright + ingest sim)              │
│   ├─ docs/                                                                │
│   └─ .changeset/          GitHub Packages 发布                             │
└──────────────────────────────────────────────────────────────────────────┘
                  │
                  │ npm install (GitHub Packages private registry)
                  ▼
    ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────────┐
    │ Magic-Core     │  │ Admin (Vue)    │  │ Magic-Resume (OSS Web)      │
    │  (private)     │  │  (private)     │  │  (public)                    │
    │  + nest-module │  │  + admin-vue   │  │  + sdk (optional dep)        │
    │  + schema      │  │  + sdk         │  │  + schema (optional dep)     │
    │  + prisma frag │  │  + schema      │  │  + sourcemap-cli (devDep)    │
    └────────────────┘  └────────────────┘  └─────────────────────────────┘
```

**关键边界**：
- 事件目录 / 漏斗定义 / 异常分组 / 后端实现 / 中台业务视图 → 全在 `magic-analytics`，**永不进 OSS**。
- OSS Web 仓库只 import 接口；私有包缺失时自动 noop，自托管用户体验无损。
- 后端、中台、OSS Web 通过 GitHub Packages 拉取 `@magic/*` 私有包（统一 organization scope）。

### 1.1 分发与版本

| 包 | 发布渠道 | 消费方 |
|---|---|---|
| `@magic/analytics-schema` | GitHub Packages (private) | sdk / nest-module / admin-vue / Web / Core / Admin |
| `@magic/analytics-sdk` | GitHub Packages (private) | Web / Admin |
| `@magic/analytics-nest` | GitHub Packages (private) | Core |
| `@magic/analytics-admin` | GitHub Packages (private) | Admin |
| `@magic/analytics-sourcemap` | GitHub Packages (private) | Web (devDep, postbuild CLI) |
| `@magic/analytics-prisma` | GitHub Packages (private) | Core（Prisma schema 片段） |

- 版本管理用 `changesets`：每个 PR 必带 changeset；merge 到 main → CI 自动 bump + 发版。
- semver：SDK / schema 走 minor 增量；后端 module 与 Prisma 片段必须 lockstep（同时升 major）。
- 消费方在自己仓库的 `package.json` pin major，`renovate` 自动跟 minor。

### 1.2 跨仓本地开发

- 本地用 `pnpm link --global` 或 `pnpm.overrides` 把 `@magic/*` 指向 `../magic-analytics/packages/*/dist`，热更新可见。
- 提供 `magic-analytics/scripts/setup-dev.sh`：自动建 link + 重启相关 watcher。
- CI 上跑 `pnpm install --frozen-lockfile`，强制走 registry，保证一致性。

### 1.3 OSS Web 兼容

OSS Magic-Resume 仓库**不能直接 require 私有包**（fork 用户装不上）。做法：

1. `apps/web/package.json`:
   ```jsonc
   {
     "optionalDependencies": {
       "@magic/analytics-sdk": "^1.0.0",
       "@magic/analytics-schema": "^1.0.0"
     }
   }
   ```
2. `apps/web/src/lib/analytics/index.ts` 提供一个动态壳：
   ```ts
   'use client';
   import type { Analytics } from './types';        // 本地接口定义
   import { noopAnalytics } from './noop';

   let analytics: Analytics = noopAnalytics;
   try {
     // 私有包存在时自动启用
     const mod = await import('@magic/analytics-sdk');
     analytics = mod.analytics;
   } catch { /* fork 用户：保持 noop */ }
   export { analytics };
   ```
3. 同样模式处理 `@magic/analytics-schema`：OSS 仓库本地定义 `EVENT_TYPES_FALLBACK = {}`，私有包存在时优先用真实常量。
4. `useTrace` 等业务 hook 调用 `analytics.track(...)`，noop 时无副作用。
5. **README 加一段**："本项目内置 Magic 团队的私有埋点接入。Fork / 自托管用户无需关心；若想接自己的分析服务，可 fork 后替换 `apps/web/src/lib/analytics/index.ts`。"
6. CI 流程：
   - OSS Web build：默认安装 `@magic/*`（用 Magic 团队的 npm token）→ 走真实 SDK。
   - 外部贡献者 PR 流水线：跳过私有 registry 配置 → optionalDep 解析失败 → 走 noop，build 仍通过。
7. **不发布到 npm**：私有包仅 GitHub Packages，OSS 没有公开 fallback。

> 副作用：自部署用户没有埋点能力。可在 README 写明，留扩展点（`analytics.init` 内部走的就是普通 fetch，他们 fork 后填自己的 endpoint 即可）。

---

## 2. 共享契约 — `@magic/analytics-schema`

> 在 `magic-analytics/packages/schema`。零运行时依赖（仅 peerDep `zod`），ESM + CJS 双格式。

### 2.1 Envelope 完整字段

```ts
// magic-analytics/packages/schema/src/envelope.ts
import { z } from 'zod';

export const envelopeSchema = z.object({
  // 标识
  event_id:    z.string().uuid(),                              // SDK uuid v4，后端唯一索引去重
  event_name:  z.string().min(1).max(80)
                .regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/),    // domain.action
  category:    z.enum(['biz', 'error', 'perf', 'system']),
  ts:          z.string().datetime(),                           // 客户端时间
  sent_at:     z.string().datetime().optional(),                // flush 时刻

  // 主体
  anonymous_id: z.string().min(1).max(64),                      // localStorage 长期 ID
  session_id:   z.string().min(1).max(64),                      // 30min 空闲滚动
  user_id:      z.string().min(1).max(64).nullable(),

  // 应用上下文
  app: z.object({
    name:    z.enum(['magic-resume-web', 'magic-resume-admin']),
    version: z.string().max(20),
    mode:    z.enum(['cloud', 'self-hosted']),
    locale:  z.string().max(10),
    release: z.string().max(40).optional(),
    sdk_version: z.string().max(20),
  }),

  // 页面上下文
  page: z.object({
    url:      z.string().max(2048),                             // PII 已脱敏
    path:     z.string().max(500),
    title:    z.string().max(200).optional(),
    referrer: z.string().max(2048).optional(),
    is_initial: z.boolean(),
  }),

  // 设备/环境
  device: z.object({
    ua:        z.string().max(500),                             // 后端解析后清除
    screen:    z.object({ w: z.number(), h: z.number() }),
    viewport:  z.object({ w: z.number(), h: z.number() }),
    dpr:       z.number().max(8),
    language:  z.string().max(10),
    tz:        z.string().max(40),
    connection: z.object({
      type: z.string().optional(),
      downlink: z.number().optional(),
      rtt: z.number().optional(),
    }).partial().optional(),
  }),

  // 业务上下文
  context: z.object({
    source:      z.string().max(40).optional(),
    resume_id:   z.string().max(64).optional(),
    template_id: z.string().max(64).optional(),
    utm: z.object({
      source:   z.string().max(80).optional(),
      medium:   z.string().max(80).optional(),
      campaign: z.string().max(80).optional(),
      term:     z.string().max(80).optional(),
      content:  z.string().max(80).optional(),
    }).partial().optional(),
  }).partial(),

  // 事件特定属性（每个 event_name 对应 schema，§2.3）
  properties: z.record(z.unknown()).optional(),
});

export type Envelope = z.infer<typeof envelopeSchema>;
```

| 字段 | 来源 | 用途 |
|---|---|---|
| `event_id` | SDK uuid v4 | 后端 `@unique` 去重 |
| `event_name` | 业务 / 自动收集器 | 主索引 |
| `category` | schema 包按 event_name 自动派生 | 路由表 |
| `ts` | SDK `new Date().toISOString()` | 真实发生时间 |
| `sent_at` | Buffer flush 时刻 | 端到端延迟监控 |
| `anonymous_id` | SDK Identity，localStorage `magic.analytics.anon_id` | 跨 session 追踪 |
| `session_id` | SDK Identity，30min 空闲滚动 | session funnel |
| `user_id` | `analytics.identify(userId)` | 登录关联 |
| `app.release` | `NEXT_PUBLIC_BUILD_ID`（CI 注入） | sourcemap 匹配 |
| `device.ua` | `navigator.userAgent` | 后端解析后清除 |
| `page.url` | `location.href`，PII 清洗后 | URL 分析 |
| `context.resume_id` | `useResumeStore.currentId` / `track` 时传 | resume 维度 |
| `context.utm` | session 首次 URL 抓 | 渠道归因 |

### 2.2 Event Catalog（完整）

> 命名：`domain.action[.qualifier]`，全小写。下表只列 properties 增量；envelope 字段全部自动带。

#### 2.2.1 system / page

| event_name | category | 触发 | properties |
|---|---|---|---|
| `page_view` | system | history pushState/popstate/初次加载 | `{ duration_ms?: number }` |
| `session_start` | system | 新 session 首事件附带 `first_event: true` | `{}` |

#### 2.2.2 landing.*

| event_name | 位置 | properties |
|---|---|---|
| `landing.cta_clicked` | `landing/HeroSection.tsx` | `{ location: 'hero' \| 'footer' }` |
| `landing.github_starred` | `landing/HeroSection.tsx` / `Footer.tsx` | `{ location: 'footer' \| 'hero' \| 'hero_glass_button' \| 'hero_macbook_badge' \| 'footer_mobile' }` |

#### 2.2.3 auth.*

| event_name | 触发 | properties |
|---|---|---|
| `auth.sign_up_completed` | Clerk `afterSignUpUrl` 回调页 | `{ method: 'email' \| 'google' \| 'github' \| 'other' }` |
| `auth.sign_in_completed` | Clerk `afterSignInUrl` 回调页 | `{ method, is_new_session: boolean }` |
| `auth.sign_out` | 登出按钮 | `{}` |

#### 2.2.4 dashboard.*

| event_name | 触发 | properties |
|---|---|---|
| `dashboard.viewed` | `/dashboard` mount | `{ resume_count: number }` |
| `dashboard.create_clicked` | "New resume" | `{ source: 'top_button' \| 'empty_state' }` |
| `dashboard.import_clicked` | "Import" | `{ source: 'top_button' \| 'empty_state' }` |

#### 2.2.5 resume.*

| event_name | 触发 | properties |
|---|---|---|
| `resume.created` | POST `/resumes` 成功 | `{ resume_id, template_id, source: 'blank' \| 'import' \| 'duplicate' }` |
| `resume.saved` | 主动 / 自动保存 | `{ resume_id, save_kind: 'manual' \| 'auto', sync_mode: 'local' \| 'cloud' }` |
| `resume.renamed` | rename 接口成功 | `{ resume_id }` |
| `resume.duplicated` | duplicate | `{ from_resume_id, to_resume_id }` |
| `resume.deleted` | delete | `{ resume_id }` |
| `resume.imported` | 导入完成 | `{ resume_id, format: 'pdf' \| 'json' \| 'docx', status: 'success' \| 'failed', duration_ms, error_code? }` |
| `resume.template_changed` | 切换模板 | `{ resume_id, old_template_id, new_template_id }` |
| `resume.exported` | PDF/JSON 导出完成 | `{ resume_id, format: 'pdf' \| 'json', status: 'success' \| 'failed', duration_ms, error_code? }` |
| `resume.share_link_created` | 生成分享链接 | `{ resume_id, role: 'viewer' \| 'commenter' \| 'editor', expiry_days?: number }` |
| `resume.share_link_copied` | 复制 | `{ resume_id }` |
| `resume.share_viewed` | 公开访问 `/s/[shareId]` | `{ share_id, role, is_owner: boolean }` |

#### 2.2.6 editor.*

| event_name | 触发 | properties |
|---|---|---|
| `editor.viewed` | `/dashboard/edit/[id]` | `{ resume_id, template_id, resume_name }` |
| `editor.section_added` | 添加 section | `{ resume_id, section_type }` |
| `editor.section_removed` | 删除 section | `{ resume_id, section_type }` |
| `editor.section_reordered` | 拖动排序 | `{ resume_id, section_type, from: number, to: number }` |

#### 2.2.7 ai.*

| event_name | 触发 | properties |
|---|---|---|
| `ai.tab_viewed` | AIModal 切 tab | `{ tab: 'create' \| 'optimize' \| 'analyze' \| 'interview' }` |
| `ai.optimization.started` | 点击优化 | `{ resume_id, has_jd: boolean, model?: string }` |
| `ai.optimization.applied` | 点击应用 | `{ resume_id, sections_optimized: number, duration_ms }` |
| `ai.optimization.failed` | 失败 | `{ resume_id, error_code, error_message /* 截断 200 字 */, duration_ms }` |
| `ai.analysis.started` | 点击分析 | `{ resume_id, model?: string }` |
| `ai.analysis.succeeded` | 成功 | `{ resume_id, overall_score: number, duration_ms }` |
| `ai.analysis.failed` | 失败 | `{ resume_id, error_code, error_message, duration_ms }` |
| `ai.interview.started` | 进入面试 | `{ resume_id, mode: 'voice' \| 'text' }` |
| `ai.interview.ended` | 结束 | `{ resume_id, duration_ms, turns: number, mode }` |
| `ai.create.started` | AI 创作开始 | `{ template_id?: string }` |
| `ai.create.completed` | 成功 | `{ template_id, resume_id, duration_ms }` |
| `ai.jd_uploaded` | JD 输入 | `{ length: number, source: 'paste' \| 'upload' }` |

#### 2.2.8 settings.*

| event_name | 触发 | properties |
|---|---|---|
| `settings.viewed` | `/dashboard/settings` | `{}` |
| `settings.saved` | 保存 | `{ section: 'llm' \| 'sync' \| 'account', model?: string }` |
| `settings.cloud_sync_toggled` | 开关 | `{ enabled: boolean }` |
| `settings.api_key_configured` | LLM key 填写 | `{ provider: 'openai' \| 'anthropic' \| 'google' \| 'compatible' }` |
| `settings.mcp_token_generated` | 生成 PAT | `{ token_id }` |

#### 2.2.9 error.* （自动）

| event_name | 触发 | properties |
|---|---|---|
| `error.js` | `window.addEventListener('error')` | `{ name, message, stack, filename, lineno, colno, fingerprint }` |
| `error.unhandled_rejection` | `unhandledrejection` | `{ name, message, stack?, fingerprint }` |
| `error.http` | axios 5xx / 网络错误 | `{ url, method, status?, code?, duration_ms, request_id?, fingerprint }` |
| `error.react` | React error boundary (`app/error.tsx`) | `{ name, message, stack, component_stack, fingerprint }` |

#### 2.2.10 perf.* （自动）

| event_name | 触发 | properties |
|---|---|---|
| `perf.web_vital` | `web-vitals` 各指标回调 | `{ metric: 'LCP' \| 'INP' \| 'CLS' \| 'FCP' \| 'TTFB', value, rating, nav_type?, attribution? }` |
| `perf.resource_slow` (v1.1) | resource entry > 1500ms | `{ url, initiator_type, duration, size? }` |
| `perf.long_task` (v1.1) | longtask > 50ms | `{ duration, start_time }` |

#### 2.2.11 admin.* （管理动作）

| event_name | 触发 | properties |
|---|---|---|
| `admin.viewed` | admin 路由切换 | `{ view: 'dashboard' \| 'stats.overview' \| 'stats.funnel' \| 'stats.exception' \| 'stats.perf' }` |
| `admin.error.resolved` | resolve 异常 group | `{ group_id }` |
| `admin.funnel.saved` | 漏斗 CRUD | `{ key, is_new: boolean }` |
| `admin.user.role_changed` | 用户角色变更 | `{ target_user_id, new_role }` |

### 2.3 命名 / 版本规则

- `domain.action[.qualifier]`，状态用 `.started/.completed/.failed`，禁大写、中划线、动宾倒装。
- 新增事件流程：在 `magic-analytics` 提 PR → 加 const + Zod schema + changeset → merge 触发自动发版。
- schema 包每次发版 bump minor；删事件需所有消费方升 SDK 后才能 major bump。
- Envelope 版本：`X-Magic-Envelope-Version: 1`；后端按版本分支解析。

---

## 3. 前端 SDK — `@magic/analytics-sdk`

> 在 `magic-analytics/packages/sdk`。

### 3.1 包结构

```
magic-analytics/packages/sdk/
  package.json                  // @magic/analytics-sdk
  tsup.config.ts                // ESM + CJS + d.ts
  src/
    index.ts                    // 单例 + 公共 API export
    core/
      Analytics.ts              // 主类
      Buffer.ts                 // 缓冲 + 节流刷盘
      Transport.ts              // sendBeacon / fetch keepalive / XHR
      Storage.ts                // localStorage offline queue
      Identity.ts               // anonymousId / sessionId
      Context.ts                // app/page/device/utm 抓取
      Sampling.ts               // category 概率丢弃
      Logger.ts                 // debug 日志（默认关）
    collectors/
      pageView.ts
      error.ts
      httpError.ts
      webVitals.ts
      click.ts                  // 默认 off
    adapters/
      vue.ts                    // createAnalyticsPlugin
      react.ts                  // useAnalytics hook
    utils/
      uuid.ts                   // crypto.randomUUID 优先
      fingerprint.ts
      pii.ts
      env.ts                    // SSR safe
  tests/                        // Vitest
```

依赖（生产）：`@magic/analytics-schema` (workspace) + `web-vitals` (^4)。目标 **≤ 8KB gzipped**，`size-limit` CI 卡。

### 3.2 公共 API

```ts
export const analytics = {
  init(options: InitOptions): void
  identify(userId: string, traits?: Record<string, unknown>): void
  reset(): void                                    // 登出清 user_id（保留 anonymous_id）
  track<E extends EventName>(name: E, properties: PropertiesOf<E>): void
  page(overrides?: Partial<PageContext>): void
  flush(): Promise<void>
  setContext(patch: Partial<Context>): void        // 比如 setContext({ resume_id })
  getSnapshot(): SDKSnapshot                       // 调试用
};

export { httpErrorInterceptor } from './collectors/httpError';
export { useAnalytics } from './adapters/react';
export { createAnalyticsPlugin } from './adapters/vue';
```

### 3.3 InitOptions（全字段）

```ts
interface InitOptions {
  endpoint: string;                                // '/api/v1/analytics/events:batch' 或绝对 URL
  appName: 'magic-resume-web' | 'magic-resume-admin';
  appVersion: string;
  appMode: 'cloud' | 'self-hosted';
  locale: string;
  release?: string;                                // git sha
  getAuthToken?: () => Promise<string | null>;     // Clerk JWT

  enabled?: boolean;                               // 默认 true；self-hosted 自动 false
  debug?: boolean;

  sampling?: {
    biz?: number; error?: number; perf?: number; system?: number;
  };
  buffer?: {
    maxEvents?: number;                            // 默认 10
    maxIntervalMs?: number;                        // 默认 5000
    maxPayloadBytes?: number;                      // 默认 60_000
  };
  storage?: {
    maxOfflineEvents?: number;                     // 默认 100
    maxOfflineBytes?: number;                      // 默认 1_000_000
    ttlMs?: number;                                // 默认 24h
    namespace?: string;
  };
  autoCollect?: {
    pageView?: boolean; error?: boolean; webVitals?: boolean; click?: boolean;
  };
  pii?: {
    redactQueryKeys?: string[];                    // 默认 ['token','apiKey','api_key','pat','code']
    redactPropertyKeys?: string[];                 // 默认 ['email','password','token','api_key','pat']
    redactor?: (input: string) => string;
  };
  beforeSend?: (e: Envelope) => Envelope | null;   // 返回 null 丢弃
}
```

### 3.4 Buffer & Transport

**触发 flush（任一）**：events ≥ `maxEvents` / 距上次 flush ≥ `maxIntervalMs` / 序列化字节 ≥ `maxPayloadBytes` / `category === 'error'` 立即 flush / `visibilitychange→hidden`、`pagehide`、`beforeunload`、显式 `flush()`。

**Transport 降级链**：
```ts
async function send(payload: string): Promise<boolean> {
  if (navigator.sendBeacon && payload.length < 60_000) {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon(endpoint, blob)) return true;
  }
  try {
    const res = await fetch(endpoint, { method:'POST', body: payload, keepalive: true, headers: await buildHeaders() });
    if (res.ok) return true;
  } catch {}
  if (isUnloading) {                                    // 最后兜底
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    try { xhr.send(payload); return true; } catch {}
  }
  return false;
}
```

**Request 头**：
```
Content-Type: application/json
X-Magic-App: magic-resume-web
X-Magic-SDK-Version: 1.0.0
X-Magic-Envelope-Version: 1
X-Magic-Release: <git-sha>
Authorization: Bearer <clerk-jwt>     // 登录态且 getAuthToken 有值时附带
```

### 3.5 自动收集器（字段映射）

#### pageView
```ts
emit('page_view', { duration_ms: now - lastPageEnterAt });
```

#### error
```ts
window.addEventListener('error', (e) => {
  emit('error.js', {
    name: e.error?.name ?? 'Error',
    message: e.message,
    stack: e.error?.stack,
    filename: e.filename, lineno: e.lineno, colno: e.colno,
    fingerprint: fingerprint(e.error?.name, e.message, e.error?.stack),
  });
});
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason;
  emit('error.unhandled_rejection', {
    name: r?.name ?? 'UnhandledRejection',
    message: r?.message ?? String(r),
    stack: r?.stack,
    fingerprint: fingerprint(r?.name, r?.message, r?.stack),
  });
});
```

#### httpError 工厂
```ts
export function httpErrorInterceptor(opts?: { include5xxOnly?: boolean }) {
  return (error: AxiosError) => {
    const status = error.response?.status;
    const isNetwork = !error.response;
    const should = isNetwork || (opts?.include5xxOnly ? (status ?? 0) >= 500 : (status ?? 0) >= 400);
    if (should) analytics.track('error.http', {
      url: piiUrl(error.config?.url ?? ''),
      method: (error.config?.method ?? 'GET').toUpperCase(),
      status, code: error.code,
      duration_ms: getRequestDuration(error.config),
      request_id: error.response?.headers['x-request-id'],
      fingerprint: fingerprint('http', `${error.config?.method} ${error.config?.url}`, String(status)),
    });
    return Promise.reject(error);
  };
}
```

#### webVitals
```ts
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals/attribution';
const emit = (metric, value, rating, navigationType, attribution) =>
  analytics.track('perf.web_vital', { metric, value, rating, nav_type: navigationType, attribution });
onLCP(({ value, rating, navigationType, attribution }) => emit('LCP', value, rating, navigationType, { element: attribution.element, url: attribution.url }));
// 同理 INP / CLS / FCP / TTFB
```

### 3.6 Identity

```ts
const ANON_KEY = 'magic.analytics.anon_id';
const SESSION_KEY = 'magic.analytics.session';
const USER_KEY = 'magic.analytics.user_id';
const SESSION_TTL_MS = 30 * 60 * 1000;

function getAnonymousId() {
  return localStorage.getItem(ANON_KEY) ?? (() => {
    const id = uuid(); localStorage.setItem(ANON_KEY, id); return id;
  })();
}
function getSessionId() {
  const now = Date.now();
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    const rec = JSON.parse(raw) as { id: string; lastSeenAt: number };
    if (now - rec.lastSeenAt < SESSION_TTL_MS) {
      rec.lastSeenAt = now;
      localStorage.setItem(SESSION_KEY, JSON.stringify(rec));
      return rec.id;
    }
  }
  const id = uuid();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastSeenAt: now }));
  pendingSessionStart = true;
  return id;
}
function reset() { localStorage.removeItem(USER_KEY); localStorage.removeItem(SESSION_KEY); }
```

**迁移**：init 时把老 keys (`magic_resume_anonymous_id`、`magic_resume_session_id`) 一次性搬到新 keys 并删除。

### 3.7 Context

```ts
function captureContext() {
  return {
    app: { name, version, mode, locale, release, sdk_version },
    page: {
      url: pii(location.href), path: location.pathname, title: document.title,
      referrer: document.referrer || undefined, is_initial: !hasFiredFirstPageView,
    },
    device: {
      ua: navigator.userAgent,
      screen: { w: screen.width, h: screen.height },
      viewport: { w: innerWidth, h: innerHeight },
      dpr: devicePixelRatio,
      language: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connection: nav.connection && { type: nav.connection.effectiveType, downlink: nav.connection.downlink, rtt: nav.connection.rtt },
    },
    context: { source, utm: captureUtmOnce(), ...sdkContextPatch },
  };
}
```

`setContext({ resume_id })` 在进入编辑器时调用，自动挂到后续事件。

### 3.8 Sampling

```ts
shouldKeep(category) { return Math.random() < (sampling[category] ?? 1.0); }
```
事件级也支持 `track(name, props, { sample: 0.1 })`。

### 3.9 PII 脱敏

```ts
const DEFAULT_QUERY_KEYS = ['token','apiKey','api_key','pat','code','state'];
const DEFAULT_PROP_KEYS  = ['email','password','token','api_key','pat','authorization'];

function piiUrl(url: string): string {
  const u = new URL(url, location.origin);
  for (const k of redactQueryKeys) if (u.searchParams.has(k)) u.searchParams.set(k, '[REDACTED]');
  return u.toString();
}
function piiProperties(props: Record<string, unknown>): Record<string, unknown> {
  const out = { ...props };
  for (const key of Object.keys(out)) if (redactPropertyKeys.includes(key.toLowerCase())) out[key] = '[REDACTED]';
  return out;
}
```

### 3.10 离线队列

```ts
function persistFailed(events: Envelope[]) {
  const existing = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]');
  const merged = [...existing, ...events]
    .filter(e => Date.now() - new Date(e.ts).getTime() < storage.ttlMs)
    .slice(-storage.maxOfflineEvents);
  if (JSON.stringify(merged).length > storage.maxOfflineBytes) merged.splice(0, merged.length / 2);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(merged));
}
function drainOfflineOnInit() {
  const queued = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]');
  if (!queued.length) return;
  buffer.push(...queued);
  localStorage.removeItem(OFFLINE_KEY);
  flush();
}
```

---

## 4. 后端 — `@magic/analytics-nest`

> 在 `magic-analytics/packages/nest-module`。Core 仓库 install 后 `AppModule.imports.push(AnalyticsModule.forRoot({...}))` 即接入。

### 4.1 包暴露

```ts
@Module({ ... })
export class AnalyticsModule {
  static forRoot(opts: AnalyticsModuleOptions): DynamicModule {
    return {
      module: AnalyticsModule,
      imports: [
        BullModule.registerQueue({ name: 'analytics-ingest' }),
        BullModule.registerQueue({ name: 'analytics-sourcemap' }),
        // ... cron / scheduler 注入
      ],
      controllers: [IngestController, QueryController, SourcemapController],
      providers: [
        IngestService, QueryService, FunnelService, ExceptionService, PerfService,
        IngestProcessor, ResolveProcessor,
        RollupHourlyJob, RollupDailyJob, RetentionCleanupJob, ErrorGroupStatusJob,
        { provide: ANALYTICS_OPTIONS, useValue: opts },
      ],
      exports: [QueryService],
    };
  }
}

interface AnalyticsModuleOptions {
  prefix?: string;                                  // 默认 '/api/v1/analytics'
  storage: 'local' | 's3';
  s3?: S3Options;
  rateLimit?: { windowSec: number; max: number };
  authGuard: Type<CanActivate>;                     // 由 Core 注入自己的 ClerkAuthGuard
  rolesGuard: Type<CanActivate>;
  redisName?: string;
  prismaName?: string;
}
```

### 4.2 Prisma 片段 — `@magic/analytics-prisma`

包内提供：
- `schema.prisma.fragment` 全部新表
- `migrations/` 文件夹
- `scripts/merge.ts`：把 fragment 合到 Core 的 `prisma/schema.prisma`（idempotent）

Core 的 prisma 流程：`prisma format && prisma migrate dev` 前先运行 `magic-analytics-prisma merge`。

完整表见 §4.3。

### 4.3 Prisma Schema（完整）

```prisma
model AnalyticsEventV2 {
  id            String   @id @default(cuid())
  eventId       String   @unique
  eventName     String   @db.VarChar(80)
  category      String   @db.VarChar(16)
  ts            DateTime
  receivedAt    DateTime @default(now())
  ingestLagMs   Int?

  anonymousId   String   @db.VarChar(64)
  sessionId     String   @db.VarChar(64)
  userId        String?  @db.VarChar(64)

  appName       String   @db.VarChar(40)
  appVersion    String   @db.VarChar(20)
  appMode       String   @db.VarChar(20)
  release       String?  @db.VarChar(40)
  sdkVersion    String?  @db.VarChar(20)
  locale        String   @db.VarChar(10)

  url           String   @db.VarChar(2048)
  path          String   @db.VarChar(500)
  pageTitle     String?  @db.VarChar(200)
  referrer      String?  @db.VarChar(2048)
  isInitial     Boolean

  device         String? @db.VarChar(40)
  os             String? @db.VarChar(40)
  osVersion      String? @db.VarChar(20)
  browser        String? @db.VarChar(40)
  browserVersion String? @db.VarChar(20)
  language       String? @db.VarChar(10)
  tz             String? @db.VarChar(40)
  screen         Json?
  viewport       Json?
  dpr            Float?
  connection     Json?

  source        String?  @db.VarChar(40)
  resumeId      String?  @db.VarChar(64)
  templateId    String?  @db.VarChar(64)
  utm           Json?
  properties    Json?

  ipHash        String?  @db.VarChar(64)
  country       String?  @db.VarChar(2)
  serverTs      DateTime @default(now())

  @@index([eventName, ts])
  @@index([anonymousId, ts])
  @@index([sessionId])
  @@index([userId, ts])
  @@index([resumeId])
  @@index([category, ts])
  @@index([appName, ts])
  @@index([release])
}

model AnalyticsError {
  id            String   @id @default(cuid())
  eventId       String   @unique
  groupId       String   @db.VarChar(64)
  name          String   @db.VarChar(80)
  message       String   @db.VarChar(500)
  stack         String?  @db.Text
  resolvedStack String?  @db.Text
  filename      String?  @db.VarChar(500)
  lineno        Int?
  colno         Int?
  componentStack String? @db.Text
  httpUrl       String?  @db.VarChar(2048)
  httpStatus    Int?
  httpMethod    String?  @db.VarChar(10)

  url           String   @db.VarChar(2048)
  release       String?  @db.VarChar(40)
  userId        String?  @db.VarChar(64)
  anonymousId   String   @db.VarChar(64)
  sessionId     String   @db.VarChar(64)
  ts            DateTime
  device        Json?

  @@index([groupId, ts])
  @@index([release, ts])
  @@index([userId])
}

model AnalyticsErrorGroup {
  id              String   @id @default(cuid())
  fingerprint     String   @unique @db.VarChar(64)
  type            String   @db.VarChar(16)
  title           String   @db.VarChar(200)
  release         String?  @db.VarChar(40)
  firstSeen       DateTime
  lastSeen        DateTime
  occurrences     Int      @default(1)
  affectedUsers   Int      @default(0)
  affectedAnon    Int      @default(0)
  status          String   @default("unresolved") @db.VarChar(20)
  resolvedAt      DateTime?
  resolvedByUser  String?  @db.VarChar(64)
  resolvedInRelease String? @db.VarChar(40)
  notes           String?  @db.Text

  @@index([status, lastSeen])
  @@index([release, status])
}

model AnalyticsPerf {
  id            String   @id @default(cuid())
  eventId       String   @unique
  metric        String   @db.VarChar(20)
  value         Float
  rating        String   @db.VarChar(10)
  navType       String?  @db.VarChar(20)
  attribution   Json?
  path          String   @db.VarChar(500)
  release       String?  @db.VarChar(40)
  device        String?  @db.VarChar(40)
  ts            DateTime
  userId        String?
  anonymousId   String   @db.VarChar(64)

  @@index([metric, ts])
  @@index([metric, path])
  @@index([release, metric])
}

model AnalyticsEventDaily {
  date         DateTime  @db.Date
  eventName    String    @db.VarChar(80)
  path         String    @db.VarChar(500)
  appName      String    @db.VarChar(40)
  count        Int
  uniqueAnon   Int
  uniqueUser   Int
  uniqueSession Int
  @@id([date, eventName, path, appName])
}

model AnalyticsPerfDaily {
  date    DateTime @db.Date
  metric  String   @db.VarChar(20)
  path    String   @db.VarChar(500)
  p50     Float
  p75     Float
  p95     Float
  samples Int
  @@id([date, metric, path])
}

model AnalyticsErrorGroupDaily {
  date         DateTime @db.Date
  groupId      String   @db.VarChar(64)
  occurrences  Int
  uniqueUsers  Int
  @@id([date, groupId])
}

model AnalyticsFunnel {
  id        String   @id @default(cuid())
  key       String   @unique @db.VarChar(40)
  name      String   @db.VarChar(120)
  description String? @db.VarChar(500)
  steps     Json     // [{ key, name, event_name, where?: { property, op, value } }, ...]
  windowSec Int      @default(86400)
  groupBy   String   @db.VarChar(20) @default("anonymousId")
  enabled   Boolean  @default(true)
  createdBy String   @db.VarChar(64)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SourcemapAsset {
  id         String   @id @default(cuid())
  release    String   @db.VarChar(40)
  filename   String   @db.VarChar(200)
  bundleUrl  String   @db.VarChar(500)
  storageUri String   @db.VarChar(500)
  bytes      Int
  uploadedAt DateTime @default(now())
  @@unique([release, filename])
  @@index([release])
}
```

### 4.4 摄入接口

```
POST {prefix}/events:batch
Authorization: Bearer <clerk-jwt>     (可选，登录态附带)
Content-Type: application/json
X-Magic-App / X-Magic-SDK-Version / X-Magic-Envelope-Version / X-Magic-Release

Body: { "events": [Envelope, ...] }   // 1 ≤ len ≤ 50；总 ≤ 256KB

Response 202: { "received": 10, "rejected": [ { "index": 3, "reason": "invalid event_name" } ] }
错误码：400 INVALID_PAYLOAD / 413 PAYLOAD_TOO_LARGE / 429 RATE_LIMITED
```

Controller 流程：
1. `@Public()`，但若带 Bearer 则解析；解析成功才信任 envelope.user_id（防伪造）。
2. ThrottlerGuard 按 `body.events[0].anonymous_id || req.ip` 限流（默认 60s/300req）。
3. 校验：`envelopeSchema.safeParse()` 每条；失败收集到 `rejected[]`。
4. 通过的 envelope `addBulk` 到 BullMQ `analytics-ingest`，立即 202。

### 4.5 BullMQ 队列

```ts
new Queue('analytics-ingest', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600, count: 5000 },
    removeOnFail: false,                            // 进 DLQ
  },
});
new Queue('analytics-ingest-dlq', { connection: redis });
```

**Worker (`IngestProcessor`)**：
```ts
@Processor('analytics-ingest')
class IngestProcessor extends WorkerHost {
  async process(job: Job<Envelope>) {
    const env = job.data;
    const ua = parseUA(env.device.ua);
    const ipHash = hashIp(job.opts.meta?.ip);

    await this.prisma.analyticsEventV2.create({ data: mapToV2(env, ua, ipHash) });

    if (env.category === 'error') {
      const group = await this.upsertErrorGroup(env);
      await this.prisma.analyticsError.create({ data: mapToError(env, group.id) });
      if (env.app.release) this.sourcemapQueue.add('resolve', { eventId: env.event_id });
    } else if (env.category === 'perf') {
      await this.prisma.analyticsPerf.create({ data: mapToPerf(env) });
    }
  }
}
```

去重：`AnalyticsEventV2.eventId @unique`；冲突静默跳过（idempotent）。

### 4.6 错误聚合

```ts
const fingerprint = env.properties.fingerprint;
const title = `${env.properties.name}: ${truncate(env.properties.message, 100)}`;
await prisma.analyticsErrorGroup.upsert({
  where: { fingerprint },
  create: {
    fingerprint, type: errorType(env.event_name), title,
    release: env.app.release, firstSeen: env.ts, lastSeen: env.ts,
    occurrences: 1,
    affectedUsers: env.user_id ? 1 : 0,
    affectedAnon: 1,
  },
  update: { lastSeen: env.ts, occurrences: { increment: 1 } },
});
// affectedUsers / affectedAnon 由 daily cron 重算
```

### 4.7 Sourcemap

**上传接口**
```
POST {prefix}/internal/sourcemaps/upload
Authorization: Bearer <pat-with-scope:sourcemap.upload>
Content-Type: multipart/form-data
- release: string
- filename: string                    (e.g. _next/static/chunks/main-abc123.js)
- bundleUrl: string                   (公开 URL)
- file: binary                        (.map)

Response: { id, release, filename, bytes }
```

调用方：`@magic/analytics-sourcemap` CLI（next postbuild 执行）。

**解析 worker**
```ts
@Processor('analytics-sourcemap')
class ResolveProcessor {
  cache = new LRU<string, SourceMapConsumer>({ max: 50 });

  async process(job: Job<{ eventId: string }>) {
    const err = await prisma.analyticsError.findUnique({ where: { eventId } });
    if (!err?.stack) return;
    const frames = parseStack(err.stack);                 // chrome v8 stack parser
    const resolved = [];
    for (const f of frames.slice(0, 8)) {
      const consumer = await this.loadMap(err.release, f.file);
      if (!consumer) { resolved.push(f); continue; }
      const orig = consumer.originalPositionFor({ line: f.line, column: f.column });
      resolved.push({ ...f, source: orig.source, line: orig.line, column: orig.column, name: orig.name });
    }
    await prisma.analyticsError.update({ where: { id: err.id }, data: { resolvedStack: formatStack(resolved) } });
  }
}
```

### 4.8 滚动聚合 cron

```ts
// jobs/rollup-hourly.job.ts
@Cron('5 * * * *')
async rollupHour() {
  await prisma.$executeRaw`
    INSERT INTO "AnalyticsEventDaily" (date, "eventName", path, "appName", count, "uniqueAnon", "uniqueUser", "uniqueSession")
    SELECT DATE(ts), "eventName", path, "appName",
           COUNT(*), COUNT(DISTINCT "anonymousId"), COUNT(DISTINCT "userId"), COUNT(DISTINCT "sessionId")
    FROM "AnalyticsEventV2"
    WHERE ts >= ${hourStart} AND ts < ${hourEnd}
    GROUP BY 1,2,3,4
    ON CONFLICT (date, "eventName", path, "appName") DO UPDATE SET
      count = EXCLUDED.count + "AnalyticsEventDaily".count, ...
  `;
  // 同理处理 AnalyticsPerfDaily / AnalyticsErrorGroupDaily
}

// jobs/retention-cleanup.job.ts
@Cron('0 3 * * 1')
async cleanup() {
  await prisma.analyticsEventV2.deleteMany({ where: { ts: { lt: subDays(now, 90) } } });
  await prisma.analyticsError.deleteMany({ where: { ts: { lt: subDays(now, 90) } } });
  await prisma.analyticsPerf.deleteMany({ where: { ts: { lt: subDays(now, 90) } } });
}
```

### 4.9 查询接口

全部 `@UseGuards(ClerkAuthGuard, RolesGuard)` + `@Roles('admin')`，Redis 缓存 (TTL 60-300s)。

#### 流量
```
GET {prefix}/traffic?range=7d&interval=day&tz=Asia/Shanghai
{
  "range":{...}, "interval":"day",
  "kpis":{ "pv":{"value":12500,"delta_pct":8.3}, "uv":..., "sessions":..., "avg_session_sec":..., "bounce_rate":... },
  "series":{ "pv":[{"ts":"...","value":1700},...], "uv":[...], "sessions":[...] },
  "breakdown":{ "device":[...], "os":[...], "browser":[...], "country":[...], "top_paths":[{"path":"/dashboard","pv":2100,"uv":1100}] }
}
```

#### 事件趋势
```
GET {prefix}/events?range=30d&interval=day&filter[event_name]=resume.created,resume.saved&group_by=event_name
{ "series":{ "resume.created":[{"ts":"...","count":12,"uniqueUser":8},...], ... }, "totals":{...} }
```

#### 漏斗
```
GET  {prefix}/funnels                  → [{ key,name,steps_count,enabled,... }]
GET  {prefix}/funnels/:key             → 完整定义
POST {prefix}/funnels                  → 新建
PATCH {prefix}/funnels/:key            → 编辑
DELETE {prefix}/funnels/:key
GET  {prefix}/funnels/:key/result?range=30d&group_by=anonymousId
{
  "funnel":{...}, "range":{...},
  "steps":[
    {"key":"signup","users":1200,"conv_from_prev":1.0,"conv_from_first":1.0,"avg_to_prev_sec":null},
    {"key":"first_resume","users":840,"conv_from_prev":0.70,"conv_from_first":0.70,"avg_to_prev_sec":1500},
    {"key":"first_save","users":520,"conv_from_prev":0.62,"conv_from_first":0.43,"avg_to_prev_sec":600}
  ],
  "totalEntered":1200,"totalCompleted":520,"overall_conv":0.43
}
```

#### 异常
```
GET {prefix}/errors/groups?status=unresolved&range=14d&release=2025.11.0&search=TypeError&page=1&page_size=20
{
  "total":38,
  "items":[
    { "id":"grp_...", "fingerprint":"ab12...", "type":"js",
      "title":"TypeError: Cannot read 'sections'",
      "firstSeen":"...","lastSeen":"...","occurrences":142,"affectedUsers":18,
      "status":"unresolved","release":"2025.11.0",
      "spark":[3,5,8,12,24,18,22] }
  ]
}

GET {prefix}/errors/groups/:id
{
  "group":{...},
  "timeseries":[{"date":"2026-06-10","count":12},...],
  "topPaths":[{"path":"/dashboard/edit/abc","count":80},...],
  "topReleases":[{"release":"2025.11.0","count":138},...],
  "samples":[ { "eventId":"...","ts":"...","userId":"...","url":"...","stack":"...","resolvedStack":"at handleSave (src/.../ResumeEdit.tsx:140:8)","device":{...} } ]
}

PATCH {prefix}/errors/groups/:id  body: { status:"resolved"|"ignored"|"unresolved", notes?, resolvedInRelease? }
```

#### 性能
```
GET {prefix}/perf?metric=LCP&range=7d&interval=day&path=/dashboard
{
  "kpis":{"p50":1850,"p75":2400,"p95":4100},
  "series":[{"ts":"...","p50":...,"p75":...,"p95":...,"samples":120},...],
  "by_path":[{"path":"/","p75":1900,"samples":800},...],
  "by_release":[{"release":"2025.11.0","p75":2400},...]
}
```

### 4.10 漏斗 SQL（参考）

```sql
WITH base AS (
  SELECT "anonymousId", "eventName", ts
  FROM "AnalyticsEventV2"
  WHERE ts BETWEEN $1 AND $2
    AND "eventName" IN ('auth.sign_up_completed','resume.created','resume.saved')
),
step1 AS (SELECT "anonymousId", MIN(ts) AS ts1 FROM base WHERE "eventName"='auth.sign_up_completed' GROUP BY 1),
step2 AS (
  SELECT s1."anonymousId", MIN(b.ts) AS ts2
  FROM step1 s1 JOIN base b
    ON b."anonymousId"=s1."anonymousId" AND b."eventName"='resume.created'
   AND b.ts BETWEEN s1.ts1 AND s1.ts1 + INTERVAL '86400 seconds'
  GROUP BY 1
),
step3 AS (
  SELECT s2."anonymousId", MIN(b.ts) AS ts3
  FROM step2 s2 JOIN base b
    ON b."anonymousId"=s2."anonymousId" AND b."eventName"='resume.saved'
   AND b.ts BETWEEN s2.ts2 AND s2.ts2 + INTERVAL '86400 seconds'
  GROUP BY 1
)
SELECT
  (SELECT COUNT(*) FROM step1) AS users_step1,
  (SELECT COUNT(*) FROM step2) AS users_step2,
  (SELECT COUNT(*) FROM step3) AS users_step3;
```

`FunnelService.buildSql(steps[], windowSec, groupBy)` 动态拼接。

### 4.11 限流 / 鉴权 / 缓存

| 维度 | 配置 |
|---|---|
| 摄入限流 | 60s/300req per anonymousId (fallback IP) |
| 查询限流 | 60s/120req per userId |
| 查询缓存 | Redis key `analytics:{endpoint}:{hash(params)}`，TTL 60-300s |
| 缓存失效 | funnel/exception status 变更 → 删 `analytics:funnels:*` / `analytics:errors:*` |
| 摄入鉴权 | `@Public()` |
| 查询鉴权 | ClerkAuthGuard + Roles('admin') |
| CORS | 白名单 `magic-resume.cn`、`localhost:3000`、`localhost:5173` |

---

## 5. 中台 — `@magic/analytics-admin`

> 在 `magic-analytics/packages/admin-vue`。Admin 仓库 install 后 `app.use(createAnalyticsAdmin(...))` 注册路由 + 视图组件。

### 5.1 包暴露

```ts
// 提供两种集成姿势
// 姿势 A: 整页路由（最少接入）
export function createAnalyticsAdmin(options): Plugin {
  return { install(app) {
    app.use(createAnalyticsPlugin({...}));           // SDK 自身埋点
    router.addRoute({
      path: '/stats',
      children: [
        { path: '',         component: OverviewView },
        { path: 'traffic',  component: TrafficView },
        { path: 'funnel',   component: FunnelView },
        { path: 'exception',component: ExceptionsView },
        { path: 'perf',     component: PerfView },
      ],
    });
  }};
}

// 姿势 B: 单独组件（需要嵌入自定义布局时）
export { OverviewView, TrafficView, FunnelView, ExceptionsView, PerfView };
export { ErrorRateKpi, LcpP75Kpi, ActiveErrorsKpi };   // Dashboard 卡片
export { useAnalyticsApi };                            // composable 拿数据
```

### 5.2 改造矩阵（Admin 仓本地改动）

| 文件 | 现状 | v1 改动 |
|---|---|---|
| `admin/src/main.ts` | — | `app.use(createAnalyticsAdmin({ endpoint, getAuthToken, role: 'admin' }))` |
| `admin/src/views/DashboardView.vue` | wired (旧 stats) | 顶部新增 `<ErrorRateKpi/>` `<LcpP75Kpi/>` `<ActiveErrorsKpi/>` |
| `admin/src/views/DataView.vue` | wired | 各 tab 改为 import `@magic/analytics-admin` 的视图组件 |
| `admin/src/components/stats/*.vue` | 部分 mocked | 全部删除（被包内组件替代） |
| `admin/src/router/index.ts` | — | 不用改（由 plugin 自动注入），或显式跳转 `/stats` |

### 5.3 Dashboard 新 KPI

```vue
<ErrorRateKpi range="24h" :threshold="0.01" />
<LcpP75Kpi range="7d" :good="2500" :poor="4000" />
<ActiveErrorsKpi range="24h" to="/stats/exception" />
```

数据：`useAnalyticsApi().fetchErrorGroups({ status:'unresolved', range:'24h' })`、`fetchPerf({ metric:'LCP', range:'7d' })`。

### 5.4 漏斗页 UX

**列表 + 编辑 modal + 可视化**
- 列表：`name, steps数量, 完成率, enabled, 操作（编辑/删除/复制）`
- 编辑 modal：name、key（auto slug）、description、windowSec、groupBy；步骤构建器从 `EVENT_TYPES`（schema 包）下拉选 event_name，每步加 `where` 条件。保存前可调 `POST /funnels/_preview` 看 7 天数据。
- 结果：ECharts funnel chart + 步骤表（人数 / 上一步转化率 / 累计转化率 / 平均跨步耗时）；切换时间范围 7d/30d/90d；切 groupBy。

### 5.5 异常页 UX

```
Filter: [Status] [Release] [Type] [Search]
┌──────────────┬─────────────────────────────────────────────────────┐
│  Group List  │  Detail Pane                                         │
│  • TypeError │   Title / Status / Resolve & Ignore                 │
│  • NetworkErr│   First seen / Last seen / Occurrences / Users       │
│              │   Timeseries (7d)                                    │
│              │   Top paths · Top releases                           │
│              │   Resolved Stack                                     │
│              │   Recent samples (10) ▶ device/user/url               │
└──────────────┴─────────────────────────────────────────────────────┘
```

- Resolve → `PATCH /errors/groups/:id { status:'resolved', resolvedInRelease, notes }`
- 自动 Reopen：cron 每天比对已 resolved 的 group 在更新 release 后又出现 → 改回 `unresolved` 加 `regression` tag。

### 5.6 性能页（新增）

Tabs: LCP / INP / CLS / FCP / TTFB
- KPI: p50 / p75 / p95
- 折线（按 release 上色）
- Top paths 表
- 与 Web Vitals 阈值对比：good/needs-improvement/poor 三色。

### 5.7 Admin 自身埋点

事件归 category=`system`（不污染业务漏斗）：`admin.viewed` / `admin.error.resolved` / `admin.funnel.saved` / `admin.user.role_changed`。SDK 通过 `createAnalyticsPlugin` 自动接入；路由切换由 `router.afterEach` 触发 `analytics.page()`。

---

## 6. OSS Web 接入（在 Magic-Resume 仓内）

### 6.1 改动文件

| 文件 | 改动 |
|---|---|
| `apps/web/package.json` | `optionalDependencies` 加 `@magic/analytics-sdk` / `@magic/analytics-schema` / `@magic/analytics-sourcemap` (devDep) |
| `apps/web/src/lib/analytics/index.ts` | **新建**：动态 import + noop fallback |
| `apps/web/src/lib/analytics/noop.ts` | **新建**：no-op 实现，与 `analytics` 同接口 |
| `apps/web/src/lib/analytics/core-events.ts` | **删除** |
| `apps/web/src/components/providers/PageViewTracker.tsx` | **删除** |
| `apps/web/src/components/providers/AnalyticsBootstrap.tsx` | **新建**：Client component，挂 Clerk getToken + `analytics.init` + identify/reset |
| `apps/web/src/app/layout.tsx` | 去 PageViewTracker，挂 AnalyticsBootstrap |
| `apps/web/src/hooks/useTrace.ts` | 内部改为 `analytics.track`，对外 API 不变 |
| `apps/web/src/lib/api/httpClient.ts` | 注册 `httpErrorInterceptor({ include5xxOnly: true })` |
| `apps/web/src/app/error.tsx` | useEffect 中 `analytics.track('error.react', {...})` |
| `apps/web/next.config.ts` | `productionBrowserSourceMaps: true` + postbuild 调 `@magic/analytics-sourcemap upload` |
| `apps/web/.env.example` | 新增 `NEXT_PUBLIC_BUILD_ID`（CI 注入），`SOURCEMAP_UPLOAD_PAT`（仅 build 时） |
| `apps/web/README.md` | 加一段：OSS fork 自动 noop；如何替换为自己的 endpoint |

### 6.2 动态接入示例

```ts
// apps/web/src/lib/analytics/index.ts
'use client';
import type { Analytics } from './types';
import { noopAnalytics } from './noop';

let analytics: Analytics = noopAnalytics;
let ready: Promise<void> = (async () => {
  try {
    const mod = await import('@magic/analytics-sdk');
    analytics = mod.analytics;
  } catch { /* fork 用户保持 noop */ }
})();

export { analytics, ready };
```

```ts
// apps/web/src/components/providers/AnalyticsBootstrap.tsx
'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { analytics, ready } from '@/lib/analytics';

export default function AnalyticsBootstrap() {
  const { getToken, userId } = useAuth();
  useEffect(() => {
    (async () => {
      await ready;
      analytics.init({
        endpoint: `${process.env.NEXT_PUBLIC_CLOUD_API_URL ?? ''}/api/v1/analytics/events:batch`,
        appName: 'magic-resume-web',
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0',
        appMode: process.env.NEXT_PUBLIC_APP_MODE === 'cloud' ? 'cloud' : 'self-hosted',
        release: process.env.NEXT_PUBLIC_BUILD_ID,
        locale: document.documentElement.lang || 'en',
        enabled: process.env.NEXT_PUBLIC_APP_MODE === 'cloud',
        getAuthToken: getToken,
        sampling: { perf: 0.2 },
      });
      if (userId) analytics.identify(userId);
    })();
  }, [userId]);
  return null;
}
```

### 6.3 CI 配置

- Magic 团队 CI：在 GH Actions secrets 加 `MAGIC_NPM_TOKEN`（GitHub Packages read scope），`.npmrc` 加 `@magic:registry=https://npm.pkg.github.com`。Web build 时自动装到真实 SDK。
- 外部贡献者 PR / Vercel preview：跳过私有 token → `optionalDependencies` 解析失败 → noop → build 通过、CI 绿。

---

## 7. 跨切关注点

### 7.1 隐私

| 类型 | 处理 |
|---|---|
| 邮箱 / 姓名 | 不进 properties；只在登录态以 user_id 关联 |
| API Key / Token | properties 中 token / api_key 自动 REDACT |
| URL query | `?token=xxx` 等关键参数 REDACT |
| IP | 后端落 `sha256(ip + daily_salt)` |
| GDPR 删除 | `DELETE /internal/analytics/user/:userId`，删 V2/Error/Perf 中 userId=X 行；anonymous_id 进 deny list |
| Cookie | SDK 不写 Cookie，全部 localStorage |
| CORS | 白名单 |

### 7.2 灰度

- SDK init 支持 `sampling.{biz,error,perf,system}`：首发 `error:1.0, perf:0.1, biz:1.0`。
- 服务端开关：Redis key `analytics:enabled = true/false`，controller 入口检查；紧急时一键关闸。

### 7.3 数据保留

- 明细 90 天（cleanup cron）。
- 聚合永久。
- Sourcemap 按 release 保留最近 20 个版本。

### 7.4 监控

- Bull Board 暴露 `/admin/queues`（admin role）。
- DLQ 入项 > 50 → 飞书 webhook 告警（配置走 env）。
- ingest p95 latency > 500ms 告警。

### 7.5 Self-hosted

- `appMode='self-hosted'` 时 SDK 自动 `enabled:false`，noop。
- 文档说明：自部署可 fork SDK 改 endpoint 接自己的分析服务。

---

## 8. 实施 Roadmap

按依赖：

| Step | 内容 | 估时 | 仓库 |
|---|---|---|---|
| 1 | 建 `magic-analytics` 仓 + pnpm/turbo/changesets 骨架 + GitHub Packages 发布流水线 | 0.5d | magic-analytics |
| 2 | `packages/schema` 全部事件 + 单测 + 发版 v0.1.0 | 1d | magic-analytics |
| 3 | `packages/prisma-fragment` + merge 脚本；Core 仓接入跑 migration | 1d | magic-analytics + Core |
| 4 | `packages/nest-module` 骨架 (ingest controller + service + BullMQ + worker) | 1.5d | magic-analytics |
| 5 | Core 仓 install nest-module，挂载到 AppModule，老 `/api/analytics/events` 改为兼容代理（双写 V2） | 0.5d | Core |
| 6 | 滚动聚合 / 清理 cron | 0.5d | magic-analytics |
| 7 | `packages/sdk` 核心 (Buffer/Transport/Identity/Context) + 单测 | 2d | magic-analytics |
| 8 | SDK 自动收集器 (pageView/error/httpError/webVitals) | 1d | magic-analytics |
| 9 | Vue / React adapter；Admin install SDK 接入 | 0.5d | magic-analytics + Admin |
| 10 | OSS Web 接入（optionalDep + bootstrap + useTrace 内部替换） | 1d | Magic-Resume |
| 11 | `packages/sourcemap-cli` + nest-module sourcemap upload/resolver + Web next postbuild | 1d | magic-analytics + Magic-Resume |
| 12 | 查询接口：traffic / events | 1d | magic-analytics |
| 13 | 查询接口：funnel CRUD + result | 1.5d | magic-analytics |
| 14 | 查询接口：errors groups + samples | 1d | magic-analytics |
| 15 | 查询接口：perf | 0.5d | magic-analytics |
| 16 | `packages/admin-vue` views：overview/traffic/funnel/exception/perf；Admin 仓接入 | 4d | magic-analytics + Admin |
| 17 | Dashboard 新 KPI 卡 | 0.5d | magic-analytics + Admin |
| 18 | 兼容期：双写 30 天观察 → 下线老 `/api/analytics/events` 与 `AnalyticsEvent` 旧表 | 30d 观察 | Core |

总开发工作量 ≈ **18 工日**（不含观察期）。

---

## 9. Verification

### 9.1 自动化

- `magic-analytics` CI：
  - `pnpm -r test`：schema Zod fixture / SDK buffer & transport & PII / nest-module e2e
  - `pnpm size`：SDK ≤ 8KB gzipped
  - `playground-api + playground-admin` e2e：模拟 1000 events 批量、漏斗 fixture 比对
- Core 仓 CI：装新 nest-module + 跑 prisma migration + e2e ingest
- Magic-Resume CI：装 optional `@magic/*` 后 lint + build；同时跑一份不装的 build 验证 noop 通路

### 9.2 手测

1. 本地 link 启动：`magic-analytics`（watch build）、Core (3111)、Admin (5173)、Web (3000)
2. Web 操作：浏览 / 操作 / 抛错 / 慢网 → DevTools Network 看到 `events:batch` 包 → psql 查 `AnalyticsEventV2`、`AnalyticsError`、`AnalyticsPerf`
3. Admin：Dashboard 新 KPI 数字、Stats Overview PV/UV、Funnel 新建 + 看结果、Exceptions 看错误（含 sourcemap 还原）、Perf 看 LCP 曲线
4. Resolve 异常 group → 列表刷新
5. 关闸：Redis `analytics:enabled=false` → SDK 进入离线队列；恢复后队列重放
6. OSS Web fork 模拟：把 `@magic/*` 从 lockfile 移除，build 应通过，运行时 analytics noop

### 9.3 性能 baseline

- ingest p95 < 100ms（队列直推）
- 查询 p95 < 300ms（聚合表）
- SDK 对页面加载增量 < 10ms（cold）
- Bundle ≤ 8KB gzipped

---

## 10. Critical Files

### `magic-analytics`（新私有仓）

- `pnpm-workspace.yaml`、`turbo.json`、`.changeset/`、`.github/workflows/publish.yml`
- `packages/schema/` 全部
- `packages/sdk/` 全部
- `packages/nest-module/` 全部
- `packages/admin-vue/` 全部
- `packages/sourcemap-cli/` 全部
- `packages/prisma-fragment/{schema.prisma.fragment, migrations/, scripts/merge.ts}`
- `apps/playground-api/`、`apps/playground-admin/`、`e2e/`

### `Magic-Core`（已有，私有）

- `prisma/schema.prisma` 加 `magic-analytics-prisma merge`（package.json scripts）
- `src/app.module.ts` 加 `AnalyticsModule.forRoot({...})`
- `src/modules/analytics/analytics.controller.ts` 老路由改为兼容代理，双写 V2 表（30d 兼容期）

### `Magic-Resume-Admin`（已有，私有）

- `src/main.ts` `app.use(createAnalyticsAdmin({...}))`
- `src/views/DashboardView.vue` 加 KPI 卡
- 删除 `src/components/stats/{FunnelView,ExceptionsView,TrafficView,ActivityLog}.vue`（被包内组件取代）；保留 access log 视图

### `Magic-Resume`（OSS public）

- 删 `apps/web/src/lib/analytics/core-events.ts`、`components/providers/PageViewTracker.tsx`
- 新增 `apps/web/src/lib/analytics/{index,noop,types}.ts`、`components/providers/AnalyticsBootstrap.tsx`
- 改 `apps/web/src/hooks/useTrace.ts`、`apps/web/src/lib/api/httpClient.ts`、`apps/web/src/app/error.tsx`、`apps/web/src/app/layout.tsx`
- 改 `apps/web/next.config.ts`（sourcemap + postbuild）
- 改 `apps/web/package.json`（optionalDependencies）、`apps/web/.env.example`
- 改 `README.md` / `README.zh-CN.md`（加 Analytics 段落 + 自部署说明）

---

## 11. Open Questions

1. **Sourcemap 存储**：Core 是否已接 S3/OSS？无则 v1 先落 `var/sourcemaps/` 本地盘。
2. **告警通道**：DLQ / ingest 告警走飞书 webhook / 邮件 / 仅日志？
3. **release id**：CI 注入 `NEXT_PUBLIC_BUILD_ID`，Vercel 是否能直接拿 `VERCEL_GIT_COMMIT_SHA`？
4. **OSS fork 用户的体验**：是否需要在 `apps/web/.env.example` 给一个示例的 `NEXT_PUBLIC_ANALYTICS_ENDPOINT` 让他们填自己的服务？v1 倾向不做（保持 noop 默认）。
5. **MCP 通道埋点**：`packages/mcp` 是否也接 SDK 发 `mcp.tool_invoked` 等？v1 留接口，不做。
6. **跨仓 PR 协调**：schema 加事件 → SDK / nest-module 同步发版 → Core/Admin/Web 各起 PR。是否要写一份 RUNBOOK 描述加事件全流程？建议做。
