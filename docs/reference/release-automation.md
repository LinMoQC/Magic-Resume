# Release automation (semantic-release + gitmoji)

Releases are cut automatically from the gitmoji of commits merged to `master`.
No manual version bumping or changelog editing is required.

## How it works

On every push to `master`, `.github/workflows/release.yml` runs
[`semantic-release`](https://semantic-release.gitbook.io/) with the
[`semantic-release-gitmoji`](https://github.com/momocow/semantic-release-gitmoji)
plugin. It reads all commits since the last `vX.Y.Z` tag, derives the next
version from their gitmoji, and — if a release is warranted — produces:

- a git tag `vX.Y.Z`,
- a **GitHub Release** with generated notes grouped by gitmoji,
- an **auto-opened PR** (`:memo: docs(changelog): vX.Y.Z`) that updates `CHANGELOG.md`.

Because `master` is protected ("Changes must be made through a pull request"), the
workflow never pushes to it directly: the tag + Release are created through the
API, and the `CHANGELOG.md` update is landed as a normal PR you merge. That
changelog PR is `:memo: docs`, so merging it does **not** trigger another release.

Because it keys off **gitmoji**, our existing emoji-first commit convention
(`✨ feat(web): …`) works as-is — no change to how commits are written.

> **One-time setting:** the changelog PR is opened via `peter-evans/create-pull-request`
> with `GITHUB_TOKEN`, which requires **Settings → Actions → General → "Allow GitHub
> Actions to create and approve pull requests"** to be enabled.

## Version rules

Configured in `.releaserc.json` (`releaseRules`):

| Bump  | Gitmoji |
|-------|---------|
| major | 💥 `:boom:` |
| minor | ✨ `:sparkles:` |
| patch | 🐛 `:bug:` · 🚑 `:ambulance:` · 🔒 `:lock:` · ⚡ `:zap:` · 🎨 `:art:` · ♻️ `:recycle:` · 🔧 `:wrench:` · 💄 `:lipstick:` · 🌐 `:globe_with_meridians:` · ✏️ `:pencil2:` · 🥅 `:goal_net:` · ♿ `:wheelchair:` · 🚸 `:children_crossing:` · 💬 `:speech_balloon:` · 👽 `:alien:` · 🔥 `:fire:` · ⏪ `:rewind:` |

Anything else (📝 docs, 🔨 chore, 👷 ci, ✅ test, 🚧 wip, …) does **not** trigger a
release on its own — it only shows up in the notes when it ships alongside a
release-worthy commit. Adjust the lists in `.releaserc.json` to taste.

## Prerequisites / caveats

- **The toolchain is installed isolated** (in `$RUNNER_TEMP`) so it never touches
  the pnpm workspace or the frozen lockfile. It is intentionally **not** a
  `devDependency`.
- **`package.json` version is not auto-bumped** (the app is private and unpublished);
  the source of truth for the version is the git tag + GitHub Release. Add
  `@semantic-release/npm` (`npmPublish: false`) if you want `package.json` synced too.
- The workflow sets `HUSKY: 0` so the repo's local git hooks don't run in CI.
- **`CHANGELOG.md` lands via a PR, not a direct push** — see the note above. If you
  ever want it committed straight to `master` instead (no changelog PR), grant
  `github-actions[bot]` bypass on the branch ruleset and swap the
  `create-pull-request` step for the `@semantic-release/git` plugin.

## Verifying / dry-run

Locally, against the real history (`--dry-run` skips publishing; use `--no-ci` to
run off a feature branch):

```bash
npx -p semantic-release@24 -p semantic-release-gitmoji@1 \
  -p @semantic-release/github@11 semantic-release --dry-run --no-ci
```

It prints the next version and the notes it would publish, without changing anything.
