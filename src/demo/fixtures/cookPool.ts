import type { ImageSourcePropType } from 'react-native';

import type { CookMenuSection, CookPoolState, ServedCook } from '@features/cookPool';

/**
 * DEMO FIXTURES — NOT PRODUCTION DATA.
 *
 * The Cook Pool as a household that has been served by four cooks and has not built its pool yet
 * (`844:5842`) — the dev preview's local store (`createDemoCookPoolSource`), which runs with no
 * session. The app reads the same screens from DEC-085's `/v1/me/cooks` routes.
 *
 * Every dish shows the one sample plate the frames draw (`755:2365`).
 */

const DISH = require('../../../assets/figma/cookpool/sample-dish.webp') as ImageSourcePropType;
const SANCHITA = require('../../../assets/figma/cook/sanchita-photo.webp') as ImageSourcePropType;
const REKHA = require('../../../assets/figma/cook/rekha-photo.webp') as ImageSourcePropType;
const JYOTI = require('../../../assets/figma/cook/jyoti-photo.webp') as ImageSourcePropType;
const BARSHA = require('../../../assets/figma/cook/barsha-photo.webp') as ImageSourcePropType;

function section(cook: string, id: string, title: string, dishes: readonly string[]) {
  return {
    id: `${cook}-${id}`,
    title,
    dishes: dishes.map((name) => ({
      id: `${cook}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      name,
      image: DISH,
    })),
  } satisfies CookMenuSection;
}

/** `1380:3196` — as the adapter builds them from a cook card. */
function lines(region: string, languages: string, visits: number, rating: string) {
  return {
    badges: ['Spoon trained', 'Verified'],
    details: [
      { id: 'region', value: region },
      { id: 'languages', value: `Speaks ${languages}` },
    ],
    stats: [
      { id: 'visits', label: 'Visits with you', value: String(visits) },
      { id: 'rating', label: 'Rating', value: rating, icon: 'star' },
    ],
  };
}

const SANCHITA_COOK: ServedCook = {
  cookId: 'demo-pool-sanchita',
  name: 'Cook Sanchita',
  shortName: 'Sanchita',
  photo: SANCHITA,
  ...lines('West Bengal', 'Hindi, Bengali', 45, '4.5'),
  menu: [
    section('sanchita', 'veg', 'Curries/ sabzis- Veg', [
      'Dahi bhindi',
      'Aloo posto',
      'Shukto',
      'Chhanar dalna',
      'Begun bhaja',
    ]),
    section('sanchita', 'non-veg', 'Curries/ sabzis- Non Veg', [
      'Macher jhol',
      'Chicken kosha',
      'Egg curry',
      'Chingri malai',
    ]),
    section('sanchita', 'breakfast', 'Breakfast', ['Luchi', 'Poha', 'Aloo paratha', 'Upma']),
    section('sanchita', 'one-pot', 'One pot recipes', ['Khichuri', 'Veg pulao', 'Chicken biryani']),
    section('sanchita', 'snacks', 'Snacks', ['Ghugni', 'Veg chop', 'Samosa']),
    section('sanchita', 'salads', 'Salads', ['Kachumber', 'Sprouts chaat']),
    section('sanchita', 'drinks', 'Drinks', ['Masala chai', 'Aam panna', 'Lassi']),
  ],
};

const REKHA_COOK: ServedCook = {
  cookId: 'demo-pool-rekha',
  name: 'Cook Rekha',
  shortName: 'Rekha',
  photo: REKHA,
  ...lines('West Bengal', 'Hindi, Bengali', 12, '4.8'),
  menu: [
    section('rekha', 'veg', 'Curries/ sabzis- Veg', [
      'Palak paneer',
      'Dal tadka',
      'Mix veg',
      'Rajma',
    ]),
    section('rekha', 'breakfast', 'Breakfast', ['Aloo paratha', 'Besan chilla', 'Idli']),
    section('rekha', 'one-pot', 'One pot recipes', ['Veg pulao', 'Dal khichdi']),
    section('rekha', 'drinks', 'Drinks', ['Masala chai', 'Lassi']),
  ],
};

const JYOTI_COOK: ServedCook = {
  cookId: 'demo-pool-jyoti',
  name: 'Cook Jyoti',
  shortName: 'Jyoti',
  photo: JYOTI,
  ...lines('Odisha', 'Hindi, Odia', 8, '4.6'),
  menu: [
    section('jyoti', 'veg', 'Curries/ sabzis- Veg', ['Dalma', 'Santula', 'Aloo bharta']),
    section('jyoti', 'non-veg', 'Curries/ sabzis- Non Veg', ['Chicken curry', 'Fish fry']),
    section('jyoti', 'snacks', 'Snacks', ['Pakoda', 'Bara']),
  ],
};

const BARSHA_COOK: ServedCook = {
  cookId: 'demo-pool-barsha',
  name: 'Cook Barsha',
  shortName: 'Barsha',
  photo: BARSHA,
  ...lines('West Bengal', 'Hindi, Bengali', 3, '4.2'),
  menu: [
    section('barsha', 'veg', 'Curries/ sabzis- Veg', ['Aloo dum', 'Cholar dal', 'Labra']),
    section('barsha', 'breakfast', 'Breakfast', ['Poha', 'Upma']),
  ],
};

/** `844:5842` — four cooks have served the household; its pool is empty; it needs two. */
export const DEMO_COOK_POOL: CookPoolState = {
  minimumSize: 2,
  servedCooks: [SANCHITA_COOK, REKHA_COOK, JYOTI_COOK, BARSHA_COOK],
  poolIds: [],
};
