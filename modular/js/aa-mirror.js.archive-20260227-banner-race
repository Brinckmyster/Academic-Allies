/* ============================================================
   aa-mirror.js — Academic Allies Support Mirror
   Created: 2026-02-21 by Claude
   Updated: 2026-02-26 by Claude — renamed 'admin' → 'backstage-manager' + added 'network-lead' to SUPPORT_ROLES

   When a support-role user (support / family / nearby-help / network-lead) is
   signed in, every page except admin.html and user-tiers.html
   mirrors the student's data.

   Strategy:
     1. Read sessionStorage synchronously at load time → set
        window.AA_MIRROR_UID *before* any onAuthStateChanged fires.
     2. On first load as a support user, findStudent() scans
        Firestore and stores the result in sessionStorage, then
        calls location.reload() so the synchronous path above fires.

   Exposes:
     window.AA_MIRROR_UID  — student UID (string) or null
     window.AA_MIRROR      — full cache object or null
     window.AA_uid(realUid)         — mirror UID if active, else realUid
     window.AA_flower_uid(uid, email) — realUid for dorothy, else AA_uid()
   ============================================================ */

(function () {
  'use strict';

  var CACHE_KEY     = 'aa-mirror';
  var SUPPORT_ROLES = ['support', 'family', 'nearby-help', 'network-lead'];
  var FLOWER_EXEMPT = 'dorothy.brinck@gmail.com';

  /* Pages where mirroring is suppressed entirely */
  var NO_MIRROR = ['admin.html', 'user-tiers', 'message-system'];

  /* Pages where the banner is suppressed (support-dashboard has its own) */
  var NO_BANNER = ['support-dashboard'].concat(NO_MIRROR);

  /* ── Helpers ──────────────────────────────────────────────── */

  function inPath(list) {
    var p = window.location.pathname;
    return list.some(function (s) { return p.indexOf(s) !== -1; });
  }

  function readCache() {
    try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
  }

  function writeCache(obj) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  function clearCache() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Synchronous init ─────────────────────────────────────── */
  /* Runs at script-parse time — before any onAuthStateChanged  */

  var _cache = readCache();

  if (_cache && _cache.studentUid && !inPath(NO_MIRROR)) {
    window.AA_MIRROR_UID = _cache.studentUid;
    window.AA_MIRROR     = _cache;
  } else {
    window.AA_MIRROR_UID = null;
    window.AA_MIRROR     = null;
  }

  /* ── Public helpers ───────────────────────────────────────── */

  window.AA_uid = function (realUid) {
    return window.AA_MIRROR_UID ? window.AA_MIRROR_UID : realUid;
  };

  /* dorothy always keeps her own flower-quiz UID */
  window.AA_flower_uid = function (realUid, email) {
    if (email === FLOWER_EXEMPT) return realUid;
    return window.AA_uid(realUid);
  };

  /* ── Banner ───────────────────────────────────────────────── */

  function showBanner(name) {
    if (inPath(NO_BANNER)) return;
    if (document.getElementById('aa-mirror-banner')) return;
    var b = document.createElement('div');
    b.id = 'aa-mirror-banner';
    b.setAttribute('role', 'status');
    b.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:9990;' +
      'background:linear-gradient(90deg,#e8eeff,#f0f4ff);' +
      'border-bottom:2px solid #a5b4fc;' +
      'padding:5px 16px;font-size:12px;color:#4338ca;' +
      'text-align:center;font-family:inherit;line-height:1.4;box-sizing:border-box;';
    b.innerHTML =
      '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1 <strong>Mirror mode</strong>' +
      ' \u2014 viewing <strong>' + esc(name) + '\u2019s</strong> data' +
      ' &nbsp;\u00B7&nbsp; read-only';
    document.body.insertBefore(b, document.body.firstChild);
  }

  if (window.AA_MIRROR_UID) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        showBanner((_cache && _cache.studentName) || 'student');
      });
    } else {
      showBanner((_cache && _cache.studentName) || 'student');
    }
  }

  /* ── Firebase watcher ─────────────────────────────────────── */

  function waitForAA(cb, n) {
    n = n || 0;
    if (window.AA && window.AA.auth && window.AA.db) { cb(); return; }
    if (n > 40) return;
    setTimeout(function () { waitForAA(cb, n + 1); }, 200);
  }

  waitForAA(function () {
    AA.auth.onAuthStateChanged(function (user) {
      if (!user) {
        clearCache();
        window.AA_MIRROR_UID = null;
        window.AA_MIRROR     = null;
        return;
      }

      if (inPath(NO_MIRROR)) return;

      AA.db.collection('users').doc(user.uid).get()
        .then(function (doc) {
          if (!doc.exists) return;
          var role = doc.data().role || 'student';

          /* Not a support role — clear any stale mirror state.
             If AA_MIRROR_UID was already set from a stale sessionStorage cache
             (e.g. support user → logout → student login, same session), reload
             so the page re-initialises without the stale mirror UID. */
          if (SUPPORT_ROLES.indexOf(role) === -1) {
            var wasMirroring = !!window.AA_MIRROR_UID;
            clearCache();
            window.AA_MIRROR_UID = null;
            window.AA_MIRROR     = null;
            if (wasMirroring) { window.location.reload(); }
            return;
          }

          /* Cache still valid for this viewer */
          var cached = readCache();
          if (cached && cached.viewerUid === user.uid && cached.studentUid) {
            if (!window.AA_MIRROR_UID) {
              window.AA_MIRROR_UID = cached.studentUid;
              window.AA_MIRROR     = cached;
            }
            showBanner(cached.studentName || 'student');
            return;
          }

          /* First time as support user on this session — find the student */
          findStudent(user.uid, function (studentUid, studentName) {
            if (!studentUid) return; /* no student found */
            var entry = {
              viewerUid:   user.uid,
              studentUid:  studentUid,
              studentName: studentName
            };
            writeCache(entry);
            window.location.reload();
          });
        })
        .catch(function (e) { console.warn('[aa-mirror] user doc read:', e); });
    });
  });

  /* Scan all users to find the student whose supportNetwork includes viewerUid */
  function findStudent(viewerUid, cb) {
    AA.db.collection('users').get()
      .then(function (snap) {
        var found = null;
        snap.forEach(function (doc) {
          if (found) return;
          var d = doc.data();
          if (d.role === 'student' &&
              d.supportNetwork &&
              d.supportNetwork[viewerUid]) {
            found = { uid: doc.id, name: d.displayName || d.email || 'Student' };
          }
        });
        cb(found ? found.uid : null, found ? found.name : null);
      })
      .catch(function (e) {
        console.warn('[aa-mirror] findStudent:', e);
        cb(null, null);
      });
  }

})();
