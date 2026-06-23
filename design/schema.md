# Magic Resume Schema

`packages/resume-schema` is the shared source of truth for structured resume content across the web app, template package, MCP package, and tests.

## Exports

- `resumeSchema`: Zod schema for full resume content.
- `templateSchema`: Zod enum of valid template IDs.
- `templateIds`: ordered template ID list.
- `defaultResume`: minimal valid resume object.
- `sampleResume`: preview/test resume with representative sections.
- `resumeJsonSchema`: JSON schema object.
- `dist/schema.json`: generated JSON schema artifact.

## Template IDs

Current IDs:

- `classic`
- `azurill`
- `bronzor`
- `chikorita`
- `ditto`
- `gengar`
- `orange-modern`
- `clean-minimal`
- `teal-professional`
- `red-accent`
- `golden-elegant`
- `product-ops-focus`

`resumeSchema.template` falls back to `classic` for unknown values to keep older Core content compatible. Direct `templateSchema` parsing still rejects unknown IDs.

## Content Compatibility

The schema intentionally preserves the existing Core `content` JSON shape:

- Contact data lives under `info`.
- Resume sections live under `sections`.
- Section display order lives under `sectionOrder`.
- Section items require `id` and `visible`, and allow unknown extra fields for template-specific content.
- Rich summary fields remain HTML strings.

No database migration is required for this schema package change.

## Generate JSON Schema

```bash
pnpm --filter @magic-resume/resume-schema build
```

The build emits:

```text
packages/resume-schema/dist/schema.json
```

Run tests:

```bash
pnpm --filter @magic-resume/resume-schema test
```
