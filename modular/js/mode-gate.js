/* ============================================================
   mode-gate.js — Hard gate that blocks access to mode-disabled pages
   Created: 2026-03-19 by Claude

   Problem: mode-enforcer.js only hides links/cards on the home page.
   Direct URL access bypasses it entirely. This script runs on each
   mode-gated page and blocks rendering if the feature is off.

   Usage: Before loading this script, set window.AA_MODE_GATE to the
   feature key for the page:
     <script>var AA_MODE_GATE = 'checkin';</script>
     <script src="/Academic-Allies/modular/js/mode-gate.js"></script>

   The script checks synchronously using localStorage (no flash),
   then refines with Firestore custom settings once auth loads.
   ============================================================ */
(function() {
  'use strict';

  var gateKey = window.AA_MODE_GATE;
  if (!gateKey) return; /* No gate configured — skip */

  /* ── Same defaults as mode-enforcer.js — keep in sync ── */
  var MODE_DEFAULTS = {
    'normal':        { checkin: true, spoonPlanner: true, mealPlan: true, messages: true, calendar: true, audioNotes: true, emergency: true, statusCircle: true, comfort: true, flowerQuiz: true, supportDash: true },
    'recovery':      { checkin: true, spoonPlanner: true, mealPlan: true, messages: true, calendar: false, audioNotes: false, emergency: true, statusCircle: true, comfort: true, flowerQuiz: true, supportDash: false },
    'bad-brain-day': { checkin: true, spoonPlanner: false, mealPlan: false, messages: true, calendar: false, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false },
    'semi-nope':     { checkin: true, spoonPlanner: true, mealPlan: true, messages: true, calendar: true, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false },
    'nope':          { checkin: false, spoonPlanner: false, mealPlan: false, messages: false, calendar: false, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false },
    'migraine':      { checkin: true, spoonPlanner: false, mealPlan: false, messages: true, calendar: false, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false }
  };

  /* Friendly mode names for the blocked message */
  var MODE_NAMES = {
    'normal': 'Normal', 'recovery': 'Recovery', 'bad-brain-day': 'Bad Brain Day',
    'semi-nope': 'Semi-Nope', 'nope': 'Nope Day', 'migraine': 'Migraine'
  };

  /* ── Read current mode synchronously ── */
  var currentMode = 'normal';
  try { currentMode = localStorage.getItem('appMode') || 'normal'; } catch (e) {}

  /* ── Check if feature is allowed by defaults ── */
  function isAllowed(mode, featureKey, customSettings) {
    var defaults = MODE_DEFAULTS[mode] || MODE_DEFAULTS['normal'];
    var custom = (customSettings && customSettings[mode]) || {};
    if (custom[featureKey] !== undefined) return !!custom[featureKey];
    return defaults[featureKey] !== undefined ? !!defaults[featureKey] : true;
  }

  /* ── Block the page ── */
  function blockPage(mode) {
    var modeName = MODE_NAMES[mode] || mode;
    /* Hide everything currently in <body> */
    var children = document.body.children;
    for (var i = 0; i < children.length; i++) {
      children[i].style.display = 'none';
    }

    /* Insert blocked notice */
    var notice = document.createElement('div');
    notice.id = 'mode-gate-blocked';
    notice.setAttribute('role', 'alert');
    notice.innerHTML =
      '<div style="max-width:480px;margin:80px auto;text-align:center;font-family:\'Atkinson Hyperlegible\',Arial,sans-serif;padding:20px;">' +
        '<div style="font-size:3rem;margin-bottom:16px;">🚫</div>' +
        '<h1 style="font-size:1.5rem;color:#4d787b;margin-bottom:12px;">Module Unavailable</h1>' +
        '<p style="color:#5a6a6b;font-size:1rem;line-height:1.6;margin-bottom:24px;">' +
          'This module is turned off in <strong>' + modeName + '</strong> mode.' +
        '</p>' +
        '<a href="/Academic-Allies/" style="display:inline-block;padding:12px 24px;background:#6CA0A3;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem;">← Back to Home</a>' +
        ' <a href="/Academic-Allies/modular/sitemap.html" style="display:inline-block;padding:12px 24px;background:#fff;color:#6CA0A3;border:2px solid #6CA0A3;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem;margin-left:8px;">Site Map</a>' +
      '</div>';
    document.body.insertBefore(notice, document.body.firstChild);
  }

  /* ── Unblock (if Firestore says feature is actually on) ── */
  function unblockPage() {
    var notice = document.getElementById('mode-gate-blocked');
    if (notice) notice.remove();
    var children = document.body.children;
    for (var i = 0; i < children.length; i++) {
      children[i].style.display = '';
    }
  }

  /* ── Immediate check with defaults (prevents content flash) ── */
  if (currentMode !== 'normal' && !isAllowed(currentMode, gateKey, null)) {
    /* Block as soon as DOM is minimally ready */
    if (document.body) {
      blockPage(currentMode);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        blockPage(currentMode);
      });
    }
  }

  /* ── Refine with Firestore custom settings once auth loads ── */
  function waitForAuth(cb, tries) {
    tries = tries || 0;
    if (window.AA && window.AA.auth && window.AA.db) { cb(); return; }
    if (tries > 50) return; /* give up after ~10s */
    setTimeout(function() { waitForAuth(cb, tries + 1); }, 200);
  }

  waitForAuth(function() {
    window.AA.auth.onAuthStateChanged(function(user) {
      if (!user) return;
      var uid = window.AA_MIRROR_UID || user.uid;
      window.AA.db.collection('users').doc(uid).get().then(function(doc) {
        var customSettings = (doc.exists && doc.data().modeSettings) || null;
        var mode = currentMode;
        try { mode = localStorage.getItem('appMode') || 'normal'; } catch (e) {}

        if (mode === 'normal') {
          /* Normal mode — everything allowed, unblock if we blocked prematurely */
          unblockPage();
          return;
        }

        if (isAllowed(mode, gateKey, customSettings)) {
          /* Custom settings say this feature IS allowed — unblock */
          unblockPage();
        } else if (!document.getElementById('mode-gate-blocked')) {
          /* Custom settings say blocked but we didn't block yet (default said OK) */
          blockPage(mode);
        }
      }).catch(function() {
        /* Firestore failed — defaults already applied, leave as-is */
      });
    });
  });

  /* ── Listen for mode changes (cross-tab or same-tab) ── */
  window.addEventListener('storage', function(e) {
    if (e.key === 'appMode') {
      currentMode = e.newValue || 'normal';
      if (currentMode === 'normal' || isAllowed(currentMode, gateKey, null)) {
        unblockPage();
      } else {
        blockPage(currentMode);
      }
    }
  });

  document.addEventListener('modeChange', function(e) {
    var newMode = e.detail && e.detail.mode;
    if (!newMode) return;
    currentMode = newMode;
    if (currentMode === 'normal' || isAllowed(currentMode, gateKey, null)) {
      unblockPage();
    } else {
      blockPage(currentMode);
    }
  });

})();
