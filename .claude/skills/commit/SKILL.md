---
name: commit
description: Write a Magic Resume commit message that passes the gitmoji + conventional-type lint. Use whenever the user asks Claude to commit, draft a commit message, or open a PR in this repo.
---

# Commit (gitmoji + conventional)

This repo enforces a gitmoji + conventional-type commit format via Husky `commit-msg` → `commitlint` (`commitlint-config-gitmoji`). Any commit that does **not** match this format is rejected.

Use this skill every time you write a commit message in this repo. Do not skip the hook with `--no-verify`.

## Format

```
<emoji> <type>(<scope>?): <subject>
```

- **emoji** — a gitmoji **shortcode** (`:sparkles:`) or unicode character (`✨`). Either works. Pick one that matches the *intent* of the change.
- **type** — exactly one of: `build`, `ci`, `chore`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `wip`. Lowercase.
- **scope** — optional, lowercase, no whitespace. Use a workspace name when the change is scoped to one (`web`, `docs`, `mcp`, `resume-schema`, `resume-templates`).
- **subject** — imperative ("add", not "added" / "adds"). No trailing period. Whole header ≤ 100 chars.

Body and footer are optional. If present, both must be preceded by a blank line.

## Emoji → intent map

Pick the emoji from intent first, then choose the type that fits. The two should agree.

Only codes in the [official gitmoji list](https://gitmoji.dev) are accepted by the validator. The plugin rejects anything else — including common-looking ones like `:books:`. Pick from this list.

| Intent | Emoji | Common type |
|---|---|---|
| New feature | `:sparkles:` ✨ | `feat` |
| Bug fix | `:bug:` 🐛 | `fix` |
| Critical hotfix | `:ambulance:` 🚑️ | `fix` |
| Docs | `:memo:` 📝 | `docs` |
| Refactor | `:recycle:` ♻️ | `refactor` |
| Architectural change | `:building_construction:` 🏗️ | `refactor` |
| Perf | `:zap:` ⚡️ | `perf` |
| Format / code structure | `:art:` 🎨 | `style` |
| UI / styling | `:lipstick:` 💄 | `style` |
| Tests | `:white_check_mark:` ✅ | `test` |
| Add a failing test | `:test_tube:` 🧪 | `test` |
| CI | `:construction_worker:` 👷 / `:green_heart:` 💚 | `ci` |
| Dev scripts (husky, makefiles) | `:hammer:` 🔨 | `build`, `chore` |
| Config files | `:wrench:` 🔧 | `chore` |
| Add a dep | `:heavy_plus_sign:` ➕ | `chore` |
| Remove a dep | `:heavy_minus_sign:` ➖ | `chore` |
| Upgrade deps | `:arrow_up:` ⬆️ | `chore` |
| Downgrade deps | `:arrow_down:` ⬇️ | `chore` |
| Pin deps | `:pushpin:` 📌 | `chore` |
| Remove code / files | `:fire:` 🔥 | `chore`, `refactor` |
| Move / rename | `:truck:` 🚚 | `refactor` |
| Types | `:label:` 🏷️ | `feat`, `refactor` |
| i18n | `:globe_with_meridians:` 🌐 | `feat` |
| .gitignore | `:see_no_evil:` 🙈 | `chore` |
| Revert | `:rewind:` ⏪️ | `revert` |
| WIP | `:construction:` 🚧 | `wip` |
| Breaking change | `:boom:` 💥 | any |

## Examples (these pass)

```
:sparkles: feat(web): add resume share link generator
:bug: fix(mcp): handle empty patch in update_resume_content
:memo: docs: rewrite intro page with multi-repo architecture
:recycle: refactor(web): centralize API route paths in lib/api/routes.ts
:zap: perf(resume-templates): memoize template registry lookup
:white_check_mark: test(mcp): add cases for preview_resume_patch errors
:arrow_up: chore(deps): bump nextra to 4.3.0
```

## Examples (these fail)

```
feat: add dark mode                       # no emoji
✨ Add dark mode                          # no type
:sparkles: Feat: add dark mode            # type must be lowercase
:sparkles: feat: add dark mode.           # trailing period
sparkles feat add dark mode               # not a gitmoji
:sparkles: feat: this subject is way too long and pushes the whole header past one hundred characters which is the cap
```

## Workflow

1. Inspect the staged diff (`git diff --cached`) to understand intent.
2. Pick the **emoji** that matches the intent (single, leading position).
3. Pick the matching **type** (lowercase).
4. Add a **scope** when the change is workspace-local. Skip it for cross-workspace or repo-wide changes.
5. Write the **subject** in present-imperative voice, no period.
6. If extra context is genuinely useful, add a body (blank line, then prose).
7. Commit. The hook will run `commitlint --edit "$1"`.

If the hook rejects, read the printed rule names (e.g. `[start-with-gitmoji]`, `[type-empty]`) and rewrite. Do not pass `--no-verify`.

## Quick check before committing

Pipe a candidate message through commitlint without actually committing:

```bash
echo ":sparkles: feat(web): add resume share link generator" | npx --no -- commitlint
```

Exit 0 = good. Non-zero = the printed rule tells you what to fix.

## Out of scope for this skill

- Choosing what to stage (`git add` decisions) — that's a separate judgment.
- Branch names, PR titles, PR body formatting — not enforced by commitlint here.
- Merge commits and revert auto-messages — exempted by parser preset.
