/* ============================================================
   student-config.js — Academic Allies Student Configuration System
   Created: 2026-03-18 by Claude

   Per-student customization layer that loads config from Firestore
   and provides safe nested access with fallback defaults.

   Usage:
     <script src="/Academic-Allies/modular/aa-firebase.js"></script>
     <script src="/Academic-Allies/modular/js/student-config.js"></script>

     window.AA_CONFIG.load(uid).then(function(config) {
       var baseBudget = window.AA_CONFIG.get('spoonPlan.baseBudget', 20);
     });

   Firestore path: /studentConfig/{uid}
   ============================================================ */

(function () {
  'use strict';

  /* ── Complete default configuration ────────────────────────── */
  var DEFAULT_CONFIG = {
    modes: {
      available: ['normal', 'recovery', 'bad-brain', 'semi-nope', 'nope', 'migraine'],
      custom: {},  /* overrides per mode: { 'bad-brain': { name: '...', icon: '...', desc: '...' } } */
      /* Claude: 2026-03-19 — card-level config per mode page.
         Each mode can define which cards appear and in what order.
         Cards not listed are hidden. Order follows array order.
         If no cards config exists for a mode, all defaults show. */
      cards: {
        'recovery': [
          { id: 'emergency',  label: 'Emergency Support',    enabled: true },
          { id: 'energy',     label: 'Energy Check-In',      enabled: true },
          { id: 'tasks',      label: 'Today\'s Tasks',       enabled: true },
          { id: 'breathing',  label: 'Breathe With Me',      enabled: true },
          { id: 'meals',      label: 'Easy Meal Ideas',      enabled: true },
          { id: 'flower',     label: 'Flower Practice Link', enabled: true },
          { id: 'selfcare',   label: 'Tiny Self-Care Wins',  enabled: true },
          { id: 'scripture',  label: 'A Word of Comfort',    enabled: true },
          { id: 'youmatter',  label: 'You Matter',           enabled: true },
          { id: 'bedroom',    label: 'Bedroom Planner',      enabled: true },
          /* Claude: 2026-03-30 — Brain Bloom disabled by default; network lead enables per student */
          { id: 'brain-bloom', label: 'Brain Bloom',          enabled: false },
          /* Claude: 2026-03-30 — Emoticon Defense comfort game (external link) */
          { id: 'emoticon-defense', label: 'Emoticon Defense', enabled: true },
          /* Claude: 2026-04-01 — Secret Agent (SAM) DOS game via js-dos */
          { id: 'secret-agent', label: 'Secret Agent (SAM)', enabled: true },
          /* Claude: 2026-04-01 — Brick Breaker + Snake vanilla JS comfort games */
          { id: 'brick-breaker', label: 'Brick Breaker', enabled: true },
          { id: 'snake', label: 'Snake', enabled: true },
          { id: 'journal',    label: 'A Gentle Moment',      enabled: true }
        ],
        'bad-brain': [
          { id: 'messages',    label: 'Messages',             enabled: true },
          { id: 'emergency',   label: 'Emergency Contacts',   enabled: true },
          { id: 'energy',      label: 'Basic Check-In',       enabled: true },
          { id: 'history',     label: 'Recent History',        enabled: true },
          { id: 'a11y',        label: 'Accessibility Settings', enabled: true },
          { id: 'backlink',    label: 'Back to Recovery',       enabled: true }
        ],
        'semi-nope': [
          { id: 'emergency',  label: 'Emergency Link',       enabled: true },
          { id: 'checklist',  label: 'Feature Checklist',    enabled: true },
          { id: 'comfort',    label: 'Inline Comfort',       enabled: true }
        ],
        'nope': [
          { id: 'team',       label: 'Team Notification',    enabled: true },
          { id: 'controls',   label: 'Cancel / Semi-Nope',   enabled: true }
        ]
      }
    },

    /* Claude: 2026-03-20 — SpoonPlanner format (name/spoons/time/priority/completed).
       Generic student defaults. Personal tasks belong in saved config, not here. */
    spoonPlan: {
      baseBudget: 20,
      tasks: [
        { name: 'Morning Routine', spoons: 2, time: '8:00 AM', priority: 'High', completed: false },
        { name: 'Breakfast', spoons: 1, time: '8:30 AM', priority: 'High', completed: false },
        { name: 'Class / Study', spoons: 3, time: '10:00 AM', priority: 'High', completed: false },
        { name: 'Lunch', spoons: 1, time: '12:00 PM', priority: 'Medium', completed: false },
        { name: 'Afternoon Activity', spoons: 2, time: '2:00 PM', priority: 'Medium', completed: false },
        { name: 'Dinner', spoons: 1, time: '6:00 PM', priority: 'Medium', completed: false },
        { name: 'Evening Wind-Down', spoons: 1, time: '8:00 PM', priority: 'Low', completed: false }
      ],
      formula: {
        base: 20,
        painScale: 1,
        fatigueScale: 1,
        sleepLowThreshold: 7,
        sleepLowPenalty: 2,
        sleepHighThreshold: 9,
        sleepHighBonus: 1,
        sleepHighMax: 3,
        moodAdjustments: { excellent: 2, good: 1, okay: 0, poor: -1, terrible: -3 },
        weatherPenalty: 1
      }
    },

    meals: {
      breakfast: ['Toast with butter', 'Oatmeal', 'Cereal with milk', 'Yogurt and granola', 'Banana and peanut butter'],
      lunch: ['Sandwich', 'Soup', 'Leftovers', 'Mac and cheese', 'Quesadilla'],
      dinner: ['Pasta', 'Rice and beans', 'Grilled cheese', 'Frozen meal', 'Soup and bread'],
      liquids: ['Water', 'Juice', 'Milk', 'Herbal tea', 'Electrolyte drink'],
      dietaryNote: null
    },

    quizzes: [],  /* array of custom quiz configs */

    comfort: {
      scriptures: [
        { text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
        { text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.', reference: 'John 14:27' },
        { text: 'Cast thy burden upon the Lord, and he shall sustain thee.', reference: 'Psalm 55:22' },
        { text: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },
        { text: 'I can do all things through Christ which strengtheneth me.', reference: 'Philippians 4:13' }
      ],
      messages: [
        'You are doing better than you think.',
        'Rest is not weakness — it is wisdom.',
        'One step at a time. One spoon at a time.',
        'You are loved, even on the hard days.',
        'It is okay to not be okay right now.',
        'Your worth is not measured by your productivity.',
        'Tomorrow is a new day with new spoons.',
        'You have survived 100% of your worst days so far.'
      ],
      breathingIn: 4,
      breathingOut: 4
    },

    alerts: {
      debtDaysCritical: 5,
      debtDaysWarning: 2,
      lowSpoonPercent: 0.25,
      custom: []
    },

    /* Claude: 2026-03-18 — hiddenTools: array of tool IDs to hide from study tools.
       Valid IDs: floral-countdown, floral-match, floral-fill-blank, floral-genus,
       floral-flower-id, floral-study-sheet, floral-flashcards, floral-speed-round,
       floral-missed-tracker. Network leads set these to hide irrelevant tools. */
    hiddenTools: [],

    configuredBy: null,
    configuredAt: null,
    aiSource: null,
    version: 1
  };

  /* ── Deep merge utility ────────────────────────────────────── */
  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    var result = Object.assign({}, target);
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  /* ── Wait for AA/Firebase to be ready ──────────────────────── */
  function _waitForAA() {
    return new Promise(function(resolve) {
      if (window.AA && window.AA.db) {
        resolve();
      } else {
        var check = setInterval(function() {
          if (window.AA && window.AA.db) {
            clearInterval(check);
            resolve();
          }
        }, 50);
      }
    });
  }

  /* ── Public namespace ──────────────────────────────────────── */
  window.AA_CONFIG = window.AA_CONFIG || {};
  var _configCache = null;
  var _cacheUid = null;

  /* Load config from Firestore, merge with defaults, cache result */
  window.AA_CONFIG.load = function(uid) {
    return _waitForAA().then(function() {
      if (_configCache && _cacheUid === uid) {
        return Promise.resolve(_configCache);
      }

      return window.AA.db.collection('studentConfig').doc(uid).get()
        .then(function(doc) {
          var merged;
          if (doc.exists) {
            merged = deepMerge(DEFAULT_CONFIG, doc.data());
          } else {
            merged = deepMerge({}, DEFAULT_CONFIG);
          }
          _configCache = merged;
          _cacheUid = uid;
          window.AA_STUDENT_CONFIG = merged;
          /* Claude: 2026-03-25 — sanitized console log to remove PII */
          if (window.AA_DEBUG) console.log('[AA_CONFIG] Loaded config');
          return merged;
        })
        .catch(function(err) {
          console.warn('[AA_CONFIG] Failed to load config, using defaults:', err.message);
          _configCache = deepMerge({}, DEFAULT_CONFIG);
          _cacheUid = uid;
          window.AA_STUDENT_CONFIG = _configCache;
          return _configCache;
        });
    });
  };

  /* Safe nested access with dot notation and default fallback */
  window.AA_CONFIG.get = function(path, defaultValue) {
    if (!_configCache) {
      console.warn('[AA_CONFIG] Config not loaded yet, returning default');
      return defaultValue !== undefined ? defaultValue : null;
    }
    var parts = path.split('.');
    var val = _configCache;
    for (var i = 0; i < parts.length; i++) {
      if (val && typeof val === 'object' && parts[i] in val) {
        val = val[parts[i]];
      } else {
        return defaultValue !== undefined ? defaultValue : null;
      }
    }
    return val;
  };

  /* Save config to Firestore (network-lead only) */
  window.AA_CONFIG.save = function(uid, configObj) {
    return _waitForAA().then(function() {
      /* Mirror mode check: only network-lead can write */
      if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) {
        return Promise.reject(new Error('Not authorized to save config'));
      }

      var timestamp = window.AA.Timestamp.now();
      var data = deepMerge({}, configObj);
      data.configuredAt = timestamp;
      data.configuredBy = window.AA.auth.currentUser ? window.AA.auth.currentUser.uid : null;
      data.version = (data.version || 0) + 1;

      /* Claude: 2026-03-21 — Triple redundancy for config saves (Mary-proof):
         Layer 1: localStorage backup FIRST (synchronous, survives connection loss)
         Layer 2: Firestore primary cloud write
         Layer 3: Retry queue if Firestore fails */
      try {
        localStorage.setItem('AA_CONFIG_BACKUP_' + uid, JSON.stringify(data));
        if (window.AA_DEBUG) console.log('[AA_CONFIG] Layer 1 — localStorage backup saved');
      } catch(lsErr) {
        try { sessionStorage.setItem('AA_CONFIG_BACKUP_' + uid, JSON.stringify(data)); } catch(ssErr) {}
      }

      var saveTimeout;
      var savePromise = new Promise(function(resolve, reject) {
        saveTimeout = setTimeout(function() {
          console.warn('[AA_CONFIG] Firestore save timed out after 10s — data safe in localStorage');
          try {
            var queue = JSON.parse(localStorage.getItem('AA_CONFIG_RETRY_QUEUE') || '[]');
            queue.push({ uid: uid, data: data, queuedAt: new Date().toISOString() });
            if (queue.length > 10) queue = queue.slice(-10);
            localStorage.setItem('AA_CONFIG_RETRY_QUEUE', JSON.stringify(queue));
          } catch(e) {}
          reject(new Error('Firestore timeout — saved to localStorage'));
        }, 10000);
      });

      return Promise.race([
        window.AA.db.collection('studentConfig').doc(uid).set(data, { merge: true })
          .then(function() {
            clearTimeout(saveTimeout);
            _configCache = deepMerge(DEFAULT_CONFIG, data);
            _cacheUid = uid;
            window.AA_STUDENT_CONFIG = _configCache;
            /* Claude: 2026-03-25 — sanitized console log to remove PII */
            if (window.AA_DEBUG) console.log('[AA_CONFIG] Layer 2 — Firestore saved');

            /* Audit log entry */
            return window.AA.db.collection('auditLog').doc(uid).collection('entries').add({
              action: 'config_updated',
              targetUid: uid,
              actorUid: window.AA.auth.currentUser ? window.AA.auth.currentUser.uid : null,
              timestamp: timestamp,
              details: {
                configVersion: data.version,
                changes: {}
              }
            });
          }),
        savePromise
      ]);
    });
  };

  /* Get default config structure */
  window.AA_CONFIG.getDefaults = function() {
    return deepMerge({}, DEFAULT_CONFIG);
  };

  /* Clear cache (for testing or re-fetch) */
  window.AA_CONFIG.clearCache = function() {
    _configCache = null;
    _cacheUid = null;
    delete window.AA_STUDENT_CONFIG;
    if (window.AA_DEBUG) console.log('[AA_CONFIG] Cache cleared');
  };

  if (window.AA_DEBUG) console.log('[AA_CONFIG] Student config system loaded');

})();
