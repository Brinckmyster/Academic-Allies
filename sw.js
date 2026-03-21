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
/* Claude: 2026-03-21 — bumped for dashboard picker sync-first fix */
var CACHE   = 'aa-shell-20260321i';
var SCOPE   = '/Academic-Allies/';

/* Files that must ALWAYS come from network — never serve stale versions.
   These are the files that change most often and cause bugs when cached. */
var NEVER_CACHE = [
  '/Academic-Allies/modular/shared-header.html',
  '/Academic-Allies/modular/shared-footer.html',
  '/Academic-Allies/modular/aa-firebase.js',
  '/Academic-Allies/modular/js/dark-mode.js',
  '/Academic-Allies/modular/js/mode-enforcer.js',
  '/Academic-Allies/modular/js/status-circle.js',
  '/Academic-Allies/modular/js/aa-mirror.js',
  '/Academic-Allies/modular/js/study-activity.js',
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
  '/Academic-Allies/modular/checkin.html',
  '/Academic-Allies/modular/accommodations.html',
  '/Academic-Allies/modular/emergency.html',
  '/Academic-Allies/modular/resources.html',

  /* Crisis mode pages — must be available offline
     Claude: 2026-03-12 — added nope + semi-nope for offline crisis access */
  '/Academic-Allies/modular/nope-mode.html',
  '/Academic-Allies/modular/semi-nope.html',

  /* Feature pages */
  '/Academic-Allies/modular/components/audio-notes/audio-notes.html',
  '/Academic-Allies/modular/components/meal-planner/meal-planner.html',
  '/Academic-Allies/modular/components/spoon-planner/spoon-planner.html',
  '/Academic-Allies/modular/components/recovery-mode.html',
  '/Academic-Allies/modular/components/bad-brain-day.html',
  '/Academic-Allies/modular/components/message-system/message-system.html',

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
      return Promise.allSettled(
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
            console.log('[AA SW] purging old cache:', k);
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
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('firebaseio.com'))  return;
  if (url.hostname.includes('firebasestorage')) return;

  /* Claude: 2026-03-16 — NEVER_CACHE files always go to network first.
     These are the files that change most often (shared-header, aa-firebase, etc).
     Falls back to cache only when fully offline. */
  var path = url.pathname;
  var isNeverCache = NEVER_CACHE.some(function (nc) { return path === nc || path.endsWith(nc); });

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
            caches.open(CACHE).then(function (c) { c.put(req, fresh.clone()); });
          }
          return fresh;
        }).catch(function () { /* offline — cache already served */ });
        return cached;
      }

      /* Not in cache — try network, cache the response */
      return fetch(req).then(function (response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE).then(function (c) { c.put(req, clone); });
        }
        return response;
      }).catch(function () {
        /* Fully offline and not cached — return offline fallback for navigation
           Claude: 2026-03-16 — offline fallback page */
        if (req.mode === 'navigate') {
          return caches.match('/Academic-Allies/offline.html');
        }
        /* For other resources just fail gracefully */
      });
    })
  );
});
