/**
 * Static Home content. The dev notes put use cases and "not included" in remote config; until
 * that exists these are the frames' copy. The cook cards are trust content, not selectable.
 */

export const USE_CASES = [
  {
    title: 'Sleep for longer',
    body: [
      'Tiffins packed, super healthy breakfast prepared, all while you enjoyed your morning carefree',
    ],
  },
  {
    title: 'Lunch served right off the stove!',
    body: [
      'Why eat reheated rotis? Or spend time making them?',
      'High time to stop combining breakfast & lunch. No you won’t pay extra with Spoon!',
    ],
  },
  {
    title: 'Crave guilt-free',
    body: [
      'Time to convert those saved ‘Reels’ & ‘Shorts’ into actual food. Snacks made healthy in just 30 minutes.',
    ],
  },
  {
    title: 'Call over friends/ family without worry',
    body: [
      'Worried about who will manage all the extra cooking? We got you covered, go arrange that get-together',
    ],
  },
  {
    title: 'Annoying to attend cook’s call in the office?',
    body: [
      'Quit getting disrupted during meetings or come home to a dinner you don’t feel like eating.',
    ],
  },
] as const;

export const DISH_TYPES = [
  { id: 'simple', label: 'Simple (dal, roti, sabzi)' },
  { id: 'complex', label: 'Complex (biryani, kofta)' },
] as const;

/**
 * `1290:1280` — the stack's cards in the order they rise in (`Cook card · 1`…`4`), so the last,
 * Sucharita, lands on top. `photo` indexes `ART.cooks` (`imgHeaderImage…3`).
 */
export const COOKS = [
  { name: 'Cook Sanchita', region: 'Assam', rating: 5, photo: 0 },
  { name: 'Cook Rekha', region: 'Assam', rating: 5, photo: 1 },
  { name: 'Cook Jyoti', region: 'Bihar', rating: 5, photo: 2 },
  { name: 'Cook Sucharita', region: 'West Bengal', rating: 5, photo: 3 },
] as const;

export const TRUST_POINTS = [
  { title: 'Trained · Hygienic', body: 'Trained across regional flavors for the familiar taste' },
  { title: 'Verified · Trusted', body: 'Aadhar, PAN verified & address checked before day one' },
  { title: 'Skilled · Adaptable', body: 'Skilled in cooking food as per your saved preferences' },
] as const;

export const EXCLUSIONS = [
  'Buying groceries',
  'Full kitchen cleaning',
  'Deep stove cleaning',
  'Washing stale utensils',
  'Running fancy appliances',
] as const;

/**
 * The message the share sheet prefills.
 *
 * TODO(product): placeholder copy and no store link yet — neither is in the frames.
 */
export const SHARE_MESSAGE = 'I use Spoon to get a trained cook home in minutes. Try it!';
