// Subsets the full CJK fonts in public/fonts/full/ down to the characters in
// charset.txt, emitting woff2 into public/fonts/.
//
// charset.txt = 8105 通用规范汉字 (via mozillazg/pinyin-data kMandarin_8105) +
// ASCII + CJK punctuation + common resume symbols. Regenerate with:
//
//   node scripts/subset-fonts.mjs        (needs Node >= 22)
//
// Sources (kept in public/fonts/full/, also back the runtime rare-glyph fallback):
//   - Source Han Sans/Serif SC .woff  (黑体 / 宋体; CID CFF)
//   - LXGW WenKai .woff (楷体; Regular=常规, Medium=当 700 加粗用,无独立 Bold)
// 楷体源本是 TrueType(glyf),已 CFF 化(见 scripts/ttf2otf-kaiti.py)——react-pdf
// 的 fontkit@2.0.4 glyf 子集路径对复杂字有 bug,CFF 走正常的 CFFSubset。
// The full fonts stay in public/fonts/full/. See pdf/browser.tsx.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(__dirname, '..');
const FULL_DIR = path.join(WEB, 'public/fonts/full');
const OUT_DIR = path.join(WEB, 'public/fonts');

const FILES = [
  { src: 'SourceHanSansSC-Regular.woff', out: 'SourceHanSansSC-Regular.woff2' },
  { src: 'SourceHanSansSC-Bold.woff', out: 'SourceHanSansSC-Bold.woff2' },
  { src: 'SourceHanSansSC-RegularOblique.woff', out: 'SourceHanSansSC-RegularOblique.woff2' },
  { src: 'SourceHanSansSC-BoldOblique.woff', out: 'SourceHanSansSC-BoldOblique.woff2' },
  { src: 'SourceHanSerifSC-Regular.woff', out: 'SourceHanSerifSC-Regular.woff2' },
  { src: 'SourceHanSerifSC-Bold.woff', out: 'SourceHanSerifSC-Bold.woff2' },
  { src: 'SourceHanSerifSC-RegularOblique.woff', out: 'SourceHanSerifSC-RegularOblique.woff2' },
  { src: 'SourceHanSerifSC-BoldOblique.woff', out: 'SourceHanSerifSC-BoldOblique.woff2' },
  { src: 'LXGWWenKai-Regular.woff', out: 'LXGWWenKai-Regular.woff2' },
  { src: 'LXGWWenKai-Medium.woff', out: 'LXGWWenKai-Medium.woff2' },
];

const charset = fs.readFileSync(path.join(__dirname, 'charset.txt'), 'utf8');
const mb = (n) => (n / 1024 / 1024).toFixed(2) + 'MB';

const REPO_ROOT = path.resolve(WEB, '../..');
const RUNTIME_CHARSET_MODULE = path.join(
  REPO_ROOT,
  'packages/resume-templates/src/pdf/cjk-subset-charset.ts',
);

// Emit the exact subset character set as a runtime module so pdf/browser.tsx can
// detect rare (unsubsetted) ideographs and load the full fonts on demand. Kept in
// lockstep with the fonts by regenerating here on every subset run.
const writeRuntimeCharsetModule = () => {
  const chars = [...new Set([...charset].filter((c) => !/\s/.test(c)))];
  const body = `// AUTO-GENERATED from apps/web/scripts/charset.txt by scripts/subset-fonts.mjs.
// Do not edit by hand. This is the exact character set the CJK subset fonts in
// apps/web/public/fonts/ were built from. Runtime rare-glyph detection in
// pdf/browser.tsx uses it to decide when to load the full fonts from
// apps/web/public/fonts/full/.
// Count: ${chars.length} characters.
/* eslint-disable */
export const CJK_SUBSET_CHARSET = ${JSON.stringify(chars.join(''))};

export const cjkSubsetCharset = new Set(CJK_SUBSET_CHARSET);
`;
  fs.writeFileSync(RUNTIME_CHARSET_MODULE, body);
  console.log('charset module ->', path.relative(REPO_ROOT, RUNTIME_CHARSET_MODULE), `(${chars.length} chars)`);
};

let srcTotal = 0;
let outTotal = 0;
for (const { src, out } of FILES) {
  const srcPath = path.join(FULL_DIR, src);
  if (!fs.existsSync(srcPath)) {
    console.warn('SKIP (missing):', src);
    continue;
  }
  const buf = fs.readFileSync(srcPath);
  const sub = await subsetFont(buf, charset, { targetFormat: 'woff2' });
  fs.writeFileSync(path.join(OUT_DIR, out), sub);
  srcTotal += buf.length;
  outTotal += sub.length;
  console.log(
    `${src.padEnd(34)} ${mb(buf.length).padStart(8)} -> ${out.padEnd(36)} ${mb(sub.length).padStart(8)}  (${((sub.length / buf.length) * 100).toFixed(1)}%)`,
  );
}
writeRuntimeCharsetModule();
console.log('-'.repeat(96));
console.log(`TOTAL ${mb(srcTotal)} -> ${mb(outTotal)}  (${((outTotal / srcTotal) * 100).toFixed(1)}%)   charset: ${[...charset].length} chars`);
