import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createMagicResumeHyphenationCallback,
  resolveMagicResumeFontSources,
  resumeContentContainsCJK,
} from '../src/pdf/fonts';

describe('pdf fonts', () => {
  it('detects CJK text anywhere in resume content', () => {
    assert.equal(resumeContentContainsCJK({ info: { fullName: 'Kai' }, sections: { summary: [{ summary: '负责产品交付' }] } }), true);
    assert.equal(resumeContentContainsCJK({ info: { fullName: 'Kai' }, sections: { summary: [{ summary: 'Product delivery' }] } }), false);
  });

  it('keeps Latin words intact while allowing CJK line breaks', () => {
    const callback = createMagicResumeHyphenationCallback(true);

    assert.deepEqual(callback('MagicResume'), ['MagicResume']);
    assert.deepEqual(callback('中文'), ['中', '', '文', '']);
  });

  it('resolves regular, bold, and italic aliases from one font base', () => {
    const sources = resolveMagicResumeFontSources('/fonts');

    assert.deepEqual(sources, [
      { src: '/fonts/SourceHanSansSC-Regular.otf', fontWeight: 400 },
      { src: '/fonts/SourceHanSansSC-Bold.otf', fontWeight: 700 },
      { src: '/fonts/SourceHanSansSC-Regular.otf', fontWeight: 400, fontStyle: 'italic' },
      { src: '/fonts/SourceHanSansSC-Bold.otf', fontWeight: 700, fontStyle: 'italic' },
    ]);
  });
});
