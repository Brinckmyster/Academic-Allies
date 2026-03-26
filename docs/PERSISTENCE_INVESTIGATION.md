# Academic Allies Sign-In Persistence Investigation Report
## 2026-03-16 — Deep Code Flow Analysis

### EXECUTIVE SUMMARY
The sign-in persistence system is **structurally sound** but there is a **critical timing issue** lurking in the interaction between Firebase persistence type-setting and session restoration. The code shows evidence of multiple previous fixes for this exact problem (see archive history), suggesting this is a recurrent fragile area.

---

## 1. PERSISTENCE INITIALIZATION FLOW (aa-firebase.js, lines 58-112)

### Current Logic:
```
Lines 64-70:  _stampPersistPref()
   - On FIRST ever load (no localStorage.AA_KEEP_SIGNED_IN):
     → Sets localStorage.AA_KEEP_SIGNED_IN = 'true'
     → Mirror to sessionStorage.AA_KEEP_SIGNED_IN_SS = 'true'
   - On EVERY load: copies LS value to SS as same-tab backup

Lines 73-75:  _keepSignedIn variable
   - Resolves preference: LS || SS fallback, defaults to true
   - Means: if LS is missing but SS exists, use SS value
   - This survives a localStorage wipe within same tab

Lines 77-87:  _typeReady promise
   CRITICAL LOGIC:
   - IF _keepSignedIn === true (LOCAL persistence):
     → Promise.resolve() — NO setPersistence call
     → Rationale: LOCAL is Firebase default; calling it redundantly 
       interferes with IndexedDB session restoration
   
   - IF _keepSignedIn === false (SESSION persistence):
     → auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
     → This MUST complete before session restoration starts

Lines 89-112: _persistenceReady promise chain
   - Waits for _typeReady to complete
   - Then subscribes to onAuthStateChanged ONCE
   - Unsubscribes immediately and resolves with the user object
   - This is the signal that session restoration is done
   - Exposed as window.AA._persistenceReady
```

### CRITICAL COMMENTS IN CODE (Line 77-80):
```javascript
/* Only call setPersistence when the user opted into SESSION (non-default).
   LOCAL is Firebase's default — calling setPersistence(LOCAL) redundantly
   interferes with the in-flight session restoration from IndexedDB, causing
   onAuthStateChanged to fire with null and never deliver the restored user. */
```

**Key insight**: Calling `setPersistence(LOCAL)` is actively harmful to session restoration. 
This explains why the code avoids it on the LOCAL path.

---

## 2. SIGN-IN BUTTON CLICK FLOW (shared-header.html, lines 231-248)

### Handler:
```javascript
Line 232:  _doSignIn(hint) function
  ├─ Lines 234-235: Disable button, show "Signing in..."
  └─ Line 237: window.AA.signInWithGoogle(hint) — calls aa-firebase.js

Lines 246-248: Sign-in click listener
  └─ Calls _doSignIn() with no hint parameter
```

### Critical Issue: setPersistence is called IN THE SIGN-IN FUNCTION

aa-firebase.js, lines 165-214 (`window.AA.signInWithGoogle`):
```javascript
Line 168-170: Re-read preference at sign-in time
   var keepPref = (localStorage.getItem('AA_KEEP_SIGNED_IN') 
                   || sessionStorage.getItem('AA_KEEP_SIGNED_IN_SS')) !== 'false';

Line 171-173: Convert to persistence type
   var pType = keepPref 
     ? firebase.auth.Auth.Persistence.LOCAL
     : firebase.auth.Auth.Persistence.SESSION;

Line 174: ⚠️ CRITICAL CALL ⚠️
   return auth.setPersistence(pType).then(function () {
   return auth.signInWithPopup(googleProvider)

   This setPersistence MUST complete BEFORE the popup/redirect starts.
   If it completes AFTER, the persistence setting won't take effect on THIS sign-in.
```

**Issue Found**: The code correctly calls `setPersistence()` BEFORE `signInWithPopup()`, 
chaining them with `.then()`. This follows Firebase best practices. **This part is correct.**

---

## 3. RETURN VISIT FLOW (shared-header.html, lines 520-741)

### Scenario: Browser closes, tab reopens

**Step 1: aa-firebase.js loads (lines 64-112)**
- Checks localStorage.AA_KEEP_SIGNED_IN
- If true: skips setPersistence call (relies on default LOCAL)
- If false: calls setPersistence(SESSION)
- Creates _persistenceReady promise that resolves when first onAuthStateChanged fires

**Step 2: shared-header.html waits for persistence (lines 739-744)**
```javascript
if (window.AA._persistenceReady) {
  window.AA._persistenceReady.then(_setupAuthListener)
                             .catch(_setupAuthListener);
}
```

**Step 3: _setupAuthListener registers listener (lines 526-737)**
```javascript
window.AA.auth.onAuthStateChanged(function (user) {
  if (!user) {
    // Try silent re-auth via GIS (lines 529-613)
    // Then show sign-in button
  } else {
    // Show signed-in UI
  }
});
```

### The Hidden Race Condition:

If persistence restoration from IndexedDB is SLOW:
1. `_persistenceReady` resolves with null from the first onAuthStateChanged
2. `_setupAuthListener` registers a NEW listener
3. Meanwhile, IndexedDB has FINALLY restored the session
4. The new listener fires with the user
5. UI switches from sign-in → signed-in

But if the user perceives the sign-in button appearing briefly before disappearing,
or if they click sign-in while restoration is in-flight, there's a window of inconsistency.

---

## 4. "KEEP ME SIGNED IN" CHECKBOX FLOW (shared-header.html, lines 181-204)

### Current Implementation:
```javascript
Line 186-187: Read initial state from localStorage
   var stored = localStorage.getItem('AA_KEEP_SIGNED_IN');
   keepSignedInBox.checked = stored !== 'false';
   // Default: checked (LOCAL persistence)

Line 188-203: Change listener
   keepSignedInBox.addEventListener('change', function () {
     var val = keepSignedInBox.checked ? 'true' : 'false';
     localStorage.setItem('AA_KEEP_SIGNED_IN', val);
     sessionStorage.setItem('AA_KEEP_SIGNED_IN_SS', val);
     
     // LIVE persistence switch for current session
     if (window.AA && window.AA.auth) {
       var pType = keepSignedInBox.checked 
         ? firebase.auth.Auth.Persistence.LOCAL
         : firebase.auth.Auth.Persistence.SESSION;
       window.AA.auth.setPersistence(pType).then(...)
     }
   });
```

### Potential Issue: First-Visit Logic

On a truly first visit (no localStorage set):
- Line 66 (aa-firebase.js) stamps localStorage.AA_KEEP_SIGNED_IN = 'true'
- Line 187 (shared-header.html) sets checkbox.checked = true
- But the checkbox HTML (line 90) also has `checked` attribute

**Question**: Does setting `checked = true` on an already-checked element fire a 'change' event?
**Answer**: No. The change listener only fires if the DOM state actually changes.

**So on first visit**: 
- Preference is already set to LOCAL at line 66
- No change event fires
- No problem ✓

---

## 5. SESSION vs LOCAL PERSISTENCE EDGE CASES

### Timing Issue: setPersistence(SESSION) on Return Visit

In aa-firebase.js, lines 81-84:
```javascript
var _typeReady = _keepSignedIn
  ? Promise.resolve()
  : auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(function () { console.log('[AA] setPersistence(SESSION) resolved OK'); })
```

If `_keepSignedIn === false`:
- `setPersistence(SESSION)` is called immediately on page load
- If the user's session WAS being restored from IndexedDB, this call happens BEFORE restoration completes
- Per Firebase docs, calling setPersistence while a session restore is in-flight can disrupt it

**However**: If the user explicitly unchecked the box (keepPref === false), 
they WANT SESSION only, so this is intentional.

### Edge Case: localStorage Cleared Mid-Session

Line 69 (sessionStorage mirror):
```javascript
sessionStorage.setItem('AA_KEEP_SIGNED_IN_SS', localStorage.getItem('AA_KEEP_SIGNED_IN'));
```

If localStorage is wiped (e.g., by browser storage policy, user action, or bug):
- The mirror in sessionStorage keeps the preference alive for THIS tab
- But ONLY if it was mirrored at page load
- If localStorage is cleared AFTER page load but BEFORE the mirror is created, the mirror will have null

**This is actually fine**: The code falls back to the default (LOCAL) at line 74.

---

## 6. SERVICE WORKER IMPACT (sw.js)

### Current Strategy:
- Cache-first for own origin (AA domain)
- Pass-through for Firebase/CDN (lines 107-114)
- skipWaiting() + clients.claim() enabled (lines 78, 98)

### Could It Interfere With Auth?

**NO.** The service worker explicitly skips caching Firebase calls:
```javascript
Line 112: if (url.hostname.includes('googleapis.com')) return;
Line 113: if (url.hostname.includes('firebaseio.com'))  return;
Line 114: if (url.hostname.includes('firebasestorage')) return;
```

Auth tokens and IndexedDB restoration are cross-origin Firebase calls, so they bypass the cache.

The `skipWaiting()` and `clients.claim()` can cause disruptions (see comment lines 74-76), 
but they're necessary to fix mobile sign-in visibility issues.

---

## 7. SILENT RE-AUTH FLOW (shared-header.html, lines 528-613)

When auth resolves to null but user had Keep Signed In enabled:

1. **Line 533-534**: Fetch AA_LAST_USER from localStorage
2. **Line 535-536**: Check AA_KEEP_SIGNED_IN preference and AA_REAUTH_DONE flag
3. **Line 538**: If all conditions met (lastUser exists, pref is true, hasn't already tried, not intentional sign-out):
   - Set AA_REAUTH_DONE flag to '1'
   - Load Google Identity Services script
   - Call google.accounts.id.prompt() with auto_select: true
4. **Lines 589-594**: GIS returns credential or notifies no credential available
5. **Lines 601-609**: Fallback shows "Welcome back! Tap Sign In to continue"

### Potential Issue Here:

If GIS fails or times out, the fallback is shown. But there's no timeout on the GIS prompt itself.
If the prompt hangs, the user sees "Signing you back in..." indefinitely.

However, the AA_REAUTH_DONE flag (set at line 539) prevents infinite loops on the same page.

---

## 8. DOCUMENTED PERSISTENCE ISSUES (Archive History)

Multiple archive files suggest this has been debugged before:

- `aa-firebase-pre-redirect-20260304.js` comment: 
  "before checking auth state. Fixes sign-in not persisting across"

- `shared-header-pre-persist-20260304.html`
- `shared-header_2026-03-05_pre-persistfix.html`
- `shared-header_2026-03-06_pre-graceperiod.bak.html`

The fact that there are multiple dated revisions of persistence logic suggests 
this is a known fragile area with a history of regressions.

---

## 9. CRITICAL FINDINGS

### Finding 1: setPersistence(LOCAL) Avoidance is Correct
The code avoids calling setPersistence(LOCAL) because it interferes with IndexedDB restoration.
This is correct per Firebase compat SDK behavior.

### Finding 2: setPersistence Called BEFORE signInWithPopup
In signInWithGoogle (line 174), setPersistence is chained before the popup, which is correct.

### Finding 3: First-Load Grace Period Was Removed
Comment at line 739 mentions waiting for persistence, but there's no grace period timer.
The code relies entirely on _persistenceReady resolving before UI shows.

### Finding 4: No Timeout on Session Restoration
If IndexedDB restore hangs (corrupted DB, slow hardware), onAuthStateChanged might never fire.
There's no fallback timeout.

### Finding 5: Silent Re-Auth Can Hang
GIS prompt has no timeout. If it hangs, user sees "Signing you back in..." forever.

### Finding 6: The Checkbox Edge Case
If checkbox is unchecked while signed in (line 188-202), setPersistence(SESSION) is called.
This happens WHILE there's an active session, which is correct for "forget this device" UX.

---

## 10. MOST LIKELY CAUSES OF REPORTED ISSUE

### Scenario A: IndexedDB Corruption
- User has LOCAL persistence enabled
- IndexedDB was cleared (browser, storage policy, user action, browser bug)
- _persistenceReady resolves with null (no session to restore)
- _setupAuthListener shows sign-in button
- This is CORRECT behavior, but feels like "persistence failed"

**Diagnostic**: The code logs a warning at line 103-106 if this happens.

### Scenario B: GIS Silent Re-Auth Failure
- IndexedDB cleared, but AA_LAST_USER and AA_KEEP_SIGNED_IN are still in localStorage
- GIS script loads but fails (timeout, network, user dismissed prompt)
- Fallback shows sign-in button
- User thinks they were signed out, but welcome-back message should be shown

**Diagnostic**: Check browser console for GIS errors.

### Scenario C: Slow IndexedDB Restoration
- Session restore is in-flight
- User sees sign-in button briefly before it disappears
- Causes perception of "flicker"

**Diagnostic**: Would show up in console as a timing gap between onAuthStateChanged calls.

### Scenario D: SESSION Persistence Forced Unintentionally
- User unchecked "Keep me signed in" at some point
- localStorage.AA_KEEP_SIGNED_IN = 'false' is now set
- On return visit, auth.setPersistence(SESSION) is called
- Session doesn't survive browser close

**Diagnostic**: Check if localStorage.AA_KEEP_SIGNED_IN === 'false'.

---

## CODE LOCATIONS SUMMARY

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Pref stamping | aa-firebase.js | 64-70 | Initialize localStorage default |
| Preference resolve | aa-firebase.js | 73-75 | Read pref with fallback |
| setPersistence logic | aa-firebase.js | 77-87 | Type-setting based on pref |
| _persistenceReady | aa-firebase.js | 89-112 | Session restore signal |
| Sign-in function | aa-firebase.js | 165-214 | setPersistence BEFORE signInWithPopup |
| Sign-in button | shared-header.html | 82-86 | Button HTML |
| Sign-in handler | shared-header.html | 231-248 | Click → _doSignIn() |
| Checkbox listener | shared-header.html | 181-204 | Live persistence switch |
| Persistence wait | shared-header.html | 739-744 | Wait for _persistenceReady |
| Auth listener setup | shared-header.html | 526-737 | Main listener registration |
| Silent re-auth | shared-header.html | 528-613 | GIS fallback for null user |
| Service worker | sw.js | 107-114 | Firebase calls bypass cache |

---

## RECOMMENDED INVESTIGATION STEPS

1. **Check browser console logs** for '[AA]' messages on both first visit and return visit
2. **Check localStorage** for AA_KEEP_SIGNED_IN value (should be 'true' or 'false', not null)
3. **Check IndexedDB** `firebase` database for cached auth documents
4. **Monitor onAuthStateChanged timing** — how many times does it fire? In what order?
5. **Check if GIS script loads** — does Google Identity Services script appear in Network tab?
6. **Compare behavior** on fresh profile vs. existing profile
7. **Test on mobile** specifically — service worker changes (skipWaiting) affect mobile more

---

## CRITICAL OBSERVATION

The code has been extensively patched and refactored for persistence issues (evident from archive history).
The current implementation is careful and defensive, but may still have edge cases around:
- Timing of IndexedDB restoration
- Timing of GIS fallback prompt
- Timing of _persistenceReady resolution

All three of these are async and can race with each other or with user interactions.

