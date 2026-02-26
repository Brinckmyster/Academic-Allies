# Academic Allies — Student Network & Admin Architecture
<!-- Claude: Written 2026-02-26 from confirmed user CoT. Do not modify without explicit user confirmation. -->

**Written:** February 2026
**Source:** User design session (Cowork) — confirmed decisions only
**Purpose:** Load-bearing spec for Amanda sudo build, Play Store onboarding, and student self-management

---

## Core Principle

> **The student is always in control of their own network. Always.**

No admin — platform or personal — can override a student's final say over their own data, their own network, or their own mode (including Bad Brain Day exit).

---

## 1. Role Hierarchy

Two separate admin concepts exist. Do not conflate them.

| Role | Scope | Who holds it |
|------|-------|-------------|
| **Platform admin** | App-wide (all students, all data) | `brinckmyster@gmail.com` (hardcoded in `ADMIN_EMAILS`) |
| **Student admin** | One student's network only | The person the student designates — or the student themselves |
| **Student** | Their own data only | Anyone who signs up directly (Play Store download) |
| **Family** | Read + limited interaction | Invited by student with this role |
| **Support** | Read + limited interaction | Invited by student with this role |
| **Nearby-help** | Read-only | Invited by student with this role |
| **Pending** | No access | Unknown sign-in; blocked until role assigned |
| **Archived** | No access | Former user; blocked on sign-in |

---

## 2. Student Admin Slot

Every student has exactly **one student admin slot** in their support network (tier = `admin` within their `supportNetwork` map).

### Rules:
- The student admin slot can be filled by any person the student designates
- OR by the student themselves (self-admin)
- There is always exactly one admin — the slot is never empty for more than 24 hours
- Student admin can: manage the support network, view student data, trigger Bad Brain Day
- Student admin cannot: override the student's exit from Bad Brain Day, remove the student's own access to their data

### 24-Hour Default Rule (on signup):
1. Student signs up → admin slot is empty
2. 24-hour timer starts
3. **Option A:** Student (or platform admin) assigns someone to the admin slot → that person becomes student admin
4. **Option B:** 24 hours pass with no admin assigned → student is automatically added to their own admin slot (self-admin)
5. Student is never left without an admin

### 24-Hour Revocation Rule:
1. Student revokes admin access from their current admin at any time, no questions asked
2. 24-hour grace period begins (student can assign a replacement)
3. **Option A:** Student assigns a new person to the admin slot within 24 hours → new admin takes over
4. **Option B:** 24 hours pass with no replacement assigned → student auto-becomes their own admin
5. At no point is the student left without oversight or in an unmanaged state

---

## 3. Play Store Onboarding Flow

Both students AND support network members download from the app store (iOS / Android / Play Store). Role is determined by HOW they onboard, not how they got the app.

### Student onboarding (direct signup):
```
Download app → Sign in with Google → No invite code entered
→ role: 'student' assigned automatically
→ 24-hour admin timer starts
→ Student proceeds to dashboard
```

### Support network member onboarding (invite flow):
```
Student generates invite code/QR in app → assigns role (family/support/nearby-help/admin)
→ Invitee downloads app → Sign in with Google → Enters invite code during onboarding
→ role assigned from invite → linked to student's support network automatically
→ No admin approval needed
```

### Unknown / no-code signup (current dev phase):
```
Sign in → no Firestore doc → role: 'pending'
→ Immediately signed out → "Access pending" message shown
→ Must contact platform admin to get access
```
**Note:** The `pending` default is correct for the current private development phase (Mary only). When Play Store launches, direct signups revert to `student` and the invite code system handles support network members.

---

## 4. Invite System (Amanda Sudo — Build Priority #1)

The invite system replaces the `AA.preRegisterEmail()` admin-only flow. Students manage their own invitations.

### Student-side (invite generator):
- Student opens "My Support Network" → taps "Invite someone"
- Selects role for that person (family / support / nearby-help / admin)
- App generates a unique invite code (or QR code, or shareable link)
- Student shares it however they want (text, AirDrop, printed, etc.)
- Code is stored in `pendingUsers/{inviteCode}` with: role, studentUid, expiresAt (7 days suggested), createdBy

### Invitee-side (onboarding):
- Invitee downloads app → signs in → prompted: "Do you have an invite code?"
- Enters code → system looks up `pendingUsers/{code}` → assigns role → links to student's `supportNetwork`
- Code is consumed (deleted from `pendingUsers`) after use
- No platform admin involved

### Revocation:
- Student can remove any network member at any time via "My Support Network" UI
- If removed member was the admin → 24-hour revocation rule applies (see §2)
- Removed member's role is downgraded; they lose access to student data

---

## 5. Self-Admin Capability

When a student is their own admin (self-admin state), they can:
- Add/remove support network members
- Assign/change roles
- View their own data in admin view (mirror mode)
- Trigger Bad Brain Day (they could already do this as student)
- Generate invite codes
- Revoke any member's access

When a student has an external admin, the student CAN STILL:
- Generate invite codes (with admin approval optional — TBD)
- Remove any member from their network
- Exit Bad Brain Day at any time regardless of who triggered it
- Revoke admin access from their admin and replace them

---

## 6. Connection to Confirmed Rules

These rules from STATUS-CIRCLE-SPEC.md §1-5 remain unchanged and are compatible with this spec:

> *"Bad Brain Day trigger: student role (Mary / future students), admin, or family CAN trigger Bad Brain Day mode. Student always has final control — they can exit at any time. Support and nearby-help roles cannot trigger it."*

Under this spec:
- "admin" in that rule = **student's personal admin** (whoever holds their admin slot)
- The student admin inherits this capability
- Platform admin also retains this capability (platform-wide oversight)
- Student's final control is preserved — they can always exit

---

## 7. Implementation Sequence (Next Build)

| Step | What to build | Unblocks |
|------|--------------|---------|
| 1 | Invite code generator (student UI) | Support network self-management |
| 2 | Invite code redemption (onboarding screen) | Play Store launch |
| 3 | 24-hour admin timer (signup + revocation) | Admin slot always filled |
| 4 | Self-admin state (student = admin slot) | Student always in control |
| 5 | Revert `pending` default → `student` for direct signups | Play Store ready |
| 6 | `preRegisterEmail()` deprecated → invite codes only | Clean architecture |

---

## 8. Files Affected (Future Build)

| File | Change needed |
|------|--------------|
| `modular/aa-firebase.js` | Invite code generation/redemption helpers; 24-hour timer logic; revert default role |
| `modular/components/user-tiers/user-tiers.html` | Student-facing invite UI (currently admin-facing only) |
| `modular/shared-header.html` | Onboarding code entry prompt for new sign-ins |
| `modular/admin.html` | Platform admin retains override view; student admin panel separate |
| Firestore rules | `pendingUsers` writable by students (not just admin) for invite codes |

---

## 9. What Is NOT Included (until confirmed)

- ❌ Multiple admin slots per student (exactly one — by design)
- ❌ Admin-to-admin transfer without student consent
- ❌ Platform admin overriding student's revocation
- ❌ Expiring invite codes auto-extending without student action
- ❌ Support/nearby-help triggering Bad Brain Day (confirmed NO in STATUS-CIRCLE-SPEC)

---

*Claude authored this spec from confirmed user decisions. No logic in this file should be implemented without explicit user sign-off.*
