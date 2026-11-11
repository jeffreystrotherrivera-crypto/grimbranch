# GrimBranch — Requirements

## Introduction

GrimBranch is a browser-only interactive-fiction app with three stitched
parts: a branching-story player, an author workshop with a live validator
and story map, and read-aloud narration with read-along highlighting. The
shipped story is "The Ninth Bell", an original haunted-house tale.

## Requirements

### Requirement 1: Play a branching story

**User story:** As a reader, I want to read a haunted branching story and
choose my own path, so that my choices change what happens.

Acceptance criteria (EARS):

1. WHEN the app loads, THE SYSTEM SHALL parse the built-in story text and
   display the passage tagged `[start]`.
2. WHEN a passage is displayed, THE SYSTEM SHALL show its choices as
   buttons labelled with the choice text.
3. WHEN the reader clicks a choice, THE SYSTEM SHALL display the target
   passage and apply any `@set` directives in it.
4. IF a choice has a `(requires flag)` condition and the flag is not set,
   THEN THE SYSTEM SHALL show the choice disabled with a note naming what
   is missing.
5. WHEN the reader reaches a passage tagged `[ending]`, THE SYSTEM SHALL
   mark the ending as found and persist it.

### Requirement 2: Validate a story draft

**User story:** As an author, I want the app to check my story text, so
that I can fix broken paths before anyone reads it.

Acceptance criteria:

1. WHEN the author edits the story text in the Workshop, THE SYSTEM SHALL
   re-validate and show errors and warnings, each naming its passage.
2. THE SYSTEM SHALL report: choices pointing at passages that do not
   exist, passages no path can reach, non-ending passages with no choices
   (dead ends), duplicate passage names, a missing `[start]` passage, and
   choices that require a flag no passage ever sets.
3. IF the story has no issues, THEN THE SYSTEM SHALL say so plainly and
   show the passage, choice and ending counts.
4. THE SYSTEM SHALL never throw an exception on malformed story text.

### Requirement 3: Show the story map

**User story:** As a reader or author, I want to see the whole story as a
map, so that I can understand its shape.

Acceptance criteria:

1. WHEN the Map view opens, THE SYSTEM SHALL draw every passage as a node
   and every choice as a connecting line, laid out by distance from the
   start passage.
2. THE SYSTEM SHALL visually distinguish the current passage, visited
   passages, unvisited passages and endings.
3. WHEN the underlying story changes in the Workshop, THE SYSTEM SHALL
   redraw the map from the new text.

### Requirement 4: Read the story aloud

**User story:** As a listener, I want the current passage read aloud with
the words highlighted as they are spoken, so that I can follow along.

Acceptance criteria:

1. WHEN the reader presses Listen, THE SYSTEM SHALL speak the passage text
   using the Web Speech API and highlight each word as it is reached.
2. IF no speech voice is available, THEN THE SYSTEM SHALL still run the
   word highlighting on a timer and say that narration is in silent mode.
3. WHEN the reader presses Stop or leaves the passage, THE SYSTEM SHALL
   stop speaking and clear the highlight.

### Requirement 5: Remember the reader

**User story:** As a returning reader, I want the app to remember the
endings I have found, so that I can hunt for the ones I missed.

Acceptance criteria:

1. THE SYSTEM SHALL persist found endings and visited passages in
   localStorage and restore them on load.
2. THE SYSTEM SHALL show an "Endings found: n of N" counter in Play view.
3. THE SYSTEM SHALL offer a Restart button that returns to the start
   passage without erasing found endings.
