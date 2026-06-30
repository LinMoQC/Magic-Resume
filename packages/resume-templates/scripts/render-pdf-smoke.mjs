import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { Mail } from 'lucide';
import { magicTemplateList } from '../src/config/magic-templates.ts';
import { MagicResumePdfDocument } from '../src/pdf/MagicResumePdfDocument.tsx';
import { PdfLucideIcon } from '../src/pdf/PdfLucideIcon.tsx';
import { magicPdfHyphenationCallback } from '../src/pdf/hyphenation.ts';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webFontsDir = resolve(packageDir, '../../apps/web/public/fonts');

Font.register({
  family: 'Source Han Sans SC',
  fonts: [
    { src: join(webFontsDir, 'SourceHanSansSC-Regular.otf'), fontWeight: 400 },
    { src: join(webFontsDir, 'SourceHanSansSC-RegularOblique.woff'), fontWeight: 400, fontStyle: 'italic' },
    { src: join(webFontsDir, 'SourceHanSansSC-Bold.otf'), fontWeight: 700 },
    { src: join(webFontsDir, 'SourceHanSansSC-BoldOblique.woff'), fontWeight: 700, fontStyle: 'italic' },
  ],
});
Font.register({
  family: 'Source Han Serif SC',
  fonts: [
    { src: join(webFontsDir, 'SourceHanSerifSC-Regular.woff'), fontWeight: 400 },
    { src: join(webFontsDir, 'SourceHanSerifSC-RegularOblique.woff'), fontWeight: 400, fontStyle: 'italic' },
    { src: join(webFontsDir, 'SourceHanSerifSC-Bold.woff'), fontWeight: 700 },
    { src: join(webFontsDir, 'SourceHanSerifSC-BoldOblique.woff'), fontWeight: 700, fontStyle: 'italic' },
  ],
});
Font.registerHyphenationCallback(magicPdfHyphenationCallback);

assert.deepEqual(magicPdfHyphenationCallback('中文'), ['中', '', '文', '']);
assert.deepEqual(magicPdfHyphenationCallback('Reactive'), ['Reactive']);

const iconElement = PdfLucideIcon({ icon: Mail, color: '#3b82f6', size: 12 });
for (const primitive of React.Children.toArray(iconElement.props.children)) {
  assert.equal(primitive.props.fill, 'none', 'Lucide PDF primitives must disable the default black fill');
  assert.equal(primitive.props.stroke, '#3b82f6', 'Lucide PDF primitives must receive the requested stroke color');
  assert.equal(primitive.props.strokeWidth, 2, 'Lucide PDF primitives must preserve the Lucide stroke width');
}

const repeatedSummary = [
  '<p>负责复杂产品的规划与交付，推动业务团队协同开发以及日常值周oncall处理；负责 40+ PO 与 4 个 PO 级需求迭代，如 “Inspection 平台接入”、“Approval Flow Photo适配”等核心项目。</p>',
  '<p>基于 React + TypeScript monorepo架构，完成 AI 解析、多模板渲染、PDF 导出等能力，并通过 pnpm patch 重写 @react-pdf/textkit 字体度量读取逻辑。</p>',
  '<p><em>斜体混排：React项目、Photo适配、monorepo架构与中文斜体。</em></p>',
  '<ul>',
  '<li><p><strong>智能表格与 Agent 落地：</strong><br>完成核心架构设计与交付。</p></li>',
  '<li><p><span style="color: #dc2626"><u>跨团队协作</u></span>并持续优化体验。</p></li>',
  '</ul>',
].join('');
const richTextCoverage = [
  '<h2 style="text-align: center">富文本能力验证</h2>',
  '<p><em><u>斜体下划线</u></em>、<strong><em>粗斜体</em></strong>、<s>删除线</s>、<a href="https://example.com">链接</a>与<code>inline code</code></p>',
  '<ol><li><p>编号列表一</p></li><li><p>编号列表二</p></li></ol>',
].join('');
const entries = Array.from({ length: 8 }, (_, index) => ({
  id: `experience-${index}`,
  visible: true,
  company: `示例科技有限公司 ${index + 1}`,
  position: '高级产品工程师',
  date: `20${18 + index} - 至今`,
  location: '上海',
  summary: repeatedSummary,
}));

const data = {
  id: 'pdf-smoke-test',
  name: '中文简历 PDF 测试',
  updatedAt: Date.now(),
  info: {
    fullName: '张三',
    headline: '高级产品工程师',
    email: 'zhangsan@example.com',
    phoneNumber: '138-0000-0000',
    address: '上海市浦东新区',
    website: 'example.com',
    avatar: '',
    customFields: [],
  },
  sections: {
    summary: [{ id: 'summary', visible: true, name: '简介', summary: richTextCoverage }],
    experience: entries,
    education: [{ id: 'education', visible: true, school: '示例大学', degree: '硕士', major: '计算机科学', date: '2015 - 2018', summary: '优秀毕业生' }],
    projects: [{ id: 'project', visible: true, name: '智能简历项目', role: '负责人', date: '2025', summary: repeatedSummary }],
    skills: [{ id: 'skill', visible: true, name: 'TypeScript / React', level: '精通', summary: '前端工程化' }],
    languages: [{ id: 'language', visible: true, language: '中文', level: '母语' }],
    certificates: [{ id: 'certificate', visible: true, certificate: '示例认证', date: '2025' }],
    profiles: [{ id: 'profile', visible: true, name: 'GitHub', username: 'zhangsan', url: 'https://github.com/zhangsan' }],
    awards: [],
  },
  sectionOrder: [
    { key: 'summary', label: '个人总结' },
    { key: 'experience', label: '工作经历' },
    { key: 'projects', label: '项目经历' },
    { key: 'education', label: '教育经历' },
    { key: 'skills', label: '专业技能' },
    { key: 'languages', label: '语言能力' },
    { key: 'certificates', label: '证书资质' },
    { key: 'profiles', label: '个人主页' },
  ],
  template: 'classic',
  themeColor: '#2563eb',
  typography: 'Source Han Sans SC',
};

const requestedOutputDir = process.env.PDF_SMOKE_OUTPUT_DIR;
const outputDir = requestedOutputDir
  ? resolve(requestedOutputDir)
  : await mkdtemp(join(tmpdir(), 'magic-resume-pdf-'));
await mkdir(outputDir, { recursive: true });

try {
  for (const template of magicTemplateList) {
    const document = React.createElement(MagicResumePdfDocument, {
      data: { ...data, template: template.id },
      template,
      locale: 'zh-CN',
    });
    const buffer = await renderToBuffer(document);
    const outputPath = join(outputDir, `${template.id}.pdf`);
    await writeFile(outputPath, buffer);
    const bytes = await readFile(outputPath);

    assert.equal(bytes.subarray(0, 4).toString(), '%PDF', `${template.id} did not render a PDF`);
    assert.ok(bytes.byteLength > 10_000, `${template.id} PDF was unexpectedly small`);

    const pdfSource = bytes.toString('latin1');
    assert.match(pdfSource, /\/Count 1\b/, `${template.id} should render as one free-form page`);

    const mediaBox = pdfSource.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
    assert.ok(mediaBox, `${template.id} PDF did not contain a page MediaBox`);
    assert.ok(Math.abs(Number(mediaBox[1]) - 595.28) < 0.1, `${template.id} did not keep the A4 page width`);
    assert.ok(Number(mediaBox[2]) > 841.89, `${template.id} did not grow beyond the A4 minimum height`);
  }

  console.log(`Rendered ${magicTemplateList.length} templates successfully.`);
} finally {
  if (!requestedOutputDir) await rm(outputDir, { recursive: true, force: true });
}
