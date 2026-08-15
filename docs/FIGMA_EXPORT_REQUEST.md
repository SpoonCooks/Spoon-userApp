# Figma Export Request — User App

> # ⛔ WITHDRAWN — 2026-08-14
>
> **No exports are needed. Please ignore the request below.**
>
> We re-ran the audit against the imported copy of the file
> (`BTPW14a7M69ySPZxdkc2yn` → `V0_-user-app`) from a **student-tier, Full-seat** account, and the MCP
> rate limit that blocked us is gone. **All 38 outstanding frames were captured ourselves, plus the 12
> we already had — 50 / 50, zero failures.** PNGs are in `.figma-audit/screens/`.
>
> Two notes for the record:
> - The plan tier was the blocker, not the **View** seat and not any node or permission problem. A
>   Full seat on a student plan renders fine.
> - **Node IDs survived the import unchanged** — all 41 depth-1 children and 12 section children match
>   the old file on ID, name and geometry. The node IDs listed below are still valid; only the file key
>   changed.
>
> **What we still need from you is answers, not images.** The questions at the bottom of this document
> have grown from 7 to ~30 now that we can see every screen — several are blocking. The current list
> lives in **`docs/FIGMA_USER_APP_AUDIT.md` § T**, with per-frame detail in
> `docs/FIGMA_VISUAL_AUDIT_PENDING.md`. The most urgent:
>
> 1. **Where does payment happen?** Page 6 turned out to be a meal-brief form, not a payment review.
>    There is no payment-method picker, no taxes breakdown and no T&C acceptance anywhere in the file.
> 2. **Is Home one screen or two?** `1:455` and `59:520` differ in tile copy, carousel state, and an
>    entire "COOK EN-ROUTE" module — so `59:520` is not the crop we assumed it was.
> 3. **"An original booking can be rescheduled only once"** (Page 12a) appears nowhere else and has no
>    designed state for a booking that has used it up.
>
> The rest of this document is retained **for historical context only.**

---

## What we need *(superseded — see the notice above)*

PNG exports of **38 frames** listed below. We've already read the full metadata tree for every one of them, so we are not asking you to re-explain the designs — we only need to *see* them. Structural audit is complete; the visual gap is the only thing blocking implementation.

**Why we're asking instead of pulling them ourselves:** our Figma MCP access is on the Starter plan and has hit its tool-call quota. We got 11 frames rendered before it cut off and retries still return the quota error. Exporting from your side is not rate-limited.

## Export settings

- **Format:** PNG, **@2x** (so 390-wide frames land at 780px — enough to read body copy and spot spacing)
- **Whole frame**, not slices — including any that scroll past 830px (the 891px Scheduled frames especially)
- **Naming:** `<node-id>-<slug>.png` with the colon replaced by a hyphen, e.g. `53-174-page17-login.png`
  (colons are illegal in Windows filenames, so `53:174-...png` will fail on our machines)
- **Deliver to:** a zip, or drop straight into `.figma-audit/screens/` if you have repo access

If bulk-exporting by node ID is awkward, selecting each frame and using **Export → PNG 2x** with "Contents only" **off** gives us what we need.

---

## The 39 frames

### Authentication (1)
| Node ID | Frame |
|---|---|
| `53:174` | Page 17- Login |

### Address (3)
| Node ID | Frame |
|---|---|
| `68:214` | Page 16a- Address location |
| `53:31` | Page 16b- Address location |
| `60:655` | Page 16c- Address full |

### Home (1)
| Node ID | Frame |
|---|---|
| `59:520` | Page 3- home page (830h variant) |

### Instant booking (2)
| Node ID | Frame |
|---|---|
| `25:1327` | Page 4c- Instant- NA out of shift |
| `44:5378` | Page 4c- Instant- No slots |

### Scheduled booking — cluster A (6)
| Node ID | Frame |
|---|---|
| `37:4183` | Page 5b- Scheduled day |
| `37:3943` | Page 5b- Scheduled time |
| `37:3703` | Page 5b- Scheduled duration |
| `34:3035` | Page 5b- Scheduled morning |
| `34:1919` | Page 5b- Scheduled noon |
| `34:2105` | Page 5c- Scheduled eve |

### Scheduled booking — cluster B (5)
| Node ID | Frame |
|---|---|
| `47:6549` | Page 5b- Scheduled day |
| `47:6450` | Page 5b- Scheduled time |
| `47:6059` | Page 5c- Scheduled morning |
| `47:5844` | Page 5b- Scheduled noon |
| `47:5638` | Page 5c- Scheduled eve |

### Booking lifecycle (2)
| Node ID | Frame |
|---|---|
| `3:684` | Page 6- service brief |
| `99:1413` | Page 8b- En route late |

### Cancellation (4)
| Node ID | Frame |
|---|---|
| `6:2` | Page 12a- Cancel policy |
| `104:2260` | Page 12b- Cancel reason |
| `104:2336` | Page 12c- Refund details |
| `115:2703` | Page 12d- Cancel confirm |

### History / Profile / Refund (3)
| Node ID | Frame |
|---|---|
| `6:227` | Page 14- Booking history |
| `6:663` | Page 15- Profile |
| `71:615` | Page 18- Refund history |

### Design-reference frames (3)
| Node ID | Frame |
|---|---|
| `54:280` | Icons |
| `94:905` | Food icons |
| `119:2885` | Frame 18 (Rating widget) |

### Cook profile cards — regular, section `81:447` (4)
| Node ID | Frame |
|---|---|
| `81:448` | Rekha |
| `81:710` | Sanchita |
| `81:972` | Barsha |
| `81:1234` | Jyoti |

### Cook profile cards — pure veg, section `87:119` (4)
| Node ID | Frame |
|---|---|
| `87:510` | Rekha |
| `87:380` | Sanchita |
| `87:250` | Barsha |
| `87:120` | Jyoti |

**Total: 38.** For reference, the 12 we already have and do **not** need exported: `73:1036`, `71:747`, `1:455`, `1:728`, `25:1585`, `3:1041`, `3:1381`, `3:1658`, `101:1812`, `3:2002`, `143:207`, `3:1848`.

---

## Questions we'd like answered alongside the exports

These came out of the structural audit and can't be resolved by looking at pixels. Answering them with the exports would save a round trip.

1. **Scheduled cluster B** (`47:*`, y ≈ 3329+) duplicates cluster A's names. Is it an old iteration to delete, or is it the **Reschedule** flow? The "Reschedule for free" CTAs on Page 12a/12c currently have no destination. Note cluster B also appears to have no *duration* step, which cluster A does.
2. **Pages 2, 5a, 8c, 13 don't exist** on the canvas. Intentionally renamed/dropped, or missing?
3. After **Page 12d Cancel confirm → "Yes"** (make another booking), where should the user land — Home, or a rebook shortcut?
4. **No loading, skeleton, or spinner states are designed anywhere.** Address lookup, cook assignment, payment, OTP verification, extension pricing and refund calculation all involve network calls. Are these coming, or should we spec generic ones during the build?
5. The two cook-profile sections contain the **same 4 cook names** (Rekha, Sanchita, Barsha, Jyoti). Is "pure veg" a dietary flag on the same cook, or genuinely a separate roster? This is a schema-level decision for us.
6. **Page 17 Login** has no companion OTP screen. Is OTP entry on the same screen, or is a screen missing?
7. **`3:1848` "Page 10- Countdown"** — we've verified this one ourselves, so no export needed, but it raised three questions. It isn't a countdown screen: it carries Extend Time, End Service and End OTP, i.e. the same controls as `101:1812` Page 10 In service, and both share the `Page 10-` prefix. (a) Is `3:1848` simply the 830h top-fold crop of the 1236h `101:1812`, safe for us to build as one scrolling screen — or do they differ below the fold? (b) If it is a crop, can the frame be renamed? "Countdown" reads as a distinct screen and would have sent us down the wrong path. (c) With no countdown screen between them, **nothing is designed for the moment after a correct Start OTP on Page 9 and before the live session appears** — is there meant to be a transition there, or does it swap instantly?

---

## Alternative that unblocks us permanently

If you'd rather not hand-export: upgrading the Figma plan above Starter would restore our MCP access and we'd pull these ourselves. Worth noting our account (`lakshayd.intern@spoonhelp.com`) currently holds a **View** seat — if you go this route, please confirm a View seat is enough for MCP rendering, or bump it.
