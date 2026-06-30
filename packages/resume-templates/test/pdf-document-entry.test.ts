import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MagicResumePdfDocument } from '../src/pdf/document';

describe('pdf document entry', () => {
  it('exports the MagicResumePdfDocument from the stable document module', () => {
    assert.equal(typeof MagicResumePdfDocument, 'function');
  });
});
