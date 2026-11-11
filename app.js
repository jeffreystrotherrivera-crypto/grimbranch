/*
 * GrimBranch app logic: the Player, the story Map, the Workshop and the
 * Narrator. Plain browser JavaScript, no dependencies.
 */
(function () {
  'use strict';

  var parseStory = window.GrimStory.parseStory;
  var validateStory = window.GrimStory.validateStory;
  var STORY_TEXT = window.GrimStoryText.STORY_TEXT;
  var FORMAT_DOC = window.GrimStoryText.FORMAT_DOC;

  var FLAG_LABELS = {
    brassKey: 'the brass key',
    litCandle: 'a lit candle',
    truthKnown: 'the truth from the diary'
  };

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    endingsCount: $('endingsCount'), passageTitle: $('passageTitle'),
    passageBody: $('passageBody'), choices: $('choices'),
    endingBanner: $('endingBanner'), listenBtn: $('listenBtn'),
    stopBtn: $('stopBtn'), narrateNote: $('narrateNote'),
    restartBtn: $('restartBtn'), mapWrap: $('mapWrap'),
    storyEditor: $('storyEditor'), validateReport: $('validateReport'),
    playDraftBtn: $('playDraftBtn'), restoreBtn: $('restoreBtn'),
    formatDoc: $('formatDoc')
  };

  /* ---------- story + run state ---------- */

  var savedDraft = null;
  try { savedDraft = localStorage.getItem('grimbranch-draft'); } catch (e) {}
  var storyText = savedDraft && savedDraft.trim() ? savedDraft : STORY_TEXT;
  var parsed = parseStory(storyText);
  var report = validateStory(parsed);

  var flags = new Set();
  var currentName = parsed.start ? parsed.start.name : null;

  function loadSet(key) {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
  }
  var visited = loadSet('grimbranch-visited');
  var endingsFound = loadSet('grimbranch-endings');
  // Only keep names that still exist in the active story.
  visited.forEach(function (n) { if (!parsed.byName.has(n)) visited.delete(n); });
  endingsFound.forEach(function (n) { if (!parsed.byName.has(n)) endingsFound.delete(n); });

  function setStory(text) {
    storyText = text;
    parsed = parseStory(text);
    report = validateStory(parsed);
    flags = new Set();
    currentName = parsed.start ? parsed.start.name : null;
    visited.forEach(function (n) { if (!parsed.byName.has(n)) visited.delete(n); });
    endingsFound.forEach(function (n) { if (!parsed.byName.has(n)) endingsFound.delete(n); });
    if (currentName) visited.add(currentName);
    saveSet('grimbranch-visited', visited);
    saveSet('grimbranch-endings', endingsFound);
    updateEndingsLine();
  }

  function updateEndingsLine() {
    els.endingsCount.textContent = endingsFound.size + ' of ' + parsed.endings.length;
  }

  /* ---------- views ---------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function showView(name) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.view === name); });
    ['play', 'map', 'workshop'].forEach(function (v) {
      $('view-' + v).classList.toggle('active', v === name);
    });
    if (name === 'map') renderMap();
    if (name !== 'play') stopNarration();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { showView(t.dataset.view); }); });

  /* ---------- player ---------- */

  var typeTimer = null;

  function paragraphsOf(text) {
    return text.split(/\n\s*\n/).map(function (p) { return p.replace(/\n/g, ' ').trim(); }).filter(Boolean);
  }

  function renderPassage(instant) {
    stopNarration();
    var p = parsed.byName.get(currentName);
    if (!p) return;
    els.passageTitle.textContent = p.name;
    visited.add(p.name);
    saveSet('grimbranch-visited', visited);
    p.setsFlags.forEach(function (f) { flags.add(f); });

    var isEnding = p.tags.indexOf('ending') !== -1;
    if (isEnding) {
      endingsFound.add(p.name);
      saveSet('grimbranch-endings', endingsFound);
      updateEndingsLine();
      els.endingBanner.textContent = '🔔 Ending found — ' + endingsFound.size + ' of ' + parsed.endings.length + '. The night can be lived again, differently.';
      els.endingBanner.classList.remove('hidden');
    } else {
      els.endingBanner.classList.add('hidden');
    }

    // Typewriter reveal; click the text to complete it at once.
    var paras = paragraphsOf(p.displayBody);
    var fullText = paras.join('\n\n');
    els.passageBody.innerHTML = '';
    var pEl = document.createElement('p');
    els.passageBody.appendChild(pEl);
    if (instant || !fullText) {
      renderBodyPlain(p);
    } else {
      var shown = 0;
      var step = Math.max(1, Math.ceil(fullText.length / 200));
      clearInterval(typeTimer);
      typeTimer = setInterval(function () {
        shown = Math.min(fullText.length, shown + step);
        pEl.textContent = fullText.slice(0, shown);
        if (shown >= fullText.length) { clearInterval(typeTimer); renderBodyPlain(p); }
      }, 12);
      els.passageBody.onclick = function () {
        clearInterval(typeTimer);
        renderBodyPlain(p);
      };
    }
    renderChoices(p);
  }

  function renderBodyPlain(p) {
    els.passageBody.innerHTML = '';
    paragraphsOf(p.displayBody).forEach(function (para) {
      var el = document.createElement('p');
      el.textContent = para;
      els.passageBody.appendChild(el);
    });
    els.passageBody.onclick = null;
  }

  function renderChoices(p) {
    els.choices.innerHTML = '';
    p.choices.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.label;
      var missing = c.requires && !flags.has(c.requires);
      if (missing) {
        btn.disabled = true;
        var note = document.createElement('span');
        note.className = 'lock-note';
        note.textContent = '🔒 First, you need ' + (FLAG_LABELS[c.requires] || ('the flag "' + c.requires + '"')) + '.';
        btn.appendChild(note);
      } else {
        btn.addEventListener('click', function () {
          if (!parsed.byName.has(c.target)) return;
          currentName = c.target;
          renderPassage(false);
        });
      }
      els.choices.appendChild(btn);
    });
  }

  els.restartBtn.addEventListener('click', function () {
    flags = new Set();
    currentName = parsed.start ? parsed.start.name : currentName;
    renderPassage(true);
  });

  /* ---------- narrator ---------- */

  var speaking = false;
  var highlightTimer = null;
  var wordSpans = [];

  function renderBodyAsWords(p) {
    els.passageBody.innerHTML = '';
    wordSpans = [];
    paragraphsOf(p.displayBody).forEach(function (para) {
      var el = document.createElement('p');
      para.split(/\s+/).filter(Boolean).forEach(function (w, i, arr) {
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = w;
        el.appendChild(s);
        wordSpans.push(s);
        if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
      });
      els.passageBody.appendChild(el);
    });
  }

  function clearHighlights() {
    wordSpans.forEach(function (s) { s.classList.remove('spoken'); });
  }

  function stopNarration() {
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
    if (highlightTimer) { clearInterval(highlightTimer); highlightTimer = null; }
    if (speaking) {
      speaking = false;
      els.listenBtn.classList.remove('hidden');
      els.stopBtn.classList.add('hidden');
      els.narrateNote.textContent = '';
      var p = parsed.byName.get(currentName);
      if (p) renderBodyPlain(p);
    }
  }

  els.stopBtn.addEventListener('click', stopNarration);

  els.listenBtn.addEventListener('click', function () {
    var p = parsed.byName.get(currentName);
    if (!p) return;
    clearInterval(typeTimer);
    renderBodyAsWords(p);
    var words = wordSpans.map(function (s) { return s.textContent; });
    var text = words.join(' ');
    speaking = true;
    els.listenBtn.classList.add('hidden');
    els.stopBtn.classList.remove('hidden');

    var idx = 0;
    function light(i) {
      clearHighlights();
      if (wordSpans[i]) wordSpans[i].classList.add('spoken');
    }
    function finish() {
      if (!speaking) return;
      speaking = false;
      if (highlightTimer) { clearInterval(highlightTimer); highlightTimer = null; }
      els.listenBtn.classList.remove('hidden');
      els.stopBtn.classList.add('hidden');
      els.narrateNote.textContent = '';
    }

    var voices = [];
    try { voices = speechSynthesis.getVoices() || []; } catch (e) {}
    if (window.speechSynthesis && voices.length) {
      els.narrateNote.textContent = 'Reading aloud…';
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.96; u.pitch = 0.85;
      var v = voices.filter(function (x) { return /^en([-_]|$)/i.test(x.lang); })[0] || voices[0];
      if (v) u.voice = v;
      // Map spoken character offsets to word spans.
      var offsets = [];
      var pos = 0;
      words.forEach(function (w) { offsets.push(pos); pos += w.length + 1; });
      u.onboundary = function (ev) {
        if (typeof ev.charIndex !== 'number') return;
        var i = 0;
        while (i + 1 < offsets.length && offsets[i + 1] <= ev.charIndex) i++;
        light(i);
      };
      u.onend = finish;
      u.onerror = finish;
      try { speechSynthesis.speak(u); } catch (e) { finish(); }
    } else {
      // No voice available (headless browsers, some mobiles): keep the
      // read-along promise with a timed highlighter instead of failing.
      els.narrateNote.textContent = 'Silent read-along — no speech voice is available on this device.';
      highlightTimer = setInterval(function () {
        light(idx);
        idx++;
        if (idx >= wordSpans.length) finish();
      }, 330);
    }
  });

  /* ---------- map ---------- */

  function renderMap() {
    var wrap = els.mapWrap;
    wrap.innerHTML = '';
    if (!parsed.passages.length) { wrap.textContent = 'No passages yet.'; return; }

    // BFS depths from start (ignoring flag conditions).
    var depth = new Map();
    var lost = [];
    if (parsed.start) {
      depth.set(parsed.start.name, 0);
      var queue = [parsed.start];
      while (queue.length) {
        var cur = queue.shift();
        cur.choices.forEach(function (c) {
          var t = parsed.byName.get(c.target);
          if (t && !depth.has(t.name)) { depth.set(t.name, depth.get(cur.name) + 1); queue.push(t); }
        });
      }
    }
    parsed.passages.forEach(function (p) { if (!depth.has(p.name)) lost.push(p); });

    var cols = new Map();
    depth.forEach(function (d, name) {
      if (!cols.has(d)) cols.set(d, []);
      cols.get(d).push(parsed.byName.get(name));
    });
    var maxDepth = Math.max.apply(null, Array.from(cols.keys()).concat([-1]));
    var NW = 158, NH = 42, GX = 196, GY = 62, X0 = 26, Y0 = 44;
    var maxRows = 0;
    cols.forEach(function (list) { maxRows = Math.max(maxRows, list.length); });
    if (lost.length) maxRows = Math.max(maxRows, lost.length);
    var width = X0 * 2 + (maxDepth + 1) * GX + (lost.length ? GX : 0);
    var height = Y0 + maxRows * GY + 26;

    var pos = new Map();
    cols.forEach(function (list, d) {
      list.forEach(function (p, i) { pos.set(p.name, { x: X0 + d * GX, y: Y0 + i * GY }); });
    });
    if (lost.length) {
      lost.forEach(function (p, i) { pos.set(p.name, { x: X0 + (maxDepth + 1) * GX, y: Y0 + i * GY }); });
    }

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    function label(x, y, text) {
      var t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', y);
      t.setAttribute('class', 'map-col-label');
      t.textContent = text;
      svg.appendChild(t);
    }
    label(X0, 24, 'Where the night begins');
    if (lost.length) label(X0 + (maxDepth + 1) * GX, 24, 'Lost passages — no path reaches them');

    // Edges first, under the nodes.
    parsed.passages.forEach(function (p) {
      var a = pos.get(p.name);
      if (!a) return;
      p.choices.forEach(function (c) {
        var b = pos.get(c.target);
        if (!b) return;
        var path = document.createElementNS(svgNS, 'path');
        var x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2;
        var dAttr;
        if (x2 > x1) {
          var mx = (x1 + x2) / 2;
          dAttr = 'M ' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2;
        } else {
          // Back-edge: swing below both nodes.
          var by = Math.max(y1, y2) + 34;
          dAttr = 'M ' + (a.x + NW / 2) + ' ' + (a.y + NH) + ' C ' + (a.x + NW / 2) + ' ' + by + ', ' + (b.x + NW / 2) + ' ' + by + ', ' + (b.x + NW / 2) + ' ' + (b.y + NH);
        }
        path.setAttribute('d', dAttr);
        path.setAttribute('class', 'edge' + (visited.has(p.name) && visited.has(c.target) ? ' taken' : ''));
        svg.appendChild(path);
      });
    });

    parsed.passages.forEach(function (p) {
      var pt = pos.get(p.name);
      if (!pt) return;
      var g = document.createElementNS(svgNS, 'g');
      var cls = 'node';
      if (!depth.has(p.name)) cls += ' lost';
      else if (p.name === currentName) cls += ' current visited';
      else if (visited.has(p.name)) cls += ' visited';
      else cls += ' unseen';
      if (p.tags.indexOf('ending') !== -1) cls += ' ending';
      g.setAttribute('class', cls);
      var rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', pt.x); rect.setAttribute('y', pt.y);
      rect.setAttribute('width', NW); rect.setAttribute('height', NH);
      rect.setAttribute('rx', 8);
      g.appendChild(rect);
      var t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', pt.x + NW / 2); t.setAttribute('y', pt.y + NH / 2 + 5);
      t.setAttribute('text-anchor', 'middle');
      var name = p.name.length > 19 ? p.name.slice(0, 18) + '…' : p.name;
      t.textContent = (p.tags.indexOf('ending') !== -1 ? '🔔 ' : '') + name;
      g.appendChild(t);
      svg.appendChild(g);
    });

    wrap.appendChild(svg);
  }

  /* ---------- workshop ---------- */

  var debounce = null;
  function renderReport() {
    var r = report;
    var html = '';
    if (!r.issues.length) {
      html = '<p class="ok-line">✓ The story holds together: ' + r.stats.passages +
        ' passages, ' + r.stats.choices + ' choices, ' + r.stats.endings +
        ' endings — no broken links, no dead ends, nothing unreachable.</p>';
    } else {
      html = '<p>' + r.stats.errors + ' error' + (r.stats.errors === 1 ? '' : 's') +
        ', ' + r.stats.warnings + ' warning' + (r.stats.warnings === 1 ? '' : 's') +
        ' — across ' + r.stats.passages + ' passages and ' + r.stats.endings + ' endings.</p><ul>';
      r.issues.forEach(function (i) {
        html += '<li class="' + i.level + '"><span class="where">' +
          escapeHtml(i.passage) + ':</span> ' + escapeHtml(i.message) + '</li>';
      });
      html += '</ul>';
    }
    els.validateReport.innerHTML = html;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function refreshFromEditor() {
    setStory(els.storyEditor.value);
    renderReport();
    renderPassage(true);
    try { localStorage.setItem('grimbranch-draft', els.storyEditor.value); } catch (e) {}
  }

  els.storyEditor.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(refreshFromEditor, 350);
  });
  els.playDraftBtn.addEventListener('click', function () {
    refreshFromEditor();
    showView('play');
    renderPassage(true);
  });
  els.restoreBtn.addEventListener('click', function () {
    els.storyEditor.value = STORY_TEXT;
    refreshFromEditor();
  });

  /* ---------- boot ---------- */

  els.formatDoc.textContent = FORMAT_DOC;
  els.storyEditor.value = storyText;
  setStory(storyText);
  renderReport();
  if (currentName) renderPassage(true);
})();
