# Magic-Resume 埋点文档 (Tracking Plan)

本文档详细描述了 Magic-Resume 项目中的关键埋点计划。

## 1. Landing Page (落地页)

| 事件名称              | 触发时机                                | 属性 (Properties)             | 文件位置                                                   |
| :-------------------- | :-------------------------------------- | :---------------------------- | :--------------------------------------------------------- |
| `page_view`           | 用户进入页面时自动触发                  | `$current_url`, `referrer`    | `src/app/layout.tsx` (已实现)                              |
| `clicked_get_started` | 用户点击 Hero 区域的 "Get Started" 按钮 | `location: 'hero_section'`    | `src/app/components/landing/HeroSection.tsx`               |
| `clicked_github_star` | 用户点击 GitHub Star 按钮               | `location: 'footer'` / `hero` | `src/app/components/landing/Footer.tsx`, `HeroSection.tsx` |

## 2. Dashboard (仪表盘)

| 事件名称                | 触发时机                | 属性 (Properties)          | 文件位置                     |
| :---------------------- | :---------------------- | :------------------------- | :--------------------------- |
| `dashboard_viewed`      | 用户进入 Dashboard 页面 | `resume_count`, `username` | `src/app/dashboard/page.tsx` |
| `clicked_create_resume` | 用户点击创建简历按钮    | `username`                 | `src/app/dashboard/page.tsx` |
| `resume_created`        | 简历创建成功            | `resume_id`, `username`    | `src/app/dashboard/page.tsx` |
| `clicked_import_resume` | 用户点击导入简历        | `username`                 | `src/app/dashboard/page.tsx` |

## 3. Editor (简历编辑器)

| 事件名称                | 触发时机                          | 属性 (Properties)                                         | 文件位置                                     |
| :---------------------- | :-------------------------------- | :-------------------------------------------------------- | :------------------------------------------- |
| `editor_viewed`         | 用户进入简历编辑页面              | `resume_id`, `template_id`, `resume_name`, `username`     | `src/app/dashboard/edit/[id]/ResumeEdit.tsx` |
| `resume_saved`          | 用户点击保存简历 (或自动保存成功) | `resume_id`, `resume_name`, `username`                    | `src/app/dashboard/edit/[id]/ResumeEdit.tsx` |
| `clicked_download_json` | 用户点击下载 JSON                 | `resume_id`, `resume_name`, `username`                    | `src/app/dashboard/edit/[id]/ResumeEdit.tsx` |
| `template_changed`      | 用户切换简历模板                  | `old_template`, `new_template`, `resume_name`, `username` | `src/app/dashboard/edit/[id]/ResumeEdit.tsx` |

## 4. Settings (设置)

| 事件名称          | 触发时机         | 属性 (Properties)   | 文件位置                              |
| :---------------- | :--------------- | :------------------ | :------------------------------------ |
| `settings_viewed` | 用户进入设置页面 | `username`          | `src/app/dashboard/settings/page.tsx` |
| `settings_saved`  | 用户保存设置     | `model`, `username` | `src/app/dashboard/settings/page.tsx` |

## 5. AI Lab (AI 实验室)

| 事件名称                  | 触发时机             | 属性 (Properties) | 文件位置                                                   |
| :------------------------ | :------------------- | :---------------- | :--------------------------------------------------------- |
| `ai_create_viewed`        | 用户切换到"创作" Tab | `username`        | `src/app/dashboard/edit/_components/AIModal.tsx`           |
| `ai_optimize_viewed`      | 用户切换到"优化" Tab | `username`        | `src/app/dashboard/edit/_components/AIModal.tsx`           |
| `ai_analyze_viewed`       | 用户切换到"分析" Tab | `username`        | `src/app/dashboard/edit/_components/AIModal.tsx`           |
| `ai_interview_viewed`     | 用户切换到"面试" Tab | `username`        | `src/app/dashboard/edit/_components/AIModal.tsx`           |
| `ai_optimization_started` | 用户点击"开始优化"   | `username`        | `src/app/dashboard/edit/_components/AiLab/OptimizeTab.tsx` |
| `ai_analysis_started`     | 用户点击"开始分析"   | `username`        | `src/app/dashboard/edit/_components/AiLab/AnalyzeTab.tsx`  |

## 实施注意事项

1.  **Hook 使用**: 在所有 Client Component 中使用 `const posthog = usePostHog()` 获取实例。
2.  **属性脱敏**: 确保不要发送用户的敏感信息（如具体的 API Key 内容，只发送是否已填写）。
3.  **自动捕获**: PostHog 默认会自动捕获点击和页面浏览，这里定义的 Manual Events 是为了更精准的业务分析。
4.  **用户信息**: 所有登录后的事件都需要带上 `username`。
