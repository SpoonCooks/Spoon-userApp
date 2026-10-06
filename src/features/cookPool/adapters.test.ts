import { DISH_GLYPHS } from '@ui';
import { cookCardContentFor } from '@ui/components/cookCardContent';

import {
  cookPoolSummaryFrom,
  cookProfileFrom,
  deckCooksFrom,
  groupDishes,
  shortNameOf,
} from './adapters';
import type { PoolCookCardDto, PoolCookProfileDto } from './api';

function card(overrides: Partial<PoolCookCardDto> = {}): PoolCookCardDto {
  return {
    cookId: 'cook-sanchita',
    profileCode: 'COOK_SANCHITA',
    displayName: 'Cook Sanchita',
    profileImageUrl: null,
    region: 'West Bengal',
    languages: [],
    cuisines: [],
    specialties: null,
    gender: null,
    spoonTrained: true,
    backgroundVerified: true,
    hygieneVerified: true,
    specialtyDishes: [
      { dishKey: 'palak-paneer', label: 'Palak paneer', dietCategory: 'veg', displayOrder: 1 },
      { dishKey: 'mustard-fish', label: 'Mustard fish', dietCategory: 'non_veg', displayOrder: 2 },
      { dishKey: 'chola-bhatura', label: 'Chola bhatura', dietCategory: 'veg', displayOrder: 3 },
      { dishKey: 'egg-masala-curry', label: 'Egg curry', dietCategory: 'egg', displayOrder: 4 },
    ],
    profileVariant: 'mixed',
    rating: { average: 4.46, count: 12 },
    visitsWithYou: 45,
    ...overrides,
  };
}

describe('Cook Pool adapters', () => {
  it('captions the pool with short names, in the backend’s order, at the minimum it is given', () => {
    const summary = cookPoolSummaryFrom(
      {
        cooks: [
          {
            cook: card({ cookId: 'rekha', displayName: 'Cook Rekha', profileCode: null }),
            available: true,
            addedAt: '2026-10-02T00:00:00.000Z',
          },
          { cook: card(), available: false, addedAt: '2026-10-01T00:00:00.000Z' },
        ],
        count: 2,
      },
      3,
    );

    expect(summary.minimumSize).toBe(3);
    expect(summary.members.map((member) => [member.cookId, member.name])).toEqual([
      ['rekha', 'Rekha'],
      ['cook-sanchita', 'Sanchita'],
    ]);
    // No hosted photo and no profile code: no photo rather than someone else's.
    expect(summary.members[0]?.photo).toBeUndefined();
  });

  it('keeps a name with no honorific as it is', () => {
    expect(shortNameOf('Sanchita')).toBe('Sanchita');
  });

  it('prefers a hosted photo, else the bundled one the profile code resolves', () => {
    // Jest's asset stub resolves no uri, so the bundled tier is compared as it resolves here.
    const bundled = cookCardContentFor('COOK_SANCHITA')?.photoUrl;
    expect(deckCooksFrom([card()])[0]?.photo).toEqual(
      bundled === undefined ? undefined : { uri: bundled },
    );
    expect(
      deckCooksFrom([card({ profileImageUrl: 'https://cdn.test/sanchita.webp' })])[0]?.photo,
    ).toEqual({ uri: 'https://cdn.test/sanchita.webp' });
  });

  it('draws Region, visits and the rating as the header lines', () => {
    const [profile] = deckCooksFrom([card()]);
    expect(profile?.details).toEqual([{ id: 'region', label: 'Region', value: 'West Bengal' }]);
    expect(profile?.stats).toEqual([
      { id: 'visits', label: 'No. of visits', value: '45' },
      { id: 'rating', label: 'Rating', value: '4.5', icon: 'star' },
    ]);
  });

  it('leaves out a region it was not sent and a rating nobody has given', () => {
    const [profile] = deckCooksFrom([card({ region: null, rating: { average: 0, count: 0 } })]);
    expect(profile?.details).toEqual([]);
    expect(profile?.stats.map((line) => line.id)).toEqual(['visits']);
  });

  it('groups a candidate’s dishes by diet, in the order they arrive', () => {
    const [profile] = deckCooksFrom([card()]);
    expect(profile?.inPool).toBe(false);
    expect(
      profile?.menu.map((section) => [section.title, section.dishes.map((d) => d.name)]),
    ).toEqual([
      ['Veg', ['Palak paneer', 'Chola bhatura']],
      ['Non Veg', ['Mustard fish']],
      ['Egg', ['Egg curry']],
    ]);
    expect(groupDishes([]).length).toBe(0);
  });

  it('pictures a dish with the food mark the cook’s own card pairs with its key', () => {
    const [profile] = deckCooksFrom([card()]);
    const dishes = profile?.menu.flatMap((section) => section.dishes) ?? [];
    expect(dishes.find((dish) => dish.id === 'palak-paneer')?.image).toBe(DISH_GLYPHS.sugarCubes);
    expect(dishes.find((dish) => dish.id === 'mustard-fish')?.image).toBe(DISH_GLYPHS.fish);
    // No card content for the cook: no picture, rather than another cook's.
    const unknown = deckCooksFrom([card({ profileCode: null })])[0];
    expect(unknown?.menu[0]?.dishes[0]?.image).toBeUndefined();
  });

  it('builds a profile from its grouped menu, skipping a category it has no title for', () => {
    const dto: PoolCookProfileDto = {
      cook: card(),
      available: true,
      inPool: true,
      addedAt: '2026-10-01T00:00:00.000Z',
      dishesByCategory: [
        { category: 'jain', dishes: [card().specialtyDishes[0]!] },
        { category: 'non_veg', dishes: [card().specialtyDishes[1]!] },
      ],
    };
    const profile = cookProfileFrom(dto);
    expect(profile.name).toBe('Cook Sanchita');
    expect(profile.inPool).toBe(true);
    expect(profile.menu.map((section) => section.id)).toEqual(['non_veg']);
  });
});
