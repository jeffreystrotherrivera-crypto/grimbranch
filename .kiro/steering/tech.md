# GrimBranch — Tech Steering

## Stack

- Vanilla HTML, CSS and JavaScript. No frameworks, no bundler, no npm
  dependencies. This is deliberate: judges and readers open one page and it
  runs.
- `index.html` — page shell and the three views (Play, Map, Workshop).
- `styles.css` — the candlelit gothic theme; all animation is CSS.
- `story.js` — the built-in story as Twee-style plain text (`STORY_TEXT`)
  plus the passage-format documentation string.
- `validator.js` — the story parser and validator. One file, used by the
  browser app AND by the Node test suite, so the checks a writer sees are
  the checks the tests prove.
- `app.js` — view logic: passage rendering, choices and flags, the SVG
  story map, the workshop, narration with read-along highlighting.

## Conventions

- The parser must never throw on bad author input. It returns a list of
  issues with levels (`error`, `warning`) and the passage each belongs to.
- Passage headers carry their tags on the header line itself, e.g.
  `:: The Attic [ending]`. A tag typed inside a passage body does not count.
- Choices use `[[Label->Target]]` or `[[Label|Target]]`. A trailing
  `(requires flagName)` makes a choice conditional on a story flag.
- A body line `@set flagName` sets a flag when the passage is entered.
- Narration uses the Web Speech API when voices exist; when they do not,
  the read-along highlighter still runs on a timer so the feature degrades
  gracefully instead of failing.
- All state (visited passages, endings found) persists in localStorage
  under the `grimbranch-` prefix.
