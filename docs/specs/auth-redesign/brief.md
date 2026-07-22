---
title: 登录 / 注册页重构 —— 设计 brief
type: design-brief
status: Confirmed
owner: kaihuang
created: 2026-07-16
updated: 2026-07-16
status_note: 方向已于 2026-07-16 与作者确认,可进入实现。
summary: 现登录/注册直接渲染 Clerk 预构建组件(零定制)。本 brief 定方向:Linear 式社交优先、单列极简;用 Clerk headless hooks 完全自建;支持 Google / GitHub / 邮箱+密码 / 邮箱验证码;深浅双主题 + 中英双语。产出供 /impeccable craft 或实现使用。
scope: [apps/web]
repos: [Magic-Resume]
related: [.impeccable.md, specs/light-theme]
---

# 登录 / 注册页重构 —— 设计 brief

> 现状:`apps/web/src/app/sign-in/[[...sign-in]]/page.tsx` 与 `sign-up/[[...sign-up]]/page.tsx` 仅居中渲染 Clerk 的 `<SignIn/>` / `<SignUp/>`,无任何定制——即用户所说「完全是 clerk 的」。本文只定 UX/UI 方向,不含代码。

## 1. Feature Summary

Magic Resume 云端模式的登录/注册页。用户是准备打磨简历、投递岗位的求职者(中文市场为主),到达此页时目标单一:**尽快进入工作台**。要把当前的 Clerk 默认 UI 换成与产品同语言的、锐利极简的原生认证界面——社交优先、单列居中、深浅双主题、中英双语。

## 2. Primary User Action

**一步进入。** 首屏最突出的是「用最省事的方式登录」——主社交按钮(Google,若能识别上次用的方式则高亮它)。邮箱是次级、按需展开的路径。注册与登录之间一键互切,不让用户在两页间迷路。

## 3. Design Direction

沿用 `.impeccable.md`:深色工作台 `#0A0A0A` 默认、sky `#38bdf8` 作**唯一强调色**(仅主 CTA + focus,占比 ≤10%)、少 border / 减少割裂、动效轻快贴元素(仅 transform/opacity,不弹跳)、「实验室」隐喻(FlaskConical 标记)。

品牌人格「锐利、协作、有主见的搭档」在此表现为:**克制而自信**——不堆卡片、不多色社交按钮、文案短、动词开头、不解释显而易见的东西。

**关键配色决策(区别于 RxResume 的多品牌色)**:社交按钮**不各染品牌色**(不做 Google 蓝 / GitHub 黑 / LinkedIn 蓝的彩虹排列)。除主按钮外一律中性深色表面 + 单色 provider 字形;sky 只留给「主操作 + focus 环」。这既贴 Linear 参考的单强调色,又守住「10% 强调、稀有才有力」。

浅色主题遵循 `specs/light-theme`:暖纸桌 + 冷 sky 墨,hairline 边界 + 落地暖阴影(而非深色的发光造层次)。

## 4. Layout Strategy

- **单列居中**,窄栏(约 360–400px 内容宽),纵向大留白、有节奏(logo→标题间距 < 标题→按钮组间距)。auth 场景居中是正确惯例(两参考图皆居中),不套用「不要什么都居中」的通则;避免呆板靠内部细节的非对称权重(如 logo 光学微调、按钮组左对齐的辅助文字)。
- **垂直堆叠、无 or 分隔线**(Linear 式比 RxResume 的「or continue with」更干净):主按钮置顶 → 次级社交 → 「继续用邮箱」。
- 邮箱路径**渐进披露**:点「继续用邮箱」后,按钮组就地形变为邮箱输入(用 `grid-template-rows` 过渡高度,transform/opacity 入场),而非跳转新页 / 弹窗(呼应原则④「就地而非另开」)。
- 输入框**少 border**:靠表面色差 + 细 hairline + focus 时 sky 环表达状态,不用重描边盒子。
- 底部单行切换:登录页「还没有账号? 注册」/ 注册页「已有账号? 登录」。

## 5. Key States

**登录(sign-in):**
- `default`:社交优先按钮组(主 Google / 次 GitHub / 继续用邮箱)+ 切注册链接。
- `email-entered`:邮箱输入 + 继续。
- `password`:密码输入 + 登录;含「忘记密码?」与「改用验证码登录」次级链接。
- `email-code`:6 位验证码输入(无密码路径)+ 重发倒计时。
- `forgot-password`:邮箱 → 重置码 → 新密码,三步就地推进。
- `loading`:按钮级 spinner(点谁转谁)+ 提交态禁用其余。
- `error`:人话、可行动的错误(见 §7),就地显示在相关字段/按钮下,不用红条 banner。
- `oauth-redirecting`:点社交后到跳转前的短暂 pending 态(避免「点了没反应」)。

**注册(sign-up):**
- `default`:同社交优先入口。
- `email-entered` → `password-create`:邮箱 + 设密码(密码强度轻提示)。
- `verify-otp`:Clerk 强制邮箱验证——6 位码 + 重发。
- `error`:邮箱已注册 / 密码太弱 / 验证码错误。
- `success`:验证通过 → 直接进 `/dashboard`(不停留成功页)。

**共享:** 深/浅主题、中/英文案、`prefers-reduced-motion`(渐进披露降级为即时切换)、窄屏(移动端天然单列,免额外断点)。

## 6. Interaction Model

- **首屏**:入场轻 stagger(logo → 标题 → 按钮组,60–80ms 递进,ease-out,仅 opacity/translateY 少量)。
- **主方式高亮**:若本地存过「上次登录方式」,把它提为主按钮并加一行灰字提示(如「上次用的是 Google」),呼应参考图的 last-used。可选增强。
- **社交**:点击 → pending → `authenticateWithRedirect`。回跳由 Clerk SSO callback 处理。
- **邮箱渐进**:点「继续用邮箱」→ 区域形变出邮箱框(不跳页)→ 继续后按 password / code 分支。password 态提供「改用验证码登录」互切。
- **反馈**:所有提交按钮有 idle/loading/disabled 三态;错误就地、聚焦回相关输入。
- **互切**:登录 ↔ 注册用同一视觉外壳,切换用横向 fade/slide 让人知道「同一处、换了模式」,不整页刷新感。

## 7. Content Requirements

全部走 i18n(zh 默认 / en),动词开头、简短。占位与真实文案(建议初稿):

- 标题:`登录 Magic Resume` / `注册 Magic Resume`(en: `Log in to Magic Resume` / `Create your account`)。
- 主按钮:`用 Google 继续`;次:`用 GitHub 继续`、`用邮箱继续`。
- 字段:`邮箱`、`密码`;链接:`忘记密码?`、`改用验证码登录`、`用密码登录`。
- 切换:`还没有账号? 注册` / `已有账号? 登录`。
- 验证码:`我们向 {email} 发了验证码`、`重新发送(60s)`。
- 错误(人话,不透传 Clerk code):
  - 密码错:`邮箱或密码不对,再试一次`。
  - 邮箱未注册(登录):`没找到这个邮箱,去注册?`。
  - 邮箱已注册(注册):`这个邮箱已注册,去登录?`。
  - 验证码错/过期:`验证码不对或已过期,重发一个`。
  - OAuth 失败:`第三方登录没成功,换种方式试试`。
  - 限流:`尝试太频繁,稍后再试`。
- 微文案克制:标题下**至多一行**价值主张或直接省略(品牌:不复述、不填表感)。

## 8. Recommended References(craft 阶段查阅)

- `interaction-design.md` —— 表单、focus、loading、渐进披露(本页最重)。
- `motion-design.md` —— 入场 stagger、`grid-template-rows` 高度过渡、reduced-motion。
- `color-and-contrast.md` —— 深/浅两套 auth 表面、provider 按钮的中性化处理、sky 强调的 AA。
- `typography.md` —— wordmark/标题的 display 选型与 webfont 加载(见 §9 待定)。

## 9. Open Questions(实现时定)

1. **两条邮箱路径如何并存**:建议 sign-in 默认密码 + 「改用验证码登录」次级切换;sign-up 走 邮箱+密码 → 强制 OTP 验证。待确认此模型。
2. **上次登录方式提示**:是否做(需本地存最近成功方式)。纯增强,可 v2。
3. **字体**:标题/wordmark 是否引入一支 display 面(候选:Clash Display / General Sans,Fontshare,均不在 impeccable 禁用列表),还是复用 App 现有 UI 字体?需对齐 App 现有 type,避免只在 auth 页突兀。
4. **忘记密码深度**:是否本 brief 内一并做完整重置流,还是先跳 Clerk 托管页。
5. **Passkey**:本次未选,确认暂不做(Linear 参考里有,后续可补)。
6. **Logo 资产**:是否已有 FlaskConical 主标记 / wordmark 可直接用。
7. **Clerk 后台**:确认 Google / GitHub / password / email_code 四种策略均已在 instance 启用(否则对应按钮要隐藏)。

## 10. Implementation Notes(2026-07-16 已实现)

已按本 brief 用 Clerk headless hooks 完全自建,落在 `apps/web/src/components/auth/`:
- `AuthShell`(居中壳 + 入场 stagger + 主题切换 + 深色 sky 辉光)、`AuthPrimitives`(按钮/输入/OTP/文字链,全走语义 token,深浅双主题)、`SocialButtons`(Google/GitHub 中性化 + last-used 高亮)、`SignInCard` / `SignUpCard`(完整状态机)、`authErrors`(Clerk code → 人话 i18n)、`lastMethod`(本地记忆)、`providerIcons`(单色字形)。
- 路由:`sign-in` / `sign-up` 页改为渲染卡片(保留 `isCloudMode` 重定向);新增 `sso-callback`(OAuth 回跳,`AuthenticateWithRedirectCallback`)。
- i18n:新增 `auth.*`(zh/en);文案人话、动词开头。

开放问题落定:①§9.1 采用 sign-in 密码为主 +「改用验证码登录」、sign-up 密码 → 强制 OTP。②§9.2 last-used 已做(localStorage)。③§9.3 复用现有品牌字体 **Sora**(`--font-brand`),不引新 webfont。④§9.4 忘记密码完整流已内建(邮箱 → 重置码 + 新密码)。⑤§9.5 Passkey 暂不做。⑦§9.7 四种策略需在 Clerk 后台启用——**未启用的 provider 按钮会在点击时报错**(当前不做启用探测,后续可加)。

验证:`apps/web` typecheck / eslint / i18n(仅剩一处与本次无关的既有 `PdfCanvasPreview` 硬编码告警)全过;Playwright 实测 sign-in 深色/邮箱步/浅色 + sign-up 均 0 console error,视觉符合 brief。
