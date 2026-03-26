/* Claude: 2026-03-20 — Tag all of Mary's quizzes with trimester: "winter-2026".
   Paste into browser console while in Mary's mirror mode. */

(function() {
  'use strict';

  var uid = window.AA_MIRROR_UID;
  if (!uid) { alert('Not in mirror mode!'); return; }
  if (!window.AA || !window.AA.db) { alert('Firebase not ready.'); return; }

  var docRef = window.AA.db.collection('studentConfig').doc(uid);

  docRef.get().then(function(doc) {
    var quizzes = (doc.exists && doc.data().quizzes) ? doc.data().quizzes : [];
    if (quizzes.length === 0) { alert('No quizzes found.'); return; }

    var tagged = 0;
    quizzes.forEach(function(q) {
      if (!q.trimester) {
        q.trimester = 'winter-2026';
        tagged++;
      }
    });

    return docRef.set({ quizzes: quizzes }, { merge: true }).then(function() {
      alert('[TRIMESTER TAG] Done! Tagged ' + tagged + ' quizzes as winter-2026. (' + quizzes.length + ' total)');
    });
  }).catch(function(err) {
    alert('Error: ' + err.message);
  });
})();
