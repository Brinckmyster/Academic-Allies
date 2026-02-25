# Academic Allies — Status Circle: Locked Spec
<!-- Claude: Generated from confirmed Perplexity CoT + user instructions. Do not modify without explicit user confirmation. -->

**Last confirmed:** February 2026
**Source:** Perplexity Space thread + user CoT + direct corrections
**Updated 2026-02-25 by Claude:** Mental/Emotional segment now uses Mary's confirmed 10-point energy scale (energyLevel field).

### Confirmed Energy Scale (Mental/Emotional — DO NOT CHANGE)
| Level | Emoji | Label | Circle Color |
|-------|-------|-------|-------------|
| 1 | 😁 | Fully Charged | 🟢 Green |
| 2 | 😊 | Energized | 🟢 Green |
| 3 | 🙂 | Pretty Good | 🟢 Green |
| 4 | 🙂 | Doing Okay | 🟢 Green |
| 5 | 😐 | Neutral | 🟡 Yellow |
| 6 | 😕 | Starting to Tire | 🟠 Orange |
| 7 | 😟 | Pretty Tired | 🟠 Orange |
| 8 | 😫 | Very Exhausted | 🔴 Red |
| 9 | 😩 | Almost Empty | 🔴 Red |
| 10 | ☠️ | Completely Depleted | 🔴 Red |

---

## 1. Core Behavior

| # | Feature | What It Does |
|---|---------|--------------|
| 1-1 | One circle, always visible | Top right corner. Never multiple circles or icons. Never hidden except bad brain day logic (see 1-5). |
| 1-2 | Toggle: single color ↔ pie chart | Tap the circle OR change in Settings. Two default views only. No toggle switches on dashboard — labeled choices in Settings only. |
| 1-3 | Weekend logic | **NOT YET CONFIRMED. Do not implement until user specifies.** |
| 1-4 | Default / processing states | **Default = grey** (no check-in yet, or data unavailable). **Processing = blue spinning circle** (awaiting auto-fill or check-in). |
| 1-5 | Bad brain day | Circle is hidden. If a new message is waiting → show message icon in same spot instead. **Trigger logic NOT YET CONFIRMED.** |
| 1-6 | Item-dependent logic | Each segment color is determined by its own confirmed check-in item. See Section 3. |
| 1-7 | Accessibility (ADA) | High contrast. No flashing/pulsing. Keyboard accessible. Screen reader labels. Large/touch-friendly. Spinning animation is ADA-compliant. |

---

## 2. View Types

| View | Available | Banner? | Admin Alert? | Notes |
|------|-----------|---------|--------------|-------|
| Single Color | Dashboard (tap) or Settings | **Yes — always** | No | Default view |
| Pie Chart (5 segments) | Dashboard (tap) or Settings | **Yes — always** | No | Default view |
| Custom (Auto-detected) | Settings only | **Yes — always** | **Yes** | Alert goes to Admin only (not Mary, not Mom) |

> **Banner rule (corrected):** The banner appears in **ALL views**, not just custom views.
> Banner text: *"Status circle is currently showing: [current view/metric]"*
> Banner location: directly underneath the status circle, visible on ALL dashboards (Mary, Admin, Family, Support).
> Banner disappears only when… nothing — it is always shown.

---

## 3. Segment Mapping (Weekday Logic)

| Segment | Label | Data Source | Green | Yellow | Orange | Red | Grey |
|---------|-------|-------------|-------|--------|--------|-----|------|
| Mental | Mental | Energy level (check-in) + brain fog from Q-A symptom list | Energy 1–4 (Fully Charged → Doing Okay) | Energy 5 (Neutral) or brain fog | Energy 6–7 (Starting to Tire / Pretty Tired) | Energy 8–10 (Very Exhausted → Completely Depleted) or emergency | No check-in |
| Physical | Physical | Q-A symptoms + Q-B sleep | No symptoms, good sleep | Some symptoms OR poor sleep | Symptoms + poor sleep | 3+ symptoms or emergency | No check-in |
| Spiritual | Spiritual | **NOT YET TRACKED** | — | — | — | — | Always grey until confirmed |
| Academic | Academic | Q-D planner review | Reviewed planner | Planner not reviewed | — | Emergency | Not recorded/skipped |
| Social | Social | Q-C support connection | Talked to support team | No support contact | — | Emergency | Not recorded/skipped |

> **Emergency (Q-E = Yes):** Immediately sets ALL segments to red.

---

## 4. Color Reference

| Color | Meaning | Hex |
|-------|---------|-----|
| Green | Good, no concerns | `#28a745` |
| Yellow | Some concern | `#ffc107` |
| Orange | Needs attention | `#fd7e14` |
| Red | Urgent / emergency | `#dc3545` |
| Grey | No data / default | `#adb5bd` |
| Blue (spinning) | Processing | `#4fa3e0` |

---

## 5. Flag Protocols (Rolling 5-Day Window)

| Flag | Trigger | Who Gets Alerted |
|------|---------|-----------------|
| Green | 0–1 concerning days in 5 | No alert. Factual, reassuring feedback. |
| Yellow | 2 of 5 days concerning | Gentle alert: Mary, Admin, Mom. Escalation optional. |
| Orange | 3 of 5 days concerning | Moderate alert. Escalation optional. |
| Red | 4 of 5 days OR 7 consecutive days | High priority. Marked URGENT if 2+ items escalate. |

> Escalation is **always optional, never automatic.** All actions logged.

---

## 6. What Is NOT Included (until user confirms)

- ❌ Weekend logic (Saturday/Sunday special colors)
- ❌ Bad brain day trigger/definition
- ❌ Cognitive scale
- ❌ Emoji in circle (off by default; enable in Settings)
- ❌ Alerts for Mary or Mom (unless confirmed)
- ❌ Any logic based on personal tiredness or bedtime
- ❌ Nope day / skip day logic (TBD — see nope-day spec when created)

---

## 7. Support User Rules

- Support users (Admin, Family, BYU-I Staff, Support) see the **same circle** mirrored in real time.
- They **cannot change Mary's dashboard view.**
- They CAN customize their own dashboard view.
- Banner always visible on all mirrored dashboards.
- All view changes logged for transparency.

---

## 8. Banner Spec

```
Location:    Fixed, directly under the status circle (top right)
Visibility:  Always — all views, all dashboards
Text:        "Status circle is currently showing: [view name]"
Examples:
  - "Status circle is currently showing: Overall status"
  - "Status circle is currently showing: All 5 segments"
  - "Status circle is currently showing: Auto-detected metric"
Style:       Small, gentle, high-contrast, non-intrusive
Admin alert: Only triggered when Mary selects a Custom (auto-detected) view
```

---

## 9. Files

| File | Purpose |
|------|---------|
| `modular/js/status-circle.js` | All status circle rendering logic |
| `modular/js/draggable.js` | Drag behavior for the circle |
| `modular/shared-header.html` | Houses `#status-circle` div + banner div |
| `docs/STATUS-CIRCLE-SPEC.md` | **This file** — locked spec, do not edit without confirmation |

---

*Claude authored this spec file from confirmed user instructions. No logic in this file should be implemented without explicit user sign-off.*
