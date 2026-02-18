# Academic Allies — Nope Day & Semi-Nope Day: Locked Spec
<!-- Claude: Generated from confirmed Perplexity CoT thread. Do not modify without explicit user confirmation. -->

**Last confirmed:** February 2026

---

## 1. Nope Day

### 1.1 Definition
A "nope" day is when Mary decides that **nothing exists — not herself, not the world, nothing.** It is a total opt-out.

**Only Mary can set or cancel a nope day.** No one else (Admin, Mom, support, or system) can trigger or end it.

### 1.2 Trigger
Mary presses a **big red NOPE button** — like the Staples "That Was Easy" button. Easy to find, but not intrusive. Requires confirmation ("Are you sure?") before activating.

### 1.3 UI Behavior
- **All UI is hidden.** Nothing is visible except the nope day indicator.
- Status circle, dashboard, nav, banners — everything gone.
- Only the "Nope Day." screen shows.

### 1.4 Flag & Logging
- Nope day is a **RED flag** in all logs.
- Every nope day is logged (date, time set, time canceled).
- Logging continues normally in the background — nope day does NOT override logging.

### 1.5 Notifications
Sent immediately when nope day is set, to:
- **Admin** (Bruise)
- **Mom**
- **In-person physical care** tier *(name TBD — classmate, bishop, ministering person)*
- **On the ground troops** *(name TBD — immediate local support)*

**Notification message sent to all:**
> "Mary often ignores the world on these days. No texting, email, or doors will be paid attention to."

### 1.6 Other Effects
- Overrides **all other UI logic** (bad brain day, weekend, etc.) while active.
- Does **not** override logging.
- No check-in required or expected.
- Mary can undo/cancel the same day.

---

## 2. Nope Screen (what Mary sees when nope is active)

| Element | Description |
|---------|-------------|
| "Nope Day." | Large, calm text. The only main indicator. |
| Notification status | "Your team has been notified." (shows who) |
| **Semi-Nope button** | Small, subtle. Bottom area. Leads to semi-nope screen. |
| **Cancel Nope button** | Clearly separated from semi-nope button. Different color/location. Exits nope entirely. |

---

## 3. Semi-Nope Day

### 3.1 Definition
A low-interaction mode for when Mary is not fully "nope" but needs to withdraw gradually. She can pull out of nope **slowly**, choosing what to bring back one piece at a time.

**Only Mary can set or end semi-nope.** Only accessible FROM the nope screen.

### 3.2 Trigger
- From the **nope screen**, Mary taps the small "Semi-Nope" button.
- Only available on the nope screen — never shown elsewhere.

### 3.3 UI Behavior
- Mary sees a **checklist of app sections**, each with a checkbox:
  - ☐ Daily Check-In
  - ☐ My Meal Plan
  - ☐ Spoon Planner
  - ☐ My Calendar
  - ☐ Messages
  - ☐ Emergency Contacts
  - ☐ A Word of Comfort
- When she checks a box → that section appears **immediately**. No page reload.
- When she unchecks → hidden immediately.
- Checkboxes stay put until nope or semi-nope is canceled.
- No pressure to check anything. All boxes start unchecked.

### 3.4 Logging
- Semi-nope days are logged **separately** from full nope days.
- If Mary interacts with any feature (check-in, etc.), it logs as a **normal day entry** — not flagged differently.
- No actions required or expected.

### 3.5 Notifications
Same tiers as nope day. Same message:
> "Mary often ignores the world on these days. No texting, email, or doors will be paid attention to."

### 3.6 Other Effects
- Overrides all other UI logic (bad brain day, weekend, etc.).
- Does NOT override logging.
- No expectations. Trial allowed.

---

## 4. Semi-Nope Screen (what Mary sees in semi-nope)

| Element | Description |
|---------|-------------|
| "Coming back slowly…" | Gentle heading |
| Checklist | Each app section with show/hide checkbox |
| **Go Back to Nope button** | Returns to full nope screen. Only on semi-nope screen. |
| **Cancel Nope button** | Exits all special modes. Clearly separated from "Go Back" button. |

---

## 5. Button Logic Summary

| Screen | Buttons | Action |
|--------|---------|--------|
| Nope Screen | Semi-Nope | → Goes to semi-nope screen |
| Nope Screen | Cancel Nope | → Exits all modes, returns to dashboard |
| Semi-Nope Screen | Go Back to Nope | → Returns to full nope screen |
| Semi-Nope Screen | Cancel Nope | → Exits all modes, returns to dashboard |

**Rules:**
- "Go Back to Nope" only exists on the semi-nope screen.
- "Cancel Nope" exists on both screens but is always clearly separated visually.
- No button from any other page can trigger or end nope/semi-nope.

---

## 6. Support Tier Names (TBD)
- "In-person physical care" — final name not yet confirmed
- "On the ground troops" — final name not yet confirmed

---

## 7. What Is NOT Included (until confirmed)
- ❌ Automatic detection of nope days (always manual, always Mary)
- ❌ Anyone else setting or canceling nope/semi-nope
- ❌ Nope day affecting any logging
- ❌ Weekend or bad brain day logic interacting with nope (nope overrides them, not vice versa)

---

*Claude authored this spec file from confirmed user instructions. No logic should be implemented without explicit user sign-off.*
