import { DISH_GLYPHS } from '@ui';
import { cookCardContentFor } from '@ui/components/cookCardContent';
import type { CookCardContent } from '@ui/components/cookCardContent';

import type {
  CookPoolListDto,
  CookSpecialtyDishDto,
  PoolCookCardDto,
  PoolCookProfileDto,
} from './api';
import type {
  CookDish,
  CookMenuSection,
  CookPoolImage,
  CookPoolSummary,
  CookProfile,
  CookProfileLine,
} from './types';

/**
 * DTO → view model, for the landing (`719:1507`), the deck card (`755:2347`) and the profile
 * (`719:1568`).
 *
 * Every value is the server's or honestly absent, the same rule as the booking `CookCard`
 * (`features/booking/adapters.ts`): no line is drawn for a field the backend did not send, and
 * nothing falls back to a fixture cook. The only bundled content is what the backend's stable
 * `profileCode` resolves in `cookCardContentFor` — never a name or a position.
 */

/**
 * The pool's minimum when Recurring's eligibility has not answered: the design's 2 (`844:5842`).
 * The backend's `unlockThreshold` replaces it as soon as it is read.
 */
export const DEFAULT_MINIMUM_SIZE = 2;

/**
 * The menu's section titles, by the backend's diet category. The frames title sections by course
 * and diet ("Curries/ sabzis- Non Veg", `755:2362`); the backend groups by diet alone, so the
 * diet half of the frames' wording is what is left. A category with no title here is not drawn
 * rather than drawn under an invented one.
 */
const CATEGORY_TITLES: Readonly<Record<string, string>> = {
  veg: 'Veg',
  non_veg: 'Non Veg',
  egg: 'Egg',
};

/** `Cook Sanchita` → `Sanchita`: the pool grid's caption. Mirrors the booking card's first name. */
export function shortNameOf(displayName: string): string {
  return displayName.replace(/^Cook\s+/iu, '');
}

/**
 * A hosted photo wins; else the cook's bundled photograph by `profileCode`, the same tier the
 * booking `CookCard` and Home's banner draw (`homeCookPhotoFor`). Neither: no photo, and the
 * place keeps its `#FFF7CC` ground.
 */
export function cookPhotoFor(
  card: Pick<PoolCookCardDto, 'profileImageUrl' | 'profileCode'>,
): CookPoolImage | undefined {
  const uri = card.profileImageUrl ?? cookCardContentFor(card.profileCode)?.photoUrl ?? null;
  return uri === null ? undefined : { uri };
}

export function cookPoolSummaryFrom(pool: CookPoolListDto, minimumSize: number): CookPoolSummary {
  return {
    minimumSize,
    members: pool.cooks.map(({ cook }) => ({
      cookId: cook.cookId,
      name: shortNameOf(cook.displayName),
      photo: cookPhotoFor(cook),
    })),
  };
}

/**
 * `1380:3196` — the trust marks over the name, the region and languages under it, and the visits
 * and the rating as the emphasised stats.
 *
 * The rating is the cook's OVERALL average: the card carries no rating of this household's own,
 * so it reads "Rating", not the design's "Your rating", until the backend sends one.
 */
function linesFor(card: PoolCookCardDto): {
  readonly badges: readonly string[];
  readonly details: readonly CookProfileLine[];
  readonly stats: readonly CookProfileLine[];
} {
  return {
    badges: [
      ...(card.spoonTrained ? ['Spoon trained'] : []),
      ...(card.backgroundVerified ? ['Verified'] : []),
    ],
    details: [
      ...(card.region === null ? [] : [{ id: 'region', value: card.region }]),
      ...(card.languages.length === 0
        ? []
        : [{ id: 'languages', value: `Speaks ${card.languages.join(', ')}` }]),
    ],
    stats: [
      { id: 'visits', label: 'Visits with you', value: String(card.visitsWithYou) },
      // An unrated cook's `average` is 0 — no rating yet, which is not "Rating: 0".
      ...(card.rating.count === 0
        ? []
        : [
            {
              id: 'rating',
              label: 'Rating',
              value: card.rating.average.toFixed(1),
              icon: 'star',
            },
          ]),
    ],
  };
}

/**
 * A dish's picture: the bundled food mark (`94:905`) the cook's own card pairs with the same
 * dish, matched by the backend's `dishKey` against the card content's dish ids. The backend
 * publishes no dish image yet (`docs/COOK_POOL_BACKEND.md` §2), so a dish the card does not
 * list draws no picture.
 */
function dishImageFor(
  content: CookCardContent | undefined,
  dishKey: string,
): CookPoolImage | undefined {
  if (content === undefined) return undefined;
  const dish = [...content.specialties, ...content.pureVegSpecialties].find(
    (entry) => entry.id === dishKey,
  );
  return dish?.glyph === undefined ? undefined : DISH_GLYPHS[dish.glyph];
}

function menuFrom(
  groups: readonly {
    readonly category: string;
    readonly dishes: readonly CookSpecialtyDishDto[];
  }[],
  content: CookCardContent | undefined,
): readonly CookMenuSection[] {
  return groups.flatMap((group) => {
    const title = CATEGORY_TITLES[group.category];
    if (title === undefined) return [];
    return [
      {
        id: group.category,
        title,
        dishes: group.dishes.map((dish): CookDish => ({
          // Dish favourites are keyed by this id (`favourites.ts`).
          id: dish.dishKey,
          name: dish.label,
          image: dishImageFor(content, dish.dishKey),
        })),
      },
    ];
  });
}

/**
 * The card's dishes grouped by category in the order they arrive — what the profile route
 * returns as `dishesByCategory`, rebuilt for a candidate card, which carries the flat list only.
 */
export function groupDishes(
  dishes: readonly CookSpecialtyDishDto[],
): readonly { readonly category: string; readonly dishes: readonly CookSpecialtyDishDto[] }[] {
  const groups = new Map<string, CookSpecialtyDishDto[]>();
  for (const dish of dishes) {
    const list = groups.get(dish.dietCategory) ?? [];
    list.push(dish);
    groups.set(dish.dietCategory, list);
  }
  return [...groups.entries()].map(([category, list]) => ({ category, dishes: list }));
}

function profileFrom(
  card: PoolCookCardDto,
  inPool: boolean,
  groups: readonly {
    readonly category: string;
    readonly dishes: readonly CookSpecialtyDishDto[];
  }[],
): CookProfile {
  const content = cookCardContentFor(card.profileCode);
  return {
    cookId: card.cookId,
    name: card.displayName,
    photo: cookPhotoFor(card),
    ...linesFor(card),
    menu: menuFrom(groups, content),
    inPool,
  };
}

/** One deck card per candidate, in the backend's order. A candidate is never in the pool. */
export function deckCooksFrom(candidates: readonly PoolCookCardDto[]): readonly CookProfile[] {
  return candidates.map((card) => profileFrom(card, false, groupDishes(card.specialtyDishes)));
}

export function cookProfileFrom(profile: PoolCookProfileDto): CookProfile {
  return profileFrom(profile.cook, profile.inPool, profile.dishesByCategory);
}
