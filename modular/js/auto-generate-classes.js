/* Claude: 2026-04-11 — Guard: only run on battle-mode and study pages. Removed duplicate dead-code line. */
if (!location.pathname.includes("battle-mode") && !location.pathname.includes("study")) { return; }
/* Claude: 2026-04-09 — Auto-generate upcoming class slots from detected academic term.
   Replaces the old static SPRING_CLASSES list with:
   1. BYU-I term detection
   2. 30-day prep window check
   3. Calendar + template class merge
   4. Study/Battle card generation */

(function () {
  'use strict';

  var MS_PER_DAY = 24 * 60 * 60 * 1000;
  var PREP_WINDOW_DAYS = 30;
  var PREP_GRACE_DAYS = 3;
  var REVIEW_TERMS_BACK = 2;
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
    terms.sort(function (a, b) {
      return a.start - b.start;
    });
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
      now: now,
      today: today,
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

  function getTermSortValue(term) {
    return term && term.start ? term.start.getTime() : 0;
  }

  function getTermDistanceFromCurrent(classTermId, windowInfo) {
    var currentTerm = windowInfo.currentTerm;
    var provider = windowInfo.provider || getProvider();
    var terms;
    var currentIndex = -1;
    var classIndex = -1;
    var i;

    if (!currentTerm || !classTermId) return null;

    terms = buildTermSequence(provider, currentTerm.year - 2, 5);
    for (i = 0; i < terms.length; i++) {
      if (terms[i].id === currentTerm.id) currentIndex = i;
      if (terms[i].id === classTermId) classIndex = i;
    }

    if (currentIndex === -1 || classIndex === -1) return null;
    return currentIndex - classIndex;
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
    if (window.AA && window.AA.auth && window.AA.auth.currentUser) {
      return window.AA.auth.currentUser.uid;
    }
    return null;
  }

  function hasTemplateClassNodes() {
    return document.querySelectorAll('[data-class-template], [data-class]').length > 0;
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
          var key;
          if (!parsed || !parsed.code) continue;
          key = parsed.code;
          if (seen[key]) continue;
          seen[key] = true;
          results.push({
            code: parsed.code,
            name: parsed.name,
            source: 'template',
            masteryLevel: 0
          });
        }
        return results;
      })
      .catch(function (err) {
        console.warn('[AA] Template class fetch failed:', err.message || err);
        return [];
      });
  }

  function fetchCalendarClasses() {
    var uid = getCurrentUid();
    if (!uid || !window.AA || !window.AA.db) return Promise.resolve([]);

    return window.AA.db.collection('users').doc(uid).get()
      .then(function (doc) {
        var data = doc.exists ? (doc.data() || {}) : {};
        var raw = data.classSchedule || data.classes || data.schedule || data.calendarClasses || [];
        var mapped = [];
        var i;
        var cls;
        for (i = 0; i < raw.length; i++) {
          cls = raw[i] || {};
          mapped.push({
            code: normalizeCode(cls.code),
            name: cls.name || cls.code || 'Class',
            source: 'calendar',
            semesterStart: cls.semesterStart || null,
            semesterEnd: cls.semesterEnd || null,
            days: cls.days || [],
            masteryLevel: 0
          });
        }
        return mapped;
      })
      .catch(function (err) {
        console.warn('[AA] Calendar class fetch failed:', err.message || err);
        return [];
      });
  }

  function mergeClassLists(calendarClasses, templateClasses) {
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
          source: cls.source || 'unknown',
          semesterStart: cls.semesterStart || null,
          semesterEnd: cls.semesterEnd || null,
          days: cls.days || [],
          masteryLevel: typeof cls.masteryLevel === 'number' ? cls.masteryLevel : 0
        };
        order.push(key);
        return;
      }
      existing = merged[key];
      if ((!existing.name || existing.name === existing.code) && cls.name) existing.name = cls.name;
      if ((!existing.semesterStart) && cls.semesterStart) existing.semesterStart = cls.semesterStart;
      if ((!existing.semesterEnd) && cls.semesterEnd) existing.semesterEnd = cls.semesterEnd;
      if ((!existing.days || !existing.days.length) && cls.days && cls.days.length) existing.days = cls.days;
      if (typeof existing.masteryLevel !== 'number') existing.masteryLevel = 0;
      if (typeof cls.masteryLevel === 'number' && cls.masteryLevel > existing.masteryLevel) existing.masteryLevel = cls.masteryLevel;
      if (existing.source !== 'calendar' && cls.source === 'calendar') existing.source = 'calendar';
    }

    calendarClasses.forEach(upsert);
    templateClasses.forEach(upsert);

    return order.map(function (key) { return merged[key]; });
  }

  function belongsToPrepTerm(cls, prepTerm) {
    var inferred = inferTermFromDate(cls.semesterStart || cls.start);
    if (inferred) return inferred.id === prepTerm.id;

    if (cls.semesterEnd) {
      var endDate = new Date(cls.semesterEnd);
      if (!isNaN(endDate.getTime()) && endDate < prepTerm.start) return false;
    }

    return cls.source === 'template';
  }

  function compareClasses(a, b) {
    var aLabel = (a.code || a.name || '').toLowerCase();
    var bLabel = (b.code || b.name || '').toLowerCase();
    if (aLabel < bLabel) return -1;
    if (aLabel > bLabel) return 1;
    return 0;
  }

  function resolveClassTerm(cls, windowInfo) {
    var inferred = inferTermFromDate(cls.semesterStart || cls.start);
    if (inferred) return inferred;

    if (cls.source === 'template' && windowInfo.nextTerm && windowInfo.nextTerm.shouldPrep) {
      return windowInfo.nextTerm;
    }

    if (windowInfo.currentTerm) return windowInfo.currentTerm;
    return windowInfo.nextTerm || null;
  }

  function enrichClassMetadata(cls, windowInfo) {
    var term = resolveClassTerm(cls, windowInfo);
    var startDate = cls.semesterStart || cls.start || (term && term.start ? term.start.toISOString().slice(0, 10) : null);
    var enriched = {};
    var key;

    for (key in cls) {
      if (Object.prototype.hasOwnProperty.call(cls, key)) enriched[key] = cls[key];
    }

    enriched.termId = term ? term.id : null;
    enriched.termName = term ? term.label : null;
    enriched.startDate = startDate;
    enriched.source = cls.source || 'unknown';
    enriched.masteryLevel = typeof cls.masteryLevel === 'number' ? cls.masteryLevel : 0;
    enriched.reviewEligible = isReviewEligible(enriched, windowInfo);
    return enriched;
  }

  function groupClassesByTerm(classes) {
    var groups = {};
    var order = [];

    classes.forEach(function (cls) {
      var termId = cls.termId || 'unknown-term';
      if (!groups[termId]) {
        groups[termId] = {
          termId: termId,
          termName: cls.termName || 'Unknown Term',
          sortValue: cls._termSortValue || 0,
          classes: []
        };
        order.push(termId);
      }
      groups[termId].classes.push(cls);
      if ((cls._termSortValue || 0) > groups[termId].sortValue) groups[termId].sortValue = cls._termSortValue || 0;
    });

    return order
      .map(function (termId) { return groups[termId]; })
      .sort(function (a, b) { return b.sortValue - a.sortValue; });
  }

  function isReviewEligible(classObj, windowInfo) {
    var classTerm = classObj.termId ? classObj.termId : (resolveClassTerm(classObj, windowInfo) || {}).id;
    var distance = getTermDistanceFromCurrent(classTerm, windowInfo);

    if (distance === null) return false;
    return distance > 0 && distance <= REVIEW_TERMS_BACK;
  }

  function isCurrentOrFutureClass(cls, windowInfo) {
    var term = resolveClassTerm(cls, windowInfo);
    if (!term) return false;

    if (!windowInfo.currentTerm) {
      return !!windowInfo.nextTerm && term.id === windowInfo.nextTerm.id;
    }

    return term.start >= windowInfo.currentTerm.start;
  }

  function describeClass(cls) {
    if (cls.code && cls.name && cls.name !== cls.code) return cls.code + ' — ' + cls.name;
    return cls.name || cls.code || 'Class';
  }

  function buildStudyCard(cls, termLabel) {
    var card = document.createElement('div');
    card.className = 'class-card';
    card.innerHTML =
      '<h3>' + describeClass(cls) + '</h3>' +
      '<p>Study tools ready for ' + termLabel + '</p>' +
      '<button type="button">Open Study Mode</button>';
    return card;
  }

  function buildBattleCard(cls, termLabel) {
    var card = document.createElement('div');
    card.className = 'battle-card';
    card.innerHTML =
      '<h3>' + describeClass(cls) + '</h3>' +
      '<p>Battle Mode ready for ' + termLabel + '</p>' +
      '<button type="button">Start Battle</button>';
    return card;
  }

  function getClassTermLabel(cls, windowInfo) {
    var term = resolveClassTerm(cls, windowInfo);
    return term && term.label ? term.label : 'this term';
  }

  function renderClassSlots(studyClasses, battleClasses, windowInfo) {
    var studyContainer = document.getElementById('study-tools-auto');
    var battleContainer = document.getElementById('battle-mode-auto');
    var i;

    // Study tools: render cards as before
    if (studyContainer) {
      studyContainer.innerHTML = '';
      for (i = 0; i < studyClasses.length; i++) {
        studyContainer.appendChild(buildStudyCard(studyClasses[i], getClassTermLabel(studyClasses[i], windowInfo)));
      }
    }

    /* Claude: 2026-04-11 — Battle classes feed into the Battle Mode class picker grid
       (Lingo Legend pattern) instead of rendering a separate raw list below the game.
       #battle-mode-auto is cleared and left empty; the grid handles display. */
    if (battleContainer) battleContainer.innerHTML = '';

    if (typeof window.AA_addSpringClasses === 'function') {
      window.AA_addSpringClasses(battleClasses);
    } else {
      // Battle Mode hasn't registered its handler yet — queue for pickup
      window.AA_pendingSpringClasses = battleClasses;
    }
  }

  function generateClassSlots() {
    var windowInfo = getAcademicWindow();

    Promise.all([
      fetchCalendarClasses().catch(function (err) {
        console.warn('[AA] Calendar classes unavailable for auto render:', err && err.message ? err.message : err);
        return [];
      }),
      fetchTemplateClasses().catch(function (err) {
        console.warn('[AA] Template classes unavailable for auto render:', err && err.message ? err.message : err);
        return [];
      })
    ])
      .then(function (results) {
        var allClasses = mergeClassLists(results[0], results[1]).map(function (cls) {
          var resolvedTerm = resolveClassTerm(cls, windowInfo);
          var enriched = enrichClassMetadata(cls, windowInfo);
          enriched._termStart = resolvedTerm ? resolvedTerm.start : null;
          enriched._termSortValue = getTermSortValue(resolvedTerm);
          return enriched;
        });
        var studyClasses = allClasses.filter(function (cls) {
          if (windowInfo.nextTerm.shouldPrep && belongsToPrepTerm(cls, windowInfo.nextTerm)) {
            return true;
          }
          return isCurrentOrFutureClass(cls, windowInfo);
        });
        var battleClasses = allClasses.slice();
        var groupedBattleTerms = groupClassesByTerm(battleClasses);

        if (location.pathname.includes("battle-mode") || location.pathname.includes("study")) { window.AA_CLASS_TERM_GROUPS = groupedBattleTerms; }

        studyClasses.sort(compareClasses);
        battleClasses.sort(compareClasses);
        renderClassSlots(studyClasses, battleClasses, windowInfo);
      })
      .catch(function (err) {
        console.warn('[AA] Auto class generation failed:', err.message || err);
        renderClassSlots([], [], windowInfo);
      });
  }

  function bootWhenReady(attemptsLeft) {
    if (hasTemplateClassNodes()) {
      generateClassSlots();
      return;
    }

    if (attemptsLeft <= 0) {
      generateClassSlots();
      return;
    }

    setTimeout(function () {
      bootWhenReady(attemptsLeft - 1);
    }, 50);
  }

  function startGeneratorBoot() {
    bootWhenReady(80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGeneratorBoot);
  } else {
    startGeneratorBoot();
  }
})();
