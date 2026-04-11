/* Claude: 2026-04-09 — Sync calendar + template classes to studentConfig quizzes.
   Calendar classes still sync as before, but trimester tagging is now dynamic and
   template-only classes can be pre-created during the next-term prep window. */

(function () {
  'use strict';

  var MS_PER_DAY = 24 * 60 * 60 * 1000;
  var PREP_WINDOW_DAYS = 30;
  var PREP_GRACE_DAYS = 3;
  var TEMPLATE_SOURCE_URL = '/Academic-Allies/modular/components/templates/templates.html';

  var TERM_PROVIDERS = {
    byui: {
      key: 'byui',
      name: 'BYU-I',
      terms: [
        { name: 'Winter', month: 0, day: 5 },
        { name: 'Spring', month: 3, day: 15 },
        { name: 'Fall',   month: 8, day: 20 }
      ]
    }
  };

  function getProvider() {
    var key = String(window.AA_ACADEMIC_PROVIDER || 'byui').toLowerCase();
    return TERM_PROVIDERS[key] || TERM_PROVIDERS.byui;
  }

  function slugifyTerm(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function buildTermSequence(provider, startYear, years) {
    var terms = [];
    var y;
    var i;
    for (y = startYear; y < startYear + years; y++) {
      for (i = 0; i < provider.terms.length; i++) {
        terms.push({
          provider: provider.key,
          name: provider.terms[i].name,
          start: new Date(y, provider.terms[i].month, provider.terms[i].day),
          year: y
        });
      }
    }
    terms.sort(function (a, b) { return a.start - b.start; });
    for (i = 0; i < terms.length; i++) {
      terms[i].id = slugifyTerm(terms[i].name) + '-' + terms[i].year;
      terms[i].label = terms[i].name + ' ' + terms[i].year;
    }
    return terms;
  }

  function getAcademicWindow() {
    var provider = getProvider();
    var now = new Date();
    var today = startOfDay(now);
    var terms = buildTermSequence(provider, now.getFullYear() - 1, 3);
    var nextTerm = null;
    var currentTerm = null;
    var i;

    for (i = 0; i < terms.length; i++) {
      if (terms[i].start > now) {
        nextTerm = terms[i];
        break;
      }
      currentTerm = terms[i];
    }

    if (!nextTerm) {
      nextTerm = buildTermSequence(provider, now.getFullYear() + 1, 1)[0];
    }

    nextTerm.daysUntilStart = Math.round((startOfDay(nextTerm.start) - today) / MS_PER_DAY);
    nextTerm.shouldPrep = nextTerm.daysUntilStart <= PREP_WINDOW_DAYS && nextTerm.daysUntilStart >= -PREP_GRACE_DAYS;
    if (!currentTerm && nextTerm && nextTerm.daysUntilStart >= 0 && nextTerm.daysUntilStart <= PREP_WINDOW_DAYS) {
      currentTerm = nextTerm;
    }

    return {
      provider: provider,
      currentTerm: currentTerm,
      nextTerm: nextTerm
    };
  }

  function inferTermFromDate(dateValue) {
    if (!dateValue) return null;
    var d = new Date(dateValue);
    if (isNaN(d.getTime())) return null;
    var provider = getProvider();
    var terms = buildTermSequence(provider, d.getFullYear() - 1, 2);
    var inferred = null;
    var i;
    for (i = 0; i < terms.length; i++) {
      if (terms[i].start <= d) inferred = terms[i];
      else break;
    }
    return inferred;
  }

  function decodeHtmlEntities(str) {
    var textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  }

  function normalizeCode(value) {
    return String(value || '').toUpperCase().replace(/\s+/g, ' ').trim();
  }

  function parseClassLabel(label) {
    var raw = decodeHtmlEntities(String(label || '')).trim();
    if (!raw) return null;

    var match = raw.match(/\(([^)]+)\)\s*$/);
    var code = match ? normalizeCode(match[1]) : '';
    var name = match ? raw.slice(0, match.index).trim() : raw;

    if (!code) {
      var fallbackMatch = raw.match(/([A-Z]{2,}\s*\d{3,}[A-Z]?)$/);
      if (fallbackMatch) code = normalizeCode(fallbackMatch[1]);
    }

    return {
      name: name || code || raw,
      code: code || normalizeCode(name || raw)
    };
  }

  function getCurrentUid() {
    if (window.AA_MIRROR_UID) return window.AA_MIRROR_UID;
    if (window.AA && window.AA.auth && window.AA.auth.currentUser) return window.AA.auth.currentUser.uid;
    return null;
  }

  function fetchTemplateClasses() {
    return fetch(TEMPLATE_SOURCE_URL, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Template fetch failed: ' + response.status);
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var options = doc.querySelectorAll('[data-class-template], [data-class]');
        var seen = {};
        var results = [];
        var i;
        for (i = 0; i < options.length; i++) {
          var parsed = parseClassLabel(options[i].getAttribute('data-class-template') || options[i].getAttribute('data-class'));
          if (!parsed || !parsed.code || seen[parsed.code]) continue;
          seen[parsed.code] = true;
          results.push({
            code: parsed.code,
            name: parsed.name,
            source: 'template'
          });
        }
        return results;
      })
      .catch(function (err) {
        console.warn('[AA] Template class sync source failed:', err.message || err);
        return [];
      });
  }

  function mergeClasses(calendarClasses, templateClasses) {
    var merged = {};
    var order = [];

    function upsert(cls) {
      var key;
      var existing;
      if (!cls || !(cls.code || cls.name)) return;
      key = normalizeCode(cls.code || cls.name);
      if (!merged[key]) {
        merged[key] = {
          code: normalizeCode(cls.code || cls.name),
          name: cls.name || cls.code || 'Class',
          semesterStart: cls.semesterStart || null,
          semesterEnd: cls.semesterEnd || null,
          source: cls.source || 'unknown'
        };
        order.push(key);
        return;
      }
      existing = merged[key];
      if ((!existing.name || existing.name === existing.code) && cls.name) existing.name = cls.name;
      if ((!existing.semesterStart) && cls.semesterStart) existing.semesterStart = cls.semesterStart;
      if ((!existing.semesterEnd) && cls.semesterEnd) existing.semesterEnd = cls.semesterEnd;
      if (existing.source !== 'calendar' && cls.source === 'calendar') existing.source = cls.source;
    }

    calendarClasses.forEach(upsert);
    templateClasses.forEach(upsert);

    return order.map(function (key) { return merged[key]; });
  }

  function getTrimesterIdForClass(cls, fallbackTerm) {
    var inferred = inferTermFromDate(cls.semesterStart || cls.start);
    if (inferred) return inferred.id;
    return fallbackTerm ? fallbackTerm.id : null;
  }

  function shouldCreateTemplatePlaceholder(cls, windowInfo) {
    if (cls.source !== 'template') return true;
    return !!(windowInfo && windowInfo.nextTerm && windowInfo.nextTerm.shouldPrep);
  }

  window.syncCalendarClassesToQuizzes = function () {
    if (!window.AA || !window.AA.auth || !window.AA.db) {
      console.warn('[AA] Sync skipped: Firebase not ready');
      return;
    }

    var uid = getCurrentUid();
    var windowInfo = getAcademicWindow();

    if (!uid) {
      console.warn('[AA] Sync skipped: no current uid');
      return;
    }

    console.log('[AA] Starting class→quizzes sync for uid:', uid);

    window.AA.db.collection('users').doc(uid).get()
      .then(function (doc) {
        var calendarClasses = [];
        var data = doc.exists ? (doc.data() || {}) : {};
        var raw = data.classSchedule || data.classes || data.schedule || data.calendarClasses || [];
        if (raw && raw.length) {
          calendarClasses = raw.map(function (cls) {
            cls = cls || {};
            return {
              code: normalizeCode(cls.code),
              name: cls.name || cls.code || 'Class',
              semesterStart: cls.semesterStart || null,
              semesterEnd: cls.semesterEnd || null,
              source: 'calendar'
            };
          });
        }

        return Promise.all([
          Promise.resolve(calendarClasses),
          fetchTemplateClasses().catch(function (err) {
            console.warn('[AA] Template classes unavailable for quiz sync:', err && err.message ? err.message : err);
            return [];
          }),
          window.AA.db.collection('studentConfig').doc(uid).get().catch(function (err) {
            console.warn('[AA] studentConfig unavailable for quiz sync:', err && err.message ? err.message : err);
            return { exists: false, data: function () { return {}; } };
          })
        ]);
      })
      .then(function (results) {
        var mergedClasses = mergeClasses(results[0], results[1]);
        var snap = results[2];
        var config = snap.exists ? (snap.data() || {}) : {};
        var quizzes = config.quizzes || [];
        var existingClasses = {};
        var newQuizzes = [];

        quizzes.forEach(function (q) {
          var title = q.title || '';
          var match = title.match(/^([A-Z]{2,}\s*\d{3,}[A-Z]?)/);
          if (match) existingClasses[normalizeCode(match[1])] = true;
        });

        mergedClasses.forEach(function (cls) {
          var trimesterId;
          if (!cls.code || existingClasses[cls.code]) return;
          if (!shouldCreateTemplatePlaceholder(cls, windowInfo)) return;

          trimesterId = getTrimesterIdForClass(cls, windowInfo.nextTerm || windowInfo.currentTerm);
          newQuizzes.push({
            title: cls.code + ': Class Quizzes',
            type: 'flashcards',
            description: 'Quizzes for ' + (cls.name || cls.code),
            data: [],
            trimester: trimesterId,
            createdAt: new Date(),
            autoGenerated: true
          });
        });

        console.log('[AA] Existing class quiz shells:', Object.keys(existingClasses));
        console.log('[AA] Creating', newQuizzes.length, 'new class quiz shell(s)');

        if (!newQuizzes.length) {
          console.log('[AA] All detected classes already have quizzes');
          return null;
        }

        return window.AA.db.collection('studentConfig').doc(uid).set({
          quizzes: quizzes.concat(newQuizzes)
        }, { merge: true }).then(function () {
          console.log('[AA] Auto-created ' + newQuizzes.length + ' class quizzes');
        });
      })
      .catch(function (err) {
        console.error('[AA] Class → quizzes sync failed:', err);
      });
  };

  var _syncPoll = setInterval(function () {
    if (window.AA && window.AA.auth && window.AA.db) {
      clearInterval(_syncPoll);
      window.syncCalendarClassesToQuizzes();
    }
  }, 250);
})();
