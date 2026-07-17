# Cloud Sync v2 — 脏检查 / 冲突检测 / 增量同步 / 退出送达

- **状态**: Accepted（P0 触发层修复已先行落地：maxWait、卸载 flush、续链、错误恢复）
- **日期**: 2026-07-17
- **范围**: `apps/web`（客户端同步算法）+ `Magic-Resume-Core/apps/platform-api`（resumes PATCH 协议扩展）
- **兼容性红线**: 旧客户端（含 MCP 包、agent-service 的 resume client）继续全量 `content` PATCH 且不带 `baseRevision`，行为与现状完全一致（无条件写 + LWW）。所有新增字段均为可选。

## 1. 背景与现状

自动同步链路：编辑 → store 置 `modified` → 10s 防抖（45s maxWait）→ `syncToCloud` → 全量
`JSON.stringify(resume)` PATCH → 5min 冷却自动建版本。

服务端 `Resume` 已有 `revision Int`（每次写自增）与 `UpdateResumeDto.baseRevision`
条件写（`updateMany where {id, revision}`，命中 0 行 → `ResumeConflictError` 409），
**但 web 客户端从未携带 baseRevision，也从不记录 revision** —— 乐观锁形同虚设，
多端并发是静默 last-write-wins 互踩。

其余问题：
- 内容未变也全量 PATCH；习惯性 Ctrl+S 产生冗余版本快照（P1-1）。
- 手动保存后 `createVersion → fetchCloudResume` 用云端副本**整体覆盖** `activeResume`，
  往返窗口内的击键被回滚；历史页打开时同样调用 `fetchCloudResume`（P1-2）。
- 每会话首次自动同步时本地 `versions` 未加载，`lastVersionTime=0`，5min 冷却失效（P1-3）。
- 关标签页 / 跳转时 axios 请求不保送达（P2-3）。
- 全量 content 数十 KB，编辑一次实际增量 ~1KB（P2-1）。

## 2. 客户端同步基线（baseline）

`useResumeStore.ts` 模块级 `Map<resumeId, SyncBaseline>`：

```ts
type SyncBaseline = {
  revision?: number;   // 云端行版本（乐观锁基线）
  doc?: SyncDoc;       // 最后一次已知与云端一致的推送文档（{...resume} 去 versions）
};
```

**播种点**（凡是拿到权威云端行的地方）：
| 时机 | revision | doc |
|---|---|---|
| `loadResumes` 云端行胜出合并 | ✓ | ✓（云端内容） |
| `loadResumes` 本地行胜出 | ✓（仍记录，供冲突检测） | ✗（首推走全量） |
| `syncToCloud` 成功 | ✓（响应） | ✓（本次已发送的 doc） |
| `fetchCloudResume` | ✓ | ✓ |
| `updateSharing` 响应 | ✓（内容未变，doc 保留） | — |
| ID rebind（本地临时 id → CUID） | 键迁移 | 键迁移 |
| `deleteResume` | 删除条目 | 删除条目 |

内存态即可：跨会话由 `loadResumes` 重新播种；未播种时退化为现状（无条件全量推）。

## 3. 脏检查（P1-1）

比较键 = `JSON.stringify(getSanitizedResume(resume))` —— 白名单字段、构造顺序稳定、
**不含 updatedAt**（手动保存会 bump updatedAt，若含入则重复 Ctrl+S 永远"脏"）。

- `syncToCloud` 入口：比较键 === 基线 doc 的比较键 → 返回 `'noop'`（置 `saved`，不发请求）。
- `saveResume('manual')` 收到 `'noop'` → toast「云端已是最新」，**跳过建版本**。
- 推送文档本身仍含 updatedAt（其它设备的 `loadResumes` 靠它做新旧合并）。

误判方向安全性：键序不同/构造差异只会导致"假脏"（多同步一次），不会"假净"。

## 4. 冲突检测与恢复（P2-2，服务端已就绪）

- 每次 PATCH 携带 `baseRevision`（有基线时）。
- **409 恢复策略（备份远端 → 本机强推）**：
  1. `GET /resumes/:id` 取远端当前 content + revision；
  2. `POST /resumes/:id/versions`（changelog=`Conflict backup`）把**远端**内容存为历史版本
     （服务端该接口同时会把 resume.content 写回该内容并 revision++，无害）；
  3. 用 store 里**最新** activeResume 无条件全量 PATCH（不带 base，蓄意 LWW —— 远端已备份，
     本机是用户眼前的事实）；
  4. 播种新基线；刷新版本列表；toast 告知「已备份其它设备的修改为历史版本」。
- 不做三方 merge：单人多端产品形态下「眼前的编辑器赢 + 输家进历史版本」可解释、可恢复；
  真 merge 属协作范畴（见 §8 未来项）。
- 注意：服务端**任何** update 都会 revision++（含 isPublic/分享设置），所以分享开关后若不
  回写基线会产生一次良性 409；`updateSharing` 响应回写基线避免之。

## 5. 增量同步（P2-1，服务端扩展）

### 5.1 协议

`PATCH /resumes/:id` 请求体新增可选字段：

```jsonc
{
  "title": "...",
  "contentPatch": "[{\"op\":\"replace\",\"path\":\"/sections/…\",…}]", // RFC 6902，序列化字符串
  "baseRevision": 42
}
```

约束（服务端校验）：
- `contentPatch` **必须**伴随 `baseRevision`（对未知状态打补丁不可接受）→ 否则 400；
- `contentPatch` 与 `content` 互斥（同时出现 → 400）；
- 补丁应用失败（路径不存在 / 非法 op / 现存内容非 JSON）→ 400 `ValidationDomainException`，
  客户端回退条件全量；
- 乐观锁与现状一致：`updateMany where {id, revision: baseRevision}`，0 行 → 409。

正确性论证：条件写保证「补丁基 = 服务端现存内容」——读取(解密 content)与条件写之间若有
并发写落地，revision 不匹配 → 409，补丁不会写歪。加密在 patch 应用后照常 `encrypt()`。

### 5.2 客户端

- 基线 doc 存在且 revision 已知 → `fast-json-patch.compare(baselineDoc, currentDoc)` 生成 ops
  （web 端新增依赖 `fast-json-patch@^3`，与 MCP 包同款）；ops 为空且标题未变 → noop。
- 收到对 patch 请求的 400 → 一次性回退「条件全量」（仍带 baseRevision）；再 409 → §4 流程。
- 本地临时 id（首推 POST 创建）恒为全量。

带宽预期：典型编辑一次 20–50KB → ~1KB。

## 6. 版本相关修复（P1-2 / P1-3）

- 新增 store 方法 `refreshCloudVersions(id)`：`GET /resumes/:id/versions` → normalize →
  **只写** `resumes[i].versions` / `activeResume.versions`，不触内容字段。
  替换以下调用点的 `fetchCloudResume`：
  - `createVersion` 成功后（消除手动保存往返窗口的击键回滚）；
  - 历史页 / 历史弹窗打开时（同一族问题：打开历史 = 内容被云端覆盖）。
  `fetchCloudResume` 保留给真正需要拉全量云端副本的场景。
- 自动建版本冷却：模块级 `Map<resumeId, lastVersionAtMs>`，`createVersion` 成功即更新；
  冷却判定取 `max(本地 versions 最新时间, map)` —— 会话首次同步不再必建版本。

## 7. 退出送达（P2-3，尽力而为）

- `httpClient` 请求拦截器缓存最近一次 token（`getCachedAuthToken()`，同步读）。
- 新增 `resumeApi.syncResumeKeepalive(resume, token)`：原生 `fetch(…, { keepalive: true })`
  无条件全量 PATCH（不带 base：退出后无人处理 409，LWW 与现状语义一致；下次会话冲突照 §4 收敛）。
- `ResumeEdit`：`pagehide` → 若 `syncStatus ∈ {modified, error}` 且有缓存 token → keepalive 推送
  并 `debouncedSync.cancel()`（防 axios 重复）；`visibilitychange:hidden` 维持 axios `flush()`
  （切标签页页面仍活，axios 可靠且走完整算法）。
- 已知边界：keepalive 请求体上限 64KB，超限失败即放弃（catch 静默）；token 过期（>60s 无请求）
  则跳过。均退化为现状。

## 8. 不做 / 未来

- 三方内容 merge、CRDT；
- 服务端 sendBeacon 专用端点（免 Authorization header 方案）；
- 版本快照的增量存储。

## 9. 验收清单

- [ ] 旧客户端全量 PATCH 回归不变（服务端 spec 覆盖）；
- [ ] patch: 应用成功 / 无 base 400 / 与 content 互斥 400 / 非法补丁 400 / revision 不匹配 409（服务端 spec）；
- [ ] 双标签页同改一份简历：后写方 409 → 远端进历史版本 + 本机内容胜出 + toast；
- [ ] 重复 Ctrl+S：第二次「云端已是最新」，无新版本；
- [ ] 手动保存往返期间连续打字：击键不回滚；
- [ ] 打开历史弹窗不再覆盖正在编辑的内容；
- [ ] 会话首次自动同步不再必建版本；
- [ ] 编辑后 3s 内关标签页 → 重开后云端已是新内容（keepalive 生效，网络面板可见）。
