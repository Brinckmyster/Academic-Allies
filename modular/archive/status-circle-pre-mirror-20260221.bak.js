/* ============================================================
   status-circle.js — Academic Allies Status Circle Brain
   Written:  2026-02-19 by Claude
   Updated:  2026-02-21 by Claude — 5-segment ring, day logic, click toggle

   Views (click circle to toggle):
     ring  → colored arc per category (default)
     solid → single overall color

   Segments (day-of-week gated):
     Mon–Fri : Academic, Spiritual, Mental/Emotional, Physical, Social
     Saturday: Social only
     Sunday  : Spiritual only

   Each segment colored from today's latest check-in entry.
   No grey — segments with no data simply don't appear.
   NOPE active → always solid red (no segments).

   Dev console:
     AA_setStatus('yellow')  → force color for testing
     AA_clearStatus()        → revert to real data
   ============================================================ */

(function () {
  'use strict';

  /* ── Color values ──────────────────────────────────────── */
  var C = {
    green:  '#28a745',
    yellow: '#ffc107',
    orange: '#fd7e14',
    red:    '#dc3545'
  };

  var DEV_KEY  = 'aa-status-dev';
  var VIEW_KEY = 'aa-status-view';  /* 'ring' | 'solid' */

  /* ── Runtime state ─────────────────────────────────────── */
  var _view      = 'ring';
  var _segData   = {};     /* { segmentName: colorHex } */
  var _nope      = false;
  var _unsubNope = null;
  var _unsubDay  = null;

  /* ── Day-of-week → eligible segments (0=Sun … 6=Sat) ───── */
  var DAY_SEGS = [
    ['Spiritual'],                                                    /* 0 Sun */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 1 Mon */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 2 Tue */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 3 Wed */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 4 Thu */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 5 Fri */
    ['Social']                                                        /* 6 Sat */
  ];

  function eligibleSegs() {
    return DAY_SEGS[new Date().getDay()];
  }

  /* ── Segment color from one check-in entry ─────────────── */
  /* Returns a color hex string, or null if segment has no data */
  function colorOf(seg, e) {
    if (!e) return null;
    var emg = (e.emergency === 'yes');

    if (seg === 'Academic') {
      if (emg)                  return C.red;
      if (e.planner === 'yes')  return C.green;
      if (e.planner === 'no')   return C.yellow;
      return null;
    }

    if (seg === 'Social') {
      if (emg)                  return C.red;
      if (e.support === 'yes')  return C.green;
      if (e.support === 'no')   return C.yellow;
      return null;
    }

    if (seg === 'Physical') {
      if (emg) return C.red;
      var hasSymp  = (e.symptoms === 'yes' || e.symptoms === 'no');
      var hasSleep = (e.sleep    === 'yes' || e.sleep    === 'no');
      if (!hasSymp && !hasSleep) return null;
      var sympYes = (e.symptoms === 'yes');
      var sleepNo = (e.sleep    === 'no');
      var cnt = Array.isArray(e.symptomList) ? e.symptomList.length : 0;
      if (sympYes && cnt >= 3)   return C.red;
      if (sympYes && sleepNo)    return C.orange;
      if (sympYes || sleepNo)    return C.yellow;
      return C.green;
    }

    if (seg === 'Mental/Emotional') {
      if (emg) return C.red;
      var fog = (e.symptoms === 'yes' &&
                 Array.isArray(e.symptomList) &&
                 e.symptomList.some(function (s) {
                   return /brain.fog|trouble.think/i.test(s);
                 }));
      var m = e.mood || '';
      if (m === 'Struggling')                         return C.red;
      if (m === 'Anxious')                            return C.orange;
      if (m === 'Okay' || m === 'Tired' || fog)       return C.yellow;
      if (m === 'Great' || m === 'Good')              return C.green;
      return null;
    }

    if (seg === 'Spiritual') return null; /* not tracked in check-in yet */

    return null;
  }

  /* ── Build segData from a Firestore/localStorage entries array ── */
  function fromEntries(entries) {
    var entry = (entries && entries.length) ? entries[entries.length - 1] : null;
    var out = {};
    eligibleSegs().forEach(function (seg) {
      var c = colorOf(seg, entry);
      if (c !== null) out[seg] = c;
    });
    return out;
  }

  /* ── Worst color across all visible segments ───────────── */
  var RANK = [C.green, C.yellow, C.orange, C.red];

  function worstColor(sd) {
    var keys = Object.keys(sd);
    if (!keys.length) return null;
    var r = 0;
    keys.forEach(function (k) {
      var ri = RANK.indexOf(sd[k]);
      if (ri > r) r = ri;
    });
    return RANK[r];
  }

  /* ── SVG donut ring builder ────────────────────────────── */
  var CX = 20, CY = 20, OR = 18, IR = 11;

  function ptAt(r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return (CX + r * Math.cos(rad)).toFixed(2) + ',' +
           (CY + r * Math.sin(rad)).toFixed(2);
  }

  var STATUS_LABEL = {};
  STATUS_LABEL[C.green]  = 'clear';
  STATUS_LABEL[C.yellow] = 'some concern';
  STATUS_LABEL[C.orange] = 'needs attention';
  STATUS_LABEL[C.red]    = 'urgent';

  function segPath(color, a0, a1, name) {
    var large = (a1 - a0 > 180) ? 1 : 0;
    var d = 'M' + ptAt(OR, a0) +
            ' A' + OR + ',' + OR + ',0,' + large + ',1,' + ptAt(OR, a1) +
            ' L' + ptAt(IR, a1) +
            ' A' + IR + ',' + IR + ',0,' + large + ',0,' + ptAt(IR, a0) +
            ' Z';
    var tip = name + ': ' + (STATUS_LABEL[color] || '');
    return '<path d="' + d + '" fill="' + color + '"><title>' + tip + '</title></path>';
  }

  var EMPTY_SVG =
    '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="14.5" fill="none" stroke="#e0e0e0" stroke-width="7"/>' +
    '</svg>';

  function makeSVG(sd) {
    var segs = Object.keys(sd);
    var n = segs.length;
    if (n === 0) return EMPTY_SVG;

    var gap      = n > 1 ? 3 : 0;
    var arcSize  = n === 1 ? 359.9 : (360 / n - gap);
    var paths    = '';

    segs.forEach(function (name, i) {
      var a0 = i * (360 / n) + gap / 2;
      var a1 = a0 + arcSize;
      paths += segPath(sd[name], a0, a1, name);
    });

    return '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">' +
           paths + '</svg>';
  }

  /* ── Render current state to DOM ────────────────────────── */
  var SOLID_LABEL = {};
  SOLID_LABEL[C.red]    = 'Urgent — please reach out';
  SOLID_LABEL[C.orange] = 'Needs attention';
  SOLID_LABEL[C.yellow] = 'Moderate concern';
  SOLID_LABEL[C.green]  = 'All clear';

  function render() {
    var el = document.getElementById('status-circle');
    if (!el) return;

    el.style.border     = '';
    el.style.borderTop  = '';
    el.style.animation  = '';
    el.style.background = 'transparent';
    el.innerHTML        = '';

    /* NOPE: always solid red, no segments */
    if (_nope) {
      el.style.background = C.red;
      el.setAttribute('aria-label', 'Status: Urgent — NOPE mode active');
      el.title = 'Urgent — NOPE mode active (double-click to reset position)';
      return;
    }

    if (_view === 'ring') {
      el.innerHTML = makeSVG(_segData);
      var keys = Object.keys(_segData);
      var w    = worstColor(_segData);
      var lbl  = keys.length
        ? keys.join(', ') + ' — ' + (STATUS_LABEL[w] || 'all clear')
        : 'No check-in yet';
      el.setAttribute('aria-label', 'Status: ' + lbl);
      el.title = lbl + ' · click for overall view · double-click to reset position';
    } else {
      /* Solid overall view */
      var color = worstColor(_segData);
      if (color) {
        el.style.background = color;
        el.setAttribute('aria-label', 'Status: ' + (SOLID_LABEL[color] || ''));
        el.title = (SOLID_LABEL[color] || '') +
                   ' · click for segments · double-click to reset position';
      } else {
        el.innerHTML = EMPTY_SVG;
        el.setAttribute('aria-label', 'Status: No check-in yet');
        el.title = 'No check-in yet · double-click to reset position';
      }
    }
  }

  function renderProcessing() {
    var el = document.getElementById('status-circle');
    if (!el) return;
    el.innerHTML        = '';
    el.style.background = 'transparent';
    el.style.border     = '4px solid rgba(74,158,255,0.3)';
    el.style.borderTop  = '4px solid #4a9eff';
    el.style.animation  = 'aa-status-spin 1s linear infinite';
    el.setAttribute('aria-label', 'Status: Processing…');
  }

  /* ── Click: toggle ring ↔ solid ─────────────────────────── */
  function setupToggle() {
    var el = document.getElementById('status-circle');
    if (!el || el._scToggleReady) return;
    el._scToggleReady = true;
    el.addEventListener('click', function () {
      _view = (_view === 'ring') ? 'solid' : 'ring';
      try { localStorage.setItem(VIEW_KEY, _view); } catch (e) {}
      render();
    });
  }

  /* ── Firebase / Firestore listeners ─────────────────────── */
  function teardown() {
    if (_unsubNope) { _unsubNope(); _unsubNope = null; }
    if (_unsubDay)  { _unsubDay();  _unsubDay  = null; }
  }

  function localData() {
    try {
      var k   = new Date().toISOString().split('T')[0];
      var raw = localStorage.getItem('checkins_' + k);
      return fromEntries(raw ? JSON.parse(raw) : []);
    } catch (e) { return {}; }
  }

  function startWatching(user) {
    var dateKey = new Date().toISOString().split('T')[0];
    teardown();

    _unsubNope = window.AA.db.collection('nope').doc(user.uid)
      .onSnapshot(function (doc) {
        _nope = !!(doc.exists && doc.data().active);
        render();
      }, function (err) {
        console.warn('[status-circle] nope listener:', err);
      });

    _unsubDay = window.AA.db
      .collection('checkins').doc(user.uid)
      .collection('days').doc(dateKey)
      .onSnapshot(function (doc) {
        var entries = (doc.exists && Array.isArray(doc.data().entries))
          ? doc.data().entries : [];
        _segData = fromEntries(entries);
        render();
      }, function (err) {
        console.warn('[status-circle] checkin listener:', err);
        _segData = localData();
        render();
      });
  }

  /* ── Boot: check dev override, then connect to Firebase ──── */
  function boot() {
    var dev = null;
    try { dev = localStorage.getItem(DEV_KEY); } catch (e) {}

    /* Dev override — bypass Firebase entirely */
    if (dev === 'processing') { renderProcessing(); return; }
    if (dev) {
      var devColorMap = { green: C.green, yellow: C.yellow, orange: C.orange, red: C.red };
      var devC = devColorMap[dev];
      _nope = false;
      _segData = devC ? { 'Dev': devC } : {};
      render();
      return;
    }

    renderProcessing();

    /* Poll for window.AA (loaded by aa-firebase.js via shared-header) */
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      if (window.AA && window.AA.auth) {
        clearInterval(poll);
        window.AA.auth.onAuthStateChanged(function (user) {
          if (!user) {
            teardown();
            _nope = false;
            _segData = localData();
            render();
            return;
          }
          startWatching(user);
        });
        return;
      }
      /* Firebase unavailable after ~6 s — fall back to localStorage */
      if (tries > 20) {
        clearInterval(poll);
        _segData = localData();
        render();
      }
    }, 300);
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    var el = document.getElementById('status-circle');
    if (!el) { setTimeout(init, 150); return; }

    /* Restore saved view preference */
    try {
      var v = localStorage.getItem(VIEW_KEY);
      if (v === 'solid' || v === 'ring') _view = v;
    } catch (e) {}

    setupToggle();
    boot();
  }

  /* ── Dev API ────────────────────────────────────────────── */
  /**
   * Force a color for testing (browser console).
   * Valid values: 'green' | 'yellow' | 'orange' | 'red' | 'processing'
   * Example: AA_setStatus('orange')
   */
  window.AA_setStatus = function (state) {
    var valid = ['green', 'yellow', 'orange', 'red', 'processing'];
    if (valid.indexOf(state) === -1) {
      console.warn('[status-circle] Valid states: ' + valid.join(', '));
      return;
    }
    try { localStorage.setItem(DEV_KEY, state); } catch (e) {}
    if (state === 'processing') {
      renderProcessing();
    } else {
      var devColorMap2 = { green: C.green, yellow: C.yellow, orange: C.orange, red: C.red };
      _nope = false;
      _segData = { 'Dev': devColorMap2[state] };
      render();
    }
    console.info('[status-circle] Dev override →', state);
  };

  /**
   * Clear dev override and revert to real data.
   * Example: AA_clearStatus()
   */
  window.AA_clearStatus = function () {
    try { localStorage.removeItem(DEV_KEY); } catch (e) {}
    boot();
    console.info('[status-circle] Dev override cleared — reverting to real data');
  };

  /* ── Inject CSS once ─────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('aa-sc-style')) return;
    var s = document.createElement('style');
    s.id = 'aa-sc-style';
    s.textContent =
      '@keyframes aa-status-spin{' +
        '0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}' +
      '}' +
      '#status-circle{box-sizing:border-box;}' +
      '#status-circle svg{display:block;}';
    document.head.appendChild(s);
  }

  /* ── Kick off ───────────────────────────────────────────── */
  injectCSS();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
