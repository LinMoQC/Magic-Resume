import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultResume,
  resumeJsonSchema,
  resumeSchema,
  sampleResume,
  templateIds,
  templateSchema,
} from '../dist/index.js';

describe('resume schema', () => {
  it('accepts every known template id', () => {
    for (const templateId of templateIds) {
      assert.equal(templateSchema.parse(templateId), templateId);
    }
  });

  it('rejects unknown template ids directly', () => {
    assert.throws(() => templateSchema.parse('unknown-template'));
  });

  it('falls back to classic for unknown resume template values', () => {
    const parsed = resumeSchema.parse({
      ...defaultResume,
      template: 'unknown-template',
    });

    assert.equal(parsed.template, 'classic');
  });

  it('exports valid default and sample resume objects', () => {
    assert.equal(resumeSchema.safeParse(defaultResume).success, true);
    assert.equal(resumeSchema.safeParse(sampleResume).success, true);
  });

  it('exports JSON schema with template enum', () => {
    assert.deepEqual(resumeJsonSchema.properties.template.enum, [...templateIds]);
  });
});
