/* ============================================================
   aa-mirror.js — Academic Allies Support Mirror
   Created: 2026-02-21 by Claude
   Updated: 2026-02-26 by Claude — renamed 'admin' → 'backstage-manager' + added 'network-lead' to SUPPORT_ROLES
   Updated: 2026-02-28 by Claude — added 'backstage-manager' to SUPPORT_ROLES (header switcher + mirror)
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
  var SUPPORT_ROLES = ['support', 'family', 'nearby-help', 'network-lead', 'backstage-manager'];
  var FLOWER_EXEMPT = 'dorothy.brinck@gmail.com';

  /* Pages where mirroring is suppressed entirely */
  /* Updated 2026-03-02 by Claude: spoon-pal is Bruise's personal energy tracker only,
     never shared — mirror UID must never bleed in. */
  var NO_MIRROR = ['admin.html', 'user-tiers', 'message-system', 'spoon-pal'];

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

  // Claude: check force-self flag — if set, skip mirror entirely for this load
  var _forceSelf = false;
  try { _forceSelf = sessionStorage.getItem('AA_FORCE_SELF') === '1'; } catch (e) {}

  var _cache = readCache();

  if (_forceSelf || !_cache || !_cache.studentUid || inPath(NO_MIRROR)) {
    window.AA_MIRROR_UID       = null;
    window.AA_MIRROR           = null;
    window.AA_MIRROR_CAN_WRITE = false;
  } else {
    window.AA_MIRROR_UID       = _cache.studentUid;
    window.AA_MIRROR           = _cache;
    window.AA_MIRROR_CAN_WRITE = (_cache.viewerRole === 'network-lead');
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

  // Claude: exit mirror mode — sets force-self flag so mirror doesn't re-engage on reload
  window.AA_EXIT_MIRROR = function () {
    clearCache();
    window.AA_MIRROR_UID = null;
    window.AA_MIRROR     = null;
    try { sessionStorage.setItem('AA_FORCE_SELF', '1'); } catch (e) {}
    window.location.reload();
  };

  /* ── Header student-switcher dropdown ─────────────────────── */

  function renderSwitcher() {
    var cache = readCache();
    /* Claude: 2026-02-28 — debug log to trace dropdown failures */
    console.log('[aa-mirror] renderSwitcher: cache=', !!cache,
      'allStudents=', cache && cache.allStudents ? cache.allStudents.length : 'missing');

    // Claude: 2026-03-05 — show switcher for 1+ students (need "View as Myself" even with one)
    if (!cache || !cache.allStudents || cache.allStudents.length < 1) return;
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
      /* Claude: "View as Myself" option — exits mirror mode */
      '<li style="border-top:1px solid #e1e5e9;margin-top:4px;padding-top:4px;">' +
        '<button onclick="window.AA_EXIT_MIRROR()" ' +
          'style="width:100%;text-align:left;padding:8px 14px;' +
          'background:#fff;border:none;cursor:pointer;font-size:13px;' +
          'color:#6CA0A3;font-weight:600;">' +
          '&#x1F464; View as Myself' +
        '</button></li>' +
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
  /* Claude: 2026-03-14 — compact ribbon banner with small tails,
     dark-mode aware, starts minimized. Slimmed down per user feedback. */
  function showBanner(name) {
    if (inPath(NO_BANNER)) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { showBanner(name); });
      return;
    }
    if (document.getElementById('aa-mirror-banner')) return;

    var _isNL = (_cache && _cache.viewerRole === 'network-lead');
    var isDark = document.documentElement.classList.contains('aa-dark');

    /* --- Color palette --- */
    var colors = _isNL
      ? {
          bg:      isDark ? '#1e4030' : '#d4edda',
          bgDark:  isDark ? '#163328' : '#b8dbca',
          border:  isDark ? '#2d6a4f' : '#6abf7b',
          text:    isDark ? '#8fd4a0' : '#2d6a4f',
          accent:  isDark ? '#6abf7b' : '#2d6a4f',
          fold:    isDark ? '#0f2a1e' : '#a3c9b0',
          shadow:  'rgba(45,106,79,0.15)'
        }
      : {
          bg:      isDark ? '#252850' : '#e4e8ff',
          bgDark:  isDark ? '#1e2040' : '#cdd3fc',
          border:  isDark ? '#4338ca' : '#a5b4fc',
          text:    isDark ? '#a5b4fc' : '#4338ca',
          accent:  isDark ? '#818cf8' : '#6366f1',
          fold:    isDark ? '#161830' : '#b0b8f0',
          shadow:  'rgba(67,56,202,0.15)'
        };

    /* --- Inject ribbon CSS (once) --- */
    if (!document.getElementById('aa-ribbon-css')) {
      var style = document.createElement('style');
      style.id = 'aa-ribbon-css';
      /* Claude: 2026-03-14 — compact ribbon placed below header, not overlapping nav */
      style.textContent =
        '#aa-mirror-banner {' +
          'position:relative;z-index:800;' +
          'margin:0 30px 8px 30px;padding:6px 20px;' +
          'text-align:center;font-family:inherit;' +
          'font-size:12px;line-height:1.4;' +
          'box-sizing:border-box;' +
          'transition:all 0.25s ease;' +
        '}' +
        '#aa-mirror-banner .ribbon-tail-l,' +
        '#aa-mirror-banner .ribbon-tail-r {' +
          'position:absolute;top:0;width:20px;height:100%;' +
        '}' +
        '#aa-mirror-banner .ribbon-tail-l { left:-20px; }' +
        '#aa-mirror-banner .ribbon-tail-r { right:-20px; }' +
        '#aa-mirror-banner .ribbon-fold-l,' +
        '#aa-mirror-banner .ribbon-fold-r {' +
          'position:absolute;bottom:-6px;width:0;height:0;' +
          'border-style:solid;' +
        '}' +
        '#aa-mirror-banner .ribbon-fold-l {' +
          'left:0;border-width:6px 8px 0 0;' +
          'border-color:transparent;' +
        '}' +
        '#aa-mirror-banner .ribbon-fold-r {' +
          'right:0;border-width:6px 0 0 8px;' +
          'border-color:transparent;' +
        '}' +
        '#aa-mirror-banner.minimized {' +
          'margin:0 60px 4px 60px;padding:3px 14px;' +
          'font-size:11px;' +
        '}' +
        '#aa-mirror-banner.minimized .ribbon-tail-l,' +
        '#aa-mirror-banner.minimized .ribbon-tail-r,' +
        '#aa-mirror-banner.minimized .ribbon-fold-l,' +
        '#aa-mirror-banner.minimized .ribbon-fold-r { display:none; }' +
        /* Claude: 2026-03-14 — grab cursor + no text selection for drag */
        '#aa-mirror-banner, #aa-mirror-banner * {' +
          'cursor:grab;-webkit-user-select:none;user-select:none;' +
        '}' +
        '#aa-mirror-banner #aa-mirror-minimize { cursor:pointer; }';
      document.head.appendChild(style);
    }

    /* --- Build the ribbon --- */
    var b = document.createElement('div');
    b.id = 'aa-mirror-banner';
    b.setAttribute('role', 'status');
    b.style.background = 'linear-gradient(180deg, ' + colors.bg + ' 0%, ' + colors.bgDark + ' 100%)';
    b.style.color = colors.text;
    b.style.boxShadow = '0 3px 10px ' + colors.shadow;
    b.style.borderTop = '2px solid ' + colors.border;
    b.style.borderBottom = '2px solid ' + colors.border;

    /* --- Content --- */
    var icon = _isNL ? '\uD83C\uDF1F' : '\uD83D\uDC41\uFE0F';
    var roleLabel = _isNL ? 'Network Lead' : 'Mirror Mode';
    var accessLabel = _isNL ? 'full access' : 'read-only';

    /* --- SVG tails (pointed ribbon ends, 20px wide) --- */
    var tailSvgL =
      '<svg class="ribbon-tail-l" viewBox="0 0 20 30" preserveAspectRatio="none" style="position:absolute;top:0;left:-20px;width:20px;height:100%;">' +
        '<polygon points="20,0 20,30 0,15" fill="' + colors.bg + '" />' +
        '<line x1="20" y1="0" x2="0" y2="15" stroke="' + colors.border + '" stroke-width="1" />' +
        '<line x1="0" y1="15" x2="20" y2="30" stroke="' + colors.border + '" stroke-width="1" />' +
      '</svg>';
    var tailSvgR =
      '<svg class="ribbon-tail-r" viewBox="0 0 20 30" preserveAspectRatio="none" style="position:absolute;top:0;right:-20px;width:20px;height:100%;">' +
        '<polygon points="0,0 0,30 20,15" fill="' + colors.bg + '" />' +
        '<line x1="0" y1="0" x2="20" y2="15" stroke="' + colors.border + '" stroke-width="1" />' +
        '<line x1="20" y1="15" x2="0" y2="30" stroke="' + colors.border + '" stroke-width="1" />' +
      '</svg>';

    /* --- Fold shadows (small triangles at bottom edges) --- */
    var foldL = '<div class="ribbon-fold-l" style="border-right-color:' + colors.fold + ';"></div>';
    var foldR = '<div class="ribbon-fold-r" style="border-left-color:' + colors.fold + ';"></div>';

    /* Claude: 2026-03-14 — ribbon content, full view by default */
    b.innerHTML =
      tailSvgL + tailSvgR + foldL + foldR +
      '<span class="aa-mirror-full">' +
        '<span style="font-size:13px;vertical-align:middle;">' + icon + '</span> ' +
        '<strong>' + roleLabel + '</strong>' +
        ' \u2014 viewing <strong>' + esc(name) + '\'s</strong> data' +
        ' \u00B7 ' +
        '<span style="font-size:10px;padding:1px 6px;border-radius:8px;' +
          'background:' + colors.accent + ';color:#fff;font-weight:600;">' + accessLabel + '</span>' +
      '</span>' +
      '<span class="aa-mirror-mini" style="display:none;">' +
        icon + ' Viewing <strong>' + esc(name) + '</strong> \u00B7 ' + accessLabel +
      '</span>';

    /* --- Minimize button --- */
    var minBtn = document.createElement('button');
    minBtn.id = 'aa-mirror-minimize';
    minBtn.setAttribute('aria-label', 'Minimize mirror banner');
    minBtn.style.cssText =
      'position:absolute;top:50%;right:6px;transform:translateY(-50%);' +
      'background:none;border:none;cursor:pointer;' +
      'font-size:14px;line-height:1;padding:2px 6px;' +
      'border-radius:4px;color:inherit;opacity:0.5;' +
      'transition:opacity 0.2s;';
    minBtn.textContent = '\u2715';
    minBtn.onmouseover = function() { minBtn.style.opacity = '1'; };
    minBtn.onmouseout  = function() { minBtn.style.opacity = '0.5'; };

    /* Claude: 2026-03-14 — starts expanded; user can minimize with X */
    var _minimized = false;

    minBtn.onclick = function() {
      _minimized = !_minimized;
      if (_minimized) {
        b.classList.add('minimized');
        minBtn.textContent = icon;
        minBtn.setAttribute('aria-label', 'Expand mirror banner');
        b.querySelector('.aa-mirror-full').style.display = 'none';
        b.querySelector('.aa-mirror-mini').style.display = 'inline';
      } else {
        b.classList.remove('minimized');
        minBtn.textContent = '\u2715';
        minBtn.setAttribute('aria-label', 'Minimize mirror banner');
        b.querySelector('.aa-mirror-full').style.display = 'inline';
        b.querySelector('.aa-mirror-mini').style.display = 'none';
      }
    };

    b.appendChild(minBtn);

    /* Claude: 2026-03-14 — insert AFTER the site-header so it doesn't
       overlap the navigation bar. Falls back to top-of-body if no header. */
    var header = document.getElementById('site-header');
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(b, header.nextSibling);
    } else if (header) {
      header.parentNode.appendChild(b);
    } else {
      document.body.insertBefore(b, document.body.firstChild);
    }

    /* Claude: 2026-03-14 — make banner draggable (same pattern as status circle).
       Drag to move, double-click to reset to default position.
       Position persists in localStorage across page loads. */
    makeBannerDraggable(b);
  }

  /* ── Draggable banner ──────────────────────────────────── */
  var BANNER_POS_KEY = 'aa-mirror-banner-pos';

  function makeBannerDraggable(el) {
    var startX = 0, startY = 0, startLeft = 0, startTop = 0;
    var dragging = false, didMove = false;

    /* Restore saved position or leave in flow */
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(BANNER_POS_KEY)); } catch (e) {}
    if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
      var w = el.offsetWidth || el.getBoundingClientRect().width;
      el.style.position = 'fixed';
      el.style.width = w + 'px';
      el.style.left = Math.max(0, Math.min(window.innerWidth - 200, saved.left)) + 'px';
      el.style.top  = Math.max(0, Math.min(window.innerHeight - 30, saved.top)) + 'px';
      el.style.margin = '0';
    }

    /* --- Mouse --- */
    el.addEventListener('mousedown', function(e) {
      if (e.target.id === 'aa-mirror-minimize' || e.button !== 0) return;
      e.preventDefault();
      beginDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      e.preventDefault();
      doDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', function() {
      if (!dragging) return;
      endDrag();
    });

    /* --- Touch --- */
    el.addEventListener('touchstart', function(e) {
      if (e.target.id === 'aa-mirror-minimize') return;
      var t = e.touches[0];
      beginDrag(t.clientX, t.clientY);
    }, { passive: true });
    el.addEventListener('touchmove', function(e) {
      if (!dragging) return;
      e.preventDefault();
      var t = e.touches[0];
      doDrag(t.clientX, t.clientY);
    }, { passive: false });
    el.addEventListener('touchend', function() {
      if (!dragging) return;
      endDrag();
    });

    /* --- Double-click resets --- */
    el.addEventListener('dblclick', function(e) {
      if (e.target.id === 'aa-mirror-minimize') return;
      el.style.position = 'relative';
      el.style.left = '';
      el.style.top  = '';
      el.style.margin = '';
      try { localStorage.removeItem(BANNER_POS_KEY); } catch (e2) {}
    });

    /* --- Helpers --- */
    function beginDrag(cx, cy) {
      dragging = true;
      didMove  = false;
      startX   = cx;
      startY   = cy;
      /* Switch to fixed on first drag if still in flow */
      if (el.style.position !== 'fixed') {
        var rect = el.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.width = rect.width + 'px';
        el.style.left = rect.left + 'px';
        el.style.top  = rect.top  + 'px';
        el.style.margin = '0';
      }
      startLeft = parseInt(el.style.left, 10) || 0;
      startTop  = parseInt(el.style.top,  10) || 0;
      el.style.cursor = 'grabbing';
      el.style.transition = 'none';
    }

    function doDrag(cx, cy) {
      var dx = cx - startX, dy = cy - startY;
      if (!didMove && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) didMove = true;
      var newL = Math.max(0, Math.min(window.innerWidth - 100, startLeft + dx));
      var newT = Math.max(0, Math.min(window.innerHeight - 20, startTop + dy));
      el.style.left = newL + 'px';
      el.style.top  = newT + 'px';
    }

    function endDrag() {
      dragging = false;
      el.style.cursor = 'grab';
      el.style.transition = '';
      if (didMove) {
        try {
          localStorage.setItem(BANNER_POS_KEY, JSON.stringify({
            left: parseInt(el.style.left, 10),
            top:  parseInt(el.style.top,  10)
          }));
        } catch (e2) {}
      }
    }
  }

  if (window.AA_MIRROR_UID) {
    showBanner((_cache && _cache.studentName) || 'student');
    renderSwitcherWhenReady();

    /* Claude: 2026-03-14 — poll for banner element and attach drag handlers.
       Bypasses timing issues where showBanner defers or errors before
       makeBannerDraggable gets called. */
    (function waitForBanner(n) {
      n = n || 0;
      var el = document.getElementById('aa-mirror-banner');
      if (el && !el._dragAttached) {
        el._dragAttached = true;
        makeBannerDraggable(el);
      } else if (n < 30) {
        setTimeout(function() { waitForBanner(n + 1); }, 200);
      }
    })();
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

          /* Claude: honor force-self flag — skip mirror setup, clear flag, show switcher only */
          if (_forceSelf) {
            try { sessionStorage.removeItem('AA_FORCE_SELF'); } catch (e) {}
            _forceSelf = false;
            findStudents(user.uid, function (students) {
              if (!students || students.length === 0) return;
              // Claude: cache students for switcher but DON'T set studentUid (no auto-mirror)
              var entry = { viewerUid: user.uid, viewerRole: role, studentUid: null, studentName: null, allStudents: students };
              writeCache(entry);
              renderSwitcherWhenReady();
            });
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
              viewerRole:  role,
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
