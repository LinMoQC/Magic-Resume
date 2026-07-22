# Build troubleshooting — clean-install failures

These failures surface in **clean environments** (GitHub `Build and Push Docker
Image`, Vercel deploys, fresh CI) but often **not locally** — a local `pnpm build`
reuses an existing `node_modules` and skips `pnpm install`, so install/lockfile
problems stay hidden. To reproduce, run a clean `docker build -f apps/web/Dockerfile .`
(or `rm -rf node_modules && pnpm install`).

Three issues hit together during the 2026-07-22 release (docs → Mintlify migration).

## 1. `"/apps/docs/package.json": not found` — docker build

The Mintlify migration turned `apps/docs` into README + content only (no
`package.json`), but `apps/web/Dockerfile` still `COPY`d it in the deps stage.

**Fix:** delete the `COPY apps/docs/package.json apps/docs/package.json` line —
`apps/docs` is no longer a pnpm workspace package.

## 2. `ERR_PNPM_UNSUPPORTED_ENGINE … Got: 6.35.1` — Vercel

Vercel does not activate corepack by default, so it ignored
`packageManager: pnpm@10.28.1` and fell back to corepack's pinned default pnpm
6.35.1 — which fails `engine-strict` (repo requires pnpm `>=10.28.1`). The Vercel
Node.js version was already 22; the version wasn't the problem, corepack was.

**Fix:** in `apps/web/vercel.json`, make the install command activate corepack:

```json
"installCommand": "cd ../.. && corepack enable && pnpm install"
```

(Alternative: set `ENABLE_EXPERIMENTAL_COREPACK=1` as a Vercel project env var.)

## 3. `ERR_PNPM_BROKEN_LOCKFILE … duplicated mapping key` — docker + Vercel

`pnpm-lock.yaml` had **duplicated mapping keys within the same section**: both the
`packages:` and `snapshots:` sections listed e.g. `harfbuzzjs@0.10.3` twice
back-to-back (lines 4815+4818 and 11775+11777). YAML rejects duplicate keys, so
every clean `pnpm install` died. Introduced by a bad lockfile edit / manual
merge-resolution during the docs migration.

**Fix:** regenerate the lockfile with the correct pnpm (`.npmrc` sets
`frozen-lockfile=true`, so `--no-frozen-lockfile` is required):

```bash
corepack enable                                     # activates pnpm@10.28.1 from packageManager
rm pnpm-lock.yaml
pnpm install --lockfile-only --no-frozen-lockfile
```

The regen was a ~31-line diff (only the duplicate entries removed) — **no
dependency version changes**.

**Detecting a real duplicate** (vs. the normal `packages:`/`snapshots:`
cross-section repeat, which is fine) — look for repeats *within one section*:

```bash
awk '/^packages:/{f=1;next} /^snapshots:/{f=0} f && /^  [^ ]/' pnpm-lock.yaml | sort | uniq -d
# should print nothing
```

## Takeaway

- Never hand-edit or manually merge-resolve `pnpm-lock.yaml`; regenerate it with
  `pnpm install` (pnpm 10.28.1 via corepack).
- A green **local** build does not prove installs work — it reuses `node_modules`.
  Validate a clean `docker build` before merging a release.
