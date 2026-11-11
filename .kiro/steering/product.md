# GrimBranch — Product Steering

## What it is

GrimBranch is a haunted choose-your-path story engine that runs entirely in the
browser. It stitches three things that do not normally live in one app:

1. A gamebook engine that plays branching stories written in a plain-text,
   Twee-style passage format.
2. A writing workshop with a live story validator and an interactive story
   map, so an author can see broken links, unreachable passages and dead
   ends before a reader ever hits them.
3. Read-aloud narration with word-by-word highlighting, so the story can be
   listened to like a ghost story told by candlelight.

## Who it is for

- Readers who like interactive fiction and haunted-house stories.
- Writers and teachers who want to draft a branching tale and immediately
  test that every path works.
- Anyone who wants a story read aloud to them, including younger readers and
  readers who need text highlighted as it is spoken.

## The shipped story

The built-in tale, "The Ninth Bell", is an original short haunted-house
story written for this project: thirteen passages, four endings, and three
story flags (a brass key, a lit candle, a truth learned from a diary) that
open and close choices.

## Product principles

- The story the reader plays is the exact text the author edits. One source
  of truth, in plain text, in the Workshop tab.
- Validation is honest and specific: every problem names the passage and
  says what is wrong.
- No accounts, no tracking, no network calls. Progress lives in the
  reader's own browser (localStorage).
- The app must work by simply opening the page. No build step, no server
  requirement beyond static file hosting.
