import { render } from '@testing-library/react-native';

import { TrustBadges } from './TrustBadges';

/**
 * The trust row's geometry.
 *
 * Reported off a handset: the three badges did not line up, horizontally or vertically. Both
 * causes were in the layout rather than in the art, and both are the kind of thing a render test
 * can hold still — a style regression here shows up as a crooked row on a card the customer is
 * deciding to trust.
 */

const ALL = { spoonTrained: true, backgroundVerified: true, hygienic: true } as const;

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (merged, entry) => ({ ...merged, ...flatten(entry) }),
      {},
    );
  }
  return (style ?? {}) as Record<string, unknown>;
}

describe('TrustBadges layout', () => {
  it('gives every badge an equal share of the row', () => {
    const { getByTestId } = render(<TrustBadges badges={ALL} />);

    /*
     * The labels differ by more than a factor of two — "Hygienic" against "Background
     * Verified" — so any distribution that depends on their widths puts the three discs at
     * three arbitrary positions. Equal flex is what makes them land on thirds regardless.
     */
    for (const key of ['spoonTrained', 'backgroundVerified', 'hygienic']) {
      expect(flatten(getByTestId(`trust-badges-${key}`).props.style)['flex']).toBe(1);
    }
  });

  it('centres each badge within its own share', () => {
    const { getByTestId } = render(<TrustBadges badges={ALL} />);
    for (const key of ['spoonTrained', 'backgroundVerified', 'hygienic']) {
      expect(flatten(getByTestId(`trust-badges-${key}`).props.style)['alignItems']).toBe('center');
    }
  });

  it('aligns the row to the top so every disc sits on one line', () => {
    // `center` let each item float to its own vertical position, and the items are unequal
    // heights — which is the vertical half of the report.
    const { getByTestId } = render(<TrustBadges badges={ALL} />);
    expect(flatten(getByTestId('trust-badges').props.style)['alignItems']).toBe('flex-start');
  });

  it('still lays out correctly when only some badges are earned', () => {
    // Two badges must split the row in half, not sit as a third and a third with a gap.
    const { getByTestId, queryByTestId } = render(
      <TrustBadges badges={{ spoonTrained: true, hygienic: true }} />,
    );
    expect(queryByTestId('trust-badges-backgroundVerified')).toBeNull();
    for (const key of ['spoonTrained', 'hygienic']) {
      expect(flatten(getByTestId(`trust-badges-${key}`).props.style)['flex']).toBe(1);
    }
  });

  it('renders nothing at all when no badge is earned', () => {
    const { queryByTestId } = render(<TrustBadges badges={{}} />);
    expect(queryByTestId('trust-badges')).toBeNull();
  });
});
