/* Claude: 2026-03-20 — Triple Mary's quizzes: each dataset gets all 3 types.
   Paste this into the browser console while in Mary's mirror mode.
   It reads the existing quizzes from Firestore, generates all 3 types per
   unique dataset, deduplicates, and writes back. */

(function() {
  'use strict';

  var uid = window.AA_MIRROR_UID;
  if (!uid) {
    alert('Not in mirror mode! Switch to Mary\'s mirror first.');
    return;
  }
  if (!window.AA || !window.AA.db) {
    alert('Firebase not ready. Wait for the page to fully load.');
    return;
  }

  var TYPES = ['flashcards', 'fill-blank', 'match'];
  var TYPE_LABELS = {
    'flashcards': 'Flashcards',
    'fill-blank': 'Fill in the Blank',
    'match': 'Match Game'
  };

  var docRef = window.AA.db.collection('studentConfig').doc(uid);

  docRef.get().then(function(doc) {
    var existing = (doc.exists && doc.data().quizzes) ? doc.data().quizzes : [];

    if (existing.length === 0) {
      alert('No quizzes found in config! Load the base quizzes first.');
      return;
    }

    /* Build a map of base titles (strip any type suffix) to their data */
    var baseSets = {};
    existing.forEach(function(quiz) {
      /* Remove trailing type labels like " — Flashcards" to find the base title */
      var baseTitle = quiz.title
        .replace(/\s*[—–-]\s*(Flashcards|Fill in the Blank|Match Game)\s*$/i, '')
        .trim();

      /* Keep the first version's data and description we see per base title */
      if (!baseSets[baseTitle]) {
        baseSets[baseTitle] = {
          description: quiz.description || '',
          data: quiz.data || []
        };
      }
    });

    /* Build the full tripled quiz list */
    var allQuizzes = [];
    var baseNames = Object.keys(baseSets);

    baseNames.forEach(function(baseName) {
      var base = baseSets[baseName];
      TYPES.forEach(function(type) {
        allQuizzes.push({
          title: baseName + ' — ' + TYPE_LABELS[type],
          type: type,
          description: base.description,
          data: JSON.parse(JSON.stringify(base.data)) /* deep copy */
        });
      });
    });

    console.log('[QUIZ TRIPLER] ' + baseNames.length + ' base datasets → ' + allQuizzes.length + ' quizzes');

    return docRef.set({ quizzes: allQuizzes }, { merge: true }).then(function() {
      /* Audit log */
      return window.AA.db.collection('auditLog').doc(uid).collection('entries').add({
        action: 'config_updated',
        targetUid: uid,
        actorUid: window.AA.auth.currentUser ? window.AA.auth.currentUser.uid : null,
        timestamp: window.AA.Timestamp.now(),
        details: { note: 'Tripled ' + baseNames.length + ' quiz datasets into all 3 types (' + allQuizzes.length + ' total)' }
      });
    }).then(function() {
      alert('[QUIZ TRIPLER] Done! ' + baseNames.length + ' datasets × 3 types = ' + allQuizzes.length + ' quizzes loaded.');
      console.log('[QUIZ TRIPLER] Complete. Titles:', allQuizzes.map(function(q) { return q.title; }));
    });
  }).catch(function(err) {
    console.error('[QUIZ TRIPLER] Error:', err);
    alert('Error: ' + err.message);
  });
})();
