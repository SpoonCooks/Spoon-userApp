# Figma Design Tokens — Spoon User App

**File:** `BTPW14a7M69ySPZxdkc2yn` → `V0_-user-app`
**Page:** `0:1 User App`
**Extracted:** 2026-08-14 via `figma-desktop` MCP `get_variable_defs`
**Account:** Lakshay Dawar · student tier · **Full** seat

---

## How this was extracted (read this before trusting the list)

`get_variable_defs` was called on `0:1` as instructed. **It was rejected:**

> `You currently have nothing selected. You need to select a layer first before using this tool.`

The tool does not accept a *page* node as a target — it needs a concrete frame (or a live canvas
selection). It was therefore retargeted once at **`1:455` Page 3 home page**, the largest and most
component-dense frame in the file (390×2014), which is the best single proxy for file-wide token usage.

**Consequence — scope limit:** `get_variable_defs` returns only the variables *consumed by the queried
node*, not the file's full variable collection. The table below is therefore **the token set used by the
Home screen**, not a guaranteed-complete inventory of the file. Tokens used exclusively on screens Home
never references (e.g. cancellation-specific colours) may be missing. Treat this as a high-confidence
core palette, not a closed set.

---

## Health warning: this is a machine-generated token set, not a curated design system

Three things stand out and should be settled with the designer before any of this is hardcoded:

1. **A vendor namespace is baked into the token names.** 46% of tokens are prefixed
   `aistudio.google.com/` — an artefact of the design being generated in / imported through Google AI
   Studio. These are not Spoon-authored names. **Do not ship `aistudio.google.com/*` as token
   identifiers.** Re-map them to a Spoon namespace before use.
2. **Colour names are duplicated across namespaces.** `color/white/solid` (`#ffffff`) and
   `aistudio.google.com/White` (`#FFFFFF`) are the same colour under two names; likewise
   black, `#F3F4F6`, `#1E2939`, `#364153`, `#101828`. Pick one namespace per value.
3. **Several tokens are corrupt or misaliased** — see the "Broken tokens" section. These are real
   defects in the variable definitions, not extraction errors.

---

## Colour

| Token | Value | Duplicate of | Notes |
|---|---|---|---|
| `color/white/solid` | `#ffffff` | `aistudio.google.com/White` | Surface / card background |
| `color/black/solid` | `#000000` | `aistudio.google.com/Black` | Primary text |
| `color/black/ 70%` | `#000000b2` | — | 70% black. **Leading space in the token name** — likely a typo |
| `color/azure/11` | `#0f172b` | — | Darkest slate — headings |
| `color/azure/11 2` | `#101828` | `aistudio.google.com/Ebony` | Near-black slate. `" 2"` suffix = a Figma name collision, not a scale step |
| `color/azure/17` | `#1e2939` | `aistudio.google.com/Mirage` | Dark slate |
| `color/azure/27 2` | `#364153` | `aistudio.google.com/Oxford Blue` | Mid slate — secondary text |
| `color/azure/84` | `#cad5e2` | `aistudio.google.com/Botticelli` | Light slate — borders / dividers |
| `color/grey/96` | `#f3f4f6` | `aistudio.google.com/Athens Gray` | Neutral fill |
| `color/grey/98` | `#fffdf5` | `aistudio.google.com/Quarter Pearl Lusta` | **Warm off-white — the app's dominant background** |

**Note the brand yellow/lime is absent.** Every screen rendered so far is dominated by a yellow
(`GET OTP` CTA, Instant tile) and a lime-green accent, yet no yellow token appears in Home's variable
set — those fills are almost certainly **raw hex values, not variables**. This is the single biggest
tokenisation gap in the file; the primary brand colour is not tokenised. Confirm with the designer.

## Typography

**Font family:** `font family/Font 1` = **Livvic** (single family across the file).

| Style token | Weight | Size | Line height | Letter spacing |
|---|---|---|---|---|
| `Livvic/Regular` | 400 | 10 | 15 | 0 |
| `Livvic/Medium` | 500 | 10 | 13.33 | 0 |
| `Livvic/SemiBold` | 600 | 11 | 16.5 | 0 |
| `Livvic/SemiBold upper` | 600 | 10 | 15 | 0.5 |
| `Livvic/Bold` | 700 | ⚠ 12 | ⚠ 16 | 0 |
| `Livvic/Black` | 900 | 16 | 24 | -0.4 |
| `Livvic/Black upper` | 900 | 10 | 13.33 | 0 |

The two `upper` styles carry no `textCase` in the variable itself — the uppercasing is applied at the
layer, so replicate it in CSS/RN (`textTransform: 'uppercase'`), not via the token.

**Raw scales available:** font size `9 · 10 · 11 · 12 · 14 · 16 · 18` · line height
`13.33 · 13.5 · 15 · 15.11 · 16 · 16.5 · 20 · 24 · 28` · weight `400 · 500 · 600 · 700 · 900` ·
letter spacing `-0.4 · 0.5`.

## Radius

`12 · 16 · 24 · 26 · 44` — plus two corrupt entries (below).

## Stroke weight

`0.8 · 1 · 1.67 · 2 · 9`

## Spacing (item spacing)

`6 · 11.99 · 238.05` — only three values, two of them non-round. This is **not a spacing scale**;
these are one-off auto-layout gaps. There is no 4pt/8pt system in the variables. Build the spacing
scale yourself and do not attempt to derive it from these.

## Opacity

`opacity/100` = 100 (the only opacity token).

---

## Broken tokens — do not consume

| Token | Declared value | Problem |
|---|---|---|
| `corner radius/29826200` | `29826200` | Nonsense radius (~29.8M px). Figma's "fully rounded" pill overflow. Use `9999` / `borderRadius: 999` instead |
| `corner radius/26843500` | `26843500` | Same defect, different overflow value |
| `aistudio.google.com/Livvic/Bold` | size = `corner radius/12`, lineHeight = `corner radius/16` | **Misaliased**: the Bold text style points at *corner-radius* variables for its font size and line height. Numerically it resolves to 12/16 so it renders correctly, but the alias is semantically wrong and will break if either radius token is retuned. Flag to the designer |

---

## Recommended implementation mapping

```ts
// tokens.ts — Spoon-namespaced, de-duplicated, corruption removed.
// Yellow/lime are NOT in the Figma variables; values below are placeholders
// pending designer confirmation (see "Colour" note above).
export const color = {
  surface:      '#ffffff',
  background:   '#fffdf5',  // color/grey/98 — warm off-white app background
  neutralFill:  '#f3f4f6',  // color/grey/96
  border:       '#cad5e2',  // color/azure/84
  textPrimary:  '#0f172b',  // color/azure/11
  textStrong:   '#101828',  // color/azure/11 2
  textSecondary:'#364153',  // color/azure/27 2
  textMuted:    '#1e2939',  // color/azure/17
  black:        '#000000',
  black70:      'rgba(0,0,0,0.7)',
  // TODO(designer): brand yellow + lime accent are untokenised in Figma
} as const

export const radius = { sm: 12, md: 16, lg: 24, xl: 44, pill: 999 } as const
export const stroke = { hairline: 0.8, thin: 1, base: 1.67, thick: 2, heavy: 9 } as const
export const font = { family: 'Livvic' } as const
```

---

## Open questions for the designer

1. **Brand yellow and lime green are not variables.** Can they be promoted to tokens? Right now the
   primary CTA colour is unmanaged.
2. Can the `aistudio.google.com/*` namespace be renamed to a Spoon namespace, and the duplicate
   colour pairs collapsed to one definition each?
3. `corner radius/29826200` and `corner radius/26843500` — please replace with a proper "pill" token.
4. `Livvic/Bold` uses corner-radius variables for its font size and line height. Intentional, or a
   mis-drag in the variables panel?
5. There is no spacing scale. Should one be authored, or should the frontend define it?
