/* ============================================================
   aa-firebase.js — Academic Allies Firebase layer
   Created: 2026-02-18 by Claude

   Load AFTER the Firebase compat CDN scripts:
     firebase-app-compat.js
     firebase-auth-compat.js
     firebase-firestore-compat.js

   Exposes window.AA with auth + Firestore helpers.
   ============================================================ */

(function () {
  'use strict';

  var FIREBASE_CONFIG = {
    apiKey:            'AIzaSyDk9mwSZgk9I65RpYlus7by9mB8tN_oskE',
    authDomain:        'academic-allies-464901.firebaseapp.com',
    projectId:         'academic-allies-464901',
    storageBucket:     'academic-allies-464901.firebasestorage.app',
    messagingSenderId: '93996985456',
    appId:             '1:93996985456:web:c697df7623bbceeb1d18b5'
  };

  /* Emails that get the "admin" role (can read all students' data) */
  var ADMIN_EMAILS = ['brinckmyster@gmail.com'];

  /* ── Initialize Firebase once ───────────────────────────── */
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  var db   = firebase.firestore();
  var auth = firebase.auth();

  /* Enable offline persistence (IndexedDB) so the app works without
     internet and picks up where it left off when reconnected.
     synchronizeTabs: true keeps multiple open tabs in sync. */
  db.enablePersistence({ synchronizeTabs: true })
    .catch(function (err) {
      if (err.code === 'failed-precondition') {
        console.warn('[AA] Offline persistence: multiple tabs open — using first tab only.');
      } else if (err.code === 'unimplemented') {
        console.warn('[AA] Offline persistence: browser not supported.');
      }
    });

  /* ── Public namespace ───────────────────────────────────── */
  window.AA            = window.AA || {};
  window.AA.db         = db;
  window.AA.auth       = auth;
  window.AA.FieldValue = firebase.firestore.FieldValue;
  window.AA.Timestamp  = firebase.firestore.Timestamp;

  /* ── Auth helpers ───────────────────────────────────────── */

  /* ── Account-linking helper ──────────────────────────────────
     Returns a Firebase auth provider instance for a given method ID.
     Only OAuth providers can be used in signInWithPopup; email/password
     cannot be auto-linked without the user's password. */
  function _providerFor(method) {
    if (method === 'google.com')   return new firebase.auth.GoogleAuthProvider();
    if (method === 'github.com')   return new firebase.auth.GithubAuthProvider();
    if (method === 'facebook.com') return new firebase.auth.FacebookAuthProvider();
    return null;
  }

  /* Sign in with Google.
     If the email already exists under a different auth provider,
     sign in with that provider first, then link the Google credential
     so a single Firebase account covers both methods.
     Added 2026-02-21 by Claude. */
  window.AA.signInWithGoogle = function () {
    var googleProvider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(googleProvider)
      .catch(function (err) {
        if (err.code !== 'auth/account-exists-with-different-credential') throw err;

        var pendingCred = err.credential; // Google credential to link
        var email       = err.email;

        console.warn('[AA] Account exists with different credential for:', email, '— attempting link.');

        return auth.fetchSignInMethodsForEmail(email)
          .then(function (methods) {
            var existingProvider = _providerFor(methods[0]);
            if (!existingProvider) {
              // email/password or unknown — cannot auto-link; surface clear error
              var e = new Error('This email (' + email + ') is registered via "' + methods[0] + '". Please sign in with that method.');
              e.code = 'auth/account-exists-with-different-credential';
              throw e;
            }
            // Sign in with the original provider, then link the Google credential
            return auth.signInWithPopup(existingProvider)
              .then(function (result) {
                return result.user.linkWithCredential(pendingCred);
              });
          });
      });
  };

  window.AA.signOut = function () { return auth.signOut(); };

  window.AA.isAdmin = function () {
    var u = auth.currentUser;
    return !!(u && ADMIN_EMAILS.indexOf(u.email) !== -1);
  };

  /* ── Internal: write user profile doc ──────────────────── */
  function createUserDoc(user, role) {
    return db.collection('users').doc(user.uid).set({
      displayName:    user.displayName || user.email,
      email:          user.email,
      role:           role,
      supportNetwork: {},   // map of uid → tier; student controls this
      createdAt:      firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  /* Resolve role for a brand-new user doc.
     Priority: admin email → existing Firestore doc with same email → 'pending'.
     If another UID already holds this email (duplicate account), inherit its role
     so the user doesn't silently lose a non-student assignment.
     Updated 2026-02-26 by Claude — default changed from 'student' to 'pending'
     so unknown sign-ins (mom, random person, duplicate account) are blocked
     immediately and must be approved by an admin before getting access. */
  function _resolveRoleForNewUser(email) {
    if (ADMIN_EMAILS.indexOf(email) !== -1) return Promise.resolve('admin');
    return db.collection('users')
      .where('email', '==', email).limit(1).get()
      .then(function (snap) {
        if (!snap.empty) {
          /* Same email, different UID — inherit the existing role so a
             duplicate account doesn't silently become pending/student */
          var inherited = snap.docs[0].data().role || 'pending';
          console.log('[AA] Inheriting role from existing user doc:', email, '→', inherited);
          return inherited;
        }
        /* Completely unknown email → pending until admin approves */
        console.log('[AA] Unknown email — assigning pending role:', email);
        return 'pending';
      })
      .catch(function () { return 'pending'; });
  }

  /* Create user profile on first sign-in.
     Checks /pendingUsers/{email} so pre-registered users (like Amanda)
     get the correct role automatically on their very first Google sign-in.
     Updated 2026-02-19 by Claude — fixed: non-admin new users got a
     permission-denied error reading pendingUsers, which silently prevented
     createUserDoc from ever being called. Now we catch that error per-step
     and fall through to the default role. */
  auth.onAuthStateChanged(function (user) {
    if (!user) return;
    db.collection('users').doc(user.uid).get().then(function (doc) {
      if (doc.exists) {
        // ── Admin self-heal: if this is an admin email but role got wiped, restore it ──
        if (ADMIN_EMAILS.indexOf(user.email) !== -1 && doc.data().role !== 'admin') {
          console.log('[AA] Admin role self-heal →', user.email);
          db.collection('users').doc(user.uid).update({ role: 'admin' }).catch(function () {});
        }
        // ── Pending honor: if admin pre-registered this user with a role AFTER they
        //    already signed in, honor it now and clean up the pendingUsers entry ──
        return db.collection('pendingUsers').doc(user.email).get()
          .then(function (pending) {
            if (pending.exists) {
              var pendingRole = pending.data().role || 'student';
              console.log('[AA] Honoring pending role for existing user:', user.email, '→', pendingRole);
              return db.collection('pendingUsers').doc(user.email).delete()
                .catch(function () {})
                .then(function () {
                  return db.collection('users').doc(user.uid).update({ role: pendingRole });
                })
                .then(function () { window.location.reload(); }); // reload so header picks up new role
            }
          })
          .catch(function () {}); // permission denied = no pending entry, fine
      }

      // Attempt to read a pending pre-registration for this email.
      // Non-admin users will get PERMISSION_DENIED here (by design) —
      // we catch it and fall through to creating with the default role.
      return db.collection('pendingUsers').doc(user.email).get()
        .then(function (pending) {
          var role;
          if (pending.exists) {
            role = pending.data().role || 'student';
            console.log('[AA] Found pending registration for', user.email, '→ role:', role);
            return db.collection('pendingUsers').doc(user.email).delete()
              .catch(function () {})
              .then(function () { return createUserDoc(user, role); })
              .then(function () { window.location.reload(); }); // reload so header shows correct role
          } else {
            return _resolveRoleForNewUser(user.email)
              .then(function (role) { return createUserDoc(user, role); })
              .then(function () { window.location.reload(); });
          }
        })
        .catch(function (err) {
          // Permission denied reading pendingUsers (non-admin first-time sign-in).
          // Resolve role (may inherit from an existing doc with the same email).
          console.log('[AA] pendingUsers check skipped (' + err.code + ') — resolving role.');
          return _resolveRoleForNewUser(user.email)
            .then(function (role) { return createUserDoc(user, role); })
            .then(function () { window.location.reload(); });
        });
    }).catch(function (err) {
      console.error('[AA] User profile create error:', err);
    });
  });

  /* ── Nope helpers ───────────────────────────────────────── */

  /* Real-time listener — callback(data | null) on every change */
  window.AA.watchNope = function (uid, callback) {
    return db.collection('nope').doc(uid)
      .onSnapshot(function (doc) {
        callback(doc.exists ? doc.data() : null);
      }, function (err) {
        console.error('[AA] watchNope error:', err);
      });
  };

  /* Write (merge) nope status */
  window.AA.setNopeMode = function (uid, mode, semiVisible, activatedAt) {
    var data = {
      mode:              mode,
      semi_nope_visible: semiVisible || {},
      updatedAt:         firebase.firestore.FieldValue.serverTimestamp()
    };
    if (activatedAt !== undefined) data.activatedAt = activatedAt;
    return db.collection('nope').doc(uid).set(data, { merge: true });
  };

  /* Clear nope — set everything to null/empty */
  window.AA.clearNope = function (uid) {
    return db.collection('nope').doc(uid).set({
      mode:              null,
      activatedAt:       null,
      semi_nope_visible: {},
      updatedAt:         firebase.firestore.FieldValue.serverTimestamp()
    });
  };

  /* Append to nope activity log (sub-collection) */
  window.AA.addNopeLog = function (uid, event) {
    return db.collection('nope').doc(uid).collection('logs').add({
      event:     event,
      flag:      'red',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  };

  /* ── Flower Quiz helpers ─────────────────────────────────── */

  window.AA.getFlowerQuiz = function (uid) {
    return db.collection('flowerQuiz').doc(uid).get();
  };

  /* Merge-write individual fields (won't overwrite other fields) */
  window.AA.patchFlowerQuiz = function (uid, patch) {
    var data = Object.assign({}, patch, {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return db.collection('flowerQuiz').doc(uid).set(data, { merge: true });
  };

  /* ── Pending Users (pre-registration for Amanda etc.) ────── */

  /* Admin calls this to pre-register an email before the person signs in.
     When they first sign in with Google, onAuthStateChanged will find this
     entry and assign them the correct role automatically. */
  window.AA.preRegisterEmail = function (email, role) {
    if (!auth.currentUser) return Promise.reject(new Error('Must be signed in as admin'));
    return db.collection('pendingUsers').doc(email).set({
      email:   email,
      role:    role || 'student',
      addedAt: firebase.firestore.FieldValue.serverTimestamp(),
      addedBy: auth.currentUser.email
    });
  };

  /* Returns a Firestore QuerySnapshot of all pending registrations */
  window.AA.getPendingUsers = function () {
    return db.collection('pendingUsers').get();
  };

  /* Cancel a pending invitation */
  window.AA.cancelPendingUser = function (email) {
    return db.collection('pendingUsers').doc(email).delete();
  };

  /* ── Support Network helpers ────────────────────────────────
     The support network lives on the STUDENT's own user doc as:
       supportNetwork: { [memberUid]: 'admin' | 'family' | 'support' | 'nearby-help' }
     The student is always the owner — they control who is in it.
  ────────────────────────────────────────────────────────── */

  /* Get the full user doc for a student (includes supportNetwork map) */
  window.AA.getUserDoc = function (uid) {
    return db.collection('users').doc(uid).get();
  };

  /* Add or update a member in a student's support network.
     studentUid  = the student who owns the network
     memberUid   = the person being added
     tier        = 'admin' | 'family' | 'support' | 'nearby-help'  */
  window.AA.setNetworkMember = function (studentUid, memberUid, tier) {
    var update = {};
    update['supportNetwork.' + memberUid] = tier;
    // Write-back: flag the member's own doc so they can see the Support Dashboard
    // even if their primary role is 'student' (dual-role: student + supporter)
    db.collection('users').doc(memberUid).update({ isSupporter: true })
      .catch(function() {}); // best-effort; non-blocking
    return db.collection('users').doc(studentUid).update(update);
  };

  /* Remove someone from a student's support network */
  window.AA.removeNetworkMember = function (studentUid, memberUid) {
    var update = {};
    update['supportNetwork.' + memberUid] = firebase.firestore.FieldValue.delete();
    // Clear the isSupporter flag from the member's doc
    // (edge case: if they're still in another network they'll lose the card,
    //  but it will be restored next time setNetworkMember is called for them)
    db.collection('users').doc(memberUid).update({ isSupporter: false })
      .catch(function() {}); // best-effort; non-blocking
    return db.collection('users').doc(studentUid).update(update);
  };

  /* Look up a user by email address — returns first match or null */
  window.AA.lookupUserByEmail = function (email) {
    return db.collection('users')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get()
      .then(function (snap) {
        if (snap.empty) return null;
        var doc = snap.docs[0];
        return { uid: doc.id, data: doc.data() };
      });
  };

  /* Get all student-role users (for admin network management picker) */
  window.AA.getAllStudents = function () {
    return db.collection('users')
      .where('role', '==', 'student')
      .get()
      .then(function (snap) {
        return snap.docs.map(function (d) { return { uid: d.id, data: d.data() }; });
      });
  };

  /* Get all admin-role users (so students can always message platform admins) */
  window.AA.getAllAdmins = function () {
    return db.collection('users')
      .where('role', '==', 'admin')
      .get()
      .then(function (snap) {
        return snap.docs.map(function (d) { return { uid: d.id, data: d.data() }; });
      });
  };

  /* Get a student's meal plan base plan from Firestore */
  window.AA.getMealBasePlan = function (uid) {
    return db.collection('mealPlans').doc(uid).get()
      .then(function (doc) { return doc.exists ? doc.data() : null; });
  };

  /* Save / merge a student's meal plan base plan */
  window.AA.saveMealBasePlan = function (uid, plan) {
    return db.collection('mealPlans').doc(uid).set(
      Object.assign({}, plan, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }),
      { merge: true }
    );
  };

  /* ── Check-in helpers ───────────────────────────────────
     Daily check-ins live at /checkins/{uid}/days/{YYYY-MM-DD}
     Each doc: { entries: [...], latestFlag: 'green'|'yellow'|'red', date }
     Support network members can read (Firestore rules grant this).
     Added 2026-02-19 by Claude */

  /* Save a check-in entry (merges into that day's doc) */
  window.AA.saveCheckin = function (uid, dateKey, entry) {
    return db.collection('checkins').doc(uid)
      .collection('days').doc(dateKey)
      .set({
        entries:    firebase.firestore.FieldValue.arrayUnion(entry),
        latestFlag: entry.flag || 'green',
        date:       dateKey,
        updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  };

  /* Get the last N days of check-ins for a student */
  window.AA.getRecentCheckins = function (uid, days) {
    days = days || 7;
    return db.collection('checkins').doc(uid)
      .collection('days')
      .orderBy('date', 'desc')
      .limit(days)
      .get()
      .then(function (snap) {
        return snap.docs.map(function (d) { return d.data(); });
      });
  };

  /* Real-time listener for check-ins (calls callback on any change) */
  window.AA.watchCheckins = function (uid, days, callback) {
    days = days || 7;
    return db.collection('checkins').doc(uid)
      .collection('days')
      .orderBy('date', 'desc')
      .limit(days)
      .onSnapshot(function (snap) {
        callback(snap.docs.map(function (d) { return d.data(); }));
      }, function (err) {
        console.error('[AA] watchCheckins error:', err);
      });
  };

  /* ── Meal log helpers ────────────────────────────────────
     Today's actual meals at /mealLogs/{uid}/days/{YYYY-MM-DD}
     Support network members can read (Firestore rules grant this).
     Added 2026-02-19 by Claude */

  /* Save/overwrite today's meal list */
  window.AA.saveMealLog = function (uid, dateKey, meals) {
    return db.collection('mealLogs').doc(uid)
      .collection('days').doc(dateKey)
      .set({
        meals:     meals,
        date:      dateKey,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  /* Get a specific day's meal log */
  window.AA.getMealLog = function (uid, dateKey) {
    return db.collection('mealLogs').doc(uid)
      .collection('days').doc(dateKey)
      .get()
      .then(function (doc) { return doc.exists ? doc.data() : null; });
  };

  /* Real-time listener for today's meal log */
  window.AA.watchMealLog = function (uid, dateKey, callback) {
    return db.collection('mealLogs').doc(uid)
      .collection('days').doc(dateKey)
      .onSnapshot(function (doc) {
        callback(doc.exists ? doc.data() : null);
      }, function (err) {
        console.error('[AA] watchMealLog error:', err);
      });
  };

  // ── SpoonPal ────────────────────────────────────────────────────
  window.AA.saveSpoonPal = function (uid, obj) {
    return db.collection('spoonPal').doc(uid).set(obj);
  };

  window.AA.getSpoonPal = function (uid) {
    return db.collection('spoonPal').doc(uid).get()
      .then(function (doc) { return doc.exists ? doc.data() : null; });
  };

  window.AA.watchSpoonPal = function (uid, callback) {
    return db.collection('spoonPal').doc(uid)
      .onSnapshot(function (doc) {
        callback(doc.exists ? doc.data() : null);
      }, function (err) {
        console.error('[AA] watchSpoonPal error:', err);
      });
  };

  console.log('[AA] Firebase ready — project:', FIREBASE_CONFIG.projectId);
})();
