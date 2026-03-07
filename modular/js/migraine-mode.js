/*
 * migraine-mode.js — Academic Allies
 * Created: 2026-03-05 by Claude
 *
 * Migraine mode: reduced-stimulus UI for the student.
 * - Dark background, dim colors, no animations, larger text
 * - One-tap toggle from the mode bar in shared-header
 * - State saved to Firestore so support network sees a banner
 * - Network sees a red "Mary is in migraine mode" banner in mirror view
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'aa_migraine_mode';
  var FIRESTORE_FIELD = 'migraineMode'; // boolean on /users/{uid}

  /* ── CSS injected into <head> when migraine mode is active ── */
  // Claude: 2026-03-05 — use CSS filter on entire page; catches ALL colors including
  // inline styles, yellow cards, etc. invert(1) flips to dark, hue-rotate(180deg)
  // corrects hue so blues stay blue. brightness(0.85) tones down the result.
  // Excludes images (re-inverted back) so photos look normal but dimmed.
  var MIGRAINE_CSS = [
    'html { filter: invert(1) hue-rotate(180deg) brightness(0.75) !important; }',
    'body * { animation: none !important; transition: none !important; }',
    // Re-invert images so they look natural (not color-inverted)
    'img, video, canvas { filter: invert(1) hue-rotate(180deg) brightness(0.7) !important; }',
    // Larger text for easier reading
    'body, p, li, td, th, label, span, div { font-size: 115% !important; line-height: 1.7 !important; }',
    // Migraine button stays visible and red
    '#aa-migraine-btn { filter: none !important; background: #c0392b !important;',
    '  color: #fff !important; font-weight: 700 !important; border: 2px solid #ff6b6b !important; }'
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
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  /* ── Update button label ── */
  function updateBtn(active) {
    var btn = document.getElementById('aa-migraine-btn');
    if (!btn) return;
    btn.textContent = active ? '🌑 Migraine: ON' : '🌑 Migraine';
    btn.title = active ? 'Turn off migraine mode' : 'Turn on migraine mode';
  }

  /* ── Save to Firestore so network sees banner ── */
  function saveToFirestore(active) {
    function _save() {
      if (!window.AA || !window.AA.auth || !window.AA.db) return;
      var user = window.AA.auth.currentUser;
      if (!user) return;
      window.AA.db.collection('users').doc(user.uid)
        .update({ migraineMode: active })
        .catch(function (err) { console.warn('[MigraineMode] Firestore save failed:', err); });
    }
    // Wait for AA to be ready
    if (window.AA && window.AA.auth && window.AA.db) { _save(); return; }
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      if (window.AA && window.AA.auth && window.AA.db) { clearInterval(poll); _save(); }
      if (tries > 30) clearInterval(poll);
    }, 200);
  }

  /* ── Toggle ── */
  window.AA_toggleMigraineMode = function () {
    var nowActive = !isActive();
    localStorage.setItem(STORAGE_KEY, nowActive ? 'true' : 'false');
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
    b.textContent = '🌑 Migraine mode is active — reduced-stimulus UI is on for this student';
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
    updateBtn(isActive());

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
