import type { FoodProfileArtKey } from './art';

/**
 * The taste-profile wizard's question catalogue — Figma `cCQlzTeiObQkpVBzwI8mZi` page `1405:448`
 * ("Food Profile"): Family `1548:3676`, Diet `1548:3786`, Taste `1548:3922`, Cook `1548:4061` /
 * `2522:1049`, and the four "Dev notes" frames beside them (`2505:4910` … `2505:4931`).
 *
 * ## Why this is data and not JSX
 *
 * What each step draws, what gates its Continue, and what is submitted have to agree. The screen
 * renders this module, `validation.ts` gates from it and `detailsData.ts` submits from it, so the
 * three cannot drift (the same reason the address form's rule lives in its own `validation.ts`).
 *
 * ## Ids are the backend's, verbatim
 *
 * Every option id below is exactly what V0 stores (`src/identity/profile-details.ts`). Labels are
 * never sent, so copy can be re-worded without touching anybody's saved answer. The one exception
 * is the grown-up food list: V0 holds it as an open vocabulary and has always stored the LABEL,
 * so that is what this sends too.
 */

export type WizardStepId = 'family' | 'diet' | 'taste' | 'cook';

export interface WizardStep {
  readonly id: WizardStepId;
  /** The bowl's caption in the progress thali (`1548:3685`). */
  readonly label: string;
  /** The header title. */
  readonly title: string;
}

export const WIZARD_STEPS: readonly WizardStep[] = [
  { id: 'family', label: 'Family', title: 'Who are we cooking for?' },
  { id: 'diet', label: 'Diet', title: 'What’s on the plate?' },
  { id: 'taste', label: 'Taste', title: 'Make it taste like home' },
  { id: 'cook', label: 'Cook', title: 'Cooks you’re comfortable with' },
];

/** `1548:3784` on steps 1–3, `1548:4174` on the last. */
export const WIZARD_CONTINUE = 'Continue';
export const WIZARD_SAVE = 'Save & Continue';

/* ------------------------------------------------------------------------------------ family */

/** Dev note `2505:4913`: free text, trimmed, max 40, mandatory. */
export const NAME_MAX_LENGTH = 40;
export const NAME_PLACEHOLDER = 'What should we call you?';

export const PEOPLE_QUESTION = 'How many people usually eat with you?';
export const PEOPLE_TIP = 'We’ll suggest duration & brief the cook accordingly';

export type HouseholdCountId = 'householdAdults' | 'householdKids' | 'householdElders';

export interface HouseholdRow {
  readonly id: HouseholdCountId;
  readonly label: string;
  readonly hint: string;
  /**
   * Dev note `2505:4914`: the customer counts as an adult, so Adults starts at 1 and its − stops
   * there; Kids and Elders start and stop at 0. No maximum is drawn; V0 bounds each at 50.
   */
  readonly min: number;
  /** The icon well's fill: `#FFF7CC`, `#ECFF9B` and `#FFE666` down the card. */
  readonly well: 'subtle' | 'positive' | 'tint';
  /** `1548:3733` draws the Kids glyph at 19.2 rather than 24. */
  readonly iconSize: number;
}

export const HOUSEHOLD_ROWS: readonly HouseholdRow[] = [
  {
    id: 'householdAdults',
    label: 'Adults',
    hint: '13–60 yrs',
    min: 1,
    well: 'subtle',
    iconSize: 24,
  },
  {
    id: 'householdKids',
    label: 'Kids',
    hint: 'Under 12',
    min: 0,
    well: 'positive',
    iconSize: 19.2,
  },
  { id: 'householdElders', label: 'Elders', hint: '60+ yrs', min: 0, well: 'tint', iconSize: 24 },
];

export const HOUSEHOLD_MAX = 50;

/* -------------------------------------------------------------------------------------- diet */

export interface TileOption {
  readonly id: string;
  readonly label: string;
  /** The tile's second line, where one is drawn. */
  readonly hint?: string;
  /** `mixed` is the one tile whose glyph is two marks overlapped (`1548:3857`). */
  readonly icon: FoodProfileArtKey | 'mixed';
}

/** `1548:3825` — 3 × 2 tiles, single-select, mandatory, no default (dev note `2505:4919`). */
export const DIET_OPTIONS: readonly TileOption[] = [
  { id: 'vegetarian', label: 'Vegetarian', hint: 'No meat, no egg', icon: 'markVeg' },
  { id: 'eggetarian', label: 'Eggetarian', hint: 'Veg + eggs', icon: 'markEgg' },
  { id: 'non-vegetarian', label: 'Non-veg', hint: 'Meat, fish & eggs', icon: 'markNonVeg' },
  { id: 'jain', label: 'Jain/ Sattvic', hint: 'No onion, garlic', icon: 'dietJain' },
  { id: 'vegan', label: 'Vegan', hint: 'No dairy either', icon: 'dietVegan' },
  { id: 'mixed', label: 'Mixed home', hint: 'Varies by person', icon: 'mixed' },
];

export const NON_VEG_QUESTION = 'What are your non-veg preferences?';

/** Dev note `2505:4921`: the meat chips show only for these two diets. */
export const MEAT_EATING_DIETS: ReadonlySet<string> = new Set(['non-vegetarian', 'mixed']);

export interface ChipOption {
  readonly id: string;
  readonly label: string;
}

/** `2475:19480` — a horizontal scroll, multi-select, optional. */
export const NON_VEG_OPTIONS: readonly ChipOption[] = [
  { id: 'chicken', label: 'Chicken' },
  { id: 'mutton', label: 'Mutton' },
  { id: 'freshwater-fish', label: 'Freshwater fish' },
  { id: 'seawater-fish', label: 'Seawater fish' },
  { id: 'prawns', label: 'Prawns' },
  { id: 'crabs', label: 'Crabs' },
  { id: 'pork', label: 'Pork' },
];

/* ------------------------------------------------------------------------------------- taste */

export const CUISINE_QUESTION = 'What food did you grow up eating?';
export const CUISINE_SEARCH_PLACEHOLDER = 'Search';
/** Dev note `2505:4926`: optional, max 5. */
export const CUISINE_MAX = 5;

/**
 * Dev note `2505:4926`: ten chips are shown without searching, in this order; everything after
 * them is reachable only through search. The note's search-only list ends in "e.g.", so the
 * regional names the V8 list already offered stay searchable too.
 */
export const FEATURED_CUISINES: readonly string[] = [
  'Punjabi',
  'Gujarati',
  'Maharashtrian',
  'Bengali',
  'Tamil',
  'Kerala',
  'Andhra / Telangana',
  'UP / Awadhi',
  'Rajasthani',
  'Sindhi',
];

export const SEARCH_ONLY_CUISINES: readonly string[] = [
  'Kashmiri',
  'Parsi',
  'Goan',
  'Odia',
  'Assamese',
  'Bohri / Memon',
  'Christian community',
  'Northeast',
  'Bihari',
  'Karnataka',
  'Chettinad',
  'Hyderabadi',
  'Mughlai',
  'Marwari',
  'Konkani',
  'North Indian',
  'South Indian',
  'No fixed region',
];

export const ALL_CUISINES: readonly string[] = [...FEATURED_CUISINES, ...SEARCH_ONLY_CUISINES];

/**
 * The V8 page stored labels with a " food" suffix ("Rajasthani food"), and three of its regions are
 * spelled or grouped differently now. A saved answer is read back to today's chip so it shows as
 * selected rather than as an unknown value; anything else is kept exactly as stored.
 */
const LEGACY_CUISINE_LABELS: Readonly<Record<string, string>> = {
  'odiya food': 'Odia',
  'andhra food': 'Andhra / Telangana',
  'telangana food': 'Andhra / Telangana',
  'awadhi food': 'UP / Awadhi',
};

export function canonicalCuisine(stored: string): string {
  const key = stored.trim().toLowerCase();
  const mapped = LEGACY_CUISINE_LABELS[key];
  if (mapped !== undefined) return mapped;
  const bare = key.replace(/ food$/, '');
  return ALL_CUISINES.find((label) => label.toLowerCase() === bare) ?? stored.trim();
}

export const OIL_QUESTION = 'Oil & ghee';

export interface OilStop {
  readonly id: 'none' | 'light' | 'moderate';
  readonly label: string;
  readonly drop: FoodProfileArtKey;
}

/** `2486:896` — a 3-stop slider, default Light (dev note `2505:4927`). */
export const OIL_STOPS: readonly OilStop[] = [
  { id: 'none', label: 'No oil', drop: 'dropNone' },
  { id: 'light', label: 'Light', drop: 'dropLight' },
  { id: 'moderate', label: 'Moderate', drop: 'dropModerate' },
];
export const DEFAULT_OIL_LEVEL = 'light';

export const GHEE_LABEL = 'Cook only in ghee';
export const GHEE_HINT = 'Ghee replaces oil in every dish';

/* -------------------------------------------------------------------------------------- cook */

export const GENDER_QUESTION = 'Cook’s gender preferences?';

/** `2527:925` — single-select, optional. "No preference" is V0's `either`. */
export const GENDER_OPTIONS: readonly TileOption[] = [
  { id: 'either', label: 'No preference', hint: 'Any trusted cook', icon: 'friends' },
  { id: 'female', label: 'Female', hint: 'Women cooks only', icon: 'genderFemale' },
  { id: 'male', label: 'Male', hint: 'Men cooks only', icon: 'genderMale' },
];

export const REGION_QUESTION = 'Cook’s regionality preferences?';

/** `2527:14278` — single-select, optional. V8's `my-state` is no longer offered. */
export const REGION_OPTIONS: readonly TileOption[] = [
  { id: 'north-indian', label: 'North Indian', icon: 'regionNorth' },
  { id: 'south-indian', label: 'South Indian', icon: 'regionSouth' },
];

export const MEAL_QUESTION = 'How do you get your daily meals sorted?';

export type MealSetupId = 'self-cooking' | 'regular-cook' | 'order-in' | 'tiffin' | 'office-meals';

export interface ListOption {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly icon: FoodProfileArtKey;
}

/** `2522:960` — one grouped list, radio rows, single-select, mandatory, no default. */
export const MEAL_OPTIONS: readonly (ListOption & { readonly id: MealSetupId })[] = [
  { id: 'self-cooking', label: 'Self cooking', hint: 'We cook ourselves', icon: 'cookingPot' },
  { id: 'regular-cook', label: 'Regular cook', hint: 'A cook comes home', icon: 'cookAssigned' },
  { id: 'order-in', label: 'Order in', hint: 'Delivery apps, most days', icon: 'onTheWay' },
  {
    id: 'tiffin',
    label: 'Tiffin service',
    hint: 'Neighbourhood tiffin or meal subscription',
    icon: 'dish',
  },
  {
    id: 'office-meals',
    label: 'Office meals',
    hint: 'Cafeteria or canteen at work',
    icon: 'apartment',
  },
];

export interface HassleSet {
  readonly question: string;
  readonly options: readonly ListOption[];
}

/**
 * Dev note `2505:4935`: the hassle question appears once a meal setup is picked, its title and its
 * four checkbox rows depend on that setup, and it is optional.
 *
 * FIGMA_PENDING: only the Regular cook set is drawn (`2522:1173`), so its title and icons are the
 * frame's. The other four titles follow the same "What's hardest…" pattern and reuse icons from
 * the same set; the labels are the dev note's, verbatim.
 */
export const HASSLES_BY_MEAL: Readonly<Record<MealSetupId, HassleSet>> = {
  'self-cooking': {
    question: 'What’s hardest about cooking yourselves?',
    options: [
      { id: 'no-time-weekdays', label: 'No time on weekdays', icon: 'time' },
      { id: 'too-tiring', label: 'Too tiring after work', icon: 'profile' },
      { id: 'prep-and-cleaning', label: 'Prep & cleaning take long', icon: 'cookingPot' },
      { id: 'groceries-and-planning', label: 'Groceries & planning', icon: 'vegetable' },
    ],
  },
  'regular-cook': {
    question: 'What’s hardest with your regular cook?',
    options: [
      { id: 'cook-skips-or-late', label: 'Skips days or comes late', icon: 'time' },
      { id: 'cook-not-our-taste', label: 'Doesn’t cook to our taste', icon: 'taste' },
      { id: 'cook-too-much-oil', label: 'Too much oil or masala', icon: 'cookingPot' },
      { id: 'cook-needs-supervision', label: 'Needs constant supervision', icon: 'profile' },
    ],
  },
  'order-in': {
    question: 'What’s hardest about ordering in?',
    options: [
      { id: 'order-costs', label: 'Costs add up', icon: 'dish' },
      { id: 'order-unhealthy', label: 'Too oily or unhealthy', icon: 'vegetable' },
      { id: 'order-not-homely', label: 'Doesn’t taste like home', icon: 'taste' },
      { id: 'order-late-delivery', label: 'Late or inconsistent delivery', icon: 'onTheWay' },
    ],
  },
  tiffin: {
    question: 'What’s hardest with your tiffin?',
    options: [
      { id: 'tiffin-repetitive', label: 'Bland or repetitive', icon: 'taste' },
      { id: 'tiffin-too-little', label: 'Too little quantity or variety', icon: 'dish' },
      { id: 'tiffin-hard-to-change', label: 'Hard to pause, skip or change', icon: 'profile' },
      { id: 'tiffin-timings', label: 'Timings don’t suit me', icon: 'time' },
    ],
  },
  'office-meals': {
    question: 'What’s hardest about office meals?',
    options: [
      { id: 'office-same-options', label: 'Same few options every day', icon: 'dish' },
      { id: 'office-too-heavy', label: 'Too heavy or oily', icon: 'cookingPot' },
      { id: 'office-not-homely', label: 'Doesn’t feel like home food', icon: 'taste' },
      { id: 'office-weekends', label: 'Nothing good on weekends', icon: 'apartment' },
    ],
  },
};

export function isMealSetup(id: string | null): id is MealSetupId {
  return id !== null && id in HASSLES_BY_MEAL;
}

/** Dev note `2505:4936`: max 150, live counter, trimmed before saving. */
export const HASSLE_NOTE_MAX_LENGTH = 150;
export const HASSLE_NOTE_PLACEHOLDER = 'Something else? Tell us';

/* ----------------------------------------------------------------------------------- summary */

/**
 * Display labels for the Account hub's food summary, including the V8 ids an older answer may
 * still hold, so a saved profile never reads as blank there.
 */
const LEGACY_LABELS: Readonly<Record<string, string>> = {
  'non-vegetarian': 'Non-veg',
  'my-state': 'My state',
};

export function dietLabel(id: string | null): string | null {
  if (id === null) return null;
  return DIET_OPTIONS.find((option) => option.id === id)?.label ?? LEGACY_LABELS[id] ?? null;
}

export function regionLabel(id: string | null): string | null {
  if (id === null) return null;
  return REGION_OPTIONS.find((option) => option.id === id)?.label ?? LEGACY_LABELS[id] ?? null;
}
