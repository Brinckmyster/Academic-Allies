/* ============================================================
   add-fcs207-canvas-quizzes.js
   Claude: 2026-04-24 — FCS 207 Apparel Construction I
   Quiz data extracted from Canvas quiz screenshots (two quizzes):
     Quiz A: Pressing, Seams & Cutting (11 individual pairs)
     Quiz B: Machine Basics & Fabric Prep (26 individual pairs)
   Each quiz has Flashcard, Match, and Write variants.
   Combined "all answers" cards appended via add-fcs207-combined-cards.js.
   Run in browser console while signed in (mirror mode is fine).
   ============================================================ */

(async function () {
  'use strict';

  var UID = '9XltlY64NcfpfZx0AJCwv9qV6yY2'; // Mary

  var QUIZ_A_DATA = [
    { term: 'Meld seams together directly after stitching', answer: 'One purpose of pressing' },
    { term: 'Press on a surface shaped like the garment', answer: 'Pressing technique — what surface to use' },
    { term: 'Before crossing with another seam', answer: 'When should a seam finish be done?' },
    { term: 'Plain seam', answer: 'A seam finish begins as a...' },
    { term: 'Straight stitch + Pinked seam finish', answer: 'Combination that ensures a stronger seam finish' },
    { term: 'Zigzag finish', answer: 'Seam finish that can be used on both knits and woven fabrics' },
    { term: 'Weight and type of fabric', answer: 'How to choose a seam finish' },
    { term: 'Double check placement', answer: 'First tip for cutting fabric (pattern pieces)' },
    { term: 'Outward or with short snips into the seam allowance', answer: 'How to cut notches' },
    { term: 'As one unit, not separately', answer: 'How to cut double or triple notches' },
    { term: 'Leave pinned until ready to sew', answer: 'What to do with pattern pieces after cutting' }
  ];

  var QUIZ_B_DATA = [
    { term: '10-12 stitches per inch', answer: 'Normal stitch length in imperial (stitches per inch)' },
    { term: '3 on a metric scale', answer: 'Normal stitch length on a metric scale' },
    { term: '5 on a numerical scale', answer: 'Normal stitch length on a numerical scale' },
    { term: 'Top and bottom threads link between fabric layers', answer: 'Ideal stitch tension result' },
    { term: 'Fabric puckers', answer: 'Result of too much stitch tension' },
    { term: 'Weak, loose stitch', answer: 'Result of too little stitch tension' },
    { term: 'Turn it higher', answer: 'To get a tighter stitch tension, turn the dial...' },
    { term: 'Zipper foot', answer: 'Machine foot used to sew cording' },
    { term: 'Blindstitch foot', answer: 'Machine foot — fast alternative to hemming' },
    { term: 'Even feed foot', answer: 'Machine foot for fabrics that stick or stretch' },
    { term: 'General Purpose / Zigzag foot', answer: 'Machine foot used for general purpose sewing' },
    { term: 'Special purpose foot', answer: 'Machine foot that allows thread build up in decorative stitching' },
    { term: 'Button foot', answer: 'Machine foot that saves time sewing on buttons' },
    { term: 'At the corner of each stitch, midway between fabric layers', answer: 'Where the interlocking thread link falls with correct zigzag tension and pressure' },
    { term: 'Parallel to the selvage', answer: 'The lengthwise grain runs...' },
    { term: 'Weaker — usually goes around the body', answer: 'The crosswise grain is... and usually...' },
    { term: 'Lengthwise and crosswise threads form right angles', answer: 'A fabric is on grain when...' },
    { term: 'Hang correctly when worn', answer: 'Fabric needs to be on grain to...' },
    { term: 'Pull a crosswise thread', answer: 'Method to check fabric grain (woven)' },
    { term: 'Cut along a check or plaid design', answer: 'Method to check fabric grain (patterned fabric)' },
    { term: 'Cut on a crosswise rib', answer: 'Method to check fabric grain (knit fabric)' },
    { term: 'Wash and dry at the same temps as the finished garment', answer: 'How to preshrink fabric' },
    { term: 'Label says it will shrink more than 1%', answer: 'When preshrinking is necessary' },
    { term: 'To remove the sizing', answer: 'Why preshrink knit fabrics' },
    { term: 'If not preshrunk by the manufacturer', answer: 'Another reason to preshrink before cutting' },
    { term: 'Dry cleaners', answer: 'Alternative location to have fabric preshrunk' }
  ];

  function makeQuizSet(baseName, data) {
    return [
      { title: baseName + ' — Flashcard', type: 'flashcard', class: 'FCS 207', data: data },
      { title: baseName + ' — Match',     type: 'match',     class: 'FCS 207', data: data },
      { title: baseName + ' — Write',     type: 'write',     class: 'FCS 207', data: data }
    ];
  }

  var NEW_QUIZZES = [].concat(
    makeQuizSet('FCS 207 — Pressing, Seams & Cutting',    QUIZ_A_DATA),
    makeQuizSet('FCS 207 — Machine Basics & Fabric Prep', QUIZ_B_DATA)
  );

  var db  = firebase.firestore();
  var ref = db.collection('studentConfig').doc(UID);
  var snap = await ref.get();
  if (!snap.exists) { console.error('studentConfig not found for UID:', UID); return; }

  var config  = snap.data();
  var quizzes = config.quizzes || [];
  var added = 0;

  NEW_QUIZZES.forEach(function (q) {
    var exists = quizzes.some(function (e) { return e.title === q.title; });
    if (exists) {
      console.log('SKIP (already exists):', q.title);
    } else {
      quizzes.push(q);
      console.log('ADD:', q.title, '(' + q.data.length + ' pairs)');
      added++;
    }
  });

  if (added === 0) { console.log('Nothing to add — all quizzes already present.'); return; }

  await ref.update({ quizzes: quizzes });
  console.log('Done! Added', added, 'quizzes. Total quizzes now:', quizzes.length);
})();
