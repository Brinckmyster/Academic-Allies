/* ============================================================
   mode-enforcer.js — Actually applies mode settings across the app
   Created: 2026-03-09 by Claude

   Problem solved: modes.html lets students configure which features
   each mode enables, but nothing read those settings. Module cards,
   nav links, and the NOPE banner were always shown regardless.

   This script:
   1. Reads the active mode from localStorage ('appMode')
   2. Fetches the student's modeSettings from Firestore
   3. Hides/shows module cards, nav links, and sections accordingly
   4. Listens for modeChange events so switches take effect immediately
   5. Runs on every page via shared-header.html
   ============================================================ */
(function() {
  'use strict';

  /* ── Feature → DOM selector map ─────────────────────────────
     Each feature key maps to selectors for elements that should
     be hidden when that feature is OFF. Multiple selectors per
     feature to cover index cards, nav links, and page sections. */
  var FEATURE_SELECTORS = {
    checkin: [
      'a.module-card[href*="checkin.html"]',
      '.nav-list a[href*="checkin.html"]',
      '#checkinPrompt'
    ],
    /* Claude: 2026-03-09 — SpoonPal card moved inside Spoon Planner page */
    spoonPlanner: [
      'a.module-card[href*="spoon-planner.html"]',
      '#spoonpalLink'
    ],
    mealPlan: [
      'a.module-card[href*="meal-planner"]'
    ],
    messages: [
      'a.module-card[href*="message-system"]',
      '.nav-list a[href*="message-system"]'
    ],
    calendar: [
      'a.module-card[href*="calendar.html"]',
      '.nav-list a[href*="calendar.html"]'
    ],
    audioNotes: [
      'a.module-card[href*="audio-notes"]',
      '#audioNotesNavLi a'
    ],
    emergency: [
      'a.module-card[href*="emergency.html"]',
      '.nav-list a[href*="emergency.html"]'
    ],
    statusCircle: [
      '#status-circle'
    ],
    comfort: [
      'a.module-card[href*="recovery-mode.html"]'
    ],
    flowerQuiz: [],  /* no DOM element yet — ready for when it's added */
    supportDash: [
      '#supportDashCard'
    ]
  };

  /* ── Same defaults as modes.html — keep in sync ── */
  var MODE_DEFAULTS = {
    'normal':        { checkin: true, spoonPlanner: true, mealPlan: true, messages: true, calendar: true, audioNotes: true, emergency: true, statusCircle: true, comfort: true, flowerQuiz: true, supportDash: true },
    'recovery':      { checkin: true, spoonPlanner: true, mealPlan: true, messages: true, calendar: false, audioNotes: false, emergency: true, statusCircle: true, comfort: true, flowerQuiz: true, supportDash: false },
    'bad-brain-day': { checkin: true, spoonPlanner: false, mealPlan: false, messages: true, calendar: false, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false },
    'semi-nope':     { checkin: true, spoonPlanner: true, mealPlan: true, messages: true, calendar: true, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false },
    'nope':          { checkin: false, spoonPlanner: false, mealPlan: false, messages: false, calendar: false, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false },
    'migraine':      { checkin: true, spoonPlanner: false, mealPlan: false, messages: true, calendar: false, audioNotes: false, emergency: true, statusCircle: false, comfort: true, flowerQuiz: false, supportDash: false }
  };

  var FEATURE_KEYS = Object.keys(FEATURE_SELECTORS);
  var _modeSettings = null; /* loaded from Firestore once */
  var _uid = null;
  var _applied = false;

  /* ── Get effective feature states for a mode ── */
  function getEffective(modeKey) {
    var defaults = MODE_DEFAULTS[modeKey] || MODE_DEFAULTS['normal'];
    var custom = (_modeSettings && _modeSettings[modeKey]) || {};
    var result = {};
    FEATURE_KEYS.forEach(function(key) {
      result[key] = (custom[key] !== undefined) ? custom[key] : (defaults[key] !== undefined ? defaults[key] : true);
    });
    return result;
  }

  /* ── Apply mode to the DOM ── */
  function applyMode(modeKey) {
    if (!modeKey || modeKey === 'normal') {
      /* Normal mode: show everything — remove any previously hidden items */
      _showAll();
      _applied = false;
      return;
    }

    var effective = getEffective(modeKey);

    FEATURE_KEYS.forEach(function(featureKey) {
      var selectors = FEATURE_SELECTORS[featureKey];
      if (!selectors || selectors.length === 0) return;

      var shouldShow = effective[featureKey];
      selectors.forEach(function(sel) {
        var els = document.querySelectorAll(sel);
        els.forEach(function(el) {
          if (shouldShow) {
            /* Restore visibility — but respect role-based hiding (display:none via JS) */
            el.removeAttribute('data-mode-hidden');
            /* Only restore display if WE hid it */
            if (el.getAttribute('data-mode-display')) {
              el.style.display = el.getAttribute('data-mode-display');
              el.removeAttribute('data-mode-display');
            }
          } else {
            /* Save the current display value before hiding */
            if (!el.getAttribute('data-mode-hidden')) {
              var current = el.style.display || window.getComputedStyle(el).display;
              /* Don't hide something that's already hidden by role logic */
              if (current === 'none') return;
              el.setAttribute('data-mode-display', current);
              el.setAttribute('data-mode-hidden', 'true');
              el.style.display = 'none';
            }
          }
        });
      });
    });

    _applied = true;

    /* Also hide the "Today's Snapshot" section label + cards when checkin is off */
    if (!effective.checkin) {
      var snap = document.getElementById('todaySnapshot');
      if (snap && !snap.getAttribute('data-mode-hidden')) {
        snap.setAttribute('data-mode-display', snap.style.display || 'grid');
        snap.setAttribute('data-mode-hidden', 'true');
        snap.style.display = 'none';
        /* Hide the section label above it too */
        var prev = snap.previousElementSibling;
        if (prev && prev.classList.contains('section-label')) {
          prev.setAttribute('data-mode-display', prev.style.display || 'block');
          prev.setAttribute('data-mode-hidden', 'true');
          prev.style.display = 'none';
        }
      }
    }
  }

  /* ── Show everything (normal mode or cleanup) ── */
  function _showAll() {
    var hidden = document.querySelectorAll('[data-mode-hidden]');
    hidden.forEach(function(el) {
      var origDisplay = el.getAttribute('data-mode-display');
      if (origDisplay) el.style.display = origDisplay;
      el.removeAttribute('data-mode-hidden');
      el.removeAttribute('data-mode-display');
    });
  }

  /* ── Get current mode ── */
  function getCurrentMode() {
    return localStorage.getItem('appMode') || 'normal';
  }

  /* ── Listen for mode changes (from modes.html tiles) ── */
  document.addEventListener('modeChange', function(e) {
    var newMode = e.detail && e.detail.mode;
    if (newMode) {
      _showAll(); /* reset first */
      applyMode(newMode);
    }
  });

  /* ── Also listen for localStorage changes (cross-tab sync) ── */
  window.addEventListener('storage', function(e) {
    if (e.key === 'appMode') {
      _showAll();
      applyMode(e.newValue || 'normal');
    }
  });

  /* ── Load settings from Firestore then apply ── */
  function loadAndApply() {
    var mode = getCurrentMode();
    if (mode === 'normal' && !_modeSettings) {
      /* Normal mode with no custom settings — nothing to enforce */
      return;
    }
    applyMode(mode);
  }

  /* ── Wait for AA + auth, then load settings ── */
  function waitForAuth(cb, tries) {
    tries = tries || 0;
    if (window.AA && window.AA.auth && window.AA.db) { cb(); return; }
    if (tries > 50) {
      /* AA never loaded — apply defaults without custom settings */
      loadAndApply();
      return;
    }
    setTimeout(function() { waitForAuth(cb, tries + 1); }, 200);
  }

  /* ── Boot: apply defaults immediately (no flash), then refine with Firestore data ── */
  var bootMode = getCurrentMode();
  if (bootMode !== 'normal') {
    /* Apply defaults immediately for non-normal modes (before Firestore loads) */
    /* Wait a tick for the DOM to be populated (header fetch, module cards) */
    var _applyPoll = setInterval(function() {
      var cards = document.querySelectorAll('.module-card');
      if (cards.length > 0 || document.readyState === 'complete') {
        clearInterval(_applyPoll);
        applyMode(bootMode);
      }
    }, 150);
    setTimeout(function() { clearInterval(_applyPoll); }, 8000);
  }

  /* Then load Firestore settings and re-apply with custom overrides */
  waitForAuth(function() {
    window.AA.auth.onAuthStateChanged(function(user) {
      if (!user) {
        _uid = null;
        _modeSettings = null;
        return;
      }
      _uid = user.uid;
      window.AA.db.collection('users').doc(user.uid).get().then(function(doc) {
        if (doc.exists && doc.data().modeSettings) {
          _modeSettings = doc.data().modeSettings;
        }
        /* Re-apply now that we have custom settings */
        var mode = getCurrentMode();
        if (mode !== 'normal') {
          _showAll();
          applyMode(mode);
        }
      }).catch(function() {
        /* Firestore failed — defaults already applied */
      });
    });
  });

  /* ── Public API ── */
  window.AA_getActiveMode = getCurrentMode;
  window.AA_applyMode = function(modeKey) {
    localStorage.setItem('appMode', modeKey);
    _showAll();
    applyMode(modeKey);
  };

})();
