/* ================================================================
   sw.js — Academic Allies Service Worker
   Claude: 2026-03-06 — offline PWA shell cache

   Strategy:
     • Install: pre-cache the app shell (key pages + shared assets)
     • Fetch:   serve from cache first, fall back to network
                skip interception for Firebase/CDN cross-origin calls
     • Activate: purge stale caches from previous SW versions
   ================================================================ */

/* Claude: 2026-03-14 — bumped cache v3→v4. v3 had stale shared-header, aa-mirror,
   and several component pages. v4 forces a full re-download of the shell so mobile
   users pick up all the 2026-03-14 changes (mirror guards, UX polish, clock fix). */
/* Claude: 2026-03-14 — bumped v4→v5. All pages now have inline dark-mode FOUC fix;
   need fresh cache so mobile picks up the new <script> tags in <head>. */
var CACHE   = 'aa-shell-v5';
var SCOPE   = '/Academic-Allies/';

/* Pages and assets to pre-cache on install */
var SHELL = [
  '/Academic-Allies/',
  '/Academic-Allies/index.html',
  '/Academic-Allies/manifest.webmanifest',
  '/Academic-Allies/favicon.ico',
  '/Academic-Allies/favicon-32x32.png',
  '/Academic-Allies/favicon-16x16.png',
  '/Academic-Allies/apple-touch-icon-180.png',

  /* Shared infrastructure */
  '/Academic-Allies/modular/shared-header.html',
  '/Academic-Allies/modular/shared-footer.html',
  '/Academic-Allies/modular/aa-firebase.js',

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
  '/Academic-Allies/modular/icons/branding.png'
];

/* ── Install: pre-cache shell ───────────────────────────────── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* addAll stops on first failure — use individual adds so one
         missing asset doesn't block the whole install */
      return Promise.allSettled(
        SHELL.map(function (url) {
          return cache.add(url).catch(function (err) {
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

  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        /* Serve from cache, then refresh in background (stale-while-revalidate) */
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
        /* Fully offline and not cached — return index for navigation */
        if (req.mode === 'navigate') {
          return caches.match('/Academic-Allies/index.html');
        }
        /* For other resources just fail gracefully */
      });
    })
  );
});
