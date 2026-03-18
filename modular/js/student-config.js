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
      custom: {}  /* overrides per mode: { 'bad-brain': { name: '...', icon: '...', desc: '...' } } */
    },

    spoonPlan: {
      baseBudget: 20,
      tasks: [
        { code: 'A', emoji: '💊', desc: 'Morning Medications', cost: 2, fixed: true, time: '9:00 AM' },
        { code: 'V', emoji: '🧘', desc: 'Devotional / Meditation', cost: 1, fixed: true, time: '9:15 AM' },
        { code: 'B', emoji: '📖', desc: 'Family Scriptures / Breakfast', cost: 2, fixed: true, time: '9:30 AM' },
        { code: 'C', emoji: '🧩', desc: 'Word Connect Streak', cost: 1, fixed: false, time: '10:00 AM' },
        { code: 'D', emoji: '🦉', desc: 'Duolingo Streak', cost: 1, fixed: false, time: '10:15 AM' },
        { code: 'S', emoji: '📚', desc: 'School / Homework', cost: 3, fixed: false, time: '10:30 AM' },
        { code: 'L', emoji: '🍽️', desc: 'Lunch', cost: 2, fixed: true, time: '12:00 PM' },
        { code: 'I', emoji: '🧹', desc: 'Inside Chores', cost: 2, fixed: false, time: '1:00 PM' },
        { code: 'G', emoji: '🌿', desc: 'Outside / Garden', cost: 2, fixed: false, time: '2:00 PM' },
        { code: 'N', emoji: '🍽️', desc: 'Dinner', cost: 2, fixed: true, time: '5:30 PM' },
        { code: 'ME', emoji: '🛁', desc: 'Self-Care / Me Time', cost: 1, fixed: false, time: '7:00 PM' },
        { code: 'H', emoji: '🏠', desc: 'Evening Routine / House', cost: 1, fixed: false, time: '8:00 PM' },
        { code: 'CC', emoji: '📱', desc: 'Check-in Call', cost: 1, fixed: false, time: '8:30 PM' },
        { code: 'DD', emoji: '🌙', desc: 'Wind Down / Night Meds', cost: 1, fixed: true, time: '9:30 PM' },
        { code: 'EE', emoji: '📿', desc: 'Evening Prayer / Journal', cost: 1, fixed: false, time: '10:00 PM' },
        { code: 'FF', emoji: '😴', desc: 'Lights Out', cost: 0, fixed: true, time: '10:30 PM' },
        { code: 'ZZ', emoji: '📵', desc: 'Device Off / Crash', cost: 0, fixed: true, time: '10:30 PM' }
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
          console.log('[AA_CONFIG] Loaded config for', uid);
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

      return window.AA.db.collection('studentConfig').doc(uid).set(data, { merge: true })
        .then(function() {
          _configCache = deepMerge(DEFAULT_CONFIG, data);
          _cacheUid = uid;
          window.AA_STUDENT_CONFIG = _configCache;
          console.log('[AA_CONFIG] Config saved for', uid);

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
        });
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
    console.log('[AA_CONFIG] Cache cleared');
  };

  console.log('[AA_CONFIG] Student config system loaded');

})();
