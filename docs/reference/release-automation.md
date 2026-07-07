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
- a GitHub Release with generated notes (grouped by gitmoji),
- an updated `CHANGELOG.md`, committed back as
  `:bookmark: chore(release): X.Y.Z [skip ci]`.

Because it keys off **gitmoji**, our existing emoji-first commit convention
(`✨ feat(web): …`) works as-is — no change to how commits are written.

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
- **Branch protection on `master`**: `@semantic-release/git` pushes the changelog
  commit + tag directly to `master`. If `master` requires PRs / status checks,
  the push is rejected. Fixes, pick one:
  - allow the `github-actions[bot]` (or a dedicated bot) to bypass protection, **or**
  - use a Personal Access Token / GitHub App token with bypass rights as
    `GITHUB_TOKEN` in the workflow, **or**
  - drop the `@semantic-release/git` plugin — you still get the tag + GitHub
    Release (via `@semantic-release/github`), just no in-repo `CHANGELOG.md` update.
- **`package.json` version is not auto-bumped** (the app is private and unpublished);
  the source of truth for the version is the git tag + GitHub Release. Add
  `@semantic-release/npm` (`npmPublish: false`) if you want `package.json` synced too.
- The workflow sets `HUSKY: 0` so the repo's local git hooks don't run in CI.

## Verifying / dry-run

Locally, against the real history (needs a `GITHUB_TOKEN` env for the github plugin,
or run with `--dry-run` which skips publishing):

```bash
npx -p semantic-release@24 -p semantic-release-gitmoji@1 \
  -p @semantic-release/changelog@6 -p @semantic-release/git@10 \
  -p @semantic-release/github@11 semantic-release --dry-run
```

It prints the next version and the notes it would publish, without changing anything.
