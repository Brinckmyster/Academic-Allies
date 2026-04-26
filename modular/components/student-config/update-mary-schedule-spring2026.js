/* ============================================================
   update-mary-schedule-spring2026.js
   Claude: 2026-04-26 — Console script to update Mary's
   classSchedule in Firestore with confirmed Spring 2026 data.

   HOW TO USE:
   1. Go to brinckmyster.github.io/Academic-Allies and sign in
   2. Open DevTools → Console
   3. Paste this entire script and press Enter
   4. You should see "✅ Mary's schedule updated" in the console
   ============================================================ */

(function() {
  'use strict';

  var MARY_UID = '9XltlY64NcfpfZx0AJCwv9qV6yY2';

  var SPRING_START = '2026-04-27';
  var SPRING_END   = '2026-07-18';

  /* Confirmed from BYUI class portal 2026-04-26 */
  var schedule = [
    {
      code:          'COMM 130',
      section:       'COMM 130-03',
      name:          'Visual Media',
      instructor:    'Kerr, Cory Ryan',
      instructorEmail: 'kerrc@byui.edu',
      days:          ['Mon', 'Fri'],
      startTime:     '11:30',
      endTime:       '13:00',
      building:      'SPO',
      room:          '107',
      semesterStart: SPRING_START,
      semesterEnd:   SPRING_END
    },
    {
      code:          'FCS 207',
      section:       'FCS 207-01',
      name:          'Apparel Construction I',
      instructor:    'Barlow, Trinity B.',
      instructorEmail: 'barlowt@byui.edu',
      days:          ['Mon', 'Wed'],
      startTime:     '14:00',
      endTime:       '15:30',
      building:      'CLK',
      room:          '322',
      semesterStart: SPRING_START,
      semesterEnd:   SPRING_END
    },
    {
      code:          'HORT 328',
      section:       'HORT 328-01',
      name:          'Wedding & Event Planning',
      instructor:    'Robison, Katherine M.',
      instructorEmail: 'robisonka@byui.edu',
      days:          ['Tue'],
      startTime:     '12:45',
      endTime:       '14:45',
      building:      'BEN',
      room:          '236',
      semesterStart: SPRING_START,
      semesterEnd:   SPRING_END
    },
    {
      code:          'IDS 101',
      section:       'IDS 101-02',
      name:          'Intro to Interdisciplinary Studies',
      instructor:    'Wilson, Chris M.',
      instructorEmail: 'wilsonc@byui.edu',
      days:          ['Wed'],
      startTime:     '12:45',
      endTime:       '13:45',
      building:      'HIN',
      room:          '371',
      semesterStart: SPRING_START,
      semesterEnd:   SPRING_END
    }
  ];

  /* ── Check Firebase is available ── */
  if (!window.firebase || !window.firebase.firestore) {
    console.error('❌ Firebase not available. Make sure you are on the Academic Allies site.');
    return;
  }

  var db = firebase.firestore();

  /* ── First: log what is currently there so we can compare ── */
  db.collection('users').doc(MARY_UID).get()
    .then(function(doc) {
      if (doc.exists) {
        var current = doc.data().classSchedule || [];
        console.log('📋 Current classSchedule (' + current.length + ' entries):');
        current.forEach(function(c, i) {
          console.log('  [' + i + ']', c.code || c.section, '|', (c.days || []).join('/'), c.startTime + '-' + c.endTime);
        });
        console.log('⬆️  Replacing with', schedule.length, 'Spring 2026 entries…');
      } else {
        console.log('⚠️  No existing classSchedule — creating fresh.');
      }

      /* ── Write the new schedule ── */
      return db.collection('users').doc(MARY_UID).update({
        classSchedule: schedule
      });
    })
    .then(function() {
      console.log('✅ Mary\'s schedule updated with', schedule.length, 'Spring 2026 classes.');
      console.log('   Reload the calendar to see the changes.');
    })
    .catch(function(err) {
      console.error('❌ Update failed:', err.message);
      console.error('   If you see "permission-denied", run this while signed in as Bruise');
      console.error('   on the Academic Allies site (not the raw GitHub URL).');
    });
})();
