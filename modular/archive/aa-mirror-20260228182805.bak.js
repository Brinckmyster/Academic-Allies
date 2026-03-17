/* ============================================================
   aa-mirror.js — Academic Allies Support Mirror
   Created: 2026-02-21 by Claude
   Updated: 2026-02-26 by Claude — renamed 'admin' → 'backstage-manager' + added 'network-lead' to SUPPORT_ROLES
   Updated: 2026-02-28 by Claude — multi-student support: findStudents() returns all,
     allStudents stored in cache, AA_SWITCH_STUDENT() to swap active student,
     renderSwitcher() injects header dropdown when multiple students found.
   Updated: 2026-02-28 by Claude — 3 fixes:
     (1) console.log + backfill missing allStudents without reload;
     (2) student+isSupporter: honor explicit cache, no auto-mirror;
     (3) renderSwitcher debug log.

   When a support-role user (support / family / nearby-help / network-lead) is
   signed in, every page except admin.html and user-tiers.html
   mirrors the student's data.

   Student+isSupporter: mirror only when they explicitly call AA_SWITCH_STUDENT.
   No auto-mirror on login.

   Exposes:
     window.AA_MIRROR_UID          — active student UID (string) or null
     window.AA_MIRROR              — full cache object or null
     window.AA_uid(realUid)        — mirror UID if active, else realUid
     window.AA_flower_uid(uid, email) — realUid for dorothy, else AA_uid()
     window.AA_SWITCH_STUDENT(uid, name) — switch active student + reload
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

  /* Switch active student and reload.
     Works for support roles AND student+isSupporter. */
  window.AA_SWITCH_STUDENT = function (uid, name) {
    var cached = readCache() || {};
    cached.studentUid  = uid;
    cached.studentName = name;
    writeCache(cached);
    window.location.reload();
  };

  /* ── Header student-switcher dropdown ─────────────────────── */

  function renderSwitcher() {
    var cache = readCache();
    /* Claude: 2026-02-28 — debug log to trace dropdown failures */
    console.log('[aa-mirror] renderSwitcher: cache=', !!cache,
      'allStudents=', cache && cache.allStudents ? cache.allStudents.length : 'missing');

    if (!cache || !cache.allStudents || cache.allStudents.length < 2) return;
    if (inPath(NO_BANNER)) return;

    var wrap = document.getElementById('aa-student-switcher');
    if (!wrap) {
      console.log('[aa-mirror] renderSwitcher: #aa-student-switcher not found in DOM');
      return;
    }

    var students = cache.allStudents;
    var current  = cache.studentName || cache.studentUid || 'Student';

    wrap.style.cssText =
      'display:inline-block;position:relative;font-family:inherit;vertical-align:middle;';

    wrap.innerHTML =
      '<button id="aa-switcher-btn" style="' +
        'padding:5px 11px;background:#e8eeff;color:#4338ca;' +
        'border:1px solid #a5b4fc;border-radius:6px;' +
        'font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;' +
        'line-height:1.4;' +
      '">' +
        'Viewing: ' + esc(current) + ' &#9660;' +
      '</button>' +
      '<ul id="aa-switcher-menu" style="' +
        'display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:9999;' +
        'background:#fff;border:1px solid #a5b4fc;border-radius:8px;' +
        'box-shadow:0 4px 16px rgba(0,0,0,0.12);list-style:none;' +
        'margin:0;padding:4px 0;min-width:170px;' +
      '">' +
      students.map(function (s) {
        var isCurrent = (s.uid === cache.studentUid);
        return (
          '<li><button ' +
            'onclick="window.AA_SWITCH_STUDENT(\'' +
              s.uid.replace(/'/g, "\\'") + '\',\'' +
              s.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')" ' +
            'style="width:100%;text-align:left;padding:8px 14px;' +
              'background:' + (isCurrent ? '#f0f4ff' : '#fff') + ';' +
              'border:none;cursor:pointer;font-size:13px;color:#333;' +
              'font-weight:' + (isCurrent ? '700' : '400') + ';">' +
            esc(s.name) + (isCurrent ? ' &#10003;' : '') +
          '</button></li>'
        );
      }).join('') +
      '</ul>';

    var btn  = document.getElementById('aa-switcher-btn');
    var menu = document.getElementById('aa-switcher-menu');

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.style.display = (menu.style.display === 'none') ? 'block' : 'none';
    });

    document.addEventListener('click', function () {
      if (menu) menu.style.display = 'none';
    });
  }

  function renderSwitcherWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderSwitcher);
    } else {
      renderSwitcher();
    }
  }

  /* ── Banner ───────────────────────────────────────────────── */

  /* Claude: DOM-readiness guard lives inside showBanner so every
     call path is safe — fixes race when onAuthStateChanged fires
     before DOMContentLoaded (fast cached-auth pages) — 2026-02-27 */
  function showBanner(name) {
    if (inPath(NO_BANNER)) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { showBanner(name); });
      return;
    }
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
    showBanner((_cache && _cache.studentName) || 'student');
    renderSwitcherWhenReady();
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
          var data        = doc.data();
          var role        = data.role || 'student';
          var isSupporter = (data.isSupporter === true);

          /* ── Student peer-supporter: honor explicit cache, never auto-mirror ──
             Claude: 2026-02-28 — students who peer-support can use AA_SWITCH_STUDENT
             to explicitly view a peer, but we never auto-set up mirror on their behalf. */
          if (role === 'student' && isSupporter) {
            var peerCache = readCache();
            if (peerCache && peerCache.viewerUid === user.uid && peerCache.studentUid) {
              /* They explicitly switched — honor the cache */
              if (!window.AA_MIRROR_UID) {
                window.AA_MIRROR_UID = peerCache.studentUid;
                window.AA_MIRROR     = peerCache;
              }
              showBanner(peerCache.studentName || 'peer');
              if (peerCache.allStudents) {
                renderSwitcher();
              } else {
                findStudents(user.uid, function (students) {
                  peerCache.allStudents = students;
                  writeCache(peerCache);
                  renderSwitcher();
                });
              }
            }
            /* Else: no explicit switch — student sees their own data, no mirror */
            return;
          }

          /* ── Not a support role — clear any stale mirror state ── */
          if (SUPPORT_ROLES.indexOf(role) === -1) {
            var wasMirroring = !!window.AA_MIRROR_UID;
            clearCache();
            window.AA_MIRROR_UID = null;
            window.AA_MIRROR     = null;
            if (wasMirroring) { window.location.reload(); }
            return;
          }

          /* ── Support role: cache still valid for this viewer ── */
          var cached = readCache();
          if (cached && cached.viewerUid === user.uid && cached.studentUid) {
            if (!window.AA_MIRROR_UID) {
              window.AA_MIRROR_UID = cached.studentUid;
              window.AA_MIRROR     = cached;
            }
            showBanner(cached.studentName || 'student');

            /* Claude: 2026-02-28 — if allStudents missing (old cache), backfill
               without reloading so the switcher can render correctly. */
            if (cached.allStudents) {
              renderSwitcher();
            } else {
              findStudents(user.uid, function (students) {
                cached.allStudents = students;
                writeCache(cached);
                renderSwitcher();
              });
            }
            return;
          }

          /* ── First time as support user on this session — find ALL students ── */
          findStudents(user.uid, function (students) {
            if (!students || students.length === 0) return;
            var entry = {
              viewerUid:   user.uid,
              studentUid:  students[0].uid,
              studentName: students[0].name,
              allStudents: students
            };
            writeCache(entry);
            window.location.reload();
          });
        })
        .catch(function (e) { console.warn('[aa-mirror] user doc read:', e); });
    });
  });

  /* Scan all users — return array of every student whose
     supportNetwork includes viewerUid */
  function findStudents(viewerUid, cb) {
    AA.db.collection('users').get()
      .then(function (snap) {
        var found = [];
        snap.forEach(function (doc) {
          var d = doc.data();
          if (d.role === 'student' &&
              d.supportNetwork &&
              d.supportNetwork[viewerUid]) {
            found.push({ uid: doc.id, name: d.displayName || d.email || 'Student' });
          }
        });
        cb(found);
      })
      .catch(function (e) {
        console.warn('[aa-mirror] findStudents:', e);
        cb([]);
      });
  }

})();
