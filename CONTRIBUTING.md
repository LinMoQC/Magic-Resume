# Contributing to Magic Resume

Thanks for your interest in contributing! Contributions of every size are welcome — bug fixes, new templates, docs, translations, or features.

**English** · [简体中文](./CONTRIBUTING.zh-CN.md)

---

## Ways to contribute

- **Report a bug** or request a feature — open an [issue](https://github.com/LinMoQC/Magic-Resume/issues).
- **Fix a bug** or **build a feature** — open a Pull Request.
- **Add a template** — see [`packages/resume-templates`](./packages/resume-templates).
- **Improve translations** — see [Translations](#translations).
- **Improve the docs** — including this file and the READMEs.

For anything non-trivial, opening an issue first to discuss the approach saves everyone time.

---

## Prerequisites

- **Node.js** `>= 20`
- **pnpm** `>= 10.28.1` (this repo pins `pnpm@10.28.1` via `packageManager`)

## Local setup

Magic Resume runs fully in the browser — no backend or database needed for most work.

```bash
# 1. Fork, then clone your fork
git clone https://github.com/<you>/Magic-Resume.git
cd Magic-Resume

# 2. Configure self-hosted mode
cp apps/web/.env.example apps/web/.env.local   # set NEXT_PUBLIC_APP_MODE=self-hosted

# 3. Install and run
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). See the [README](./README.md#monorepo) for the monorepo layout.

---

## Development workflow

1. Create a branch off `master`:

   ```bash
   git checkout -b feat/your-thing   # or fix/…, docs/…, refactor/…
   ```

2. Make your change. Keep it focused — one concern per PR.

3. Before committing, make sure the checks pass:

   ```bash
   pnpm run lint
   pnpm run test
   ```

   > The `pre-commit` hook also runs `lint` + `build` automatically. Don't bypass it with `--no-verify`.

---

## Commit convention

This repo enforces **gitmoji + [Conventional Commits](https://www.conventionalcommits.org/)** through a `commitlint` hook (`commitlint-config-gitmoji`). Any message that doesn't match is **rejected**.

### Format

```
<emoji> <type>(<scope>?): <subject>
```

- **emoji** — a gitmoji shortcode (`:sparkles:`) or the unicode char (`✨`). Must be a valid code from [gitmoji.dev](https://gitmoji.dev).
- **type** — exactly one of: `build · ci · chore · docs · feat · fix · perf · refactor · revert · style · test · wip` (lowercase).
- **scope** — optional, lowercase workspace name: `web`, `mcp`, `resume-schema`, `resume-templates`, `docs`.
- **subject** — imperative ("add", not "added"), no trailing period, whole header ≤ 100 chars.

Body and footer are optional; if present, precede each with a blank line.

### Emoji → intent (most common)

| Intent | Emoji | Type |
|---|---|---|
| New feature | `:sparkles:` ✨ | `feat` |
| Bug fix | `:bug:` 🐛 | `fix` |
| Docs | `:memo:` 📝 | `docs` |
| Refactor | `:recycle:` ♻️ | `refactor` |
| Performance | `:zap:` ⚡️ | `perf` |
| UI / styling | `:lipstick:` 💄 | `style` |
| Code format / structure | `:art:` 🎨 | `style` |
| Tests | `:white_check_mark:` ✅ | `test` |
| Config / tooling | `:wrench:` 🔧 | `chore` |
| Bump deps | `:arrow_up:` ⬆️ | `chore` |
| Remove code / files | `:fire:` 🔥 | `chore`, `refactor` |
| i18n | `:globe_with_meridians:` 🌐 | `feat` |

Full list: [gitmoji.dev](https://gitmoji.dev).

### Examples

```bash
# ✅ pass
:sparkles: feat(web): add resume share link generator
:bug: fix(mcp): handle empty patch in update_resume_content
:memo: docs: rewrite contributing guide

# ❌ fail
feat: add dark mode                 # no emoji
:sparkles: Feat: add dark mode      # type must be lowercase
:sparkles: feat: add dark mode.     # trailing period
```

### Check a message before committing

```bash
echo ":sparkles: feat(web): add resume share link generator" | npx --no -- commitlint
```

Exit `0` means it's valid; a non-zero exit prints the rule that failed.

---

## Translations

The web app uses [i18next](https://www.i18next.com/). Translation files live under `apps/web/src/locales/`. After editing them, validate key parity:

```bash
pnpm --filter @magic-resume/web i18n:check
```

---

## Pull request process

1. Push your branch and open a [Pull Request](https://github.com/LinMoQC/Magic-Resume/pulls) against `master`.
2. Write a clear title (the commit convention is a good guide) and describe **what** changed and **why**.
3. Link any related issue (e.g. `Closes #123`).
4. Make sure CI, lint, and tests are green.

A maintainer will review as soon as they can. Thanks for helping make Magic Resume better! 🎉

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
