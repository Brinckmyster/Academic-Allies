/* ============================================================
   status-circle.js — Academic Allies Status Circle Brain
   Written:  2026-02-19 by Claude
   Updated:  2026-02-21 by Claude — 5-segment ring, day logic, click toggle
   Updated:  2026-02-25 by Claude — Mary's confirmed 10-point energy scale
   Updated:  2026-02-26 by Claude — reads new categories object from gateway
   Updated:  2026-03-27 by Claude — blue circle for recently active users with no check-in;
             multi-signal fallback (lastSeen + studyActivity + alt timestamps)
             check-in (mental/physical/school/spiritual/social); legacy field
             fallback retained for entries saved before gateway rebuild;
             Spiritual segment now live; thumping flag bumps Mental+Physical;
             emergency handles both boolean true and legacy string 'yes'

   CLAUDE: 2026-03-27 — Status-circle NOT refactored to use AA.getStudentStatus().
   Reason: Uses Firestore realtime listeners (nope watcher, daily check-in listener)
   which require instant updates. AA.getStudentStatus() is async-only (Promise).
   Status-circle already uses shared helpers (AA.colorOfSegment, AA.avgEntryColor,
   AA.shouldSuppressCaution) ensuring color consistency with support-dashboard.
   No functional changes needed — kept as-is.

   Views (click circle to toggle):
     ring  → colored arc per category (default)
     solid → single overall color

   Segments (day-of-week gated):
     Mon–Fri : Academic, Spiritual, Mental/Emotional, Physical, Social
     Saturday: Social only
     Sunday  : Spiritual only

   Each segment colored from today's latest check-in entry.
   No grey — segments with no data simply don't appear.
   NOPE active → always solid red (no segments).

   Dev console:
     AA_setStatus('yellow')  → force color for testing
     AA_clearStatus()        → revert to real data
   ============================================================ */

(function () {
  'use strict';

  /* ── Color values ──────────────────────────────────────── */
  var C = {
    green:  '#28a745',
    yellow: '#ffc107',
    orange: '#fd7e14',
    red:    '#dc3545'
  };

  var DEV_KEY  = 'aa-status-dev';
  var VIEW_KEY = 'aa-status-view';  /* 'ring' | 'solid' */

  /* Claude: 2026-03-12 — ROLLING_DAYS removed; replaced by ROLLING_COUNT (7 check-ins)
     and MAX_LOOKBACK (30 days) in fetchRecentEntries / localData. */
  /* Claude: 2026-03-12 — days without a check-in before solid view shows caution diamond.
     Configurable per-user via Firestore alertThreshold field; this is the fallback default. */
  var CAUTION_DAYS = 5;

  /* ── Runtime state ─────────────────────────────────────── */
  var _view         = 'ring';
  var _segData      = {};     /* { segmentName: colorHex } */
  var _nope         = false;
  var _unsubNope    = null;
  var _unsubDay     = null;
  var _unsubAuth    = null; /* Claude: 2026-03-26 — store onAuthStateChanged unsub handle */
  var _lastCheckinTs = null;  /* Date | null — timestamp of latest check-in entry */
  /* Claude: rolling average flag — true when displaying historical avg instead of today's data */
  var _isRollingAvg = false;
  /* Claude: 2026-03-12 — caution flag: true when last check-in was > CAUTION_DAYS ago.
     Solid view shows caution diamond; segmented view shows rolling 7-day average. */
  var _isCaution    = false;
  /* UID guard — skip re-init on Firebase ~45-min token refresh. Claude, 2026-03-07. */
  var _scUid        = null;
  /* Claude: 2026-03-20 — study tool activity for Academic segment injection */
  var _studyActive  = false;   /* true if study tools were used today */
  var _studyTools   = [];      /* which tools were used */
  var _studySessions = 0;      /* how many sessions today */
  /* Claude: 2026-03-20 — caution suppression flag. Set by AA.shouldSuppressCaution()
     which is the single source of truth (in aa-firebase.js). All three consumers
     (status-circle, support dashboard, home page) call the same function. */
  var _suppressCaution = false;
  /* Claude: 2026-03-27 — multi-signal recently active state.
     Grey shows ONLY when ALL signals confirm no recent activity.
     Signal 1: lastSeen.timestamp from user doc
     Signal 2: studyActivity.lastActivity from studyActivity doc
     Signal 3: fallback timestamps (lastLogin, lastActive, lastCheckIn) from user doc */
  var _lastSeenTs          = null; /* Signal 1 */
  var _studyLastActivityTs = null; /* Signal 2 */
  var _altActivityTs       = null; /* Signal 3 */

  /* ── Day-of-week → eligible segments (0=Sun … 6=Sat) ───── */
  var DAY_SEGS = [
    ['Spiritual'],                                                    /* 0 Sun */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 1 Mon */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 2 Tue */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 3 Wed */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 4 Thu */
    ['Academic','Spiritual','Mental/Emotional','Physical','Social'],  /* 5 Fri */
    ['Social']                                                        /* 6 Sat */
  ];

  function eligibleSegs() {
    return DAY_SEGS[new Date().getDay()];
  }

  /* Claude: local date key — avoids UTC-day mismatch for users behind UTC — 2026-02-28 */
  /* Claude: 2026-03-25 — replaced .padStart() (ES2017) with ES5-safe pattern */
  function _localDateKey() {
    var d = new Date();
    return d.getFullYear() + '-' +
           ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
           ('0' + d.getDate()).slice(-2);
  }

  /* ── Segment color from one check-in entry ─────────────── */
  /* Claude: 2026-03-20 — delegates to AA.colorOfSegment() in aa-firebase.js
     (single source of truth). Falls back to local logic if AA not loaded yet. */
  function colorOf(seg, e) {
    if (window.AA && window.AA.colorOfSegment) return window.AA.colorOfSegment(seg, e);
    if (!e) return null;

    /* Emergency — new saves boolean, legacy saved string 'yes' */
    var emg = (e.emergency === true || e.emergency === 'yes');
    if (emg) return C.red;

    /* Thumping voices flag — bumps Mental + Physical to at least yellow */
    var thumping = (e.thumping === true);

    /* ── Helper: Mary's 10-point scale → color
          1-4 green | 5 yellow | 6-7 orange | 8-10 red          */
    function emojiColor(v) {
      if (!v || typeof v !== 'number') return null;
      if (v >= 8) return C.red;
      if (v >= 6) return C.orange;
      if (v >= 5) return C.yellow;
      return C.green;  /* 1-4 */
    }

    /* ── Helper: raise color to at least yellow if thumping ── */
    function bump(col) {
      if (!thumping) return col;
      if (col === C.green || col === null) return C.yellow;
      return col;
    }

    /* ── New format: categories object from gateway check-in ─ */
    var cats = (e.categories && typeof e.categories === 'object')
               ? e.categories : null;

    /* ── ACADEMIC ← categories.school ───────────────────────── */
    if (seg === 'Academic') {
      if (cats && cats.school) {
        var sc = cats.school;
        if (!sc.gateway || sc.gateway === 'skip') return null;
        var ec = emojiColor(sc.emojiV);
        if (ec) return ec;
        if (sc.gateway === 'yes') return C.green;
        if (sc.gateway === 'no') {
          var sch = sc.checked || [];
          /* Hard flags in the No expand → orange */
          if (sch.indexOf('deadline') !== -1 ||
              sch.indexOf('overwhelmed') !== -1 ||
              sch.indexOf('executive') !== -1) return C.orange;
          return C.yellow;
        }
        return null;
      }
      /* Legacy fallback: planner was saved as boolean (new compat)
         or string 'yes'/'no' (very old entries) */
      if (e.planner === true  || e.planner === 'yes') return C.green;
      if (e.planner === false || e.planner === 'no')  return C.yellow;
      return null;
    }

    /* ── SOCIAL ← categories.social ─────────────────────────── */
    if (seg === 'Social') {
      if (cats && cats.social) {
        var so = cats.social;
        if (!so.gateway || so.gateway === 'skip') return null;
        var sec = emojiColor(so.emojiV);
        if (sec) return sec;
        if (so.gateway === 'yes') return C.green;
        if (so.gateway === 'no') {
          var soh = so.checked || [];
          if (soh.indexOf('isolated') !== -1 ||
              soh.indexOf('withdrawal') !== -1) return C.orange;
          return C.yellow;
        }
        return null;
      }
      /* Legacy fallback: support was boolean or string */
      if (e.support === true  || e.support === 'yes') return C.green;
      if (e.support === false || e.support === 'no')  return C.yellow;
      return null;
    }

    /* ── PHYSICAL ← categories.physical ─────────────────────── */
    if (seg === 'Physical') {
      if (cats && cats.physical) {
        var ph = cats.physical;
        if (!ph.gateway || ph.gateway === 'skip') return null;
        var pec = emojiColor(ph.emojiV);
        if (pec) return bump(pec);
        if (ph.gateway === 'yes') return bump(C.green);
        if (ph.gateway === 'no') {
          var phh = ph.checked || [];
          if (phh.indexOf('exhausted') !== -1 ||
              phh.indexOf('pain_high') !== -1) return bump(C.orange);
          return bump(C.yellow);
        }
        return null;
      }
      /* Legacy fallback: symptoms/sleep/symptomList */
      var hasSymp  = (e.symptoms === true || e.symptoms === 'yes' ||
                      e.symptoms === false || e.symptoms === 'no');
      var hasSleep = (e.sleep === 'yes' || e.sleep === 'no');
      if (!hasSymp && !hasSleep) return thumping ? C.yellow : null;
      var sympBad = (e.symptoms === true || e.symptoms === 'yes');
      var sleepNo = (e.sleep === 'no');
      var cnt = Array.isArray(e.symptomList) ? e.symptomList.length : 0;
      if (sympBad && cnt >= 3)  return C.red;
      if (sympBad && sleepNo)   return bump(C.orange);
      if (sympBad || sleepNo)   return bump(C.yellow);
      return bump(C.green);
    }

    /* ── MENTAL/EMOTIONAL ← categories.mental ───────────────── */
    if (seg === 'Mental/Emotional') {
      if (cats && cats.mental) {
        var mn = cats.mental;
        if (!mn.gateway || mn.gateway === 'skip') return null;
        var mec = emojiColor(mn.emojiV);
        if (mec) return bump(mec);
        if (mn.gateway === 'yes') return bump(C.green);
        if (mn.gateway === 'no')  return bump(C.yellow);
        return null;
      }
      /* Legacy fallback: energyLevel number (added 2026-02-25)
         then old 6-label mood string (very old entries) */
      var fog = (e.symptoms === true &&
                 Array.isArray(e.symptomList) &&
                 e.symptomList.some(function (s) {
                   return /brain.fog|trouble.think/i.test(s);
                 }));
      var lvl = typeof e.energyLevel === 'number' ? e.energyLevel : 0;
      if (lvl > 0) {
        if (lvl >= 8)           return bump(C.red);
        if (lvl >= 6)           return bump(C.orange);
        if (lvl >= 5 || fog)    return bump(C.yellow);
        return bump(C.green);
      }
      var m = e.mood || '';
      if (m === 'Struggling')                   return bump(C.red);
      if (m === 'Anxious')                      return bump(C.orange);
      if (m === 'Okay' || m === 'Tired' || fog) return bump(C.yellow);
      if (m === 'Great' || m === 'Good')        return bump(C.green);
      return thumping ? C.yellow : null;
    }

    /* ── SPIRITUAL ← categories.spiritual ───────────────────── */
    /* Now live! Returns null only if skipped or no data at all. */
    if (seg === 'Spiritual') {
      if (cats && cats.spiritual) {
        var sp = cats.spiritual;
        if (!sp.gateway || sp.gateway === 'skip') return null;
        var spec = emojiColor(sp.emojiV);
        if (spec) return spec;
        if (sp.gateway === 'yes') return C.green;
        if (sp.gateway === 'no')  return C.yellow;
      }
      return null; /* no data in legacy entries */
    }

    return null;
  }

  /* ── Build segData from a Firestore/localStorage entries array ── */
  function fromEntries(entries) {
    var entry = (entries && entries.length) ? entries[entries.length - 1] : null;

    /* Capture timestamp from latest entry for the banner */
    if (entry && entry.timestamp) {
      /* Firestore Timestamp → JS Date; plain Date objects pass through */
      _lastCheckinTs = (typeof entry.timestamp.toDate === 'function')
        ? entry.timestamp.toDate()
        : new Date(entry.timestamp);
    } else {
      _lastCheckinTs = null;
    }

    var out = {};
    eligibleSegs().forEach(function (seg) {
      var c = colorOf(seg, entry);
      if (c !== null) out[seg] = c;
    });

    /* Claude: 2026-03-12 — fallback for entries that have a flag but no category
       data (e.g. Bad Brain Day energy check-in, simplified check-in).
       If all segments came back null but the entry has a flag, show at least
       one segment colored by the flag so the circle isn't empty. */
    if (entry && Object.keys(out).length === 0) {
      var flagColor = null;
      if (entry.flag === 'red')    flagColor = C.red;
      else if (entry.flag === 'yellow') flagColor = C.yellow;
      else if (entry.flag === 'orange') flagColor = C.orange;
      else if (entry.flag === 'green')  flagColor = C.green;
      /* Also handle Bad Brain Day energy entries */
      if (!flagColor && typeof entry.badBrainDayEnergy === 'number') {
        var bv = entry.badBrainDayEnergy;
        if (bv >= 8) flagColor = C.red;
        else if (bv >= 6) flagColor = C.orange;
        else if (bv >= 5) flagColor = C.yellow;
        else flagColor = C.green;
      }
      if (flagColor) {
        out['Mental/Emotional'] = flagColor;
      }
    }

    return out;
  }

  /* Claude: 2026-03-12 — two separate fetch strategies:
     Scenario 2 (recent): average the last 7 CALENDAR DAYS — fixed window, some days may be empty.
     Scenario 3 (stale):  find the last 7 CHECK-INS — however far back, up to MAX_LOOKBACK days.
     fetchRecentDays returns data for both; the caller decides which to use based on newestDaysAgo. */
  var ROLLING_DAYS   = 7;   /* calendar days to average for scenario 2 */
  var ROLLING_COUNT  = 7;   /* number of actual check-in entries for scenario 3 */
  var MAX_LOOKBACK   = 30;  /* max calendar days to search back for scenario 3 */

  /* Claude: 2026-03-25 — replaced .padStart() (ES2017) with ES5-safe pattern */
  function _makeDateKey(d) {
    return d.getFullYear() + '-' +
           ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
           ('0' + d.getDate()).slice(-2);
  }

  /* Fetch up to MAX_LOOKBACK days of check-in data from Firestore.
     Returns { hits: [{ entry, daysAgo }], newestDaysAgo: number } */
  function fetchAllRecent(uid) {
    var now = new Date();
    var dayKeys = [];
    var i;
    for (i = 1; i <= MAX_LOOKBACK; i++) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      dayKeys.push({ dateKey: _makeDateKey(d), daysAgo: i });
    }

    return Promise.all(
      dayKeys.map(function (dk) {
        return window.AA.db
          .collection('checkins').doc(uid)
          .collection('days').doc(dk.dateKey)
          .get()
          .then(function (doc) {
            if (doc.exists && Array.isArray(doc.data().entries) && doc.data().entries.length > 0) {
              return { entry: doc.data().entries[doc.data().entries.length - 1], daysAgo: dk.daysAgo };
            }
            return null;
          })
          .catch(function () { return null; });
      })
    ).then(function (results) {
      var hits = results
        .filter(function (r) { return r !== null; })
        .sort(function (a, b) { return a.daysAgo - b.daysAgo; });
      var newestDaysAgo = hits.length > 0 ? hits[0].daysAgo : MAX_LOOKBACK + 1;
      return { hits: hits, newestDaysAgo: newestDaysAgo };
    });
  }

  /* Scenario 2: average entries from the last 7 calendar days only */
  function filterByDays(hits) {
    return hits
      .filter(function (h) { return h.daysAgo <= ROLLING_DAYS; })
      .map(function (h) { return h.entry; });
  }

  /* Scenario 3: take the most recent 7 check-ins regardless of how far back */
  function filterByCount(hits) {
    return hits
      .slice(0, ROLLING_COUNT)
      .map(function (h) { return h.entry; });
  }

  /* ── Banner: "Showing: [view] · Last check-in: [time]" ─── */
  /* Spec §8: always visible, non-intrusive, top-right below circle */
  function renderBanner() {
    var el = document.getElementById('sc-banner');
    if (!el) return;

    /* Claude: 2026-03-20 — uses same _suppressCaution flag as render(). */
    var bannerCaution = _isCaution && !_suppressCaution;

    var viewLabel = (_view === 'ring') ? 'All 5 segments' : 'Overall status';
    if (_nope) viewLabel = 'NOPE mode';
    /* Claude: 2026-03-12 — override view label when caution + solid view */
    if (bannerCaution && _view === 'solid') viewLabel = '\u26A0\uFE0F Caution';

    var timeLabel;
    /* Claude: 2026-03-12 — banner text distinguishes scenario 2 vs 3.
       Scenario 3 (caution): "5+ days without check-in"
       Scenario 2 (rolling): "Avg of last 7 days" */
    if (bannerCaution) {
      timeLabel = CAUTION_DAYS + '+ days without check-in';
    } else if (_isRollingAvg) {
      timeLabel = 'Avg of last ' + ROLLING_DAYS + ' days';
    } else if (!_lastCheckinTs) {
      /* Claude: 2026-03-27 — show active state instead of plain "no check-in" when recently online */
      timeLabel = _isRecentlyActive() ? 'Active on site \u2014 no check-in today' : 'No check-in today';
    } else {
      var now     = new Date();
      var diffMin = Math.round((now - _lastCheckinTs) / 60000);
      if (diffMin < 1)       timeLabel = 'just now';
      else if (diffMin < 60) timeLabel = diffMin + 'm ago';
      else {
        timeLabel = _lastCheckinTs.toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', hour12: true
        });
      }
    }

    el.textContent = 'Showing: ' + viewLabel + ' · ' + timeLabel;
  }

  /* ── Weighted-average color across all visible segments ─── */
  /* Claude: 2026-02-28 — replaced worst-only with weighted avg.
     green=1, yellow=2, orange=3, red=4; map avg back to color:
     1.0-1.7→green, 1.8-2.4→yellow, 2.5-3.2→orange, 3.3-4→red */
  var SCORE = {};
  SCORE[C.green]  = 1;
  SCORE[C.yellow] = 2;
  SCORE[C.orange] = 3;
  SCORE[C.red]    = 4;

  function avgColor(sd) {
    var keys = Object.keys(sd);
    if (!keys.length) return null;
    var total = 0;
    keys.forEach(function (k) { total += (SCORE[sd[k]] || 1); });
    var avg = total / keys.length;
    if (avg >= 3.3) return C.red;
    if (avg >= 2.5) return C.orange;
    if (avg >= 1.8) return C.yellow;
    return C.green;
  }

  /* Claude: build segData from rolling average of recent entries (multiple days) */
  function fromRollingEntries(entriesArray) {
    if (!entriesArray || !entriesArray.length) return {};

    var out = {};

    /* For each eligible segment, collect all non-null colors across all entries */
    eligibleSegs().forEach(function (seg) {
      var colors = [];
      entriesArray.forEach(function (entry) {
        var c = colorOf(seg, entry);
        if (c !== null) colors.push(c);
      });

      /* If we have colors for this segment, average them */
      if (colors.length > 0) {
        var total = 0;
        colors.forEach(function (col) {
          total += (SCORE[col] || 1);
        });
        var avg = total / colors.length;

        /* Map average score back to color */
        if (avg >= 3.3) out[seg] = C.red;
        else if (avg >= 2.5) out[seg] = C.orange;
        else if (avg >= 1.8) out[seg] = C.yellow;
        else out[seg] = C.green;
      }
    });

    return out;
  }

  /* ── SVG filled-pie builder ───────────────────────────── */
  /* Claude: 2026-03-20 — changed from donut ring (IR=11) to solid filled pie.
     Wedges now go all the way to the center like slices of an actual pie. */
  var CX = 20, CY = 20, OR = 18;

  function ptAt(r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return (CX + r * Math.cos(rad)).toFixed(2) + ',' +
           (CY + r * Math.sin(rad)).toFixed(2);
  }

  var STATUS_LABEL = {};
  STATUS_LABEL[C.green]  = 'clear';
  STATUS_LABEL[C.yellow] = 'some concern';
  STATUS_LABEL[C.orange] = 'needs attention';
  STATUS_LABEL[C.red]    = 'urgent';

  /* Claude: 2026-03-20 — solid pie wedge: arc from outer edge back to center point.
     Old donut used two arcs (outer + inner ring). Pie uses one arc + line to center.
     Claude: 2026-03-20 — stroke divider instead of degree gaps. Each wedge fills
     its full 72° slot; a thin stroke line creates the visual separator like the
     reference image (white lines between slices). */
  function segPath(color, a0, a1, name) {
    var large = (a1 - a0 > 180) ? 1 : 0;
    var d = 'M' + CX + ',' + CY +
            ' L' + ptAt(OR, a0) +
            ' A' + OR + ',' + OR + ',0,' + large + ',1,' + ptAt(OR, a1) +
            ' Z';
    var tip = name + ': ' + (STATUS_LABEL[color] || '');
    var strokeColor = document.documentElement.classList.contains('aa-dark') ? '#1e1e1e' : 'white';
    return '<path d="' + d + '" fill="' + color + '" stroke="' + strokeColor + '" stroke-width="0.8"><title>' + tip + '</title></path>';
  }

  var EMPTY_SVG =
    '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="18" fill="#e0e0e0" opacity="0.4"/>' +
    '</svg>';

  /* Claude: 2026-03-27 — blue circle for recently active users with no check-in */
  var ACTIVE_NO_CHECKIN_SVG =
    '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="18" fill="#42A5F5" opacity="0.7"/>' +
    '</svg>';

  /* Claude: 2026-03-20 — uniform 5-slot pie. Each segment has a fixed 72° slot
     regardless of how many segments have data. Empty slots are simply not drawn,
     so segments stay in consistent positions and never change size. */
  var SEG_ORDER = ['Academic','Spiritual','Mental/Emotional','Physical','Social'];
  var SLOT_DEG  = 72;  /* 360 / 5 */

  function makeSVG(sd) {
    var filled = [];
    SEG_ORDER.forEach(function (name, i) {
      if (sd[name]) filled.push(i);
    });
    if (filled.length === 0) return EMPTY_SVG;

    var paths = '';
    filled.forEach(function (slotIdx) {
      var name = SEG_ORDER[slotIdx];
      var a0 = slotIdx * SLOT_DEG;
      var a1 = a0 + SLOT_DEG;
      /* If only one segment, fill nearly the whole circle */
      if (filled.length === 1) {
        a0 = 0;
        a1 = 359.9;
      }
      paths += segPath(sd[name], a0, a1, name);
    });

    return '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">' +
           paths + '</svg>';
  }

  /* ── Render current state to DOM ────────────────────────── */
  var SOLID_LABEL = {};
  SOLID_LABEL[C.red]    = 'Urgent — please reach out';
  SOLID_LABEL[C.orange] = 'Needs attention';
  SOLID_LABEL[C.yellow] = 'Moderate concern';
  SOLID_LABEL[C.green]  = 'All clear';

  function render() {
    var el = document.getElementById('status-circle');
    if (!el) return;
    renderBanner();  /* always update banner alongside circle */
    renderTooltip(); /* Claude: 2026-03-19 — keep segment legend in sync */

    el.style.border     = '';
    el.style.borderTop  = '';
    el.style.animation  = '';
    el.style.background = 'transparent';
    el.innerHTML        = '';
    /* Claude: 2026-03-12 — reset caution diamond styles so they don't leak into other views */
    el.style.borderRadius   = '50%';
    el.style.transform      = '';
    el.style.display        = '';
    el.style.alignItems     = '';
    el.style.justifyContent = '';
    /* Claude: dim opacity when showing rolling average instead of live data */
    el.style.opacity    = _isRollingAvg ? '0.6' : '1';

    /* NOPE: always solid red, no segments */
    if (_nope) {
      el.style.background = C.red;
      el.setAttribute('aria-label', 'Status: Urgent — NOPE mode active');
      el.title = 'Urgent — NOPE mode active (double-click to reset position)';
      return;
    }

    /* Claude: 2026-03-20 — merge study tool activity into Academic segment */
    _mergeStudyActivity(_segData);

    /* Claude: 2026-03-20 — caution suppression uses AA.shouldSuppressCaution()
       (single source of truth in aa-firebase.js). */
    var effectiveCaution = _isCaution && !_suppressCaution;

    /* Claude: 2026-03-29 — caution diamond overrides BOTH views.
       Previously the diamond only showed in solid view; ring view just showed
       yellow segments that looked like a plain circle. The diamond must always
       appear when a student hasn't checked in within CAUTION_DAYS. */
    if (effectiveCaution) {
      el.style.borderRadius = '0';
      el.style.transform    = 'rotate(45deg)';
      el.style.background   = '#f5c518';
      el.style.border       = '2px solid #1a1a1a';
      el.style.display      = 'flex';
      el.style.alignItems   = 'center';
      el.style.justifyContent = 'center';
      el.innerHTML = '<span style="transform:rotate(-45deg);font-size:18px;line-height:1;">\u26A0\uFE0F</span>';
      el.setAttribute('aria-label', 'Caution: No check-in in ' + CAUTION_DAYS + '+ days');
      el.title = 'No check-in in ' + CAUTION_DAYS + '+ days · click to toggle view · double-click to reset position';
      return;
    }

    if (_view === 'ring') {
      var keys = Object.keys(_segData);
      /* Claude: 2026-03-27 — show blue circle when no check-in data but recently active */
      if (keys.length === 0 && _isRecentlyActive()) {
        el.innerHTML = ACTIVE_NO_CHECKIN_SVG;
        el.setAttribute('aria-label', 'Status: Active on site');
        el.title = 'Active on site — no check-in today · click for overall view · double-click to reset position';
      } else {
        el.innerHTML = makeSVG(_segData);
        var w    = avgColor(_segData);
        var lbl  = keys.length
          ? keys.join(', ') + ' — ' + (STATUS_LABEL[w] || 'all clear')
          : 'No check-in yet';
        el.setAttribute('aria-label', 'Status: ' + lbl);
        el.title = lbl + ' · click for overall view · double-click to reset position';
      }
    } else {
      /* Solid overall view */
      /* Claude: 2026-03-29 — caution diamond moved above both view branches so it
         shows regardless of ring vs solid view. effectiveCaution already returned above. */
      {
        var color = avgColor(_segData);
        if (color) {
          el.style.background = color;
          el.setAttribute('aria-label', 'Status: ' + (SOLID_LABEL[color] || ''));
          el.title = (SOLID_LABEL[color] || '') +
                     ' · click for segments · double-click to reset position';
        } else if (_isRecentlyActive()) {
          /* Claude: 2026-03-27 — blue circle when no check-in data but recently active */
          el.innerHTML = ACTIVE_NO_CHECKIN_SVG;
          el.setAttribute('aria-label', 'Status: Active on site');
          el.title = 'Active on site — no check-in today · click for segments · double-click to reset position';
        } else {
          el.innerHTML = EMPTY_SVG;
          el.setAttribute('aria-label', 'Status: No check-in yet');
          el.title = 'No check-in yet · double-click to reset position';
        }
      }
    }
  }

  function renderProcessing() {
    var el = document.getElementById('status-circle');
    if (!el) return;
    el.innerHTML        = '';
    el.style.background = 'transparent';
    el.style.border     = '4px solid rgba(74,158,255,0.3)';
    el.style.borderTop  = '4px solid #4a9eff';
    el.style.animation  = 'aa-status-spin 1s linear infinite';
    el.setAttribute('aria-label', 'Status: Processing…');
  }

  /* ── Click: toggle ring ↔ solid ─────────────────────────── */
  function setupToggle() {
    var el = document.getElementById('status-circle');
    if (!el || el._scToggleReady) return;
    el._scToggleReady = true;
    el.addEventListener('click', function () {
      _view = (_view === 'ring') ? 'solid' : 'ring';
      try { localStorage.setItem(VIEW_KEY, _view); } catch (e) {}
      render();          /* render() calls renderBanner() internally */
    });
  }

  /* ── Study tool activity → Academic segment — Claude 2026-03-20 ── */
  /* If study tools were used today but no check-in data exists for the
     Academic segment, inject a green Academic wedge. Check-in data always
     takes priority — this only fills in the gap when no check-in happened. */
  function _mergeStudyActivity(sd) {
    if (!_studyActive) return sd;
    var segs = eligibleSegs();
    if (segs.indexOf('Academic') === -1) return sd; /* weekday only */
    if (!sd['Academic']) {
      sd['Academic'] = C.green; /* active on study tools = green academic */
    }
    return sd;
  }

  /* Claude: 2026-03-27 — true when ANY activity signal shows activity within 48 hours.
     Grey shows ONLY when ALL three signals confirm no recent activity.
     Protects against silent Firestore write failures on unreliable connections. */
  function _isRecentlyActive() {
    var WINDOW_MS = 7 * 24 * 60 * 60 * 1000; /* Claude: 2026-03-27 — widened from 48h to 7 days to match quiet alert window */
    var now = Date.now();
    /* Signal 1: lastSeen.timestamp from user doc */
    if (_lastSeenTs && (now - _lastSeenTs.getTime()) < WINDOW_MS) return true;
    /* Signal 2: studyActivity.lastActivity from studyActivity doc */
    if (_studyLastActivityTs && (now - _studyLastActivityTs.getTime()) < WINDOW_MS) return true;
    /* Signal 3: fallback fields on user doc (lastLogin, lastActive, lastCheckIn) */
    if (_altActivityTs && (now - _altActivityTs.getTime()) < WINDOW_MS) return true;
    return false;
  }

  /* Fetch study activity for a UID and store in module state.
     Called after auth is ready. Returns a Promise.
     Claude: 2026-03-27 — also reads studyActivity doc directly for lastActivity
     timestamp (Signal 2 of _isRecentlyActive multi-signal check). */
  function _fetchStudyActivity(uid) {
    if (!window.AA || !window.AA.study || !window.AA.study.wasActiveToday) {
      _studyActive = false;
      _studyLastActivityTs = null;
      return Promise.resolve();
    }
    return window.AA.study.wasActiveToday(uid).then(function (result) {
      _studyActive = result.active;
      _studyTools = result.tools || [];
      _studySessions = result.sessions || 0;
      /* Claude: 2026-03-27 — also fetch raw studyActivity doc for lastActivity timestamp */
      if (window.AA && window.AA.db) {
        return window.AA.db.collection('studyActivity').doc(uid).get()
          .then(function (sdoc) {
            var la = sdoc.exists ? (sdoc.data().lastActivity || null) : null;
            if (la) {
              _studyLastActivityTs = (typeof la.toDate === 'function')
                ? la.toDate() : new Date(la);
            } else {
              _studyLastActivityTs = null;
            }
          }).catch(function () { _studyLastActivityTs = null; });
      }
    }).catch(function () {
      _studyActive = false;
      _studyLastActivityTs = null;
    });
  }

  /* ── Segment legend tooltip — Claude 2026-03-19 ─────────── */
  /* Shows color-coded breakdown on hover (desktop) or tap (mobile)
     so supporters AND students can tell which slice is which.       */
  var SEG_ICON = {
    'Academic':         '📚',
    'Spiritual':        '🙏',
    'Mental/Emotional': '🧠',
    'Physical':         '💪',
    'Social':           '👥'
  };

  function renderTooltip() {
    var tip = document.getElementById('sc-tooltip');
    if (!tip) return;

    if (_nope) {
      tip.innerHTML = '<div class="sc-tip-row"><span class="sc-tip-dot" style="background:#dc3545"></span>' +
                      '<span class="sc-tip-label">NOPE mode</span>' +
                      '<span class="sc-tip-status">urgent</span></div>';
      return;
    }

    var daySegs = DAY_SEGS[(new Date()).getDay()];
    var html = '';
    daySegs.forEach(function (name) {
      var color  = _segData[name];
      var status = color ? (STATUS_LABEL[color] || '') : 'no data';
      var icon   = SEG_ICON[name] || '';
      var dotBg  = color || '#ccc';
      /* Claude: 2026-03-20 — add study tools note to Academic segment */
      var extra = '';
      if (name === 'Academic' && _studyActive) {
        extra = '<span class="sc-tip-study">📖 Active on Study Tools</span>';
      }
      html += '<div class="sc-tip-row">' +
              '<span class="sc-tip-dot" style="background:' + dotBg + '"></span>' +
              '<span class="sc-tip-label">' + icon + ' ' + name + '</span>' +
              '<span class="sc-tip-status">' + status + extra + '</span>' +
              '</div>';
    });
    /* Claude: 2026-03-20 — show study tool summary if active */
    if (_studyActive && _studySessions > 0) {
      html += '<div class="sc-tip-study-summary">📖 ' +
              _studySessions + ' study session' + (_studySessions > 1 ? 's' : '') +
              ' today</div>';
    }
    if (!html) {
      html = '<div class="sc-tip-none">No check-in data yet</div>';
    }
    tip.innerHTML = html;
  }

  function setupTooltip() {
    var el  = document.getElementById('status-circle');
    var tip = document.getElementById('sc-tooltip');
    if (!el || !tip || el._scTooltipReady) return;
    el._scTooltipReady = true;

    var hideTimer = null;

    function showTip() {
      renderTooltip();
      tip.classList.add('sc-tooltip-show');
    }
    function hideTip() {
      tip.classList.remove('sc-tooltip-show');
    }
    function delayedHide() {
      hideTimer = setTimeout(hideTip, 200);
    }
    function cancelHide() {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }

    /* Desktop: hover */
    el.addEventListener('mouseenter', function () { cancelHide(); showTip(); });
    el.addEventListener('mouseleave', delayedHide);

    /* Mobile: tap-toggle (long press not needed — simple tap shows it) */
    el.addEventListener('touchstart', function (e) {
      if (tip.classList.contains('sc-tooltip-show')) {
        hideTip();
      } else {
        showTip();
        /* auto-hide after 4s on mobile */
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideTip, 4000);
      }
    }, { passive: true });

    /* Hide when tapping elsewhere */
    document.addEventListener('touchstart', function (e) {
      if (e.target !== el && !el.contains(e.target) &&
          e.target !== tip && !tip.contains(e.target)) {
        hideTip();
      }
    }, { passive: true });
  }

  /* ── Firebase / Firestore listeners ─────────────────────── */
  function teardown() {
    if (_unsubNope) { _unsubNope(); _unsubNope = null; }
    if (_unsubDay)  { _unsubDay();  _unsubDay  = null; }
    if (_unsubAuth) { _unsubAuth(); _unsubAuth = null; } /* Claude: 2026-03-26 — clean up auth listener */
  }

  function localData() {
    try {
      var k   = _localDateKey();
      /* Claude: 2026-03-16 — safe storage read */
      var raw = null;
      try {
        raw = localStorage.getItem('checkins_' + k);
      } catch (e) {
        console.warn('[AA] localStorage read failed:', e.message);
      }
      var entries = raw ? JSON.parse(raw) : [];

      /* Claude: if today has entries, return them; else try rolling average from localStorage */
      if (entries.length > 0) {
        _isRollingAvg = false;
        _isCaution = false;
        return fromEntries(entries);
      }

      /* Claude: 2026-03-12 — collect ALL past check-ins from localStorage up to
         MAX_LOOKBACK days, then apply scenario 2 or 3 filter.
         Scenario 2 (recent): entries within ROLLING_DAYS calendar days only.
         Scenario 3 (stale):  the most recent ROLLING_COUNT check-ins, any age. */
      var now = new Date();
      var allHits = [];    /* { entry, daysAgo } */
      var newestDaysAgo = MAX_LOOKBACK + 1;
      var i;
      for (i = 1; i <= MAX_LOOKBACK; i++) {
        var d = new Date(now);
        d.setDate(d.getDate() - i);
        /* Claude: 2026-03-25 — replaced .padStart() (ES2017) with ES5-safe pattern */
        var dateKey = d.getFullYear() + '-' +
                      ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
                      ('0' + d.getDate()).slice(-2);
        /* Claude: 2026-03-16 — safe storage read */
        var dayRaw = null;
        try {
          dayRaw = localStorage.getItem('checkins_' + dateKey);
        } catch (e) {
          console.warn('[AA] localStorage read failed:', e.message);
        }
        if (dayRaw) {
          try {
            var dayEntries = JSON.parse(dayRaw);
            if (Array.isArray(dayEntries) && dayEntries.length > 0) {
              allHits.push({ entry: dayEntries[dayEntries.length - 1], daysAgo: i });
              if (i < newestDaysAgo) newestDaysAgo = i;
            }
          } catch (e) {}
        }
      }

      if (allHits.length > 0) {
        _isCaution = newestDaysAgo > CAUTION_DAYS;
        _isRollingAvg = true;
        var filtered;
        if (_isCaution) {
          /* Scenario 3: take most recent ROLLING_COUNT check-ins */
          filtered = allHits.slice(0, ROLLING_COUNT).map(function (h) { return h.entry; });
        } else {
          /* Scenario 2: only entries within ROLLING_DAYS calendar days */
          filtered = allHits
            .filter(function (h) { return h.daysAgo <= ROLLING_DAYS; })
            .map(function (h) { return h.entry; });
        }
        if (filtered.length > 0) return fromRollingEntries(filtered);
      }

      _isRollingAvg = false;
      _isCaution = false;
      return {};
    } catch (e) {
      _isRollingAvg = false;
      _isCaution = false;
      return {};
    }
  }

  /* Claude: 2026-03-12 — track which data UID we're currently watching
     so we can restart when the mirror target changes */
  var _watchingDataUid = null;

  function startWatching(user, forceRestart) {
    if (!forceRestart && user.uid === _scUid) return; // token refresh — skip re-init + listener re-stack. Claude, 2026-03-07.
    _scUid = user.uid;
    /* Claude: 2026-03-28 — reset ALL state when switching students.
       Without this, stale segData from the previous student flashes
       (e.g. FHC Director's yellow shows briefly when switching to Mary). */
    _lastSeenTs          = null;
    _studyLastActivityTs = null;
    _altActivityTs       = null;
    _segData             = {};
    _nope                = false;
    _isCaution           = false;
    _suppressCaution     = false;
    _isRollingAvg        = false;
    _lastCheckinTs       = null;
    _studyActive         = false;
    _studyTools          = [];
    _studySessions       = 0;
    var uid     = window.AA_MIRROR_UID || user.uid;  /* mirror UID if active */
    /* Claude: 2026-03-12 — skip if already watching this exact data UID (avoids duplicate listeners) */
    if (!forceRestart && uid === _watchingDataUid) return;
    _watchingDataUid = uid;
    var dateKey = _localDateKey();
    /* Claude: 2026-03-28 — show processing spinner immediately while data loads.
       Prevents stale colors from previous student flashing. */
    renderProcessing();

    /* Claude: 2026-03-20 — fetch study tool activity for this user.
       Runs in parallel with check-in listener setup. When it completes,
       re-renders to inject Academic segment if tools were used today. */
    /* Claude: 2026-03-25 — added .catch() for unhandled rejection */
    /* Claude: 2026-03-28 — removed render() from this callback to prevent race condition.
       Study activity flags are set by _fetchStudyActivity; the main data callback
       (onSnapshot/AA.getStudentStatus) will call render() with all flags ready. */
    _fetchStudyActivity(uid).then(function () {
      /* flags set — next data-driven render() will pick them up */
    }).catch(function (err) { console.warn('[StatusCircle] study activity fetch failed:', err); });

    /* Claude: hide sc-banner for student role — support/admin see it, student doesn't — 2026-02-28 */
    /* Claude: 2026-03-12 — also load alertThreshold for configurable caution days */
    /* Claude: 2026-03-12 — load target user's role + alertThreshold */
    window.AA.getUserDoc(uid).then(function(doc) {
      if (doc.exists && doc.data().alertThreshold) {
        CAUTION_DAYS = doc.data().alertThreshold;
      }
      /* Claude: 2026-03-27 — Signal 1: store lastSeen timestamp */
      var docData = doc.exists ? doc.data() : {};
      var ls = docData.lastSeen || null;
      if (ls && ls.timestamp) {
        _lastSeenTs = (typeof ls.timestamp.toDate === 'function')
          ? ls.timestamp.toDate() : new Date(ls.timestamp);
      } else {
        _lastSeenTs = null;
      }
      /* Claude: 2026-03-27 — Signal 3: scan fallback timestamp fields on user doc.
         Handles both plain Firestore Timestamps and nested {timestamp:...} objects.
         Picks the most recent valid timestamp across lastLogin, lastActive, lastCheckIn. */
      var altFields = [docData.lastLogin, docData.lastActive, docData.lastCheckIn];
      var bestAlt = null;
      var fi;
      for (fi = 0; fi < altFields.length; fi++) {
        var fv = altFields[fi];
        if (!fv) continue;
        var fts = null;
        if (typeof fv.toDate === 'function') {
          fts = fv.toDate();
        } else if (fv.timestamp) {
          fts = (typeof fv.timestamp.toDate === 'function')
            ? fv.timestamp.toDate() : new Date(fv.timestamp);
        }
        if (fts && (!bestAlt || fts > bestAlt)) bestAlt = fts;
      }
      _altActivityTs = bestAlt;
      /* Claude: 2026-03-12 — skip caution diamond for non-student roles
         (backstage-manager, support, family etc. don't do check-ins) */
      var targetRole = (doc.exists && doc.data().role) || 'student';
      window._scTargetIsStudent = (targetRole === 'student');
      /* Banner visibility based on viewer's role, not the target uid */
      return window.AA.getUserDoc(user.uid);
    }).then(function(doc) {
      var role     = (doc.exists && doc.data().role) || 'student';
      var bannerEl = document.getElementById('sc-banner');
      if (bannerEl) bannerEl.style.display = (role === 'student') ? 'none' : '';
    /* Claude: 2026-03-25 — added console.warn to role-check catch */
    }).catch(function(e) { console.warn('[StatusCircle] role check failed:', e.message || e); });

    /* Claude: 2026-03-20 — call centralized caution suppression (aa-firebase.js).
       Single source of truth — same logic used by dashboard + home page dots. */
    if (window.AA && window.AA.shouldSuppressCaution) {
      /* Claude: 2026-03-25 — added .catch() for unhandled rejection */
      /* Claude: 2026-03-28 — removed render() from this callback to prevent race condition.
         AA.getStudentStatus already returns suppressCaution, so this just sets the flag
         for the rare case where onSnapshot fires with today's entries (caution N/A anyway). */
      window.AA.shouldSuppressCaution(uid, CAUTION_DAYS).then(function (result) {
        _suppressCaution = result.suppress;
      }).catch(function (err) { console.warn('[StatusCircle] caution check failed:', err); });
    }

    // Claude: 2026-03-08 — audit log with mirror context
    if (window.AA_MIRROR_UID && window.AA_MIRROR_UID !== user.uid) {
      if (window.AA && window.AA.logAccess) {
        window.AA.logAccess('mirror-view', window.AA_MIRROR_UID, 'checkin', {
          detail: 'Viewed check-in status circle',
          mirrorOf: window.AA_MIRROR_UID
        });
      }
    }

    teardown();

    _unsubNope = window.AA.db.collection('nope').doc(uid)
      .onSnapshot(function (doc) {
        var wasNope = _nope;
        _nope = !!(doc.exists && doc.data().active);
        /* Claude: 2026-03-28 — only render if nope actually changed or data is loaded.
           Prevents blue/grey flash when nope fires before segData is populated. */
        if (_nope || wasNope !== _nope) render();
      }, function (err) {
        console.warn('[status-circle] nope listener:', err);
      });

    _unsubDay = window.AA.db
      .collection('checkins').doc(uid)
      .collection('days').doc(dateKey)
      .onSnapshot(function (doc) {
        var entries = (doc.exists && Array.isArray(doc.data().entries))
          ? doc.data().entries : [];

        /* Claude: if today has check-ins, use them normally */
        if (entries.length > 0) {
          _segData = fromEntries(entries);
          _isRollingAvg = false;
          _isCaution = false;  /* Claude: 2026-03-12 — checked in today, no caution */
          render();
        } else {
          /* Claude: 2026-03-28 — REWRITTEN to use AA.getStudentStatus() (single source of truth).
             OLD: fetchAllRecent() did its own 30-day lookback + scenario logic, which raced
             with other async calls and could produce different colors than the dashboard.
             NEW: one call to the centralized function — same result everywhere.
             Falls back to fetchAllRecent if AA.getStudentStatus isn't available yet.
             Archive: status-circle_2026-03-27_pre-unified-main-circle.bak.js */
          if (window.AA && window.AA.getStudentStatus) {
            window.AA.getStudentStatus(uid).then(function (status) {
              /* Guard: make sure we're still watching this uid */
              if (uid !== _watchingDataUid) return;
              _isCaution = status.isCaution && !status.suppressCaution;
              _suppressCaution = status.suppressCaution;
              _isRollingAvg = status.isRollingAvg;
              _lastCheckinTs = status.lastCheckinTs || null;
              if (status.dotClass === 'nope') {
                _nope = true;
                _segData = {};
              } else if (status.segData && Object.keys(status.segData).length > 0) {
                /* Build per-segment data from rolling color for the pie chart */
                var rollingHex = status.segData['rolling'];
                if (rollingHex) {
                  var segs = eligibleSegs();
                  var tmpSeg = {};
                  for (var si = 0; si < segs.length; si++) {
                    tmpSeg[segs[si]] = rollingHex;
                  }
                  _segData = tmpSeg;
                }
              } else if (status.isRecentlyActive) {
                /* Active but no check-in data — set signal for blue circle */
                _lastSeenTs = new Date();
                _segData = {};
              } else {
                _segData = {};
              }
              render();
            }).catch(function (err) {
              console.warn('[status-circle] AA.getStudentStatus failed, falling back:', err);
              _segData = {};
              _isRollingAvg = false;
              _isCaution = false;
              _lastCheckinTs = null;
              render();
            });
          } else {
            /* Fallback: AA.getStudentStatus not loaded yet — use old method */
            fetchAllRecent(uid).then(function (result) {
              _isCaution = window._scTargetIsStudent !== false && result.newestDaysAgo > CAUTION_DAYS;
              _lastCheckinTs = null;
              if (_isCaution) {
                var checkins = filterByCount(result.hits);
                _segData = fromRollingEntries(checkins);
                _isRollingAvg = checkins.length > 0;
              } else {
                var dayEntries = filterByDays(result.hits);
                _segData = fromRollingEntries(dayEntries);
                _isRollingAvg = dayEntries.length > 0;
              }
              render();
            }).catch(function (err) {
              console.warn('[status-circle] rolling average fetch failed:', err);
              _segData = {};
              _isRollingAvg = false;
              _isCaution = false;
              _lastCheckinTs = null;
              render();
            });
          }
        }
      }, function (err) {
        console.warn('[status-circle] checkin listener ERROR:', err.code, err.message);
        _segData = localData();
        _isRollingAvg = false;
        render();
      });
  }

  /* ── Boot: check dev override, then connect to Firebase ──── */
  function boot() {
    var dev = null;
    try { dev = localStorage.getItem(DEV_KEY); } catch (e) {}

    /* Dev override — bypass Firebase entirely */
    if (dev === 'processing') { renderProcessing(); return; }
    if (dev) {
      var devColorMap = { green: C.green, yellow: C.yellow, orange: C.orange, red: C.red };
      var devC = devColorMap[dev];
      _nope = false;
      _segData = devC ? { 'Dev': devC } : {};
      _isRollingAvg = false;
      render();
      return;
    }

    renderProcessing();

    /* Poll for window.AA (loaded by aa-firebase.js via shared-header) */
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      if (window.AA && window.AA.auth) {
        clearInterval(poll);
        _unsubAuth = window.AA.auth.onAuthStateChanged(function (user) { /* Claude: 2026-03-26 — store unsub handle */
          if (!user) {
            teardown();
            _nope = false;
            _segData = localData();  /* localData() now sets _isRollingAvg */
            render();
            return;
          }
          startWatching(user);
        });
        return;
      }
      /* Firebase unavailable after ~6 s — fall back to localStorage */
      if (tries > 20) {
        clearInterval(poll);
        _segData = localData();  /* localData() now sets _isRollingAvg */
        render();
      }
    }, 300);
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    var el = document.getElementById('status-circle');
    if (!el) { setTimeout(init, 150); return; }

    /* Restore saved view preference */
    try {
      var v = localStorage.getItem(VIEW_KEY);
      if (v === 'solid' || v === 'ring') _view = v;
    } catch (e) {}

    setupToggle();
    setupTooltip();  /* Claude: 2026-03-19 — segment legend on hover/tap */
    boot();
  }

  /* ── Dev API ────────────────────────────────────────────── */
  /**
   * Force a color for testing (browser console).
   * Valid values: 'green' | 'yellow' | 'orange' | 'red' | 'processing'
   * Example: AA_setStatus('orange')
   */
  window.AA_setStatus = function (state) {
    var valid = ['green', 'yellow', 'orange', 'red', 'processing'];
    if (valid.indexOf(state) === -1) {
      console.warn('[status-circle] Valid states: ' + valid.join(', '));
      return;
    }
    try { localStorage.setItem(DEV_KEY, state); } catch (e) {}
    if (state === 'processing') {
      renderProcessing();
    } else {
      var devColorMap2 = { green: C.green, yellow: C.yellow, orange: C.orange, red: C.red };
      _nope = false;
      _segData = { 'Dev': devColorMap2[state] };
      render();
    }
    console.info('[status-circle] Dev override →', state);
  };

  /**
   * Clear dev override and revert to real data.
   * Example: AA_clearStatus()
   */
  window.AA_clearStatus = function () {
    try { localStorage.removeItem(DEV_KEY); } catch (e) {}
    boot();
    console.info('[status-circle] Dev override cleared — reverting to real data');
  };

  /* Claude: 2026-03-12 — public API: restart status circle for a new mirror target.
     Called by support-dashboard switchStudent() and whenever AA_MIRROR_UID changes.
     Forces teardown + re-init of Firestore listeners on the new UID. */
  window.AA_refreshStatusCircle = function () {
    if (!window.AA || !window.AA.auth || !window.AA.auth.currentUser) return;
    _watchingDataUid = null; /* force fresh start */
    startWatching(window.AA.auth.currentUser, true);
  };

  /* Auto-detect mirror UID changes (e.g. student switcher on support dashboard) */
  /* Claude: 2026-03-25 — store interval ID to allow cleanup; reduced from 1s→3s (less CPU) */
  var _mirrorPollUid = null;
  var _mirrorPollInterval = setInterval(function () {
    var cur = window.AA_MIRROR_UID || null;
    if (cur !== _mirrorPollUid) {
      _mirrorPollUid = cur;
      if (window.AA_refreshStatusCircle) window.AA_refreshStatusCircle();
    }
  }, 3000);

  /* ── Inject CSS once ─────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('aa-sc-style')) return;
    var s = document.createElement('style');
    s.id = 'aa-sc-style';
    s.textContent =
      '@keyframes aa-status-spin{' +
        '0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}' +
      '}' +
      '#status-circle{box-sizing:border-box;}' +
      '#status-circle svg{display:block;}';
    document.head.appendChild(s);
  }

  /* ── Kick off ───────────────────────────────────────────── */
  injectCSS();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
