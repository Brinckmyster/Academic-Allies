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

  window.AA.signInWithGoogle = function () {
    var provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  };

  window.AA.signOut = function () { return auth.signOut(); };

  window.AA.isAdmin = function () {
    var u = auth.currentUser;
    return !!(u && ADMIN_EMAILS.indexOf(u.email) !== -1);
  };

  /* ── Internal: write user profile doc ──────────────────── */
  function createUserDoc(user, role) {
    return db.collection('users').doc(user.uid).set({
      displayName: user.displayName || user.email,
      email:       user.email,
      role:        role,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  /* Create user profile on first sign-in.
     Checks /pendingUsers/{email} so pre-registered users (like Amanda)
     get the correct role automatically on their very first Google sign-in. */
  auth.onAuthStateChanged(function (user) {
    if (!user) return;
    db.collection('users').doc(user.uid).get().then(function (doc) {
      if (doc.exists) return; // already registered, nothing to do

      // Check if admin pre-registered this email
      return db.collection('pendingUsers').doc(user.email).get()
        .then(function (pending) {
          var role;
          if (pending.exists) {
            role = pending.data().role || 'student';
            console.log('[AA] Found pending registration for', user.email, '→ role:', role);
            // Clean up the pending entry now that they've signed in
            return db.collection('pendingUsers').doc(user.email).delete()
              .then(function () { return createUserDoc(user, role); });
          } else {
            role = ADMIN_EMAILS.indexOf(user.email) !== -1 ? 'admin' : 'student';
            return createUserDoc(user, role);
          }
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

  console.log('[AA] Firebase ready — project:', FIREBASE_CONFIG.projectId);
})();
