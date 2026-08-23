# HANDOFF — Tailwind 3.4 → 4 migration + dependabot eslint ignore

Branch: `chore/tailwind-4` (worktree, never left it). Two tasks from the brief:
the deferred Tailwind 4 migration done as a real migration, and a dependabot
ignore entry for eslint majors. No PR opened, nothing merged, no other branch
touched.

## What changed

### Commit `9c51aab` — chore(tailwind): migrate to Tailwind 4 and CSS-first configuration

- **Packages**: `tailwindcss` 3.4.17 → **4.3.3**, added `@tailwindcss/postcss`
  4.3.3, removed `autoprefixer` and the standalone `postcss` devDependency
  (v4 handles prefixing itself via Lightning CSS; Next bundles its own
  postcss for config loading).
- **`postcss.config.mjs`**: plugins are now just `"@tailwindcss/postcss": {}`.
- **`tailwind.config.ts` deleted**. Every token moved to `@theme` in
  `app/globals.css`: the six colors, the font stack, the five-step type scale
  (with `--text-*--line-height/--letter-spacing/--font-weight` sub-tokens, so
  `text-h2` etc. still set weight and tracking exactly as the v3 tuples did),
  `--container-content`/`--container-prose`, `--radius-card`,
  `--shadow-soft`/`--shadow-lift`, `--ease-apple`. The old manual `:root`
  block is gone — `@theme` emits the same variables itself, so the plain-CSS
  rules (`body`, `::selection`, `:focus-visible`) read from the single source.
  The load-bearing Polish comments (the hero `text-display` measurement note,
  the Lenis/scroll notes) were carried over, not dropped.
- **Content sources**: `@import "tailwindcss" source(none)` plus explicit
  `@source` for `app`, `components`, `data` — and **`features`**, which the
  v3 `content` globs never covered. I verified against a v3 baseline build
  that production CSS was actually shipping without four utilities Spotlight
  uses: `disabled:opacity-40`, `disabled:pointer-events-none`, `pt-2`,
  `xl:inline`. That latent gap is fixed, not preserved (see "Intentional
  visual differences").
- **Utility renames** so rendered output matches v3 exactly:
  - `outline-none` → `outline-hidden` (14×) — keeps the v3
    transparent-outline behavior that stays visible in forced-colors mode.
  - `shadow-sm` → `shadow-xs` (6×), `drop-shadow-sm` → `drop-shadow-xs` (4×),
    `shadow-inner` → `inset-shadow-sm` (1×, same value; `shadow-inner` no
    longer exists in v4), bare `rounded` → `rounded-sm` (1×),
    `bg-gradient-to-*` → `bg-linear-to-*` (5×).
  - `focus-visible:outline focus-visible:outline-2` →
    `focus-visible:outline-2` (AskJakubApp textarea): in v4 `outline-2`
    implies solid, and keeping bare `outline` (now width 1px) would fight
    over `outline-width`.
- **Two v4 defaults explicitly overridden in `globals.css`**:
  - v4 preflight gives buttons `cursor: default`; a base-layer rule restores
    `cursor: pointer` on non-disabled buttons/`[role="button"]` (the official
    upgrade-guide compat rule). Only 2 elements in the repo set `cursor-*`
    themselves; the desktop UI's buttons all relied on the v3 default.
  - **`max-w-prose` gotcha, worth knowing**: v4 ships a built-in _static_
    `max-w-prose` (65ch) that beats both a `--container-prose` theme token
    and a same-name `@utility` — with `@utility` the two declarations merge
    into one rule with the built-in's `65ch` last, so it wins. The fix is a
    plain `.max-w-prose { max-width: var(--container-prose) }` rule appended
    to `@layer utilities`, which wins by source order. Without it every prose
    column (17 usages) would have narrowed from 680px to ~65ch. Caveat noted
    in the CSS comment: this override does not cover variant-prefixed forms
    (`md:max-w-prose`); none exist today.

### Commit `e897bb1` — chore(dependabot): swap the tailwindcss major block for an eslint one

- Added the briefed ignore entry for `eslint` semver-majors with the exact
  comment: _"eslint-plugin-react latest (7.37.5) predates ESLint 10 —
  typescript-eslint-style upstream block; remove when a compatible release
  ships."_
- Removed the `tailwindcss` major ignore + its comment paragraph. The file's
  own instruction says to drop an entry when its reason stops being true;
  this branch is that migration. Left a one-line note in place so the removal
  is legible in context. The typescript ignore is untouched.

### Third commit — docs: this file.

## Gates — exact commands and results

All run in this worktree after the final state of the migration commit:

| Command                | Result                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| `npm run format:check` | `All matched files use Prettier code style!`                             |
| `npm run typecheck`    | `next typegen` OK ("Types generated successfully"), `tsc --noEmit` clean |
| `npm run lint`         | clean at `--max-warnings=0`                                              |
| `npm test`             | **34 files, 335 tests, all passed** (vitest 4.1.10, ~19s)                |
| `npm run build`        | succeeds; same route table as the v3 baseline build                      |

Note: the brief said 297 tests; the suite on this branch's base already
contains 335. All 335 pass — nothing was skipped or removed.

## How "every visual token survives" was verified

1. Built the repo **before** touching anything (Tailwind 3 baseline) and
   saved `.next/static/chunks/*.css`.
2. Rebuilt after the migration and diffed the full class-selector inventory
   (1096 v3 selectors vs 1116 v4). After mapping the renames, **zero real
   losses**. The only absent selectors: `.container` and `.!visible` (v3
   scanner artifacts from the words `container` and `if (!visible)` in
   source — zero className usage, dead CSS), `focus-visible:outline`
   (deliberately dropped, see above), plus two regex artifacts of my
   extraction script (`.125rem`/`.625rem` matched inside CSS _values_).
3. Spot-checked computed values: custom type scale (size/leading/tracking/
   weight all present), `--container-content: 1120px`, `--container-prose:
680px`, `--radius-card: 20px`, both custom shadows, `--ease-apple`, the
   font stack with `var(--font-inter)` intact, `p-4`/`gap-2` spacing
   (`--spacing: .25rem` base → identical rem values), and opacity-modified
   colors — v3 `text-ink/50` → `#1d1d1f80`, v4 → `#1d1d1f80`, byte-identical.

## Intentional visual differences (all improvements or invisible)

1. **Spotlight regains four utilities** the v3 build never emitted (missing
   `features/` content glob): the close/nav buttons now actually dim and
   lose pointer events when disabled, a `pt-2` gap renders, and the ⌘K hint
   label shows at `xl:`. This is the live site's latent bug fixed — the only
   change a user could notice.
2. **`hover:` styles now apply only on devices that support hover**
   (v4 wraps them in `@media (hover: hover)`). On touch screens, tapping no
   longer leaves sticky hover states. Kept deliberately — it suits the
   desktop-simulation UI; revert with `@custom-variant hover (&:hover);` if
   unwanted.
3. `transition-colors`/`transition` now also cover `outline-color` (v4
   default property list) — focus outlines fade instead of snapping in the
   rare spots that combine both. Negligible.
4. Dead accidental utilities (`.container`, `.!visible`) no longer emitted.
5. `space-x/y` uses a new selector (`> :not(:last-child)`, margin-bottom
   instead of margin-top) — visually identical here (19 usages, none mix
   hidden siblings or rely on collapsing margins).
6. Browser support floor rises to Safari 16.4+ / Chrome 111+ / Firefox 128+
   (v4 requirement — uses `@property`, `color-mix()`). Older browsers get
   broken styling where v3 degraded gracefully.

## Not verified / caveats

- **No browser-level screenshot diffing.** Verification is CSS-output-level
  (selector inventory + computed values), not rendered-pixel-level. I did not
  drive a browser; a quick manual pass over `/`, `/about`, `/o-mnie`, the
  desktop mode and Spotlight is the remaining sanity check.
- The `@source` list is now the contract: **a new top-level directory with
  classNames needs a new `@source` line** in `app/globals.css` (comment in
  the file says so). Auto-detection stays off to keep `docs/`, `test/` and
  README out of the scan.
- npm printed pre-existing `allow-scripts` warnings for `fsevents` and
  `unrs-resolver` install scripts (repo policy, not introduced here); nothing
  blocked.
- No permission prompts or tool failures blocked the work.
