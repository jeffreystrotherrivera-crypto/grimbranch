/*
 * GrimBranch story parser + validator.
 *
 * One file, two homes: it runs in the browser (as window.GrimStory) and in
 * Node (as a module) so the writer-facing checks and the automated tests
 * exercise exactly the same code.
 *
 * Passage format (Twee-style):
 *
 *   :: The Gate [start]
 *   Body text the reader sees.
 *   @set brassKey
 *   [[Enter the hall->The Hall]]
 *   [[Climb to the attic->The Attic]] (requires brassKey)
 *
 * Tags live on the header line: [start] and [ending] are the ones the
 * engine understands. A tag typed inside a passage body does not count.
 */
(function (global) {
  'use strict';

  var CHOICE_RE = /\[\[([^\]]+)\]\]\s*(?:\(\s*requires\s+([A-Za-z0-9_]+)\s*\))?/g;
  var HEADER_RE = /^::\s*(.+?)\s*$/;
  var TAG_RE = /\[([^\]]+)\]/g;
  var SET_RE = /^@set\s+([A-Za-z0-9_]+)\s*$/;

  function parseStory(text) {
    var issues = [];
    var passages = [];
    var byName = new Map();
    var current = null;

    function flush() {
      if (!current) return;
      current.body = current.bodyLines.join('\n').trim();
      delete current.bodyLines;
      passages.push(current);
      if (byName.has(current.name)) {
        issues.push({
          level: 'error', type: 'duplicate-name', passage: current.name,
          message: 'There are two passages named "' + current.name + '". Names must be unique.'
        });
      } else {
        byName.set(current.name, current);
      }
      current = null;
    }

    var lines = String(text == null ? '' : text).split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var header = line.match(HEADER_RE);
      if (header) {
        flush();
        var raw = header[1];
        var tags = [];
        var name = raw.replace(TAG_RE, function (_, t) { tags.push(t.trim().toLowerCase()); return ''; }).trim();
        if (!name) {
          issues.push({ level: 'error', type: 'bad-header', passage: '(line ' + (i + 1) + ')', message: 'A passage header has tags but no name.' });
          name = '(unnamed passage at line ' + (i + 1) + ')';
        }
        current = { name: name, tags: tags, bodyLines: [], setsFlags: [], choices: [] };
        continue;
      }
      if (!current) {
        if (line.trim()) {
          issues.push({ level: 'warning', type: 'orphan-text', passage: '(top of file)', message: 'Text appears before the first passage header and will be ignored.' });
        }
        continue;
      }
      var setMatch = line.trim().match(SET_RE);
      if (setMatch) { current.setsFlags.push(setMatch[1]); continue; }
      current.bodyLines.push(line);
    }
    flush();

    // Extract choices from each body (choice markup stays out of the
    // displayed text; the player renders labels itself).
    passages.forEach(function (p) {
      var display = [];
      p.body.split('\n').forEach(function (bodyLine) {
        var rest = bodyLine.replace(CHOICE_RE, function (_, inner, requires) {
          var label, target;
          if (inner.indexOf('->') !== -1) { var a = inner.split('->'); label = a[0].trim(); target = a.slice(1).join('->').trim(); }
          else if (inner.indexOf('|') !== -1) { var b = inner.split('|'); label = b[0].trim(); target = b.slice(1).join('|').trim(); }
          else { label = inner.trim(); target = inner.trim(); }
          p.choices.push({ label: label, target: target, requires: requires || null });
          return '';
        });
        if (rest.trim()) display.push(rest);
      });
      p.displayBody = display.join('\n').trim();
    });

    if (!passages.length) {
      issues.push({ level: 'error', type: 'empty-story', passage: '(whole story)', message: 'No passages were found. A story needs at least one passage header, like ":: Start [start]".' });
    }

    var start = null;
    passages.forEach(function (p) { if (!start && p.tags.indexOf('start') !== -1) start = p; });
    if (passages.length && !start) {
      issues.push({ level: 'error', type: 'missing-start', passage: '(whole story)', message: 'No passage is tagged [start], so the story has no way to begin.' });
    }
    var endings = passages.filter(function (p) { return p.tags.indexOf('ending') !== -1; });
    if (passages.length && !endings.length) {
      issues.push({ level: 'warning', type: 'no-endings', passage: '(whole story)', message: 'No passage is tagged [ending]. Readers can wander forever but never finish.' });
    }

    return { passages: passages, byName: byName, start: start, endings: endings, issues: issues };
  }

  function validateStory(parsed) {
    var issues = parsed.issues.slice();
    var byName = parsed.byName;

    // Every flag that any passage sets.
    var settable = new Set();
    parsed.passages.forEach(function (p) { p.setsFlags.forEach(function (f) { settable.add(f); }); });

    parsed.passages.forEach(function (p) {
      p.choices.forEach(function (c) {
        if (!byName.has(c.target)) {
          issues.push({
            level: 'error', type: 'unknown-target', passage: p.name,
            message: 'Choice "' + c.label + '" points to "' + c.target + '", which does not exist.'
          });
        }
        if (c.requires && !settable.has(c.requires)) {
          issues.push({
            level: 'error', type: 'unset-flag', passage: p.name,
            message: 'Choice "' + c.label + '" requires the flag "' + c.requires + '", but no passage ever sets it (no "@set ' + c.requires + '" anywhere). The choice can never be taken.'
          });
        }
      });
      if (!p.choices.length && p.tags.indexOf('ending') === -1) {
        issues.push({
          level: 'error', type: 'dead-end', passage: p.name,
          message: '"' + p.name + '" has no choices and is not tagged [ending]. The story stops here with no way forward and no ending.'
        });
      }
    });

    // Reachability: BFS from the start passage, ignoring flag conditions
    // (a conditional choice still proves its target is intended to be seen).
    if (parsed.start) {
      var seen = new Set([parsed.start.name]);
      var queue = [parsed.start];
      while (queue.length) {
        var cur = queue.shift();
        cur.choices.forEach(function (c) {
          var t = byName.get(c.target);
          if (t && !seen.has(t.name)) { seen.add(t.name); queue.push(t); }
        });
      }
      parsed.passages.forEach(function (p) {
        if (!seen.has(p.name)) {
          issues.push({
            level: 'warning', type: 'unreachable', passage: p.name,
            message: '"' + p.name + '" cannot be reached from the start passage by any chain of choices.'
          });
        }
      });
    }

    var choices = parsed.passages.reduce(function (n, p) { return n + p.choices.length; }, 0);
    return {
      issues: issues,
      stats: {
        passages: parsed.passages.length,
        choices: choices,
        endings: parsed.endings.length,
        errors: issues.filter(function (i) { return i.level === 'error'; }).length,
        warnings: issues.filter(function (i) { return i.level === 'warning'; }).length
      }
    };
  }

  var api = { parseStory: parseStory, validateStory: validateStory };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GrimStory = api;
})(typeof window !== 'undefined' ? window : globalThis);
