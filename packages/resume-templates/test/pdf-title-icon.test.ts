import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPdfSectionIconName, resolvePdfSectionTitle } from '../src/pdf/context';

describe('pdf title and icon resolvers', () => {
  it('uses Chinese defaults by section key when locale is zh', () => {
    assert.equal(resolvePdfSectionTitle({ sectionKey: 'experience', fallbackTitle: 'Experience', locale: 'zh-CN' }), '工作经历');
  });

  it('keeps explicit non-Chinese titles unchanged', () => {
    assert.equal(resolvePdfSectionTitle({ sectionKey: 'experience', fallbackTitle: 'Experience', locale: 'en-US' }), 'Experience');
  });

  it('returns stable pdf icon names for known sections and custom fields', () => {
    assert.equal(getPdfSectionIconName('experience'), 'briefcase');
    assert.equal(getPdfSectionIconName('unknown'), null);
  });
});
