# Claude Design — Recurring Setup Flow

**Source:** Claude Design artifact — `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`
("User app wireframe board"), section **v2 · Turn 2 · Recurring setup rules**.
**Captured:** 2026-09-27, from the artifact's own bundled template (the rendered page embeds its
content in an iframe that does not scroll reliably, so the markup was read directly).
**Fidelity:** a wireframe, not a pixel-accurate mock. Treat it as a flow and logic reference. The
screens use this app's existing token system and components, not the wireframe's placeholder
black/grey styling.

---

## What the board contains

Six steps, drawn as **11 states**:

| State | Step | Title on the board |
|---|---|---|
| `2a` | 1 | Pick days (under minimum) |
| `2b` | 1 | Pick days (valid) |
| `2c` | 2 | One visit · + Visit tab |
| `2d` | 2 | Visit 2 tab |
| `2e` | 2 | Three visits · Visit 3 tab |
| `2f1` | 3 | Times by date · 1 visit a day |
| `2f2` | 3 | Times by date · 2 visits a day |
| `2f3` | 3 | Times by date · 3 visits a day |
| `2g` | 4 | Review plan |
| `2h` | 5 | Autopay |
| `2i` | 6 | Plan confirmed |

The same artifact also holds other sections that are **out of scope here**: "v2 · Turn 1 ·
Recurring wireframes" (A · Home with two tabs, B · Recurring tab with an active plan) and ten
"Lane" sections covering the rest of the app.

## Global rules (chips above Step 1)

- 5–14 days per recurring window, within 21 days
- Up to 3 visits a day
- Earliest start = today + 3 (example: opened 26th → starts 29th)
- One-time Schedule owns today … +2, recurring owns +3 onward — never overlap
- Assumed: the 21 days are counted from the first bookable date
- Default: one time per visit; change it per day in Step 3

## Implementation

All screens are in `src/features/recurringSetup/screens/`. Each one is **static**: it renders
local fixture data from `src/features/recurringSetup/data.ts`, and none of the steps pass data to
each other yet.

| Step | Screen | Covers | Route |
|---|---|---|---|
| 1 | `RecurringDaysScreen` | `2a`, `2b` | `(app)/recurring-setup/days` |
| 2 | `RecurringTimeScreen` | `2c`, `2d`, `2e` | `(app)/recurring-setup/time` |
| 3 | `RecurringTimesByDateScreen` | `2f1`, `2f2`, `2f3` | `(app)/recurring-setup/times-by-date` |
| 4 | `RecurringReviewScreen` | `2g` | `(app)/recurring-setup/review` |
| 5 | `RecurringAutopayScreen` | `2h` | `(app)/recurring-setup/autopay` |
| 6 | `RecurringPlanConfirmedScreen` | `2i` | `(app)/recurring-setup/confirmed` |

The `(app)` routes sit behind the session guard in `(app)/_layout.tsx`, so on a device with no
signed-in session they redirect to `/login`. For review without a session, use the dev preview
(`src/app/(dev)/recurring-setup.tsx`), also listed in the dev menu at `spoon://menu`:

- `spoon://recurring-setup` — Step 1
- `spoon://recurring-setup?step=2` … `?step=6` — Steps 2–6
- `spoon://recurring-setup?step=3&visits=1` / `&visits=2` — Step 3's 1- and 2-visit states

### Step 1 — Pick days (`2a`, `2b`)

One interactive screen. It opens with 3 days picked (`2a`: Continue disabled, "Pick 2 more days to
continue" above it, "Need a cook in the next 2 days? Use One-time Schedule" shown). Picking 5 or
more reaches `2b`: the caption goes, the counter turns yellow and the CTA reads "Continue with N
days". Selection locks at 14. The fixture follows the board's own example: opened Sat Sep 26,
window Sep 29 – Oct 19, Oct 10 greyed out as a day with no cooks (the board strikes it through; the app does not).

### Step 2 — Time & duration (`2c`, `2d`, `2e`)

One screen that grows from `2c` to `2e`, not three separate screens:

- Opens on `2c`: Visit 1 only, its tab reading "1:15 PM · 1.5 hr", with a "+ Add visit" tab.
- "+ Add visit" adds a visit, up to 3. The add tab reads "+ Visit" at two visits (`2d`) and
  disappears at three, where the tabs drop the duration and show the time only (`2e`). Visits 2 and
  3 show "Remove Visit N", and the remaining visits are renumbered after a removal.
- Visit 1 has no Days row; it runs on every picked day. Visits 2 and 3 have "All 11" / "Some". "Some"
  opens individual day chips, with the first 6 days picked the first time (`2d`'s "Some · 6").
- The footer total is computed: the sum of each visit's day count. `2c` gives "11 visits",
  `2d` gives "17 visits", both matching the board.
- Start-time slots overlapping another visit **on a shared day** are disabled and labelled with
  that visit's name. Other slots show "All days", "N/M days" or "Full". The grid pads the hour
  ("01:15 PM"), as the board does; everywhere else times are unpadded ("1:15 PM").
- "Different time on some days?" sits under the start-time grid. It is the entry into Step 3.

### Step 3 — Times by date (`2f1`, `2f2`, `2f3`)

Every chosen day (all 11) is a card, and each visit is a column in that card's single row: one
full-width time (`2f1`), two side by side (`2f2`) or three compact ones (`2f3`). A day where a
visit's usual time is booked out is highlighted as a whole, says "Not available at …" beside the
date, and shows that visit's time as a black "Pick time" pill. Each state uses the board's own data:

- `2f1`: 1:15 PM / 1.5 hr; booked out Thu Oct 1 and Wed Oct 7.
- `2f2`: 1:15 PM / 1.5 hr and 7:00 PM / 1 hr; booked out Oct 1 (Visit 1) and Oct 7 (Visit 2);
  per-day overrides on Tue Oct 6 (12:45 PM) and Wed Oct 14 (7:30 PM).
- `2f3`: 7:30 AM / 45 min, 1:15 PM / 1.5 hr and 7:00 PM / 1 hr; booked out Oct 1 (Visit 2), Oct 7
  (Visit 3) and Tue Oct 13 (Visit 1). Like the board, it drops the intro's second sentence.

### Steps 4–6 (`2g`, `2h`, `2i`)

- **Review plan:** "11 days · 17 visits" and the date range, one line per visit ("Visit 1 · 1:15 PM
  · 1.5 hr · all 11 days", ₹189) in `DetailRows`, "Edit days or times", then "Day by day": all 11
  days, each visit's time as its own pill (`ListRow` + `Badge`). Then "Keep my plan going", the
  per-visit charge note incl. tax, and "Set up autopay".
- **Autopay:** UPI Autopay / Credit or debit card radio rows (reusing the cancellation sheet's radio
  glyphs), mandate-terms table, "Approve with UPI" / "Approve with card".
- **Plan confirmed:** no header or back control (a terminal screen, like booking Confirmation),
  plan summary, first-visit card, note, "View my plan" and "Share recipes on WhatsApp".

## Known gaps and open questions

1. **Nothing is wired.** Steps don't pass selections forward, no CTA navigates to the next step,
   and neither "Different time on some days?" nor "Edit days or times" opens anything. Nothing links
   into the flow from Home either; where it's entered from is undecided (the board's section B
   suggests a "Recurring" tab on Home).
2. **All availability and pricing is placeholder data.** The Step 1 calendar, Step 2's "N/M days"
   and "Full" labels, Step 3's unavailable dates, and every price and charge come from fixtures.
   There are no endpoints for them yet.
3. **Step 3's time pills open nothing.** No time-picker exists yet.
4. **Three Step 2 rules are interpretations**, since the board draws only one state of each:
   - Visit 1 never gets a Days row. The board only says so for the one-visit state (`2c`).
   - "Different time on some days?" shows on every tab. The board only draws it in `2c`.
   - "Remove Visit N" shows on Visits 2 and 3. `2d` draws it; `2e` draws neither control.
5. **Step 2's demo "Full" slot can land on a visit's own time.** Visit 1's 1:15 PM falls on a
   placeholder "Full" slot; it stays selectable and highlighted, but carries the "Full" label.
6. **Step 5's mandate terms** (charge at T-24h, SMS alert at T-48h, ₹1,000 cap) are labelled
   "Proposed" on the board, and the cook-assignment timing on Step 6 ("a day before") is marked
   as an assumption to confirm.
7. **The greyed-out no-cooks day on Step 1** needs a real data source: whether a day is unavailable because
   of cook capacity or something else is not specified.
