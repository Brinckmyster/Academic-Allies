/* ============================================================
   status-circle.js — Academic Allies Status Circle Brain
   Written: 2026-02-19 by Claude
   Handles: color logic, Firebase/localStorage data, dev override
   Does NOT handle: drag (draggable.js), pie chart (future thread),
                    weekend logic (future thread)

   Color states:
     grey       → no status yet (default, before check-in)
     green      → clear (flag = green)
     yellow     → moderate concern (flag = yellow)
     orange     → needs attention (flag = orange)
     red        → urgent (flag = red) or NOPE active
     processing → blue spinning (data loading)

   Dev override (browser console):
     AA_setStatus('yellow')   → force a color for testing
     AA_clearStatus()         → clear override, revert to real data
   ============================================================ */

(function () {
  'use strict';

  /* ── Color palette ─────────────────────────────────────── */
  var COLORS = {
    grey:    { bg: '#9E9E9E', label: 'No status yet — check in to update' },
    green:   { bg: '#28a745', label: 'All clear' },
    yellow:  { bg: '#ffc107', label: 'Moderate concern' },
    orange:  { bg: '#fd7e14', label: 'Needs attention' },
    red:     { bg: '#dc3545', label: 'Urgent — please reach out' },
    processing: { bg: '#4a9eff', label: 'Processing…' }
  };

  var DEV_KEY = 'aa-status-dev';
  var _unsubscribeNope = null;

  /* ── Apply a color state to the circle DOM element ─────── */
  function applyState(state) {
    var el = document.getElementById('status-circle');
    if (!el) return;

    var cfg = COLORS[state] || COLORS.grey;

    // Clear any previous state
    el.style.background  = cfg.bg;
    el.style.border      = '';
    el.style.borderTop   = '';
    el.style.animation   = '';
    el.setAttribute('aria-label', 'Status: ' + cfg.label);
    el.setAttribute('title',      'Status: ' + cfg.label + '\n(double-click to reset position)');

    // Processing gets a gentle spinning border overlay
    if (state === 'processing') {
      el.style.background  = 'transparent';
      el.style.border      = '4px solid rgba(74,158,255,0.3)';
      el.style.borderTop   = '4px solid #4a9eff';
      el.style.animation   = 'aa-status-spin 1s linear infinite';
    }
  }

  /* ── Derive flag from localStorage check-in data ────────── */
  function getFlagFromLocalStorage() {
    try {
      var dateKey = new Date().toISOString().split('T')[0];
      var raw = localStorage.getItem('checkins_' + dateKey);
      var log = raw ? JSON.parse(raw) : [];
      if (!log.length) return 'grey';

      var priority = ['grey', 'green', 'yellow', 'orange', 'red'];
      var worst = 'green';
      log.forEach(function (entry) {
        var f = (entry.flag || '').toLowerCase();
        if (priority.indexOf(f) > priority.indexOf(worst)) worst = f;
      });
      return worst;
    } catch (e) {
      return 'grey';
    }
  }

  /* ── Main: listen for auth + Firestore data ─────────────── */
  function listenForStatus() {
    // Dev override takes precedence over everything
    var dev = null;
    try { dev = localStorage.getItem(DEV_KEY); } catch (e) {}
    if (dev && COLORS[dev]) {
      applyState(dev);
      return;
    }

    // Show processing while we wait for Firebase
    applyState('processing');

    // Poll for window.AA (loaded by aa-firebase.js)
    var attempts = 0;
    var poll = setInterval(function () {
      attempts++;

      if (window.AA && window.AA.auth) {
        clearInterval(poll);
        watchAuth();
        return;
      }

      // Firebase never loaded — fall back to localStorage
      if (attempts > 20) {
        clearInterval(poll);
        applyState(getFlagFromLocalStorage());
      }
    }, 300);
  }

  function watchAuth() {
    window.AA.auth.onAuthStateChanged(function (user) {
      // Tear down any previous Firestore listener
      if (_unsubscribeNope) { _unsubscribeNope(); _unsubscribeNope = null; }

      if (!user) {
        // Not signed in — use local check-in data only
        applyState(getFlagFromLocalStorage());
        return;
      }

      // Signed in — watch nope status in real-time
      _unsubscribeNope = window.AA.db
        .collection('nope')
        .doc(user.uid)
        .onSnapshot(function (doc) {
          // Dev override still wins even here
          var dev = null;
          try { dev = localStorage.getItem(DEV_KEY); } catch (e) {}
          if (dev && COLORS[dev]) { applyState(dev); return; }

          // NOPE active → always red
          if (doc.exists && doc.data().active) {
            applyState('red');
            return;
          }

          // Otherwise read today's check-in flag
          // (falls back to localStorage until check-ins move to Firestore)
          applyState(getFlagFromLocalStorage());
        }, function (err) {
          // Firestore read failed — degrade gracefully
          console.warn('[status-circle] Firestore error, using localStorage:', err);
          applyState(getFlagFromLocalStorage());
        });
    });
  }

  /* ── Init (waits for element) ───────────────────────────── */
  function init() {
    var el = document.getElementById('status-circle');
    if (!el) { setTimeout(init, 150); return; }
    applyState('grey');       // safe starting color
    listenForStatus();        // upgrade to real data
  }

  /* ── Inject spinner @keyframes once ────────────────────── */
  function injectCSS() {
    if (document.getElementById('aa-status-circle-styles')) return;
    var style = document.createElement('style');
    style.id = 'aa-status-circle-styles';
    style.textContent = [
      '@keyframes aa-status-spin {',
      '  0%   { transform: rotate(0deg); }',
      '  100% { transform: rotate(360deg); }',
      '}',
      '#status-circle {',
      '  box-sizing: border-box;', // so border doesn't resize the circle
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Public dev-override API ────────────────────────────── */
  /**
   * Test a circle color from the browser console.
   * Valid values: 'grey' | 'green' | 'yellow' | 'orange' | 'red' | 'processing'
   * Example: AA_setStatus('yellow')
   */
  window.AA_setStatus = function (state) {
    if (!COLORS[state]) {
      console.warn('[status-circle] Unknown state "' + state + '". Valid: ' + Object.keys(COLORS).join(', '));
      return;
    }
    try { localStorage.setItem(DEV_KEY, state); } catch (e) {}
    applyState(state);
    console.info('[status-circle] Dev override → ' + state);
  };

  /**
   * Clear the dev override and revert to real data.
   * Example: AA_clearStatus()
   */
  window.AA_clearStatus = function () {
    try { localStorage.removeItem(DEV_KEY); } catch (e) {}
    listenForStatus();
    console.info('[status-circle] Dev override cleared — reverting to real data');
  };

  /* ── Kick off ───────────────────────────────────────────── */
  injectCSS();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
