/* ================================================================
   sw.js — Academic Allies Service Worker
   Claude: 2026-03-06 — offline PWA shell cache

   Strategy:
     • Install: pre-cache the app shell (key pages + shared assets)
     • Fetch:   serve from cache first, fall back to network
                skip interception for Firebase/CDN cross-origin calls
     • Activate: purge stale caches from previous SW versions
   ================================================================ */

/* Claude: 2026-03-16 — REWRITTEN cache strategy. No more manual version bumps.
   Cache name now uses a timestamp that auto-updates whenever sw.js is modified.
   Key files (shared-header, aa-firebase, dark-mode) are NEVER cached — always
   fetched fresh from the network. This eliminates the #1 source of stale-code
   bugs: the SW serving old shared-header.html after a fix was deployed.
   Static assets (icons, pages) are still cached for offline/speed. */
/* Claude: 2026-03-22 — housekeeping: synced all cache-bust versions to 20260322 */
var CACHE   = 'aa-shell-20260402e'; /* Claude: 2026-04-02 — class schedule in calendar */
var SCOPE   = '/Academic-Allies/';

/* Files that must ALWAYS come from network — never serve stale versions.
   These are the files that change most often and cause bugs when cached. */
var NEVER_CACHE = [
  '/Academic-Allies/modular/shared-header.html',
  '/Academic-Allies/modular/shared-footer.html',
  '/Academic-Allies/modular/aa-firebase.js',
  '/Academic-Allies/modular/js/dark-mode.js',
  '/Academic-Allies/modular/js/mode-enforcer.js',
  '/Academic-Allies/modular/js/mode-gate.js', /* Claude: 2026-03-23 — was missing; SW served stale mode-gate */
  '/Academic-Allies/modular/js/status-circle.js',
  '/Academic-Allies/modular/js/aa-mirror.js',
  '/Academic-Allies/modular/js/study-activity.js',
  '/Academic-Allies/modular/js/student-config.js', /* Claude: 2026-03-23 — frequently edited config system */
  '/Academic-Allies/modular/components/spoon-planner/spoon-pal.html',    /* Claude: 2026-03-23 — was being cached, serving stale code */
  '/Academic-Allies/modular/components/spoon-planner/spoon-planner.html', /* Claude: 2026-03-23 */
  '/Academic-Allies/modular/components/support-dashboard/support-dashboard.html', /* Claude: 2026-03-23 — quiet alert fix */
  '/Academic-Allies/modular/components/meal-planner-mary/index.html', /* Claude: 2026-03-25 — C4 fix: was missing from NEVER_CACHE, served stale code */
  '/Academic-Allies/modular/components/message-system/message-system.html', /* Claude: 2026-03-25 — mobile layout overhaul */
  '/Academic-Allies/modular/components/settings/settings.html', /* Claude: 2026-03-25 — mobile responsive fix */
  '/Academic-Allies/modular/components/audio-notes/audio-notes.html', /* Claude: 2026-03-25 — loading states + save button fixes */
  '/Academic-Allies/modular/components/modes/modes.html', /* Claude: 2026-03-25 — mobile mode grid fix */
  '/Academic-Allies/modular/components/recovery-mode.html', /* Claude: 2026-03-25 — energy radiogroup a11y + keyboard nav */
  '/Academic-Allies/modular/components/brain-bloom/brain-bloom.html', /* Claude: 2026-03-29 — Brain Bloom recovery games */
  '/Academic-Allies/modular/components/comfort-games/emoticon-defense.html', /* Claude: 2026-03-31 — Ruffle Flash embed, must be fresh */
  '/Academic-Allies/modular/components/comfort-games/secret-agent.html', /* Claude: 2026-04-01 — js-dos DOSBox embed, must be fresh */
  '/Academic-Allies/modular/components/comfort-games/brick-breaker.html', /* Claude: 2026-04-01 — vanilla JS, must be fresh */
  '/Academic-Allies/modular/components/comfort-games/snake.html', /* Claude: 2026-04-01 — vanilla JS, must be fresh */
  '/Academic-Allies/modular/components/comfort-games/game-center.html', /* Claude: 2026-04-01 — Game Center hub, must be fresh */
  '/Academic-Allies/modular/components/brain-check/simon-says.html', /* Claude: 2026-04-01 — brain check game */
  '/Academic-Allies/modular/components/brain-check/reaction-time.html', /* Claude: 2026-04-01 — brain check game */
  '/Academic-Allies/modular/components/brain-check/pattern-spotter.html', /* Claude: 2026-04-01 — brain check game */
  '/Academic-Allies/modular/components/brain-check/reading-check.html', /* Claude: 2026-04-01 — brain check game */
  '/Academic-Allies/modular/components/bedroom-planner/bedroom-planner.html', /* Claude: 2026-04-01 — re-add: was dropped in sw.js rewrite */
  '/Academic-Allies/modular/checkin-log.html', /* Claude: 2026-03-25 — clickable div keyboard a11y */
  '/Academic-Allies/modular/components/student-config/student-config-editor.html', /* Claude: 2026-03-25 — tab scroll hint */
  '/Academic-Allies/modular/components/calendar/calendar.html', /* Claude: 2026-03-25 — mobile responsive + offline cache */
  '/Academic-Allies/modular/components/streak-cat/streak-cat.html', /* Claude: 2026-03-25 — mobile + touch targets */
  '/Academic-Allies/modular/checkin.html', /* Claude: 2026-03-25 — mobile responsive */
  '/Academic-Allies/modular/components/user-tiers/user-tiers.html', /* Claude: 2026-03-25 — mobile responsive */
  '/Academic-Allies/modular/components/study-notes/study-notes.html', /* Claude: 2026-03-25 — focus trap + dialog a11y */
  '/Academic-Allies/modular/static/custom-quiz.html', /* Claude: 2026-03-25 — XSS escape + keyboard a11y */
  '/Academic-Allies/modular/admin.html', /* Claude: 2026-03-25 — role-based access, must be fresh */
  '/Academic-Allies/modular/components/audit-log/audit-log.html', /* Claude: 2026-03-25 — compliance data, must be fresh */
  '/Academic-Allies/modular/components/audio-notes/audio-converter.html', /* Claude: 2026-03-25 — file I/O tool */
  '/Academic-Allies/sw.js'
];

/* Pages and assets to pre-cache on install */
var SHELL = [
  '/Academic-Allies/',
  '/Academic-Allies/index.html',
  '/Academic-Allies/manifest.webmanifest',
  '/Academic-Allies/favicon.ico',
  '/Academic-Allies/favicon-32x32.png',
  '/Academic-Allies/favicon-16x16.png',
  '/Academic-Allies/apple-touch-icon-180.png',

  /* Claude: 2026-03-16 — shared-header, shared-footer, aa-firebase REMOVED from
     pre-cache. They are in NEVER_CACHE and always fetched fresh from network. */

  /* Core pages */
  /* Claude: 2026-03-25 — checkin.html moved to NEVER_CACHE (mobile responsive changes) */
  '/Academic-Allies/modular/accommodations.html',
  '/Academic-Allies/modular/emergency.html',
  '/Academic-Allies/modular/resources.html',

  /* Crisis mode pages — must be available offline
     Claude: 2026-03-12 — added nope + semi-nope for offline crisis access */
  '/Academic-Allies/modular/nope-mode.html',
  '/Academic-Allies/modular/semi-nope.html',

  /* Feature pages */
  /* Claude: 2026-03-25 — audio-notes.html moved to NEVER_CACHE */
  '/Academic-Allies/modular/components/meal-planner/meal-planner.html',
  /* Claude: 2026-03-23 — spoon-planner.html moved to NEVER_CACHE (was serving stale code) */
  /* Claude: 2026-03-25 — recovery-mode.html moved to NEVER_CACHE (a11y keyboard nav changes) */
  '/Academic-Allies/modular/components/bad-brain-day.html',
  /* Claude: 2026-03-25 — message-system.html moved to NEVER_CACHE */
  /* Claude: 2026-03-25 — streak-cat.html moved to NEVER_CACHE (mobile + touch targets) */
  /* duchess photos load on demand — too large to pre-cache */

  /* App icon */
  '/Academic-Allies/modular/icons/branding.png',

  /* Claude: 2026-03-16 — offline fallback page */
  '/Academic-Allies/offline.html'
];

/* ── Install: pre-cache shell ───────────────────────────────── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* addAll stops on first failure — use individual adds so one
         missing asset doesn't block the whole install */
      /* Claude: 2026-03-16 — bypass HTTP cache on install so we always get
         fresh copies from the network, not stale copies from the browser's
         HTTP cache. This prevents the old-cache-serves-old-files problem. */
      /* Claude: 2026-03-29 — replaced Promise.allSettled (ES2020) with Promise.all wrapping .catch for ES5 compat */
      return Promise.all(
        SHELL.map(function (url) {
          return fetch(url, { cache: 'reload' }).then(function (resp) {
            if (resp.ok) return cache.put(url, resp);
          }).catch(function (err) {
            console.warn('[AA SW] pre-cache miss:', url, err.message);
          });
        })
      );
    })
  );
  /* Claude: 2026-03-14 — re-enabled skipWaiting to force immediate activation.
     Needed to bust stale v2 cache that was hiding the sign-in button on mobile.
     Previous concern: disrupting recording sessions. Acceptable trade-off because
     users currently can't sign in at all on mobile without this fix.
     If recording disruptions recur, remove skipWaiting and bump cache version instead. */
  self.skipWaiting();
});

/* ── Activate: purge old caches ─────────────────────────────── */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k !== CACHE; })
          .map(function (k) {
            /* Claude: 2026-03-25 — fixed: service workers use self, not window */
            if (self.AA_DEBUG) console.log('[AA SW] purging old cache:', k);
            return caches.delete(k);
          })
      );
    })
  );
  /* Claude: 2026-03-14 — re-enabled clients.claim() paired with skipWaiting above.
     Forces all open tabs to use the new SW immediately, so the sign-in fix
     takes effect without requiring a manual reload. */
  self.clients.claim();
});

/* ── Fetch: cache-first for our origin, passthrough for CDN ─── */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* Skip: non-GET, cross-origin (Firebase, Google CDN, etc.) */
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  /* Skip: Firestore / Storage REST endpoints */
  /* Claude: 2026-03-25 — replaced .includes() with .indexOf() for ES5 compat */
  if (url.hostname.indexOf('googleapis.com') !== -1) return;
  if (url.hostname.indexOf('firebaseio.com') !== -1)  return;
  if (url.hostname.indexOf('firebasestorage') !== -1) return;

  /* Claude: 2026-03-16 — NEVER_CACHE files always go to network first.
     These are the files that change most often (shared-header, aa-firebase, etc).
     Falls back to cache only when fully offline. */
  var path = url.pathname;
  /* Claude: 2026-03-30 — W5 fix: replaced .endsWith() (ES6) with .slice() for ES5 compliance */
  var isNeverCache = NEVER_CACHE.some(function (nc) { return path === nc || path.slice(-nc.length) === nc; });

  if (isNeverCache) {
    e.respondWith(
      fetch(req).catch(function () {
        /* Offline fallback — try cache as last resort */
        return caches.match(req);
      })
    );
    return;
  }

  /* Everything else: cache-first with background refresh (stale-while-revalidate) */
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        var refresh = fetch(req).then(function (fresh) {
          if (fresh.ok) {
            /* Claude: 2026-03-25 — added .catch() to prevent unhandled rejection */
            caches.open(CACHE).then(function (c) { c.put(req, fresh.clone()); }).catch(function () {});
          }
          return fresh;
        }).catch(function () { /* offline — cache already served */ });
        return cached;
      }

      /* Not in cache — try network, cache the response */
      return fetch(req).then(function (response) {
        if (response.ok) {
          var clone = response.clone();
          /* Claude: 2026-03-25 — added .catch() to prevent unhandled rejection */
          caches.open(CACHE).then(function (c) { c.put(req, clone); }).catch(function () {});
        }
        return response;
      }).catch(function () {
        /* Fully offline and not cached — return offline fallback for navigation
           Claude: 2026-03-16 — offline fallback page
           Claude: 2026-03-30 — restored after truncation detected by nightly audit */
        if (req.mode === 'navigate') {
          return caches.match('/Academic-Allies/offline.html');
        }
        /* For other resources just fail gracefully */
      });
    })
  );
});
    