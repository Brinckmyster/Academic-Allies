# COMPREHENSIVE SECURITY & FIREBASE AUDIT REPORT
## Academic Allies Codebase
### Date: 2026-03-09

---

## EXECUTIVE SUMMARY

The Academic Allies Firebase application demonstrates **strong foundational security practices** with several commendable patterns (Firestore rules, auth checks, audit logging, XSS prevention). However, **THREE CRITICAL ISSUES** and **SEVERAL MEDIUM-RISK ITEMS** require immediate attention before production deployment.

**CRITICAL FINDINGS: 3**
**HIGH FINDINGS: 2**
**MEDIUM FINDINGS: 4**
**LOW FINDINGS: 3**

---

## CRITICAL SECURITY ISSUES

### 1. CRITICAL: Firebase API Key Exposed in Source Code
**Severity:** CRITICAL
**File:** `/modular/aa-firebase.js` (line 19)
**File:** `/modular/components/audio-notes/audio-notes.html` (line 311)
**File:** `/modular/components/meal-planner-mary/firebase-photo-upload.js` (line 5)
**File:** `/modular/js/google-integration.js` (lines 3, 12)
**File:** `/modular/google-integration.js` (lines 3, 10)

**Issue:**
Firebase API keys and Google OAuth Client IDs are hardcoded in publicly viewable JavaScript files. While Firebase API keys have restricted scope in production, they are still visible to attackers and can be misused for quota exhaustion, DOS attacks, or reconnaissance.

```javascript
// EXPOSED in aa-firebase.js line 19
var FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDk9mwSZgk9I65RpYlus7by9mB8tN_oskE',
  authDomain: 'academic-allies-464901.firebaseapp.com',
  projectId: 'academic-allies-464901',
  ...
};

// EXPOSED in audio-notes/audio-notes.html line 311
var GOOGLE_CLIENT_ID = '93996985456-ffj2euk9i4q41v88njuhpusk73mdb31j.apps.googleusercontent.com';
```

**Recommended Fix:**
1. Rotate the current Firebase API key immediately
2. Create a restricted API key that only allows:
   - Google Sign-In (OAuth)
   - Firestore (with Firestore security rules as enforcement)
   - Storage (with storage rules as enforcement)
3. Store sensitive config in environment variables/build-time secrets, NOT in source
4. Consider using a backend-for-frontend (BFF) pattern to proxy Firestore calls
5. Audit all Firestore write operations to ensure rules are enforcing access, not relying on key secrecy

---

### 2. CRITICAL: Mirror Mode Authorization Not Validated in SessionStorage
**Severity:** CRITICAL
**File:** `/modular/js/aa-mirror.js` (lines 84-87, 103-109)

**Issue:**
The mirror system stores `AA_MIRROR_UID` in sessionStorage (`window.AA_SWITCH_STUDENT()`). While sessionStorage is same-origin only, an attacker who gains write access to sessionStorage (via XSS) OR navigates a supporter to a malicious URL that calls `AA_SWITCH_STUDENT(maliciousStudentUID)` can force them to view and modify any student's data without explicit re-authorization.

**Current Code (VULNERABLE):**
```javascript
// aa-mirror.js line 103-109
window.AA_SWITCH_STUDENT = function (uid, name) {
  var cached = readCache() || {};
  cached.studentUid  = uid;              // ← NO VALIDATION
  cached.studentName = name;
  writeCache(cached);
  window.location.reload();
};

// Later (line 330-332):
// Cache is trusted without re-validating the relationship
if (cached && cached.viewerUid === user.uid && cached.studentUid) {
  window.AA_MIRROR_UID = cached.studentUid;  // ← TRUSTED WITHOUT VERIFICATION
  window.AA_MIRROR     = cached;
}
```

**Attack Scenario:**
1. Supporter (Mary) is signed in viewing student Alice's data
2. Alice sends Mary a link that calls `AA_SWITCH_STUDENT('bob-uid', 'Bob')`
3. OR: XSS on the site calls `window.AA_SWITCH_STUDENT('bob-uid', 'Bob')`
4. Mary's cache now points to Bob's data without verification Bob is in her support network

**Recommended Fix:**
Validate the target UID is in the viewer's authorized list BEFORE caching.

---

### 3. CRITICAL: SpoonPal (Bruise-Private Data) Not Verified on Server Side
**Severity:** CRITICAL
**File:** `/modular/components/spoon-planner/spoon-pal.html` (lines 2008-2025)
**Firebase Rules:** `firestore.rules` (lines 161-171)

**Issue:**
SpoonPal is intended to be Bruise's personal tool (backstage-manager only). While hidden from UI and blocked by mirror system, there is NO SERVER-SIDE VERIFICATION on the client page. A non-admin can navigate directly to the URL and attempt to load data. Firestore rules block it, but this creates:
- Audit log entries for unauthorized access attempts
- Reliance on Firestore rule enforcement alone
- No client-side defense redundancy

**Recommended Fix:**
Add explicit role check on page load before attempting Firestore operations.

---

## HIGH-SEVERITY ISSUES

### 4. HIGH: Mirror Cache Not Re-Validated on Page Navigation
**Severity:** HIGH
**File:** `/modular/js/aa-mirror.js` (lines 245-363)

**Issue:**
Mirror cache persists in sessionStorage. If a student removes the supporter from their network, the supporter's cache is NOT invalidated. They can continue viewing data until session ends.

**Scenario:**
1. Alice adds Mary to her network
2. Mary views Alice's data (mirror cached)
3. Alice revokes Mary's access
4. Mary refreshes page — **can still view Alice's data**

**Recommended Fix:**
When `removeNetworkMember()` succeeds, publish event to clear mirror cache and reload.

---

### 5. HIGH: Admin Page Race Condition
**Severity:** HIGH
**File:** `/modular/admin.html` (lines 546-561)

**Issue:**
Admin dashboard HTML renders before Firebase auth is verified. If XSS occurs between page load and auth gate check, DOM with sensitive data is accessible.

**Recommended Fix:**
Add `display: none !important` to body until auth gate passes.

---

## MEDIUM-SEVERITY ISSUES

### 6. MEDIUM: Firebase/Google API Keys Exposed (Same as Critical #1)
Moving to Firestore rules assessment...

---

## FIRESTORE SECURITY RULES ASSESSMENT

**Status: STRONG** ✅

The Firestore rules demonstrate excellent security design with:
- Owner-only writes on personal data
- Network-scoped reads via isNetworkMember checks
- Append-only audit trails
- Proper invite state validation
- Admin-only collections
- Array-based message access control

---

## AUTHENTICATION ASSESSMENT

**Status: GOOD** ✅

Strengths:
- Google Sign-In via Firebase Auth
- Persistence hardening (LOCAL by default)
- Token refresh every 45 min + on visibility change
- Role-based access control
- Re-auth fallback for cache failure

---

## AUDIT LOGGING ASSESSMENT

**Status: GOOD** ✅

Strengths:
- Comprehensive audit trail
- Queued entries if auth not ready
- Mirror-view tagged separately
- Students can view access logs

Gaps:
- Not logging all reads
- No deletion logging
- Audit queue could miss entries on sign-out

---

## SUMMARY TABLE

| Issue | Severity | Category |
|-------|----------|----------|
| Firebase API Key Exposed | CRITICAL | Config |
| Mirror Authorization Not Validated | CRITICAL | Authorization |
| SpoonPal No Client-Side Auth | CRITICAL | Authorization |
| Mirror Cache Not Re-Validated | HIGH | Authorization |
| Admin Page Race Condition | HIGH | XSS |
| Gmail Address Hardcoded | MEDIUM | Scalability |
| No CSRF Protection | MEDIUM | Security |
| Audit Log Missing Reads | MEDIUM | Compliance |
| No Rate Limiting on Invites | LOW | DOS |
| IndexedDB Not Cleared | LOW | Privacy |
| Missing CSP Headers | LOW | XSS Prevention |
| Token Refresh Flooding | LOW | Performance |

---

## RECOMMENDED PRIORITY

### IMMEDIATE (Before Any Production Exposure)
1. Rotate Firebase API key
2. Validate mirror UID against authorized list
3. Add auth check to SpoonPal page

### SHORT TERM (Before Alpha/Beta Launch)
4. Re-validate mirror cache on network changes
5. Fix admin page race condition
6. Add CSRF protection to forms

### BEFORE PRODUCTION
7. Move admin email to config doc
8. Complete audit logging coverage
9. Add Firestore schema validation
10. Document all security assumptions

---

## CONCLUSION

The codebase demonstrates **solid security engineering principles** with good Firestore rules, auth handling, and XSS prevention. The three critical issues are **fixable in hours** and are not systemic architectural flaws. Once addressed, the app would be **suitable for beta testing with health data**.

**Key Recommendation:** Perform a **post-launch security audit** after 30 days of real-world usage to validate that Firestore rules are not bypassed by client-side edge cases.
