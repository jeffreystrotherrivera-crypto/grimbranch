# GrimBranch — Kiroween 2026 submission answers (DRAFT, not submitted)

Hackathon: Kiroween 2026 (kiroween.devpost.com)
Deadline: **December 4, 2026, 2:00 PM Pacific Time** — no extensions.
Category: **Frankenstein**
Team: Jeff Rivera, solo.

---

## Project name

GrimBranch

## Tagline

A haunted choose-your-path story engine — a gamebook, a writing workshop
and a storyteller, stitched into one app.

## Project website / live app

https://joinlightningrod.com/grimbranch/

No login needed. It is free and open for judging and testing.

## GitHub repository

[PARENT TO ADD: the public repo URL. The local repo in ~/workspace/kiroween
is complete and committed — it needs a public GitHub repo created under
Jeff's account and a push. The repo already has the MIT LICENSE at the root
and the /.kiro directory committed and NOT gitignored, as the rules
require.]

## Demo video (YouTube)

[PARENT TO ADD: YouTube URL. The finished video is
demo/grimbranch-demo.mp4 — 1 minute 54 seconds, under the 3-minute limit,
no third-party music or trademarks. It needs a public YouTube upload.]

## Category

Frankenstein — stitch together a chimera of technologies into one app.

Bonus prizes to also select on the form:

- **Best Startup Project** ($10,000) — [OPTIONAL, parent's call. Requires:
  confirm Jeff is a founder of the startup, his LinkedIn profile, and the
  startup website. Draft answers below if wanted.]
- Best Demo is scored from the Presentation criterion — no extra field.
- Bonus Blog / Social Blitz — only if a post is actually published during
  the submission period; the social post must START with
  #KiroweenHackathon26. Draft text at the bottom of this file.

---

## Project description (Devpost story fields)

### Inspiration

I make interactive stories for a living — branching tales where the reader
chooses the path. Two things always hurt. First, readers finish a story
and never see the paths they missed. Second, writers of branching stories
ship broken tales all the time: a choice that points at a scene that was
renamed, a room nobody can reach, an ending that quietly became a dead
end. Normal writing tools never check any of that, because to them a story
is just text.

So for Kiroween I stitched the three things I always wanted in one body: a
gamebook that plays branching stories, a workshop that checks a story the
way a compiler checks code, and a storyteller that reads the tale aloud
with the words lit up as they are spoken. Frankenstein's monster, but it
reads to you.

### What it does

GrimBranch is a haunted choose-your-path story engine that runs entirely
in the browser — no account, no server, no tracking.

- **Read.** Play "The Ninth Bell," an original haunted-house story written
  for this project: 13 passages, 4 endings, and story flags — a brass key,
  a lit candle, a truth from a diary — that unlock and lock choices as you
  go. A locked choice tells you plainly what you are missing.
- **Listen.** Press Listen and the passage is read aloud with each word
  highlighted as it is reached. If the device has no speech voice, the
  highlighter still walks the words in a silent read-along instead of
  failing.
- **See the map.** The Story Map draws the whole tale as a graph — where
  you stand in gold, where you have been, which endings still hide — so
  the paths not taken stay visible.
- **Write and test.** The Workshop holds the exact story text the engine
  plays, in a plain Twee-style format. Edit it and a live validator
  re-checks every path: choices pointing at passages that do not exist,
  passages no path can reach, dead ends, duplicate names, and choices that
  require a flag no passage ever sets. Every problem names its passage.
  Break the story on purpose — rename one target — and watch it get
  caught, then restore the built-in tale with one click.
- It remembers the endings you have found between visits, so hunting all
  four is a real game.

### How I built it

Spec-first, with Kiro's spec-driven workflow (details in the "How Kiro
was used" section below). The app itself is deliberately plain: vanilla
HTML, CSS and JavaScript, zero dependencies and no build step, so any
judge can open it and it just runs.

- `validator.js` is the heart: a parser for the passage format plus a
  structural validator (reachability by breadth-first search, dead-end
  and unknown-target checks, flag analysis). The same file runs in the
  browser and in Node, so the checks a writer sees are the exact checks
  the test suite proves — 19 automated tests cover the parser, every
  validation rule, and the built-in story, which must validate clean.
- `app.js` holds the player (passage rendering, flag-gated choices,
  localStorage persistence), an SVG story map laid out by distance from
  the start passage, the workshop, and the narrator (Web Speech API with
  a word-boundary highlighter and a timed silent fallback).
- `story.js` is the tale itself, stored as the same plain text the
  Workshop edits — one source of truth for playing and for writing.
- `styles.css` is the costume: a candlelit gothic theme with CSS-only fog
  and a flickering candle.

The whole flow was verified end to end in a real browser: a scripted
playthrough that takes the key, reads the diary, unlocks the attic and
rings the bell to reach an ending, plus a workshop pass that breaks a link
and watches the validator catch it (41 checks, all passing).

### Challenges I ran into

- Tags that lie. Early in the design I let ending markers live inside a
  passage's text, where a stray mention could fake an ending. The rule
  now: a tag only counts on the passage header line, and a test proves a
  body mention does not count.
- Speech is not promised anywhere. Some browsers and devices have no
  speech voice at all. Instead of letting the Listen button fail, the
  narrator degrades to a timed read-along highlighter and says so.
- The map has loops — stories go back to the hall, back to the gate — so
  a simple tree layout collapses. Laying passages out by breadth-first
  depth, with back-edges swung underneath, keeps the shape readable.

### Accomplishments I'm proud of

- One file, two homes: the validator that judges a writer's draft in the
  browser is byte-for-byte the code the Node tests exercise.
- The built-in story genuinely plays: three flags interlock so that no
  ending is reachable without earning it, and the story itself validates
  with zero errors and zero warnings.
- Zero dependencies. The entire app is five small files anyone can read.

### What I learned

Writing the requirements in EARS notation before any code forced the
awkward questions early — what counts as an ending, what a locked choice
should say, what "the story holds together" actually means as a checklist.
By the time the code was written, most of the design arguments were
already settled on paper.

### What's next

- A small library of tales in the same format, including stories written
  by students in my AI filmmaking classes, each validated before it is
  shared.
- Exporting a finished story as a single self-contained page a writer can
  give away.
- More validator checks authors ask for: flag-usage reports ("this key is
  never used") and estimated reading paths per ending.

### Built with

HTML, CSS, JavaScript (vanilla), Web Speech API, SVG, localStorage, Kiro
(spec-driven development, steering docs, agent hooks).

---

## How Kiro was used (required write-up)

[PARENT FLAG — read before submitting: this draft describes the .kiro
artifacts that genuinely exist in the repo and the workflow they encode.
Before this text is submitted, Jeff should open the repo in Kiro itself
(his account; the hackathon's 4,000 free credits must be requested by
December 1, 12:00 PM PT on the Resources tab — the request needs his Kiro
user ID and ID verification) and run a real Kiro session over the spec —
for example, asking Kiro to verify the task list against the code or to
make a small change through the spec — so "built using Kiro" is fully and
literally true, and one or two specifics from that session can be dropped
into the marked spot. Do not submit this section as-is without that pass.]

GrimBranch was built spec-driven, the way Kiro is meant to be used:

- **Specs.** The feature lives in `.kiro/specs/grimbranch/`. The
  requirements were written first, in EARS notation — user stories with
  testable acceptance criteria for playing, validating, mapping,
  narrating and remembering. The design doc fixed the architecture (one
  parser/validator shared by browser and tests) before code existed, and
  `tasks.md` broke the work into a numbered, trackable list tied back to
  the requirements. [ADD ONE SPECIFIC FROM JEFF'S KIRO SESSION HERE.]
- **Steering docs.** `.kiro/steering/` holds product.md (what GrimBranch
  is and who it serves), tech.md (the zero-dependency rule, the
  header-line tag rule, the "parser never throws" rule) and structure.md
  (repo layout). These kept every session honest about the project's
  conventions without re-explaining them.
- **Agent hooks.** `.kiro/hooks/` defines two hooks: one re-runs the
  validator test suite whenever the story text or the parser changes —
  catching a broken passage format at save time rather than demo time —
  and one checks the spec task list against the code whenever the app
  files change.
- **Spec-driven vs vibe coding.** The practical difference: the story
  format's edge cases (body tags that must not count, choices that need
  unset flags) were decided in the requirements, so implementation was
  mostly transcription. The one place vibe-style iteration won was the
  map layout — breadth-first depth with swung back-edges came from
  looking at real output, and that experiment was then written back into
  the design doc.
- Custom agents / MCP / property-based testing: not used for this
  project; the write-up does not claim them.

---

## Testing access instructions (for judges)

Open https://joinlightningrod.com/grimbranch/ — no login, no install.
Read tab: play the story (the attic needs the brass key from the shed;
the bell needs the truth from the library diary). Map tab: the tale's
graph. Workshop tab: edit the story text and watch the validator work;
the Restore button brings back the built-in tale.

## Optional: Best Startup Project bonus fields

- Founder confirmation: Yes — Jeff Rivera is the founder.
- Startup: Sing To Me LLC / Bypass Hollywood (interactive stories and AI
  animation).
- Startup website: https://bypasshollywood.com
- LinkedIn: [PARENT TO ADD Jeff's LinkedIn profile URL.]

## Optional: draft social post (Social Blitz bonus)

Must START with the hashtag and be posted during the submission period;
paste its URL into the submission form if used.

> #KiroweenHackathon26 My favorite thing about Kiro: the spec comes
> first. I wrote what my haunted story engine had to prove — every path
> checked, no dead ends — and the requirements, design and tasks lived in
> the repo next to the code. GrimBranch, my Frankenstein of a gamebook, a
> story validator and a read-aloud storyteller, is live:
> https://joinlightningrod.com/grimbranch/

## Optional: bonus blog post

[If written: must mention it is part of the Kiroween 2026 hackathon and
be published during the submission period on any public blog platform;
paste the URL into the form. Not drafted — parent's call.]
