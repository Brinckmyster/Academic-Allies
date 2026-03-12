/* ============================================================
   aa-firebase.js — Academic Allies Firebase layer
   Created: 2026-02-18 by Claude
   Updated: 2026-02-26 by Claude — renamed platform role 'admin'→'backstage-manager',
            network tier 'admin'→'network-lead' throughout

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

  /* Claude: to add admins, add email to ADMIN_EMAILS array. Firestore rules also need updating.
     Emails that get the "backstage-manager" role (can read all students' data) */
  var ADMIN_EMAILS = ['brinckmyster@gmail.com'];

  /* ── Initialize Firebase once ───────────────────────────── */
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  console.log('[AA] Firebase initialised');

  var db   = firebase.firestore();
  var auth = firebase.auth();

  /* Claude: 2026-03-06 — persistence hardening.
     LOCAL is the ironclad default. SESSION only when user explicitly unchecks the box.
     On first load (no stored pref) or after storage wipe, stamp 'true' immediately
     so the preference is always explicit — never silently missing.
     sessionStorage mirrors the pref as a same-tab backup: if localStorage is wiped
     mid-session the current tab stays on LOCAL rather than unknowingly flipping. */
  (function _stampPersistPref() {
    if (localStorage.getItem('AA_KEEP_SIGNED_IN') === null) {
      localStorage.setItem('AA_KEEP_SIGNED_IN', 'true'); // explicit stamp — LOCAL by default
    }
    // Short-term mirror so we survive a localStorage wipe within the same tab.
    sessionStorage.setItem('AA_KEEP_SIGNED_IN_SS', localStorage.getItem('AA_KEEP_SIGNED_IN'));
  }());

  /* Resolve: prefer localStorage; fall back to sessionStorage mirror if LS was cleared. */
  var _keepSignedIn = (localStorage.getItem('AA_KEEP_SIGNED_IN')
                       || sessionStorage.getItem('AA_KEEP_SIGNED_IN_SS')) !== 'false';
  console.log('[AA] Persistence preference: ' + (_keepSignedIn ? 'LOCAL' : 'SESSION') + ' | AA_KEEP_SIGNED_IN=' + localStorage.getItem('AA_KEEP_SIGNED_IN'));

  /* Only call setPersistence when the user opted into SESSION (non-default).
     LOCAL is Firebase's default — calling setPersistence(LOCAL) redundantly
     interferes with the in-flight session restoration from IndexedDB, causing
     onAuthStateChanged to fire with null and never deliver the restored user. */
  var _typeReady = _keepSignedIn
    ? Promise.resolve()
    : auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(function () { console.log('[AA] setPersistence(SESSION) resolved OK'); })
        .catch(function (err) {
          console.warn('[AA] Auth persistence set failed:', err.code);
        });

  /* _persistenceReady resolves when onAuthStateChanged first fires — this is the
     true "session resolved" signal. setPersistence only sets the TYPE; the session
     restoration from IndexedDB is a separate async process signalled by onAuthStateChanged. */
  var _persistenceReady = _typeReady.then(function () {
    return new Promise(function (resolve) {
      var unsub = auth.onAuthStateChanged(function (user) {
        unsub();
        console.log('[AA] Auth state resolved: ' + (user ? 'USER (' + user.email + ')' : 'null'));
        /* Claude: 2026-03-12 — diagnostic: if LOCAL persistence was expected but no session
           was restored, log a warning with context so we can track the sign-out pattern. */
        if (!user && _keepSignedIn) {
          var lastUser = null;
          try { lastUser = JSON.parse(localStorage.getItem('AA_LAST_USER')); } catch (e) {}
          if (lastUser && lastUser.email) {
            console.warn('[AA] PERSISTENCE DIAGNOSTIC: Expected LOCAL session for ' + lastUser.email +
              ' but auth resolved null. IndexedDB may have been cleared by the browser.' +
              ' AA_KEEP_SIGNED_IN=' + localStorage.getItem('AA_KEEP_SIGNED_IN') +
              ' | Last login: ' + (lastUser.lastLogin || 'unknown'));
          }
        }
        resolve(user);
      });
    });
  });

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
  /* Claude: 2026-03-10 — expose persistence promise so shared-header can wait
     for auth restoration before setting up onAuthStateChanged. Without this,
     shared-header gets an immediate null and shows the sign-in button before
     Firebase finishes restoring the session from IndexedDB. */
  window.AA._persistenceReady = _persistenceReady;

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

  /* Claude: detect popup-blocked errors — browsers on virtual desktops,
     cross-origin iframes, and some mobile browsers silently block popups. */
  function _isPopupBlocked(err) {
    return err.code === 'auth/popup-blocked'
        || err.code === 'auth/popup-closed-by-user'
        || err.code === 'auth/cancelled-popup-request';
  }

  /* Sign in with Google.
     If the email already exists under a different auth provider,
     sign in with that provider first, then link the Google credential
     so a single Firebase account covers both methods.
     Claude: falls back to signInWithRedirect if popup is blocked.
     Added 2026-02-21 by Claude. Updated 2026-03-04 by Claude. */
  window.AA.signInWithGoogle = function (loginHint) {
    var googleProvider = new firebase.auth.GoogleAuthProvider();
    if (loginHint) googleProvider.setCustomParameters({ login_hint: loginHint });
    /* Claude: 2026-03-06 — re-read preference at sign-in time; sessionStorage fallback */
    var keepPref = (localStorage.getItem('AA_KEEP_SIGNED_IN')
                    || sessionStorage.getItem('AA_KEEP_SIGNED_IN_SS')) !== 'false';
    var pType = keepPref
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;
    return auth.setPersistence(pType).then(function () {
    return auth.signInWithPopup(googleProvider)
      .catch(function (err) {
        // Claude: popup blocked — fall back to redirect (works everywhere)
        if (_isPopupBlocked(err)) {
          console.warn('[AA] Popup blocked — falling back to signInWithRedirect');
          return auth.signInWithRedirect(googleProvider);
        }
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
              })
              .catch(function (linkErr) {
                // Claude: popup blocked on the link step too — redirect
                if (_isPopupBlocked(linkErr)) {
                  console.warn('[AA] Link popup blocked — falling back to redirect');
                  return auth.signInWithRedirect(existingProvider);
                }
                throw linkErr;
              });
          });
      });
    }); /* Claude: end setPersistence.then() */
  };

  // Claude: clear cached user on sign-out so re-auth isn't attempted next load
  window.AA.signOut = function () {
    try { localStorage.removeItem('AA_LAST_USER'); } catch (e) {}
    return auth.signOut();
  };

  // Claude: read cached user from localStorage (for re-auth fallback in shared-header)
  window.AA.getLastUser = function () {
    try { return JSON.parse(localStorage.getItem('AA_LAST_USER')); } catch (e) { return null; }
  };

  window.AA.isAdmin = function () {
    var u = auth.currentUser;
    return !!(u && ADMIN_EMAILS.indexOf(u.email) !== -1);
  };

  /* ── Internal: write user profile doc ──────────────────── */
  // Claude: BUG #2 FIX — support network-lead role for scoped admin control
  function createUserDoc(user, role) {
    return db.collection('users').doc(user.uid).set({
      displayName:    user.displayName || user.email,
      email:          user.email,
      role:           role,
      supportNetwork: {},   // map of uid → tier; student controls this
      // Claude: BUG #2 — network-lead field to track their assigned student (if applicable)
      linkedStudentId: null,  // set only if role === 'network-lead', points to their assigned student
      createdAt:      firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  /* Resolve role for a brand-new user doc.
     Priority: admin email → existing Firestore doc with same email → 'pending'.
     If another UID already holds this email (duplicate account), inherit its role
     so the user doesn't silently lose a non-student assignment.
     Updated 2026-02-26 by Claude — default is 'pending' for the current private
     development phase (Mary only). The shared-header invite code modal intercepts
     pending sign-ins and offers invite code redemption before signing them out.
     TODO (Play Store launch): Change 'pending' → 'student' in this function
     (see STUDENT-NETWORK-SPEC.md §7 Step 5) so direct downloads auto-become students. */
  function _resolveRoleForNewUser(email) {
    if (ADMIN_EMAILS.indexOf(email) !== -1) return Promise.resolve('backstage-manager');
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
        /* Unknown email → pending (dev phase). Invite code modal handles redemption.
           Change to 'student' at Play Store launch (STUDENT-NETWORK-SPEC §7 Step 5). */
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
  /* Claude: wait for persistence to resolve before checking auth state.
     This prevents onAuthStateChanged from firing with null while
     IndexedDB is still loading the persisted session. */
  _persistenceReady.then(function () {
  console.log('[AA] aa-firebase onAuthStateChanged registering. currentUser=' + (auth.currentUser ? auth.currentUser.email : 'null'));
  auth.onAuthStateChanged(function (user) {
    console.log('[AA] aa-firebase onAuthStateChanged: ' + (user ? 'USER (' + user.email + ')' : 'null'));
    /* Claude: cache last signed-in user to localStorage for re-auth fallback.
       If Firebase persistence fails (virtual desktops, cleared IndexedDB),
       shared-header can read this to attempt silent re-auth. */
    if (user) {
      try {
        localStorage.setItem('AA_LAST_USER', JSON.stringify({
          email: user.email, displayName: user.displayName, uid: user.uid
        }));
      } catch (e) {}
      /* Claude: 2026-03-05 — silently refresh token every 45 min when LOCAL persistence
         is active, to prevent 1-hour expiration sign-outs */
      if (_keepSignedIn && !window._aaTokenRefreshInterval) {
        window._aaTokenRefreshInterval = setInterval(function () {
          var u = auth.currentUser;
          if (u) u.getIdToken(true).catch(function () {});
        }, 45 * 60 * 1000);
      }
      /* Claude: 2026-03-05 — visibilitychange refresh.
         Chrome throttles setInterval for background tabs, so the 45-min
         interval may never fire while the tab is hidden. When the user
         returns, force a token refresh immediately so the session doesn't
         expire mid-use. One listener registered once per session. */
      if (_keepSignedIn && !window._aaVisibilityRefreshBound) {
        window._aaVisibilityRefreshBound = true;
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) {
            var u = auth.currentUser;
            if (u) {
              /* Refresh token proactively — Chrome throttles timers in background tabs */
              u.getIdToken(true).catch(function () {});
            } else {
              /* Claude: 2026-03-06 — tab returned to foreground with no current user.
                 Firebase may have expired the session while throttled in background.
                 Clear AA_REAUTH_DONE so the re-auth poll can run on next null event. */
              var lastUser = null;
              try { lastUser = JSON.parse(localStorage.getItem('AA_LAST_USER')); } catch (e) {}
              if (lastUser && lastUser.email) {
                sessionStorage.removeItem('AA_REAUTH_DONE');
              }
            }
          }
        });
      }
    }
    if (!user) {
      /* Claude: clear token refresh interval on sign-out */
      if (window._aaTokenRefreshInterval) {
        clearInterval(window._aaTokenRefreshInterval);
        window._aaTokenRefreshInterval = null;
      }
      return;
    }
    db.collection('users').doc(user.uid).get().then(function (doc) {
      if (doc.exists) {
        // ── Admin self-heal: if this is an admin email but role got wiped, restore it ──
        if (ADMIN_EMAILS.indexOf(user.email) !== -1 && doc.data().role !== 'backstage-manager') {
          console.log('[AA] Backstage-manager role self-heal →', user.email);
          db.collection('users').doc(user.uid).update({ role: 'backstage-manager' }).catch(function () {});
        }
        // ── 24-hour admin timer: auto self-admin if slot empty >24h ──
        _check24HourAdminTimer(user.uid, doc.data());
        // ── Pending honor: if admin pre-registered this user with a role AFTER they
        //    already signed in, honor it now and clean up the pendingUsers entry ──
        return db.collection('pendingUsers').doc(user.email).get()
          .then(function (pending) {
            if (pending.exists) {
              var pendingRole = pending.data().role || 'student';
              // Claude: 2026-03-05 — never overwrite an admin email's role via pendingUsers
              if (ADMIN_EMAILS.indexOf(user.email) !== -1) {
                console.log('[AA] Skipping pendingUsers role for admin email:', user.email);
                return db.collection('pendingUsers').doc(user.email).delete().catch(function () {});
              }
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
  }); /* Claude: end _persistenceReady.then() */

  /* ── Nope helpers ───────────────────────────────────────── */

  /* Real-time listener — callback(data | null) on every change */
  window.AA.watchNope = function (uid, callback) {
    // Claude: 2026-03-08 — log access with mirror context if viewing another user's data
    if (auth.currentUser && auth.currentUser.uid) {
      var _meta = {};
      if (uid !== auth.currentUser.uid) {
        _meta.mirrorOf = uid;
        _meta.detail = 'Viewed crisis mode status';
      }
      window.AA.logAccess(uid !== auth.currentUser.uid ? 'mirror-view' : 'read', uid, 'nope', _meta);
    }
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
       supportNetwork: { [memberUid]: 'network-lead' | 'family' | 'support' | 'nearby-help' }
     The student is always the owner — they control who is in it.
  ────────────────────────────────────────────────────────── */

  /* Get the full user doc for a student (includes supportNetwork map) */
  window.AA.getUserDoc = function (uid) {
    return db.collection('users').doc(uid).get();
  };

  /* Add or update a member in a student's support network.
     studentUid  = the student who owns the network
     memberUid   = the person being added
     tier        = 'network-lead' | 'family' | 'support' | 'nearby-help'  */
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

  /* Get all backstage-manager-role users (so students can always message platform admin) */
  window.AA.getAllAdmins = function () {
    return db.collection('users')
      .where('role', '==', 'backstage-manager')
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
    // Claude: 2026-03-08 — log access with mirror context
    if (auth.currentUser && auth.currentUser.uid) {
      var _meta = {};
      if (uid !== auth.currentUser.uid) {
        _meta.mirrorOf = uid;
        _meta.detail = 'Viewed check-in data';
      }
      window.AA.logAccess(uid !== auth.currentUser.uid ? 'mirror-view' : 'read', uid, 'checkin', _meta);
    }
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
    // Claude: 2026-03-08 — log access with mirror context
    if (auth.currentUser && auth.currentUser.uid) {
      var _meta = {};
      if (uid !== auth.currentUser.uid) {
        _meta.mirrorOf = uid;
        _meta.detail = 'Viewed meal log';
      }
      window.AA.logAccess(uid !== auth.currentUser.uid ? 'mirror-view' : 'read', uid, 'mealLog', _meta);
    }
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
    // Claude: 2026-03-08 — log access with mirror context
    if (auth.currentUser && auth.currentUser.uid) {
      var _meta = {};
      if (uid !== auth.currentUser.uid) {
        _meta.mirrorOf = uid;
        _meta.detail = 'Viewed SpoonPal data';
      }
      window.AA.logAccess(uid !== auth.currentUser.uid ? 'mirror-view' : 'read', uid, 'spoonPal', _meta);
    }
    return db.collection('spoonPal').doc(uid)
      .onSnapshot(function (doc) {
        callback(doc.exists ? doc.data() : null);
      }, function (err) {
        console.error('[AA] watchSpoonPal error:', err);
      });
  };

  /* ── Amanda sudo — Invite system ───────────────────────────
     Students generate single-use codes to invite support network members.
     Each code encodes the role the invitee will receive.
     Added 2026-02-26 by Claude.
  ─────────────────────────────────────────────────────────── */

  /* Generate a random invite code — 6 uppercase chars, no ambiguous letters */
  function _makeCode() {
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; /* no 0,O,I,1,L */
    var code  = '';
    for (var i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /* Create an invite code for someone to join the student's support network.
     studentUid  — uid of the student creating the invite (caller or NL's student)
     role        — 'family' | 'support' | 'nearby-help' | 'network-lead'
     Returns Promise<{ code, expiresAt }>
     Updated 2026-03-07: network leads can create invites for their student. */
  function _doCreateInvite(studentUid, studentName, role) {
    var code      = _makeCode();
    var now       = new Date();
    var expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); /* 7 days */

    var invite = {
      code:        code,
      studentUid:  studentUid,
      studentName: studentName,
      role:        role,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt:   firebase.firestore.Timestamp.fromDate(expiresAt),
      used:        false,
      usedAt:      null,
      usedBy:      null
    };

    return db.collection('invites').doc(code).set(invite)
      .then(function () {
        console.log('[AA] Invite created:', code, '→', role);
        return { code: code, expiresAt: expiresAt };
      });
  }

  window.AA.createInvite = function (studentUid, role) {
    var validRoles = ['family', 'support', 'nearby-help', 'network-lead'];
    if (validRoles.indexOf(role) === -1) {
      return Promise.reject(new Error('Invalid role: ' + role));
    }
    var user = auth.currentUser;
    if (!user) return Promise.reject(new Error('Not signed in'));

    /* Student creating for self */
    if (user.uid === studentUid) {
      return _doCreateInvite(studentUid, user.displayName || user.email || 'Your student', role);
    }

    /* Network lead creating for their student — look up student's name */
    return AA.isNetworkLeadFor(studentUid).then(function (isNL) {
      if (!isNL) throw new Error('Not authorized');
      return db.collection('users').doc(studentUid).get();
    }).then(function (doc) {
      var sName = doc.exists ? (doc.data().displayName || doc.data().email) : 'Student';
      return _doCreateInvite(studentUid, sName, role);
    });
  };

  /* Get all pending (unused, unexpired) invites created by a student */
  window.AA.getMyInvites = function (studentUid) {
    return db.collection('invites')
      .where('studentUid', '==', studentUid)
      .where('used', '==', false)
      .get()
      .then(function (snap) {
        var now = new Date();
        return snap.docs
          .map(function (d) { return d.data(); })
          .filter(function (inv) {
            /* Filter out expired invites client-side */
            var exp = inv.expiresAt && inv.expiresAt.toDate
              ? inv.expiresAt.toDate() : new Date(inv.expiresAt);
            return exp > now;
          });
      });
  };

  /* Revoke (delete) an unused invite — student cancels an outstanding invite */
  window.AA.revokeInvite = function (code) {
    return db.collection('invites').doc(code).delete()
      .then(function () { console.log('[AA] Invite revoked:', code); });
  };

  /* Redeem an invite code.
     - Looks up the code in Firestore
     - Validates: exists, unused, not expired
     - Marks invite as used
     - Adds invitee to student's supportNetwork map
     - Updates invitee's own user doc role to match the invite role
     Returns Promise<{ studentUid, role, studentName }>               */
  window.AA.redeemInvite = function (code) {
    var user = auth.currentUser;
    if (!user) return Promise.reject(new Error('Must be signed in to redeem an invite'));

    code = code.trim().toUpperCase();
    var inviteRef = db.collection('invites').doc(code);

    return inviteRef.get().then(function (doc) {
      if (!doc.exists) throw new Error('Invite code not found. Check the code and try again.');

      var inv = doc.data();
      if (inv.used) throw new Error('This invite has already been used.');

      var exp = inv.expiresAt && inv.expiresAt.toDate
        ? inv.expiresAt.toDate() : new Date(inv.expiresAt);
      if (exp < new Date()) throw new Error('This invite has expired. Ask your student to send a new one.');

      if (inv.studentUid === user.uid) throw new Error('You cannot redeem your own invite.');

      /* Mark invite used */
      return inviteRef.update({
        used:   true,
        usedAt: firebase.firestore.FieldValue.serverTimestamp(),
        usedBy: user.uid
      })
      .then(function () {
        /* Add invitee to student's supportNetwork */
        var networkUpdate = {};
        networkUpdate['supportNetwork.' + user.uid] = inv.role;
        return db.collection('users').doc(inv.studentUid).update(networkUpdate);
      })
      .then(function () {
        /* Only update invitee's global role if they are still 'pending'
           (brand-new user going through onboarding). If they already have a
           real role (student, family, etc.) leave it alone — they just get
           added to the network. This lets e.g. Amanda (student) be in Mary's
           supportNetwork as 'nearby-help' without losing her student role.
           Fixed 2026-02-26 by Claude */
        return db.collection('users').doc(user.uid).get().then(function (userDoc) {
          var currentRole = userDoc.exists ? (userDoc.data().role || 'pending') : 'pending';
          if (currentRole === 'pending') {
            return db.collection('users').doc(user.uid).update({ role: inv.role });
          }
          /* Already has a role — network link is enough, no global role change */
          return Promise.resolve();
        });
      })
      .then(function () {
        console.log('[AA] Invite redeemed:', code, '→ network role:', inv.role, 'for', inv.studentUid);
        // Claude: compliance — notify student when someone joins their network (FERPA)
        // Write to /users/{studentUid}/notifications/{auto-id}
        var displayName = user.displayName || user.email || 'Someone';
        db.collection('users').doc(inv.studentUid)
          .collection('notifications').add({
            type: 'network_join',
            message: displayName + ' joined your support network as ' + inv.role + '.',
            joinedUid: user.uid,
            role: inv.role,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
          }).catch(function(err) {
            console.warn('[AA] Failed to write network_join notification:', err);
          });
        return { studentUid: inv.studentUid, role: inv.role, studentName: inv.studentName };
      });
    });
  };

  /* ── Student Profile helpers ─────────────────────────────────
     studentProfile lives on the student's user doc:
       conditions:     string[]  — condition tags (e.g. 'concussion')
       notes:          string    — freeform context for the support network
       activeModules:  map       — which app modules are active for this student
       checkinPrompts: string[]  — custom daily check-in questions
       updatedAt, updatedBy, updatedByName — audit trail
     Write access: student or backstage-manager (via owner/admin rule),
     OR network-lead (via narrow Firestore rule added 2026-02-26).
     Added 2026-02-26 by Claude.
  ─────────────────────────────────────────────────────────── */

  window.AA.saveStudentProfile = function (studentUid, profile) {
    var user = auth.currentUser;
    if (!user) return Promise.reject(new Error('Must be signed in'));
    return db.collection('users').doc(studentUid).update({
      studentProfile: Object.assign({}, profile, {
        updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy:     user.uid,
        updatedByName: user.displayName || user.email || 'Unknown'
      })
    });
  };

  window.AA.getStudentProfile = function (studentUid) {
    return db.collection('users').doc(studentUid).get()
      .then(function (doc) {
        return doc.exists ? (doc.data().studentProfile || {}) : {};
      });
  };

  window.AA.watchStudentProfile = function (studentUid, callback) {
    return db.collection('users').doc(studentUid)
      .onSnapshot(function (doc) {
        callback(doc.exists ? (doc.data().studentProfile || {}) : {});
      }, function (err) {
        console.error('[AA] watchStudentProfile error:', err);
      });
  };

  /* ── Claude: BUG #2 FIX — Check if current user is network-lead for a student ──
     Network Lead role grants admin control (edit profile, toggle components, manage templates)
     but ONLY for the student they are assigned to.
     Returns true if currentUser is assigned as network-lead for the given student. ──────── */
  window.AA.isNetworkLeadFor = function (studentUid) {
    var user = auth.currentUser;
    if (!user) return Promise.resolve(false); /* Claude 2026-03-08: was returning bare boolean, crashing .then() callers */
    return db.collection('users').doc(studentUid).get()
      .then(function (doc) {
        if (!doc.exists) return false;
        var network = doc.data().supportNetwork || {};
        return network[user.uid] === 'network-lead';
      })
      .catch(function () { return false; });
  };

  /* ── Claude: BUG #2 FIX — Check if current user can edit student profile ──
     Allowed if: backstage-manager OR network-lead for that student.
     Used in user-tiers.html to gate edit/save buttons. ──────── */
  window.AA.canEditStudentProfile = function (studentUid) {
    var user = auth.currentUser;
    if (!user) return Promise.resolve(false);
    if (window.AA.isAdmin()) return Promise.resolve(true); // backstage-manager
    // Check if network-lead for this student
    return window.AA.isNetworkLeadFor(studentUid);
  };

  /* ── 24-hour network-lead timer ──────────────────────────────
     On every sign-in, check if the student's supportNetwork has
     a 'network-lead' slot filled. If not and createdAt > 24 hours ago,
     add the student as their own network-lead (self-lead state).
     Also fires after revocation — same 24-hour grace period applies.
     Added 2026-02-26 by Claude.
     Updated 2026-02-26 by Claude — renamed 'admin' tier → 'network-lead'.
  ─────────────────────────────────────────────────────────── */
  function _check24HourAdminTimer(uid, data) {
    /* Only applies to students */
    if (data.role !== 'student') return;

    /* Check if any supportNetwork member holds the 'network-lead' tier */
    var network = data.supportNetwork || {};
    var hasAdmin = Object.keys(network).some(function (memberUid) {
      return network[memberUid] === 'network-lead';
    });
    if (hasAdmin) return; /* network-lead slot is filled — nothing to do */

    /* No admin assigned — check how long it's been */
    var createdAt = data.createdAt && data.createdAt.toDate
      ? data.createdAt.toDate()
      : (data.createdAt ? new Date(data.createdAt) : null);

    /* Also check adminRevokedAt (set when student revokes their network-lead) */
    var timerStart = data.adminRevokedAt && data.adminRevokedAt.toDate
      ? data.adminRevokedAt.toDate()
      : createdAt;

    if (!timerStart) return; /* can't determine age — skip */

    var hoursElapsed = (Date.now() - timerStart.getTime()) / 3600000;
    if (hoursElapsed < 24) {
      console.log('[AA] Admin timer: ' + Math.round(24 - hoursElapsed) + 'h remaining before self-admin');
      return;
    }

    /* 24 hours passed — assign student as their own network-lead */
    console.log('[AA] 24h timer expired — assigning self network-lead for', uid);
    var selfAdminUpdate = {};
    selfAdminUpdate['supportNetwork.' + uid] = 'network-lead';
    db.collection('users').doc(uid).update(selfAdminUpdate)
      .then(function () { console.log('[AA] Self network-lead assigned for', uid); })
      .catch(function (err) { console.warn('[AA] Self network-lead assign failed:', err); });
  }

  /* ── Spoon Plan ──────────────────────────────────────────────
     Saves/loads the daily spoon plan so it's available on any
     device or browser the student signs into.
     Collection: spoonPlans/{uid}
     Schema: { tasks[], dailySpoons, yesterdayTasks[], updatedAt }
     Added 2026-02-26 by Claude.
  ─────────────────────────────────────────────────────────── */
  window.AA.saveSpoonPlan = function (uid, data) {
    return db.collection('spoonPlans').doc(uid).set(
      Object.assign({}, data, {
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }),
      { merge: true }
    );
  };

  window.AA.getSpoonPlan = function (uid) {
    return db.collection('spoonPlans').doc(uid).get()
      .then(function (doc) { return doc.exists ? doc.data() : null; });
  };

  window.AA.watchSpoonPlan = function (uid, callback) {
    return db.collection('spoonPlans').doc(uid)
      .onSnapshot(function (doc) {
        callback(doc.exists ? doc.data() : null);
      }, function (err) {
        console.error('[AA] watchSpoonPlan error:', err);
      });
  };

  /* ── Spoon Plan Suggestions ─────────────────────────────────────────────
     Support members (network-lead, family, support) can SUGGEST a plan
     for a student, but the student is sudo — they must accept or reject.
     Collection: spoonPlanSuggestions/{studentUid}/pending/{autoId}
     Schema: { tasks[], dailySpoons, reason, suggestedBy, suggestedByName,
               suggestedByRole, createdAt, status: 'pending' }
     Added 2026-03-08 by Claude.
  ─────────────────────────────────────────────────────────────────────── */
  window.AA.suggestSpoonPlan = function (studentUid, data) {
    var user = auth.currentUser;
    if (!user) return Promise.reject(new Error('Not signed in'));
    // Claude: 2026-03-08 — audit log: suggestion created
    window.AA.logAccess('suggest', studentUid, 'spoonPlan', {
      detail: 'Suggested a spoon plan (' + (data.tasks || []).length + ' tasks)',
      mirrorOf: studentUid
    });
    return db.collection('spoonPlanSuggestions').doc(studentUid)
      .collection('pending').add(Object.assign({}, data, {
        suggestedBy: user.uid,
        suggestedByName: user.displayName || user.email || 'Support',
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
  };

  window.AA.getPendingSuggestions = function (uid) {
    return db.collection('spoonPlanSuggestions').doc(uid)
      .collection('pending')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function (snap) {
        var results = [];
        snap.forEach(function (doc) {
          results.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return results;
      });
  };

  window.AA.acceptSuggestion = function (uid, suggestionId) {
    var ref = db.collection('spoonPlanSuggestions').doc(uid)
      .collection('pending').doc(suggestionId);
    return ref.get().then(function (doc) {
      if (!doc.exists) return Promise.reject(new Error('Suggestion not found'));
      var data = doc.data();
      // Claude: 2026-03-08 — audit log: student accepted a plan suggestion
      window.AA.logAccess('accept', uid, 'spoonPlan', {
        detail: 'Accepted spoon plan suggestion from ' + (data.suggestedByName || 'supporter')
      });
      // Apply the suggested plan to the student's real spoonPlans doc
      return window.AA.saveSpoonPlan(uid, {
        tasks: data.tasks || [],
        dailySpoons: data.dailySpoons || 10
      }).then(function () {
        return ref.update({ status: 'accepted', respondedAt: firebase.firestore.FieldValue.serverTimestamp() });
      });
    });
  };

  window.AA.rejectSuggestion = function (uid, suggestionId) {
    // Claude: 2026-03-08 — audit log: student rejected a plan suggestion
    window.AA.logAccess('reject', uid, 'spoonPlan', {
      detail: 'Rejected spoon plan suggestion'
    });
    return db.collection('spoonPlanSuggestions').doc(uid)
      .collection('pending').doc(suggestionId)
      .update({ status: 'rejected', respondedAt: firebase.firestore.FieldValue.serverTimestamp() });
  };

  /* ── Mode Suggestions (Nope / Semi-Nope) ────────────────────────────────
     Supporters suggest a mode change; student sees a flash notification
     and accepts or dismisses. Student is always sudo.
     Collection: modeSuggestions/{studentUid}/pending/{autoId}
     Schema: { mode, semiVisible, suggestedBy, suggestedByName, createdAt, status }
     Added 2026-03-08 by Claude.
  ─────────────────────────────────────────────────────────────────────── */
  window.AA.suggestMode = function (studentUid, mode, semiVisible) {
    var user = auth.currentUser;
    if (!user) return Promise.reject(new Error('Not signed in'));
    // Claude: 2026-03-08 — audit log: mode suggestion created
    var modeLabel = mode === 'nope' ? 'Nope Mode' : mode === 'semi-nope' ? 'Semi-Nope' : 'Cancel Nope';
    window.AA.logAccess('suggest', studentUid, 'nope', {
      detail: 'Suggested ' + modeLabel,
      mirrorOf: studentUid
    });
    return db.collection('modeSuggestions').doc(studentUid)
      .collection('pending').add({
        mode: mode,
        semiVisible: semiVisible || {},
        suggestedBy: user.uid,
        suggestedByName: user.displayName || user.email || 'Support',
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  window.AA.getPendingModeSuggestions = function (uid) {
    return db.collection('modeSuggestions').doc(uid)
      .collection('pending')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function (snap) {
        var results = [];
        snap.forEach(function (doc) { results.push(Object.assign({ id: doc.id }, doc.data())); });
        return results;
      });
  };

  window.AA.respondModeSuggestion = function (uid, suggestionId, accepted) {
    // Claude: 2026-03-08 — audit log: student responded to mode suggestion
    window.AA.logAccess(accepted ? 'accept' : 'reject', uid, 'nope', {
      detail: accepted ? 'Accepted mode suggestion' : 'Dismissed mode suggestion'
    });
    return db.collection('modeSuggestions').doc(uid)
      .collection('pending').doc(suggestionId)
      .update({ status: accepted ? 'accepted' : 'dismissed', respondedAt: firebase.firestore.FieldValue.serverTimestamp() });
  };

  /* ── Meal Suggestions ──────────────────────────────────────────────────
     Supporters suggest meals (not logged as actual meals). Student accepts
     to add them to their meal log. No reason required.
     Collection: mealSuggestions/{studentUid}/pending/{autoId}
     Schema: { meals[], dateKey, suggestedBy, suggestedByName, createdAt, status }
     Added 2026-03-08 by Claude.
  ─────────────────────────────────────────────────────────────────────── */
  window.AA.suggestMeals = function (studentUid, dateKey, meals) {
    var user = auth.currentUser;
    if (!user) return Promise.reject(new Error('Not signed in'));
    // Claude: 2026-03-08 — audit log: meal suggestion created
    window.AA.logAccess('suggest', studentUid, 'mealPlan', {
      detail: 'Suggested ' + meals.length + ' meal(s) for ' + dateKey,
      mirrorOf: studentUid
    });
    return db.collection('mealSuggestions').doc(studentUid)
      .collection('pending').add({
        meals: meals,
        dateKey: dateKey,
        suggestedBy: user.uid,
        suggestedByName: user.displayName || user.email || 'Support',
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  window.AA.getPendingMealSuggestions = function (uid) {
    return db.collection('mealSuggestions').doc(uid)
      .collection('pending')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function (snap) {
        var results = [];
        snap.forEach(function (doc) { results.push(Object.assign({ id: doc.id }, doc.data())); });
        return results;
      });
  };

  window.AA.respondMealSuggestion = function (uid, suggestionId, accepted) {
    // Claude: 2026-03-08 — audit log: student responded to meal suggestion
    window.AA.logAccess(accepted ? 'accept' : 'reject', uid, 'mealPlan', {
      detail: accepted ? 'Accepted meal suggestion' : 'Dismissed meal suggestion'
    });
    return db.collection('mealSuggestions').doc(uid)
      .collection('pending').doc(suggestionId)
      .update({ status: accepted ? 'accepted' : 'dismissed', respondedAt: firebase.firestore.FieldValue.serverTimestamp() });
  };

  /* ── Supporter Notifications — Claude 2026-03-12 ──────────────────────
     Active alerting system. When something important happens (red/yellow flag,
     nope activated, missed check-in), a notification is written under the
     STUDENT's doc: notifications/{studentUid}/entries/{autoId}
     Supporters read from their students' collections.
     Schema: { type, message, studentName, createdAt, read }
     Types: 'red_flag', 'yellow_flag', 'nope_activated', 'nope_canceled',
            'semi_nope_started', 'checkin_completed'
  ─────────────────────────────────────────────────────────────────────── */

  /**
   * Write a notification for all supporters in a student's network.
   * Stored under the student's UID so supporters can query by student.
   */
  window.AA.addNotification = function (studentUid, type, message) {
    var user = auth.currentUser;
    var studentName = (user && user.displayName) || 'Student';
    return db.collection('notifications').doc(studentUid)
      .collection('entries').add({
        type: type,
        message: message,
        studentUid: studentUid,
        studentName: studentName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      });
  };

  /**
   * Get unread notifications for a specific student (supporters call this).
   * Returns newest first, limit 20.
   */
  window.AA.getUnreadNotifications = function (studentUid) {
    return db.collection('notifications').doc(studentUid)
      .collection('entries')
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
      .then(function (snap) {
        var results = [];
        snap.forEach(function (doc) { results.push(Object.assign({ id: doc.id }, doc.data())); });
        return results;
      });
  };

  /**
   * Real-time listener for notifications on a student.
   * Returns unsubscribe function.
   */
  window.AA.watchNotifications = function (studentUid, callback) {
    return db.collection('notifications').doc(studentUid)
      .collection('entries')
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot(function (snap) {
        var results = [];
        snap.forEach(function (doc) { results.push(Object.assign({ id: doc.id }, doc.data())); });
        callback(results);
      }, function (err) {
        console.warn('[AA] watchNotifications error:', err.message);
        callback([]);
      });
  };

  /**
   * Mark a notification as read.
   */
  window.AA.markNotificationRead = function (studentUid, notifId) {
    return db.collection('notifications').doc(studentUid)
      .collection('entries').doc(notifId)
      .update({ read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() });
  };

  /**
   * Mark ALL notifications for a student as read (batch).
   */
  window.AA.markAllNotificationsRead = function (studentUid) {
    return db.collection('notifications').doc(studentUid)
      .collection('entries')
      .where('read', '==', false)
      .get()
      .then(function (snap) {
        var batch = db.batch();
        snap.forEach(function (doc) {
          batch.update(doc.ref, { read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() });
        });
        return batch.commit();
      });
  };

  /* ── Audit Log — FERPA/HIPAA compliance, logs PHI access ────────────────
     Path: /auditLog/{targetUid}/entries/{logId}
     Restructured 2026-03-03 for student visibility (FERPA: students can read
     their own audit trail to see who accessed their data).
     Reworked 2026-03-08 by Claude — fixed role race condition, added mirror
     context, richer action types (suggest, accept, reject, mode-change),
     and optional detail field for human-readable context.
  ─────────────────────────────────────────────────────────────────────── */

  // Claude: 2026-03-08 — role cache: resolved once per session, used by all entries
  var _roleResolved = false;
  var _rolePromise  = null;

  /**
   * Ensure we have the actor's role before writing audit entries.
   * If shared-header already set _currentRole, use it immediately.
   * Otherwise, fetch it from Firestore (one-time) so we never write "unknown".
   */
  function _ensureRole(user) {
    if (window.AA._currentRole && window.AA._currentRole !== 'pending') {
      return Promise.resolve(window.AA._currentRole);
    }
    if (_rolePromise) return _rolePromise;
    _rolePromise = db.collection('users').doc(user.uid).get()
      .then(function(doc) {
        var role = doc.exists ? (doc.data().role || 'student') : 'student';
        window.AA._currentRole = role;
        _roleResolved = true;
        return role;
      })
      .catch(function() { return 'unknown'; });
    return _rolePromise;
  }

  // Claude: 2026-03-08 — queue for entries that arrive before auth is ready
  var _auditQueue = [];

  /**
   * Write a single audit entry. Waits for role resolution first.
   * @param {Object} user         - Firebase auth user
   * @param {string} targetUid    - Student whose data was accessed
   * @param {string} action       - read | write | suggest | accept | reject | mode-change | mirror-view
   * @param {string} dataType     - checkin | mealLog | mealPlan | spoonPlan | nope | audioNote | etc.
   * @param {Object} [meta]       - Optional extra context
   * @param {string} [meta.detail]      - Human-readable detail ("Suggested Nope mode")
   * @param {string} [meta.mirrorOf]    - Student UID being mirrored (if applicable)
   * @param {string} [meta.mirrorName]  - Student display name being mirrored
   */
  function _writeAuditEntry(user, targetUid, action, dataType, meta) {
    meta = meta || {};
    _ensureRole(user).then(function(role) {
      var entry = {
        actorUid:   user.uid,
        actorEmail: user.email || '',
        actorRole:  role,
        targetUid:  targetUid,
        dataType:   dataType,
        action:     action,
        timestamp:  firebase.firestore.FieldValue.serverTimestamp()
      };
      // Claude: 2026-03-08 — optional rich fields
      if (meta.detail)     entry.detail     = meta.detail;
      if (meta.mirrorOf)   entry.mirrorOf   = meta.mirrorOf;
      if (meta.mirrorName) entry.mirrorName = meta.mirrorName;

      db.collection('auditLog').doc(targetUid)
        .collection('entries').add(entry)
        .catch(function(err) {
          console.warn('[AA] auditLog write failed:', err.code, err.message);
        });
    });
  }

  // Claude: 2026-03-08 — flush the queue once auth is confirmed (now waits for role too)
  auth.onAuthStateChanged(function(user) {
    if (!user || !_auditQueue.length) return;
    _ensureRole(user).then(function() {
      var queued = _auditQueue.splice(0);
      queued.forEach(function(entry) {
        _writeAuditEntry(user, entry.targetUid, entry.action, entry.dataType, entry.meta);
      });
    });
  });

  /**
   * Public API: log a data access event.
   * @param {string} action     - read | write | suggest | accept | reject | mode-change | mirror-view
   * @param {string} targetUid  - Student whose data was accessed
   * @param {string} dataType   - Type of data accessed
   * @param {Object} [meta]     - Optional: { detail, mirrorOf, mirrorName }
   */
  window.AA.logAccess = function(action, targetUid, dataType, meta) {
    var user = auth.currentUser;
    if (!user) {
      _auditQueue.push({ action: action, targetUid: targetUid, dataType: dataType, meta: meta || {} });
      return;
    }
    _writeAuditEntry(user, targetUid, action, dataType, meta);
  };

  /* Get the last 100 audit log entries for a given student (FERPA audit viewer)
     Claude: 2026-03-08 — bumped from 50 to 100 for better audit coverage */
  window.AA.getAuditLog = function(targetUid) {
    return db.collection('auditLog').doc(targetUid)
      .collection('entries')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get()
      .then(function(snap) {
        return snap.docs.map(function(doc) { return Object.assign({id: doc.id}, doc.data()); });
      });
  };

  console.log('[AA] Firebase ready — project:', FIREBASE_CONFIG.projectId);
})();
