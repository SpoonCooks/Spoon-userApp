/**
 * `338:4508` "Page 17- profile" — the V8 profile-details field catalogue.
 *
 * ## Why this is data and not JSX
 *
 * The screen asks eight questions, and three separate things need to agree about them: what is
 * drawn, what gates Confirm, and what is submitted. Spelling the questions out in the screen and
 * re-deriving the required set in a validator is how those three drift — the defect the address
 * form already solved by putting its rule in `features/address/validation.ts` rather than on the
 * button. This module is the single description; `validation.ts` reads it, the screen renders it,
 * and the adapter submits it.
 *
 * ## Required vs optional — read off the STAR, not guessed
 *
 * The founder's rule is "sections marked * are mandatory". Three labels in `338:4511` carry one
 * and five do not:
 *
 *   REQUIRED  `456:3392`  Name*
 *             `456:3418`  Daily meal structure*
 *             `338:4534`  Dietary preference*
 *   OPTIONAL  `456:3404`  Household structure
 *             `456:3432`  What is the most pressing issue with your meals today?
 *             `341:4658`  What food have you grown up eating?
 *             `341:4646`  Region preference
 *             `341:4642`  Gender preference
 *
 * The star is part of the DRAWN LABEL in Figma, so it is part of the label string here too —
 * `label` is what the frame prints, and `required` is what the gate reads. Neither is derived
 * from the other, so a label that loses its star in a future file cannot silently unlock the CTA,
 * and a requirement cannot silently appear without the mark that announces it.
 *
 * ## Selection mode
 *
 * `341:4655` is the one MULTI-select input (founder comment: "multi select"), and the frame proves
 * it: three chips — Rajasthani, Bihari, Odiya — are shown selected TOGETHER, each carrying its own
 * `408:1382` remove cross. Every other chip group draws exactly one selected chip and is
 * single-select. Nothing here is inferred from the control's shape; it is read off the frame.
 *
 * ## Chip families
 *
 * The frame draws chips in two distinct treatments, consistently per group rather than at random:
 * a LIME family (`#CFFF04` edge, `#ECFF9B` at 70 % when selected) and a GOLD family (`#FFD600`
 * edge, `#FFEF99` when selected). Household, Region and Gender are lime; Daily meal structure and
 * Dietary preference are gold. That is carried as `tone` so the screen never picks a colour.
 */

/** Every field the V8 page collects, in the order `338:4511` draws them. */
export type ProfileFieldId =
  | 'name'
  | 'householdStructure'
  | 'mealStructure'
  | 'pressingIssue'
  | 'dietaryPreference'
  | 'grownUpEating'
  | 'regionPreference'
  | 'genderPreference';

/** The two chip treatments `338:4511` draws. Never chosen by the screen. */
export type ProfileChipTone = 'lime' | 'gold';

export interface ProfileOption {
  readonly id: string;
  /** The chip's drawn word, verbatim from the frame. */
  readonly label: string;
}

interface ProfileFieldBase {
  readonly id: ProfileFieldId;
  /** The label exactly as drawn, INCLUDING the `*` where the frame carries one. */
  readonly label: string;
  /** True only where the drawn label carries a `*`. */
  readonly required: boolean;
}

export interface ProfileTextField extends ProfileFieldBase {
  readonly kind: 'text';
  readonly placeholder: string;
}

export interface ProfileChoiceField extends ProfileFieldBase {
  readonly kind: 'single' | 'multi';
  readonly tone: ProfileChipTone;
  /** Fixed options. Absent on `grownUpEating`, whose values are open — see `ProfileEntryField`. */
  readonly options: readonly ProfileOption[];
  /** Grid track count: `456:3405` is 2 columns, `341:4647` is 3. */
  readonly columns: number;
}

/**
 * `341:4655` — a search field that FILTERS a published vocabulary and adds the match.
 *
 * ## It used to accept anything, and that was the defect
 *
 * The control was free text: whatever the customer typed became a chip. So "It's okay", a
 * half-typed "Rajasth", a typo and "Rajasthani food" were four different stored answers for at
 * most one real preference, and the column filled with values nothing downstream could group,
 * count or match a cook against. The founder's rule is explicit — this field takes a cuisine, not
 * a sentence.
 *
 * It is now a picker: typing narrows `options` and only a value FROM that list can be added. The
 * closed set is the whole point, so `validation.ts` enforces it rather than the screen.
 *
 * ## Where the vocabulary comes from, and where it should come from
 *
 * BACKEND_GAP_GROWN_UP_FOOD_CATALOGUE is still open: no endpoint publishes a cuisine list.
 * `GET /v1/catalogue` carries pricing, the operating window, cancellation bands, extension options
 * and the meal-brief diet axis, and nothing resembling a regional-cuisine vocabulary — so the list
 * below is bundled with the client, which means re-wording or extending it costs a release.
 *
 * That is a known interim position, taken because the alternative in production is worse: a free
 * field writing ungroupable strings into durable customer data. `cook_profiles.cuisines` already
 * exists on the backend as the same kind of value, which is where the shared vocabulary belongs —
 * see `docs/FRONTEND_BACKEND_PENDING.md`.
 *
 * The three names on the frame (`341:4652`) — Rajasthani, Bihari, Odiya — are members of this list
 * rather than its whole extent, and the " food" suffix is the frame's own wording.
 */
export interface ProfileEntryField extends ProfileFieldBase {
  readonly kind: 'entry';
  readonly placeholder: string;
  /**
   * The values that may be added. Multi-select: presence in the answer IS the selection, so there
   * is no `columns` — the chosen ones are drawn as `341:4652` removable chips, not as a grid.
   */
  readonly options: readonly ProfileOption[];
}

/**
 * The cuisine vocabulary offered by `341:4655`.
 *
 * Ordered roughly by how commonly each is claimed as a household's own cooking, not
 * alphabetically: the list is read top-down under a search box, and the first screenful should be
 * the likely answers. Search reorders it anyway the moment anything is typed.
 *
 * `id` is kebab-case for consistency with every other option in this file, but note that what is
 * SUBMITTED for this field is the LABEL, not the id — see `validation.ts`. The backend stores
 * these as free strings (`MAX_GROWN_UP_EATING_LENGTH`), and a saved answer from before this list
 * existed still round-trips and can still be removed.
 */
export const PROFILE_GROWN_UP_FOOD_OPTIONS: readonly ProfileOption[] = [
  { id: 'north-indian', label: 'North Indian food' },
  { id: 'south-indian', label: 'South Indian food' },
  { id: 'punjabi', label: 'Punjabi food' },
  { id: 'rajasthani', label: 'Rajasthani food' },
  { id: 'gujarati', label: 'Gujarati food' },
  { id: 'maharashtrian', label: 'Maharashtrian food' },
  { id: 'bengali', label: 'Bengali food' },
  { id: 'bihari', label: 'Bihari food' },
  { id: 'odiya', label: 'Odiya food' },
  { id: 'assamese', label: 'Assamese food' },
  { id: 'tamil', label: 'Tamil food' },
  { id: 'kerala', label: 'Kerala food' },
  { id: 'andhra', label: 'Andhra food' },
  { id: 'telangana', label: 'Telangana food' },
  { id: 'karnataka', label: 'Karnataka food' },
  { id: 'chettinad', label: 'Chettinad food' },
  { id: 'hyderabadi', label: 'Hyderabadi food' },
  { id: 'awadhi', label: 'Awadhi food' },
  { id: 'mughlai', label: 'Mughlai food' },
  { id: 'kashmiri', label: 'Kashmiri food' },
  { id: 'goan', label: 'Goan food' },
  { id: 'sindhi', label: 'Sindhi food' },
  { id: 'marwari', label: 'Marwari food' },
  { id: 'konkani', label: 'Konkani food' },
  { id: 'jain', label: 'Jain food' },
  { id: 'indo-chinese', label: 'Indo-Chinese food' },
  { id: 'continental', label: 'Continental food' },
];

export type ProfileField = ProfileTextField | ProfileChoiceField | ProfileEntryField;

/** `456:3389` — the intro line, Livvic Bold 14/20. */
export const PROFILE_DETAILS_INTRO =
  'Please tell us about your meal structure, so that we can serve you better!';

/** `I338:4510;53:126` — the header title. */
export const PROFILE_DETAILS_TITLE = 'Profile';

/** `338:4559` — the CTA label. */
export const PROFILE_DETAILS_CTA = 'Confirm';

/** `341:4629` — the group heading above Region and Gender. It collects no value of its own. */
export const PROFILE_COOK_PREFERENCE_LABEL = 'Cook preference';

export const PROFILE_FIELDS: readonly ProfileField[] = [
  /** `456:3390` — the only field the backend can currently store. */
  { id: 'name', kind: 'text', label: 'Name*', required: true, placeholder: 'Name*' },

  {
    id: 'householdStructure',
    kind: 'single',
    label: 'Household structure',
    required: false,
    tone: 'lime',
    columns: 2,
    options: [
      { id: 'family-with-kids', label: 'Family with kids' },
      { id: 'family-with-no-kids', label: 'Family with no kids' },
      { id: 'family-with-elderly', label: 'Family with elderly' },
      { id: 'bachelors', label: 'Bachelors' },
    ],
  },

  {
    id: 'mealStructure',
    kind: 'single',
    label: 'Daily meal structure*',
    required: true,
    tone: 'gold',
    columns: 2,
    options: [
      { id: 'daily-cook-2x', label: 'Daily cook with 2x visits' },
      { id: 'daily-cook-1x', label: 'Daily cook with 1x visit' },
      { id: 'self-or-family', label: 'Cook by myself/ family' },
      // `456:3427` carries a trailing space in the frame; the drawn word is trimmed here.
      { id: 'office-and-delivery', label: 'Office meals + food delivery' },
    ],
  },

  {
    id: 'pressingIssue',
    kind: 'text',
    label: 'What is the most pressing issue with your meals today?',
    required: false,
    placeholder: 'I don’t like my cook because ...',
  },

  {
    id: 'dietaryPreference',
    kind: 'single',
    label: 'Dietary preference*',
    required: true,
    tone: 'gold',
    columns: 2,
    options: [
      { id: 'vegan', label: 'Vegan' },
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'eggetarian', label: 'Eggetarian' },
      { id: 'non-vegetarian', label: 'Non-vegetarian' },
    ],
  },

  {
    id: 'grownUpEating',
    kind: 'entry',
    label: 'What food have you grown up eating?',
    required: false,
    // `341:4678` — the frame's own placeholder, and now also the first thing the open list offers.
    placeholder: 'Rajasthani food',
    options: PROFILE_GROWN_UP_FOOD_OPTIONS,
  },

  {
    id: 'regionPreference',
    kind: 'single',
    label: 'Region preference',
    required: false,
    tone: 'lime',
    columns: 3,
    options: [
      { id: 'north-indian', label: 'North Indian' },
      { id: 'south-indian', label: 'South Indian' },
      { id: 'my-state', label: 'My state' },
    ],
  },

  {
    id: 'genderPreference',
    kind: 'single',
    label: 'Gender preference',
    required: false,
    tone: 'lime',
    columns: 3,
    options: [
      { id: 'female', label: 'Female' },
      { id: 'male', label: 'Male' },
      { id: 'either', label: 'Either' },
    ],
  },
] as const;

/** The three starred fields, derived from the catalogue so the two can never disagree. */
export const PROFILE_REQUIRED_FIELDS: readonly ProfileFieldId[] = PROFILE_FIELDS.filter(
  (field) => field.required,
).map((field) => field.id);

export function profileField(id: ProfileFieldId): ProfileField {
  const found = PROFILE_FIELDS.find((field) => field.id === id);
  // Unreachable: `ProfileFieldId` is derived from the catalogue itself.
  if (found === undefined) throw new Error(`Unknown profile field: ${id}`);
  return found;
}

/** The five chip groups. Narrowed here so the screen never casts. */
export type ProfileChoiceFieldId =
  | 'householdStructure'
  | 'mealStructure'
  | 'dietaryPreference'
  | 'regionPreference'
  | 'genderPreference';

export function profileChoiceField(id: ProfileChoiceFieldId): ProfileChoiceField {
  const field = profileField(id);
  if (field.kind !== 'single' && field.kind !== 'multi') {
    throw new Error(`Profile field is not a choice: ${id}`);
  }
  return field;
}

/** The two free-text fields and the one open-entry field, narrowed for their placeholders. */
export function profilePromptField(
  id: 'name' | 'pressingIssue' | 'grownUpEating',
): ProfileTextField | ProfileEntryField {
  const field = profileField(id);
  if (field.kind !== 'text' && field.kind !== 'entry') {
    throw new Error(`Profile field has no placeholder: ${id}`);
  }
  return field;
}
