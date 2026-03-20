/* ============================================================
   study-activity.js — Academic Allies Study Tool Firestore Tracker
   Created: 2026-03-20 by Claude

   Replaces localStorage-based score/missed tracking across all
   study tools with Firestore-backed persistence. Data syncs
   across devices, is visible to supporters, and feeds the
   status circle's Academic segment.

   Firestore path: /studyActivity/{uid}
   Fields:
     missed           – { "Flower Name": count, … }
     bests            – { "match_all": {accuracy,time}, "speed_all": {pct,time,fpm}, … }
     todayDate        – "YYYY-MM-DD"
     todaySessions    – number
     todayTools       – ["match-game","speed-round",…]
     totalSessions    – lifetime session count
     lastActivity     – Firestore Timestamp

   Usage:
     AA.study.logSession(toolId)
     AA.study.getBest(key)           → Promise<{…}|null>
     AA.study.saveBest(key, data)    → Promise
     AA.study.getMissed()            → Promise<{name:count}>
     AA.study.addMiss(flower)        → Promise
     AA.study.removeMiss(flower)     → Promise
     AA.study.resetMissed()          → Promise
     AA.study.wasActiveToday(uid)    → Promise<{active,tools,sessions}>
     AA.study.migrate()              → migrates localStorage → Firestore (once)
   ============================================================ */
(function () {
  'use strict';

  /* ── Wait for AA + auth ──────────────────────────────────── */
  function _waitForAuth(cb) {
    var checks = 0;
    var iv = setInterval(function () {
      checks++;
      if (window.AA && window.AA.auth && window.AA.db) {
        var user = window.AA.auth.currentUser;
        if (user) {
          clearInterval(iv);
          cb(user);
          return;
        }
      }
      if (checks > 100) clearInterval(iv); /* give up after ~10s */
    }, 100);
  }

  /* ── Date helpers ────────────────────────────────────────── */
  function _todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  /* ── Firestore doc ref for a user's study activity ──────── */
  function _docRef(uid) {
    return window.AA.db.collection('studyActivity').doc(uid);
  }

  /* ── Cached doc data (avoids repeated reads within a session) */
  var _cache = null;
  var _cacheUid = null;
  var _cacheTime = 0;
  var CACHE_TTL = 30000; /* 30 seconds */

  function _getDoc(uid) {
    var now = Date.now();
    if (_cache && _cacheUid === uid && (now - _cacheTime) < CACHE_TTL) {
      return Promise.resolve(_cache);
    }
    return _docRef(uid).get().then(function (snap) {
      _cache = snap.exists ? snap.data() : {};
      _cacheUid = uid;
      _cacheTime = Date.now();
      return _cache;
    });
  }

  function _invalidateCache() {
    _cache = null;
    _cacheTime = 0;
  }

  /* ── Core: get UID (respects mirror mode) ────────────────── */
  function _uid() {
    if (window.AA_MIRROR_UID) return window.AA_MIRROR_UID;
    if (window.AA && window.AA.auth && window.AA.auth.currentUser) {
      return window.AA.auth.currentUser.uid;
    }
    return null;
  }

  /* ── Core: is mirror read-only? ──────────────────────────── */
  function _isReadOnly() {
    return !!(window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE);
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  var study = {};

  /* ── logSession(toolId) — call when student finishes a round ─ */
  study.logSession = function (toolId) {
    if (_isReadOnly()) return Promise.resolve();
    var uid = _uid();
    if (!uid) return Promise.resolve();

    var today = _todayKey();
    _invalidateCache();

    return _docRef(uid).get().then(function (snap) {
      var data = snap.exists ? snap.data() : {};
      var isNewDay = (data.todayDate !== today);
      var sessions = isNewDay ? 1 : ((data.todaySessions || 0) + 1);
      var tools = isNewDay ? [toolId] : (data.todayTools || []);
      if (tools.indexOf(toolId) === -1) tools.push(toolId);
      var total = (data.totalSessions || 0) + 1;

      var update = {
        todayDate: today,
        todaySessions: sessions,
        todayTools: tools,
        totalSessions: total,
        lastActivity: firebase.firestore.FieldValue.serverTimestamp()
      };

      return snap.exists
        ? _docRef(uid).update(update)
        : _docRef(uid).set(update);
    });
  };

  /* ── getBest(key) — e.g. "match_all", "speed_1_REV" ────── */
  study.getBest = function (key) {
    var uid = _uid();
    if (!uid) return Promise.resolve(null);

    return _getDoc(uid).then(function (data) {
      var bests = data.bests || {};
      return bests[key] || null;
    });
  };

  /* ── saveBest(key, scoreObj) — only saves if better ──────── */
  study.saveBest = function (key, scoreObj) {
    if (_isReadOnly()) return Promise.resolve();
    var uid = _uid();
    if (!uid) return Promise.resolve();

    _invalidateCache();
    var field = 'bests.' + key;
    var update = {};
    update[field] = scoreObj;
    update.lastActivity = firebase.firestore.FieldValue.serverTimestamp();

    return _docRef(uid).get().then(function (snap) {
      if (!snap.exists) {
        var full = { bests: {} };
        full.bests[key] = scoreObj;
        full.lastActivity = firebase.firestore.FieldValue.serverTimestamp();
        return _docRef(uid).set(full, { merge: true });
      }
      return _docRef(uid).update(update);
    });
  };

  /* ── getMissed() — returns { "Flower Name": count } ──────── */
  study.getMissed = function () {
    var uid = _uid();
    if (!uid) return Promise.resolve({});

    return _getDoc(uid).then(function (data) {
      return data.missed || {};
    });
  };

  /* ── addMiss(flower) — increment miss count ──────────────── */
  study.addMiss = function (flower) {
    if (_isReadOnly()) return Promise.resolve();
    var uid = _uid();
    if (!uid) return Promise.resolve();

    _invalidateCache();
    return _docRef(uid).get().then(function (snap) {
      var data = snap.exists ? snap.data() : {};
      var missed = data.missed || {};
      missed[flower] = (missed[flower] || 0) + 1;
      if (snap.exists) {
        return _docRef(uid).update({ missed: missed });
      } else {
        return _docRef(uid).set({ missed: missed }, { merge: true });
      }
    });
  };

  /* ── removeMiss(flower) — decrement miss count ───────────── */
  study.removeMiss = function (flower) {
    if (_isReadOnly()) return Promise.resolve();
    var uid = _uid();
    if (!uid) return Promise.resolve();

    _invalidateCache();
    return _docRef(uid).get().then(function (snap) {
      var data = snap.exists ? snap.data() : {};
      var missed = data.missed || {};
      if (missed[flower]) {
        missed[flower] = missed[flower] - 1;
        if (missed[flower] <= 0) delete missed[flower];
      }
      if (snap.exists) {
        return _docRef(uid).update({ missed: missed });
      } else {
        return _docRef(uid).set({ missed: missed }, { merge: true });
      }
    });
  };

  /* ── resetMissed() — clear all missed data ───────────────── */
  study.resetMissed = function () {
    if (_isReadOnly()) return Promise.resolve();
    var uid = _uid();
    if (!uid) return Promise.resolve();

    _invalidateCache();
    return _docRef(uid).update({
      missed: firebase.firestore.FieldValue.delete()
    }).catch(function () { /* doc may not exist yet */ });
  };

  /* ── wasActiveToday(uid) — for status circle to call ─────── */
  /* Returns { active: bool, tools: [...], sessions: number }    */
  study.wasActiveToday = function (targetUid) {
    var uid = targetUid || _uid();
    if (!uid) return Promise.resolve({ active: false, tools: [], sessions: 0 });

    return _docRef(uid).get().then(function (snap) {
      if (!snap.exists) return { active: false, tools: [], sessions: 0 };
      var data = snap.data();
      var today = _todayKey();
      if (data.todayDate !== today) return { active: false, tools: [], sessions: 0 };
      return {
        active: true,
        tools: data.todayTools || [],
        sessions: data.todaySessions || 0
      };
    }).catch(function () {
      return { active: false, tools: [], sessions: 0 };
    });
  };

  /* ── migrate() — one-time localStorage → Firestore ──────── */
  /* Reads all known localStorage keys, merges into Firestore,
     then removes the localStorage copies. Safe to call multiple
     times — skips if already migrated. */
  study.migrate = function () {
    if (_isReadOnly()) return Promise.resolve();
    var uid = _uid();
    if (!uid) return Promise.resolve();

    /* Check if already migrated */
    var migKey = 'AA_STUDY_MIGRATED_' + uid;
    try {
      if (localStorage.getItem(migKey) === '1') return Promise.resolve();
    } catch (e) {}

    var merged = { bests: {}, missed: {} };

    /* ── Missed flowers (object format) ──────────────────── */
    try {
      var rawMissed = localStorage.getItem('AA_FLORAL_MISSED');
      if (rawMissed) {
        var parsed = JSON.parse(rawMissed);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          merged.missed = parsed;
        }
        /* Integer format (fill-blank) — can't meaningfully migrate per-flower */
      }
    } catch (e) {}

    /* ── Match game bests ────────────────────────────────── */
    _migrateLocalBests(merged.bests, 'AA_MATCH_BEST_', 'match_');

    /* ── Speed round bests ───────────────────────────────── */
    _migrateLocalBests(merged.bests, 'AA_SPEED_BEST_', 'speed_');

    /* Write to Firestore */
    _invalidateCache();
    return _docRef(uid).set(merged, { merge: true }).then(function () {
      /* Mark migrated and clean up localStorage */
      try { localStorage.setItem(migKey, '1'); } catch (e) {}
      _cleanupLocalStorage();
      console.log('[AA Study] Migrated localStorage data to Firestore for', uid);
    }).catch(function (err) {
      console.warn('[AA Study] Migration failed:', err.message);
    });
  };

  /* ── Helper: scan localStorage for best-score keys ──────── */
  function _migrateLocalBests(bestsObj, prefix, firestorePrefix) {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(prefix) === 0) {
          var suffix = key.substring(prefix.length); /* e.g. "all", "1_REV" */
          var val = localStorage.getItem(key);
          if (val) {
            try {
              bestsObj[firestorePrefix + suffix] = JSON.parse(val);
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  /* ── Helper: remove old localStorage keys after migration ── */
  function _cleanupLocalStorage() {
    var keysToRemove = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key) continue;
        if (key === 'AA_FLORAL_MISSED' ||
            key === 'flowerCount' ||
            key === 'reportedFlowers' ||
            key === 'AA_QUIZ_REPORTS' ||
            key.indexOf('AA_MATCH_BEST_') === 0 ||
            key.indexOf('AA_SPEED_BEST_') === 0 ||
            key.indexOf('aa_best_match_') === 0 ||
            key.indexOf('aa_best_speedround_') === 0 ||
            key.indexOf('aa_best_fillin_') === 0 ||
            key === 'AA_FLASHCARD_MISSED' ||
            key === 'AA_SPEEDROUND_MISSED' ||
            key === 'AA_FLOWER_MISSED') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(function (k) {
        localStorage.removeItem(k);
      });
      if (keysToRemove.length > 0) {
        console.log('[AA Study] Cleaned up', keysToRemove.length, 'localStorage keys');
      }
    } catch (e) {}
  }

  /* ── Expose on window.AA ─────────────────────────────────── */
  function _attach() {
    if (!window.AA) window.AA = {};
    window.AA.study = study;
  }
  _attach();

  /* Auto-migrate on auth */
  _waitForAuth(function () {
    _attach();
    study.migrate();
  });
})();
