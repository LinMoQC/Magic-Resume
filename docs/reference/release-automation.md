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
- a **GitHub Release** with generated notes grouped by gitmoji.

The **GitHub Releases page is the living changelog.** The workflow does not commit
`CHANGELOG.md` back to `master`, because `master` is protected ("Changes must be
made through a pull request") and rejects direct pushes. The tag and Release are
created through the API, which branch protection does not block. `CHANGELOG.md`
remains the curated historical record (≤ v2.0.0); newer entries live in Releases.

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
- **`package.json` version is not auto-bumped** (the app is private and unpublished);
  the source of truth for the version is the git tag + GitHub Release. Add
  `@semantic-release/npm` (`npmPublish: false`) if you want `package.json` synced too.
- The workflow sets `HUSKY: 0` so the repo's local git hooks don't run in CI.

### Want `CHANGELOG.md` auto-updated in the repo too?

That needs a way to land a commit on protected `master`. Pick one, then re-add
`@semantic-release/changelog` + `@semantic-release/git` to `.releaserc.json`:

- allow `github-actions[bot]` to **bypass** the branch ruleset (repo → Rules), **or**
- give the workflow a **PAT / GitHub App token** with bypass rights as `GITHUB_TOKEN`, **or**
- keep `@semantic-release/changelog` (no git plugin) and add a
  `peter-evans/create-pull-request` step to open a changelog PR — this also needs
  "Allow GitHub Actions to create and approve pull requests" enabled in settings.

## Verifying / dry-run

Locally, against the real history (`--dry-run` skips publishing; use `--no-ci` to
run off a feature branch):

```bash
npx -p semantic-release@24 -p semantic-release-gitmoji@1 \
  -p @semantic-release/github@11 semantic-release --dry-run --no-ci
```

It prints the next version and the notes it would publish, without changing anything.
