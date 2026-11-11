# GrimBranch — Design

## Architecture

One static page, three views, four scripts, zero dependencies.

```
index.html ── loads ──► story.js      (STORY_TEXT: the built-in tale)
                    ──► validator.js  (parse + validate; browser & Node)
                    ──► app.js        (views, map, narration, state)
styles.css  ── theme: candlelit gothic, CSS-only fog and candle flicker
```

## Data model

`parseStory(text)` returns:

```js
{
  passages: [ { name, tags: [], body, setsFlags: [], choices:
                [ { label, target, requires /* flag name or null */ } ] } ],
  byName: Map<name, passage>,
  start: passage | null,
  endings: [passage],
  issues: [ { level: 'error'|'warning', type, passage, message } ]
}
```

Passage format (Twee-style):

```
:: The Gate [start]
Body text the reader sees.
@set brassKey
[[Enter the hall->The Hall]]
[[Take the attic stairs->The Attic]] (requires brassKey)
```

- Header: `:: Name [tag] [tag]`. Tags live on the header line only.
- `@set flag` on its own body line sets a flag when the passage is entered;
  the line itself is not displayed.
- Choice condition: trailing `(requires flag)`.

`validateStory(parsed)` appends structural issues: `unknown-target`,
`unreachable` (BFS from start over choices), `dead-end` (no choices and not
tagged ending), `duplicate-name`, `missing-start`, `unset-flag` (a required
flag that no passage sets), plus parse-level issues collected while parsing
(`bad-header`, `empty-story`).

## Components

- **Player** — renders the current passage with a short typewriter reveal
  (click to complete instantly), renders choices (disabled state with a
  "needs the brass key" style note when a required flag is missing), tracks
  flags in a `Set`, records visits and endings, persists to localStorage.
- **Map** — BFS from the start passage assigns each passage a depth; SVG
  columns by depth, rows in discovery order; edges drawn as curved paths;
  node classes: `current`, `visited`, `unseen`, `ending`. Unreachable
  passages (validation errors) are drawn in a separate "lost passages"
  column so authors can see them too.
- **Workshop** — a textarea holding the story text (seeded with the built-in
  story), a Validate report panel, and two actions: "Play this draft" and
  "Restore the built-in story". Validation re-runs on every edit
  (debounced) and the map redraws from the same parsed result.
- **Narrator** — splits the passage body into word spans. With
  `speechSynthesis`, speaks and highlights on `boundary` events; without a
  usable voice, falls back to a timed highlighter (~340 ms/word) and labels
  itself "silent read-along". Stop on demand and on navigation.

## Error handling

- The parser is total: any input produces a result object; malformed lines
  become issues, never exceptions.
- If the built-in story somehow failed validation, the app still opens in
  the Workshop with the report visible instead of a blank page.

## Testing

- `tests/validator.test.mjs` — plain Node, no framework. Covers: parsing
  the built-in story (passage/ending counts, flags), a clean validation of
  it, and one synthetic broken story per issue type.
- Browser smoke test — serve the folder, drive the real page with CDP:
  load, click through a full path to an ending, open the Map, break the
  story in the Workshop and see the error appear.
