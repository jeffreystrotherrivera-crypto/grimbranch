# GrimBranch

**A haunted choose-your-path story engine — a gamebook, a writing workshop
and a storyteller, stitched into one browser app.**

Built for the **Kiroween 2026** hackathon (Frankenstein category): three
technologies that do not normally live together, sewn into a single body —

1. **A gamebook engine** that plays branching stories written in a
   plain-text, Twee-style passage format, with story flags that open and
   lock choices.
2. **A live story validator and map** — the same checks writers wish their
   tools had: broken links, unreachable passages, dead ends, choices that
   require a flag nobody sets. Every problem names its passage.
3. **Read-aloud narration with word-by-word highlighting**, so the tale can
   be listened to like a ghost story — and when no speech voice exists, the
   highlighter still walks the words in a silent read-along.

The shipped tale, **“The Ninth Bell”**, is an original haunted-house story:
13 passages, 4 endings, 3 flags (a brass key, a lit candle, a truth from a
diary). Most readers will not find all four endings on the first night.

## Run it

No build step, no dependencies, no server required:

- Double-click `index.html`, **or**
- `python3 -m http.server 8000` in this folder, then open
  `http://localhost:8000`

It also lives at **https://joinlightningrod.com/grimbranch/**

## Write your own story

Open the **Workshop** tab. The editor holds the exact text the engine
plays. The format:

```
:: Passage Name [start]
Body text the reader sees.
@set someFlag
[[Choice label->Target Passage]]
[[Choice label->Target Passage]] (requires someFlag)
```

Tag the first passage `[start]` and each final passage `[ending]`. The
validator re-checks the draft on every edit, and the **Story Map** tab
redraws the tale's shape from the same text.

## Tests

```
node tests/validator.test.mjs
```

Plain Node, no framework — 19 checks covering the parser, every validator
rule, and the built-in story (which must validate clean).

## How it was built

Spec-first, with Kiro's spec-driven workflow: the `.kiro/` directory in
this repo holds the steering docs (`product.md`, `tech.md`, `structure.md`),
the full spec for the app (`specs/grimbranch/` — requirements in EARS
notation, design, and the task list that was worked through), and agent
hooks that re-run the validator tests whenever the story or parser changes.
See `FORM-ANSWERS.md` for the hackathon write-up.

## License

MIT — see `LICENSE`. The story text of “The Ninth Bell” is an original work
by Jeff Rivera, included so the engine has a tale to tell.
