/**
 * Commit message linting.
 *
 * Format: ":emoji: type(scope?): subject"
 *   • emoji  — a gitmoji shortcode (`:sparkles:`) or the unicode character (`✨`)
 *   • type   — build | ci | chore | docs | feat | fix | perf | refactor | revert | style | test | wip
 *   • scope  — optional, lowercase
 *   • subject — imperative, no trailing period, ≤ 100 chars total header
 *
 * See https://gitmoji.dev for the emoji list.
 */
export default {
  extends: ['gitmoji'],
}
