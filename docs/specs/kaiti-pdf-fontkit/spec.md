---
title: 楷体 PDF 渲染专项 —— fontkit glyf subset bug 攻坚
type: spec
status: Resolved (2026-07-18,走 CFF 绕开 glyf bug)
owner: kaihuang
created: 2026-07-14
updated: 2026-07-18
summary: 让 PANEL_FONTS 的「楷体」在 react-pdf 预览/导出里渲染真楷体(霞鹜文楷)。根因是 fontkit@2.0.4 的 **glyf** subset bug。最终方案:不 patch fontkit,而是把霞鹜文楷从 TrueType(glyf)转成 **CFF-flavored** 字体,让它走 fontkit 另一条正常的 `CFFSubset` 路径(思源 CID CFF 一直 work 就是这条)。已在真实 react-pdf 浏览器嵌入路径验证复杂字(如「程」)正确渲染。
scope: [apps/web, packages/resume-templates]
repos: [Magic-Resume]
related: [../editor-preview-ux/spec.md]
---

# 楷体 PDF 渲染专项

> 背景:见 [[../editor-preview-ux/spec.md]] 的「可选字体全覆盖」。黑体/宋体子集化已交付;楷体因 fontkit 深层 bug 单列本专项。

## 0. 结论(2026-07-18 已解决)

**根因回顾**:fontkit 的 bug 只在 **glyf(TrueType)** 子集路径。CFF 字体走完全独立的 `CFFSubset`,一直正常(所以思源 CID CFF 能 work)。

**方案**:把霞鹜文楷 **glyf→CFF 化**(`fontTools` 逐字用 `T2CharStringPen` 把二次曲线重画成 CFF charstring,`FontBuilder.setupCFF` 打包成 OTF/woff),之后完全复用思源那套(subset-font/harfbuzz 子集 → woff2 → `Font.register`)。**无需 patch fontkit**,复杂字(4-contour 的「程」)也正确。

- 一次性转换脚本:`apps/web/scripts/ttf2otf-kaiti.py`(TTF→CFF woff,产物落 `public/fonts/full/LXGWWenKai-{Regular,Medium}.woff`,17.8MB/个)。
- 运行时 pipeline:`subset-fonts.mjs` 把上面两个 CFF woff 子集成 `public/fonts/LXGWWenKai-{Regular,Medium}.woff2`(~2.4MB/个)。
- 分类:`font-family.ts` 新增 `kaiti` category(在 serif 之前匹配 `/\bkaiti\b|楷/`),`browser.tsx` manifest 注册 `LXGW WenKai` 家族(Medium 当 700;斜体复用同文件避免 resolve throw);`globals.css` 加 `@font-face` 让 HTML 预览也用它。
- 验证:直接驱动 `pdfkit.browser.js`(内置 browser fontkit)渲染 → pdfium 读图,楷体笔锋 + 复杂字全部正确。

> 以下为攻坚过程的原始记录(patch fontkit 路线),保留备查 —— 最终未采用,CFF 路线更干净。

## 1. 目标
`PANEL_FONTS` 的「楷体 Kaiti」(`"Kaiti SC","KaiTi",serif`)在 react-pdf 的 canvas 预览与 PDF 导出里渲染**真楷体**(开源:霞鹜文楷 LXGW WenKai,SIL OFL)。字体源已在 `apps/web/public/fonts/full/LXGWWenKai-{Regular,Medium}.ttf`。

## 2. 根因(已彻底定位)

关键前提:**字体本身完全正常** —— 浏览器 FontFace API 能加载并渲染霞鹜文楷的所有格式(glyf/CFF/woff/woff2/ttf)。问题**全在 react-pdf 的字体嵌入链路**。

按发现顺序:

1. **fontWeight 缺失(测试假象,非真 bug)**:`@react-pdf/font` 的 `FontFamily.resolve` 在 `fontWeight` 不匹配时 `throw "Could not resolve font"` → 字体 fallback。`Font.register` 必须带 `fontWeight`。真实 app 的 `browser.tsx` registerFonts **已经带** fontWeight,所以线上无此问题;是调试脚本漏传导致的假象,浪费了很多轮。

2. **fontkit@2.0.4 的 glyf subset 丢 outline(核心 bug)**:pdfkit 嵌入字体时调 `font.createSubset()`。fontkit 的 TrueType subset `_addGlyph`(`dist/module.mjs` ~line 12179,`browser-module.mjs` ~line 12158)用 **loca offset 直接读 glyf 表原始字节**:
   ```js
   let buffer = stream.readBuffer(nextOffset - curOffset); // 读原始 glyf 字节
   // 只有 variation font 才 re-encode:
   } else if (glyf && this.font._variationProcessor)
       buffer = this.glyphEncoder.encodeSimple(glyph.path, ...);
   ```
   **woff2 的 glyf 表是 transformed(压缩变换)编码的**,loca offset 读到的是错乱字节 → subset 后 glyph outline 变空(实测 `subCmds=0`),浏览器 OTS 报 `glyf: Decreasing contour index` 拒绝。**CFF 字体走完全不同的 CFFSubset,所以思源(CID CFF)不受影响、能 work**。

3. **fontkit 无修复版**:`fontkit` 最新就是 2.0.4。

## 3. 可行的 patch(已验证渲染成功)

对 fontkit 的 **两个 ESM 入口**都要 patch(node 用 `dist/module.mjs`,浏览器/app 用 `dist/browser-module.mjs`;`main.cjs` 是 CJS 不走):

**patch A** — 让 simple glyph 总是从解析后的 path 重编码(绕开 transformed glyf):
```js
// _addGlyph 里:
} else if (glyf && (this.font._variationProcessor || glyf.numberOfContours >= 0))
    buffer = this.glyphEncoder.encodeSimple(glyph.path, glyf.instructions);
```

**patch B** — `encodeSimple` 是 fontkit 的 dead code(平时只 variation font 走),激活后暴露一串 bug,需一并修:
- `new EncodeStream(size + tail)` → `new EncodeStream(Buffer.alloc(size + tail))`(当前 restructure 的 EncodeStream 要 Buffer,不是 number)
- `Glyf.size()` 对复杂 glyph **低估** → buffer 越界。改成宽分配 + 按实际写入返回:
  ```js
  let stream = new EncodeStream(Buffer.alloc(size + 4096));
  Glyf.encode(stream, glyf);
  let len = stream.pos;
  let tail = (4 - len % 4) % 4;
  return stream.buffer.slice(0, len + tail);
  ```
- 去掉 quadratic「中点省略」优化(line ~12093-12100),它对某些字的 delta 编码算错。

**字体侧**:楷体用 **pyftsubset(fonttools)子集并 decompose 掉 composite glyph**(fontkit subset 对 composite 的 component gid 重映射也有 bug),输出 **woff2**;`Font.register` 带 `fontWeight`。

**验证结果**:patched fontkit + woff2 + fontWeight → 楷体在 pd.js **和** pdfium(Read 工具)都渲染出来了(截图存档)。

## 4. 剩余工作(未完成)

1. **encodeSimple 复杂字仍有边缘 bug**:4-contour 字(如「程」`0x7A0B`)仍 `Offset outside bounds` → 该字空。patch B 的 buffer 修法未完全覆盖;疑似 restructure `Glyf` struct 对可变长 point 数组的 size/encode 不一致。需继续深挖或换更 robust 的 glyf 编码。
2. **woff/ttf 路径**:react-pdf load woff/ttf(非 woff2)时不嵌入,原因未定位(woff2 反而 OK,反常)。若能修通,woff 的标准 glyf 表可让 `_addGlyph` 原始 loca 路径直接正确,**完全绕开 encodeSimple**,是更干净的路线,值得先查。
3. **patch 落 project**:用 `pnpm patch fontkit@2.0.4`,把 patch A/B 落到 `patches/`,同时覆盖 `module.mjs` 与 `browser-module.mjs`。
4. **字体 pipeline**:把 pyftsubset+decompose 加进 `apps/web/scripts/`(fonttools 依赖 python;或找纯 node 的 decompose),生成楷体 woff2 到 public/fonts/,恢复 `browser.tsx` manifest 的 kai + `font-family.ts` 的 kai 类。
5. **app 验证**:真实编辑器切楷体,浏览器预览确认。

## 5. 关键坑与教训
- **调试必须带 fontWeight**,否则 resolve 直接 throw,一切假象。
- **node 测(`renderToBuffer`/`pdfkit.js`)≠ 浏览器(`pdfkit.browser.js`/pd.js)**;字体最终要在浏览器验证。用独立 http server + pd.js CDN 页最快(绕开 Next middleware 对非路由路径的 404)。
- fontkit 的 ESM 入口是 `dist/module.mjs`(node)/`dist/browser-module.mjs`(browser),**不是** `main.cjs`。patch 错文件会白忙。
- 判断字体是否真渲染:`Read` 工具能直接看 PDF 首页(pdfium),但它对损坏 subset 也空白,需结合浏览器 FontFace + pd.js 交叉验证。

## 6. 当前状态(已解决)
- 楷体选项 → 真霞鹜文楷(CFF 化后子集嵌入),预览/导出一致。
- 源:`public/fonts/full/LXGWWenKai-{Regular,Medium}.woff`(CFF,兼作 rare-glyph fallback);子集:`public/fonts/LXGWWenKai-{Regular,Medium}.woff2`。原始 TTF 已移除(约定同思源:full/ 只留 woff 源)。
- 黑体/宋体子集化已交付(见 editor-preview-ux)。

## 7. 为什么没走 patch fontkit
第 2-4 节的 patch 路线能修 glyf 子集,但 `encodeSimple` 对复杂字仍有边缘 bug,且要维护对 fontkit 两个 ESM 入口的 patch,脆。CFF 路线把楷体变成和思源同构的字体,复用已验证的链路,零 patch、零额外运行时依赖,是更小更稳的改动。教训仍成立:字体最终要在**浏览器** pdfkit(`pdfkit.browser.js` + browser fontkit)验证,node renderToBuffer 不等价。
