/* ============================================================
   add-fcs207-combined-cards.js
   Claude: 2026-04-24 — FCS 207 Apparel Construction I
   Appends "all answers" combined cards to the 6 FCS 207 quizzes
   added by add-fcs207-canvas-quizzes.js.
   These mirror the Canvas multi-select format so Mary can practice
   recalling all correct answers at once, not just one at a time.
   Run AFTER add-fcs207-canvas-quizzes.js has already been run.
   ============================================================ */

(async function () {
  'use strict';

  var UID = '9XltlY64NcfpfZx0AJCwv9qV6yY2'; // Mary

  var COMBINED_A = [
    {
      term: 'Meld seams together directly after stitching; press on a surface shaped like the garment',
      answer: 'Pressing includes: (both answers)'
    },
    {
      term: 'Done prior to crossing with another seam; begins as a plain seam; straight stitch + Pinked finish = stronger; Zigzag works on knits and wovens; choose by weight and type of fabric',
      answer: 'Which of the following apply to seam finishes? (all 5)'
    },
    {
      term: 'Double check placement; cut notches outward or with short snips into seam allowance; cut double/triple notches as one unit; leave pinned until ready to sew',
      answer: 'Tips for cutting out fabric — choose all that apply (all 4)'
    }
  ];

  var COMBINED_B = [
    {
      term: '10-12 stitches per inch; 3 on a metric scale; 5 on a numerical scale',
      answer: 'For a normal stitch length, set the stitch regulator at: (all 3)'
    },
    {
      term: 'Ideal = top and bottom threads link between layers; too much tension = fabric puckers; too little = weak loose stitch; tighter tension = turn it higher',
      answer: 'The stitch tension on a sewing machine: (all 4 facts)'
    },
    {
      term: 'Lengthwise grain is parallel to selvage; crosswise grain is weaker and goes around the body; on grain = lengthwise and crosswise threads form right angles; must be on grain to hang correctly when worn',
      answer: 'True statements about fabric grain — choose all that apply (all 4)'
    },
    {
      term: 'Pull a crosswise thread; cut along a check or plaid design; cut on a crosswise rib (knit fabric)',
      answer: 'Ways to make sure fabric is on grain (all 3)'
    },
    {
      term: 'Wash and dry at same temps as finished garment; necessary if label says >1% shrinkage; removes sizing from knit fabrics; do if not preshrunk by manufacturer; can be done at dry cleaners',
      answer: 'Preshrinking: (all 5 facts)'
    }
  ];

  var APPEND_MAP = {
    'FCS 207 — Pressing, Seams & Cutting':    COMBINED_A,
    'FCS 207 — Machine Basics & Fabric Prep': COMBINED_B
  };

  var db  = firebase.firestore();
  var ref = db.collection('studentConfig').doc(UID);
  var snap = await ref.get();
  if (!snap.exists) { console.error('studentConfig not found'); return; }

  var config  = snap.data();
  var quizzes = config.quizzes || [];
  var changed = 0;

  quizzes.forEach(function (q) {
    var baseTitle = q.title.replace(' — Flashcard','').replace(' — Match','').replace(' — Write','');
    var extras = APPEND_MAP[baseTitle];
    if (!extras) return;

    extras.forEach(function (pair) {
      var already = q.data.some(function (d) { return d.term === pair.term; });
      if (!already) {
        q.data.push(pair);
        changed++;
        console.log('APPEND to [' + q.title + ']:', pair.term.slice(0, 60) + '...');
      }
    });
  });

  if (changed === 0) { console.log('Nothing new to append.'); return; }

  await ref.update({ quizzes: quizzes });
  console.log('Done! Appended', changed, 'combined cards across the 6 quizzes.');
})();
