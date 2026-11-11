# GrimBranch — Tasks

- [x] 1. Write steering docs and this spec (requirements, design, tasks)
- [x] 2. Implement `validator.js`: passage parser (headers, tags, choices,
      `@set` directives, `requires` conditions) — Req 1.1, 2.4
- [x] 3. Implement structural validation in `validator.js`: unknown
      targets, unreachable passages, dead ends, duplicate names, missing
      start, unset required flags — Req 2.2
- [x] 4. Write the built-in story "The Ninth Bell" in `story.js`
      (13 passages, 4 endings, 3 flags) — Req 1
- [x] 5. Build `index.html` + `styles.css`: three views, candlelit gothic
      theme, CSS fog and candle flicker — Req 3.1, 4
- [x] 6. Implement the Player in `app.js`: passage rendering with
      typewriter reveal, choices with flag gating, endings counter,
      restart, localStorage persistence — Req 1, 5
- [x] 7. Implement the SVG story map (BFS layout, node states, lost
      passages column) — Req 3
- [x] 8. Implement the Workshop: live validation report, play-this-draft,
      restore built-in story — Req 2
- [x] 9. Implement the Narrator: speech synthesis with word highlighting
      and the silent read-along fallback — Req 4
- [x] 10. Write and run the Node test suite for parser + validator — Req 2
- [x] 11. Browser smoke test with CDP: full playthrough to an ending, map
       view, workshop error detection
- [x] 12. Add LICENSE (MIT) and README with run instructions
- [x] 13. Capture the screenshot set and the under-3-minute demo video
- [x] 14. Draft the Devpost submission answers in FORM-ANSWERS.md
