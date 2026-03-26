/*
 * migraine-mode.js — Academic Allies
 * Created: 2026-03-05 by Claude
 * Updated: 2026-03-09 by Claude — true dimming, stronger values, no undimmed bars,
 *   mirror mode sends suggestion instead of hiding button.
 *   Archive: modular/archive/migraine-mode_2026-03-09_pre-mirror-suggest.js
 *
 * Migraine mode: reduced-stimulus UI for the student.
 * - Dimmed brightness, warm tone, muted colors, no animations, larger text
 * - One-tap toggle from the mode bar in shared-header
 * - State saved to Firestore so support network sees a banner
 * - Network sees a banner in mirror view
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'aa_migraine_mode';
  var FIRESTORE_FIELD = 'migraineMode'; // boolean on /users/{uid}

  /* ── CSS injected into <head> when migraine mode is active ── */
  /* Claude: 2026-03-09 — full-page dimming on html (not body) so nothing escapes.
     brightness(0.3) = truly dark, like reading by candlelight
     saturate(0.15)  = nearly grayscale, minimal color noise
     sepia(0.35)     = warm tone to cut blue light
     contrast(0.7)   = softer edges, less jarring
     backdrop-filter disabled on fixed elements to prevent undimmed bars. */
  var MIGRAINE_CSS = [
    'html { filter: brightness(0.3) saturate(0.15) sepia(0.35) contrast(0.7) !important; }',
    // Kill ALL animations and transitions — motion triggers migraines
    '*, *::before, *::after { animation: none !important; transition: none !important; }',
    // Slightly larger text + generous line-height for easier reading
    'body, p, li, td, th, label, span, div { font-size: 110% !important; line-height: 1.65 !important; }',
    // Soften link colors so nothing pops aggressively
    'a, a:visited { color: #7a9a9c !important; }',
    // Tone down any harsh borders or shadows
    '* { box-shadow: none !important; text-shadow: none !important; }',
    // Kill backdrop-filter on all fixed elements — prevents undimmed bars
    '#aa-credit-footer, #sc-banner, #aa-session-warning, [style*="backdrop-filter"] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
    // Migraine button stays findable so you can turn it off
    '#aa-migraine-btn { filter: brightness(1.8) !important; background: #8b4513 !important;',
    '  color: #fff !important; font-weight: 700 !important; border: 2px solid #d2691e !important; }'
  ].join('\n');

  var _styleEl = null;

  /* ── Apply / remove CSS ── */
  function applyCSS() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.id = 'aa-migraine-css';
    _styleEl.textContent = MIGRAINE_CSS;
    document.head.appendChild(_styleEl);
  }

  function removeCSS() {
    if (_styleEl) { _styleEl.remove(); _styleEl = null; }
    var el = document.getElementById('aa-migraine-css');
    if (el) el.remove();
  }

  /* ── Check current state ── */
  function isActive() {
    /* Claude: 2026-03-16 — safe storage read */
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      console.warn('[AA] localStorage read failed:', e.message);
      return false;
    }
  }

  /* ── Update button label ── */
  function updateBtn(active) {
    var btn = document.getElementById('aa-migraine-btn');
    if (!btn) return;
    btn.textContent = active ? '🌑 Dim: ON' : '🌑 Migraine';
    btn.title = active ? 'Turn off migraine dim mode' : 'Dim the screen for migraine relief';
  }

  /* ── Save to Firestore so network sees banner ── */
  /* Claude: 2026-03-21 — Triple redundancy (Mary-proof):
     Layer 1: localStorage (synchronous, guaranteed)
     Layer 2: Firestore primary cloud write
     Layer 3: Retry queue if Firestore fails */
  function saveToFirestore(active) {
    function _save() {
      if (!window.AA || !window.AA.auth || !window.AA.db) return;
      var user = window.AA.auth.currentUser;
      if (!user) return;

      /* Layer 1: localStorage backup FIRST (synchronous, survives connection loss) */
      try {
        localStorage.setItem('AA_MIGRAINE_BACKUP_' + user.uid, JSON.stringify({ migraineMode: active, savedAt: new Date().toISOString() }));
        console.log('[MigraineMode] Layer 1 — localStorage backup saved');
      } catch(lsErr) {
        try { sessionStorage.setItem('AA_MIGRAINE_BACKUP_' + user.uid, JSON.stringify({ migraineMode: active })); } catch(ssErr) {}
      }

      /* Layer 2: Firestore write with timeout */
      var saveTimeout = setTimeout(function() {
        console.warn('[MigraineMode] Firestore save timed out after 8s — queuing retry');
        /* Layer 3: Queue for retry */
        try {
          var queue = JSON.parse(localStorage.getItem('AA_MIGRAINE_RETRY_QUEUE') || '[]');
          queue.push({ uid: user.uid, active: active, queuedAt: new Date().toISOString() });
          if (queue.length > 10) queue = queue.slice(-10);
          localStorage.setItem('AA_MIGRAINE_RETRY_QUEUE', JSON.stringify(queue));
        } catch(e) {}
      }, 8000);

      window.AA.db.collection('users').doc(user.uid)
        .update({ migraineMode: active })
        .then(function() {
          clearTimeout(saveTimeout);
          /* Clean up localStorage backup on success */
          try { localStorage.removeItem('AA_MIGRAINE_BACKUP_' + user.uid); } catch(e) {}
          console.log('[MigraineMode] Layer 2 — Firestore saved');
        })
        .catch(function (err) {
          clearTimeout(saveTimeout);
          console.warn('[MigraineMode] Firestore save failed:', err);
          /* Layer 3: Queue for retry */
          try {
            var queue = JSON.parse(localStorage.getItem('AA_MIGRAINE_RETRY_QUEUE') || '[]');
            queue.push({ uid: user.uid, active: active, queuedAt: new Date().toISOString() });
            if (queue.length > 10) queue = queue.slice(-10);
            localStorage.setItem('AA_MIGRAINE_RETRY_QUEUE', JSON.stringify(queue));
          } catch(e2) {}
        });
    }

    /* Process any pending retries from previous failures */
    function _processRetryQueue() {
      try {
        var queue = JSON.parse(localStorage.getItem('AA_MIGRAINE_RETRY_QUEUE') || '[]');
        if (queue.length === 0) return;
        console.log('[MigraineMode] Processing', queue.length, 'queued retries');
        localStorage.removeItem('AA_MIGRAINE_RETRY_QUEUE');
        queue.forEach(function(item) {
          if (window.AA && window.AA.db) {
            window.AA.db.collection('users').doc(item.uid)
              .update({ migraineMode: item.active })
              .then(function() { console.log('[MigraineMode] Retry succeeded for', item.uid); })
              .catch(function() { /* give up silently — user will toggle again */ });
          }
        });
      } catch(e) {}
    }

    // Wait for AA to be ready
    if (window.AA && window.AA.auth && window.AA.db) { _processRetryQueue(); _save(); return; }
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      if (window.AA && window.AA.auth && window.AA.db) { clearInterval(poll); _processRetryQueue(); _save(); }
      if (tries > 30) clearInterval(poll);
    }, 200);
  }

  /* ── Toggle ── */
  /* Claude: 2026-03-09 — in mirror mode, sends a suggestion instead of toggling directly.
     The button stays visible for supporters (no longer hidden). */
  window.AA_toggleMigraineMode = function () {
    if (window.AA_MIRROR_UID) {
      /* Mirror mode: send a migraine suggestion to the student */
      if (!window.AA || !window.AA.suggestMode) {
        alert('Suggestion system not ready — please wait a moment and try again.');
        return;
      }
      var btn = document.getElementById('aa-migraine-btn');
      if (btn) { btn.textContent = '🌑 Sending…'; btn.disabled = true; }
      window.AA.suggestMode(window.AA_MIRROR_UID, 'migraine', {})
        .then(function () {
          if (btn) { btn.textContent = '🌑 Suggested!'; }
          setTimeout(function () {
            if (btn) { btn.textContent = '🌑 Suggest Migraine'; btn.disabled = false; }
          }, 3000);
        })
        .catch(function (err) {
          if (btn) { btn.textContent = '🌑 Suggest Migraine'; btn.disabled = false; }
          alert('Could not send suggestion: ' + (err.message || err));
        });
      return;
    }
    var nowActive = !isActive();
    /* Claude: 2026-03-16 — safe storage write */
    try {
      localStorage.setItem(STORAGE_KEY, nowActive ? 'true' : 'false');
    } catch (e) {
      console.warn('[AA] localStorage write failed:', e.message);
    }
    if (nowActive) { applyCSS(); } else { removeCSS(); }
    updateBtn(nowActive);
    saveToFirestore(nowActive);
  };

  /* ── Network banner: shown to support network when mirroring a student in migraine mode ── */
  function showNetworkBanner() {
    if (document.getElementById('aa-migraine-network-banner')) return;
    var b = document.createElement('div');
    b.id = 'aa-migraine-network-banner';
    b.style.cssText = [
      'position:fixed;top:0;left:0;right:0;z-index:99999;',
      'background:#7b2d2d;color:#fff;text-align:center;',
      'padding:10px 16px;font-size:14px;font-weight:600;',
      'letter-spacing:0.02em;box-shadow:0 2px 8px rgba(0,0,0,0.3);'
    ].join('');
    b.textContent = '🌑 Migraine mode is active — screen is dimmed and muted for this student';
    document.body.insertBefore(b, document.body.firstChild);
    // Push page content down
    document.body.style.paddingTop = (parseInt(document.body.style.paddingTop || 0) + 44) + 'px';
  }

  function hideNetworkBanner() {
    var b = document.getElementById('aa-migraine-network-banner');
    if (b) {
      document.body.style.paddingTop = Math.max(0, parseInt(document.body.style.paddingTop || 0) - 44) + 'px';
      b.remove();
    }
  }

  /* ── Watch mirrored student's migraineMode field ── */
  function watchMirrorMigraine() {
    if (!window.AA_MIRROR_UID) return;
    if (!window.AA || !window.AA.db) return;
    window.AA.db.collection('users').doc(window.AA_MIRROR_UID)
      .onSnapshot(function (doc) {
        if (doc.exists && doc.data().migraineMode) {
          showNetworkBanner();
        } else {
          hideNetworkBanner();
        }
      }, function (err) {
        console.warn('[MigraineMode] Mirror watch failed:', err);
      });
  }

  /* ── Init: apply on load if active, set up button, watch mirror ── */
  function init() {
    if (isActive()) applyCSS();

    /* Claude: 2026-03-09 — button always visible. In mirror mode, relabeled to "Suggest Migraine"
       instead of hidden. Supporters can suggest; only the student can toggle directly. */
    if (window.AA_MIRROR_UID) {
      var btn = document.getElementById('aa-migraine-btn');
      if (btn) {
        btn.textContent = '🌑 Suggest Migraine';
        btn.title = 'Suggest migraine mode to this student';
      }
    } else {
      updateBtn(isActive());
    }

    // If in mirror mode, watch the student's state
    if (window.AA_MIRROR_UID) {
      if (window.AA && window.AA.db) {
        watchMirrorMigraine();
      } else {
        var tries = 0;
        var poll = setInterval(function () {
          tries++;
          if (window.AA && window.AA.db) { clearInterval(poll); watchMirrorMigraine(); }
          if (tries > 30) clearInterval(poll);
        }, 200);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
