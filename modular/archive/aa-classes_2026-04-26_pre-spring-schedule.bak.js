/* Claude: 2026-04-21 — Centralized class list by trimester.
   Single source of truth for battle-mode, farm-mode, study-tools,
   templates, and auto-generate-classes.
   Update THIS file when classes change — nowhere else. */

(function () {
  'use strict';

  window.AA_CLASSES = {

    /* ── Trimester definitions ─────────────────────────────────── */
    trimesters: [
      {
        id: 'winter-2026',
        label: 'Winter 2026',
        start: '2026-01-05',
        end:   '2026-04-18',
        classes: [
          { code: 'HORT 235', section: 'HORT 235-01', name: 'Horticulture',              emoji: '🌾', teacher: '' },
          { code: 'FCS 207',  section: 'FCS 207-01',  name: 'Apparel Construction I',    emoji: '🧵', teacher: 'barlow@byui.edu' },
          { code: 'HORT 328', section: 'HORT 328-01', name: 'Wedding & Event Planning',  emoji: '🌸', teacher: '' }
          /* Dropped 2026-04-21: IDS 101-02 (Wilson), HORT 287R-01 (Kirby), FCS 101-A1 (Denison) */
        ]
      },
      {
        id: 'spring-2026',
        label: 'Spring 2026',
        start: '2026-04-27',
        end:   '2026-07-18',
        classes: [
          { code: 'IDS 101',  section: 'IDS 101-02', name: 'Intro to Interdisc. Studies', emoji: '📚', teacher: 'wilsonc@byui.edu' },
          { code: 'COMM 130', section: 'COMM 130', name: 'Visual Media',                emoji: '🎤', teacher: 'kerrc@byui.edu' },
          { code: 'FCS 207',  section: 'FCS 207',  name: 'Apparel Construction I',      emoji: '🧵', teacher: 'barlowt@byui.edu' },
          { code: 'HORT 328', section: 'HORT 328', name: 'Wedding & Event Planning',    emoji: '🌸', teacher: 'robisonka@byui.edu' }
        ]
      }
      /* Add future trimesters below:
      ,{
        id: 'fall-2026',
        label: 'Fall 2026',
        start: '2026-09-14',
        end:   '2026-12-12',
        classes: []
      } */
    ],

    /* ── Helpers ───────────────────────────────────────────────── */

    /* Classes for a specific term ID */
    getByTerm: function (termId) {
      for (var i = 0; i < this.trimesters.length; i++) {
        if (this.trimesters[i].id === termId) return this.trimesters[i].classes;
      }
      return [];
    },

    /* Active classes based on today's date.
       If between terms, returns upcoming if ≤14 days away, else most recent. */
    getActive: function () {
      var now   = new Date();
      var i, t, start, recent, upcoming, daysUntil;

      for (i = 0; i < this.trimesters.length; i++) {
        t = this.trimesters[i];
        if (now >= new Date(t.start) && now <= new Date(t.end + 'T23:59:59')) {
          return t.classes;
        }
      }

      recent   = null;
      upcoming = null;
      for (i = 0; i < this.trimesters.length; i++) {
        t     = this.trimesters[i];
        start = new Date(t.start);
        if (start > now) {
          daysUntil = Math.round((start - now) / 86400000);
          if (daysUntil <= 14 && (!upcoming || start < new Date(upcoming.start))) upcoming = t;
        } else {
          if (!recent || start > new Date(recent.start)) recent = t;
        }
      }
      return upcoming ? upcoming.classes : (recent ? recent.classes : []);
    },

    /* All class codes across every trimester (for quiz filtering) */
    getAllCodes: function () {
      var codes = [];
      var i, j, cls;
      for (i = 0; i < this.trimesters.length; i++) {
        cls = this.trimesters[i].classes;
        for (j = 0; j < cls.length; j++) {
          if (codes.indexOf(cls[j].code) === -1) codes.push(cls[j].code);
        }
      }
      return codes;
    },

    /* First class object matching a code (any term) */
    getByCode: function (code) {
      var i, j, cls;
      for (i = 0; i < this.trimesters.length; i++) {
        cls = this.trimesters[i].classes;
        for (j = 0; j < cls.length; j++) {
          if (cls[j].code === code) return cls[j];
        }
      }
      return null;
    },

    /* Check whether a class code appears anywhere in the list */
    isKnownCode: function (code) {
      return !!this.getByCode(code);
    }
  };

})();
