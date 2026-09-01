import { Image, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  DEMO_COOK_JYOTI,
  DEMO_COOK_MINIMAL,
  DEMO_COOK_PARTIAL_BADGES,
  DEMO_COOK_REKHA,
} from '@/demo/fixtures/cooks';
import { CookCard } from './CookCard';

/** Concatenates every string leaf in a rendered tree. */
function renderedText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(renderedText).join(' ');
  if (node !== null && typeof node === 'object' && 'children' in node) {
    return renderedText((node as { children: unknown }).children);
  }
  return '';
}

describe('CookCard — standard', () => {
  it('renders a languages attribute when the payload carries one', () => {
    // `289:7392` (Jyoti) is the card that DOES list languages; `289:8388` (Rekha) does not.
    render(<CookCard cook={DEMO_COOK_JYOTI} />);
    expect(screen.getByText('Hindi, Odiya')).toBeTruthy();
  });

  it('renders identity, attributes and the specialty grid', () => {
    render(<CookCard cook={DEMO_COOK_REKHA} />);

    expect(screen.getByText('Cook Rekha')).toBeTruthy();
    expect(screen.getByText('Female')).toBeTruthy();
    expect(screen.getByText('North Indian')).toBeTruthy();
    expect(screen.getByText('West Bengal')).toBeTruthy();
    expect(screen.getByText('Chicken biryani')).toBeTruthy();
  });

  it('interpolates the cook name into the heading instead of hardcoding "rekha"', () => {
    // The Figma file says "What rekha cooks best?" on 6 of 8 cards (defect D-4).
    render(<CookCard cook={DEMO_COOK_PARTIAL_BADGES} />);

    expect(screen.getByText('What Sanchita cooks best?')).toBeTruthy();
    expect(screen.queryByText('What rekha cooks best?')).toBeNull();
  });
});

describe('CookCard — pureVeg variant', () => {
  it('shows the pure-veg dish list instead of the standard one', () => {
    render(<CookCard cook={DEMO_COOK_REKHA} variant="pureVeg" />);

    expect(screen.getByText('Baigan palak aloo')).toBeTruthy();
    // Chicken biryani is a standard-only dish.
    expect(screen.queryByText('Chicken biryani')).toBeNull();
  });

  it('changes nothing but the dish list — same cook, same identity, same badges', () => {
    // Confirmed C-6: pure veg is a dish filter on the same cook, not a second roster.
    const standard = render(<CookCard cook={DEMO_COOK_REKHA} />);
    const standardName = screen.getByText('Cook Rekha');
    const standardBadges = screen.getByTestId('cook-card-badges');
    expect(standardName).toBeTruthy();
    expect(standardBadges).toBeTruthy();
    standard.unmount();

    render(<CookCard cook={DEMO_COOK_REKHA} variant="pureVeg" />);

    expect(screen.getByText('Cook Rekha')).toBeTruthy();
    expect(screen.getByText('West Bengal')).toBeTruthy();
    expect(screen.getByTestId('cook-card-badges-spoonTrained')).toBeTruthy();
  });

  it('renders nothing for the grid when the variant has no dishes', () => {
    render(<CookCard cook={DEMO_COOK_PARTIAL_BADGES} variant="pureVeg" />);

    expect(screen.queryByTestId('cook-card-specialties')).toBeNull();
    expect(screen.getByText('Cook Sanchita')).toBeTruthy();
  });
});

describe('CookCard — trust badges are conditional', () => {
  it('renders only the badges that are earned', () => {
    render(<CookCard cook={DEMO_COOK_PARTIAL_BADGES} />);

    expect(screen.getByTestId('cook-card-badges-spoonTrained')).toBeTruthy();
    expect(screen.queryByTestId('cook-card-badges-backgroundVerified')).toBeNull();
    // Hygienic must never be assumed true.
    expect(screen.queryByTestId('cook-card-badges-hygienic')).toBeNull();
  });

  it('hides the row entirely when nothing is earned', () => {
    render(<CookCard cook={DEMO_COOK_MINIMAL} />);

    expect(screen.queryByTestId('cook-card-badges')).toBeNull();
  });

  it('never shows Hygienic for a cook whose flag is explicitly false', () => {
    render(
      <CookCard
        cook={{
          ...DEMO_COOK_REKHA,
          badges: { spoonTrained: true, backgroundVerified: true, hygienic: false },
        }}
      />,
    );

    expect(screen.queryByTestId('cook-card-badges-hygienic')).toBeNull();
    expect(screen.getByTestId('cook-card-badges-backgroundVerified')).toBeTruthy();
  });
});

describe('CookCard — optional fields', () => {
  it('renders with only a name supplied', () => {
    render(<CookCard cook={DEMO_COOK_MINIMAL} />);

    expect(screen.getByText('Cook Jyoti')).toBeTruthy();
    expect(screen.queryByTestId('cook-card-attributes')).toBeNull();
    expect(screen.queryByTestId('cook-card-specialties')).toBeNull();
  });

  it('falls back to initials when no photo is supplied', () => {
    render(<CookCard cook={DEMO_COOK_MINIMAL} />);

    expect(screen.getByText('CJ')).toBeTruthy();
  });

  it('hides the specialty grid when suppressed', () => {
    render(<CookCard cook={DEMO_COOK_REKHA} showSpecialties={false} />);

    expect(screen.queryByTestId('cook-card-specialties')).toBeNull();
  });
});

describe('CookCard — calling', () => {
  it('invokes the callback and labels the action with the cook name', () => {
    const onCallCook = jest.fn();
    render(<CookCard cook={DEMO_COOK_REKHA} onCallCook={onCallCook} />);

    const call = screen.getByTestId('cook-card-call');
    expect(call.props.accessibilityLabel).toBe('Call Rekha');

    fireEvent.press(call);
    expect(onCallCook).toHaveBeenCalledTimes(1);
  });

  it('hides the action when no callback is supplied', () => {
    render(<CookCard cook={DEMO_COOK_REKHA} />);

    expect(screen.queryByTestId('cook-card-call')).toBeNull();
  });

  it('exposes no phone number anywhere in the rendered tree', () => {
    // The view model has no phone field at all: the component cannot leak one.
    const onCallCook = jest.fn();
    render(<CookCard cook={DEMO_COOK_REKHA} onCallCook={onCallCook} />);

    // Scan the rendered TEXT, not the style tree (which legitimately contains long numbers).
    const text = renderedText(screen.toJSON());
    expect(text).not.toMatch(/(?:\+91[\s-]?)?[6-9]\d{9}/);
    expect(text).not.toMatch(/tel:/);
    // And the view model has no phone field at all, so there is nothing to leak.
    expect(Object.keys(DEMO_COOK_REKHA)).not.toContain('phone');
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/"(phone|mobile|tel)"\s*:/i);
  });
});

/**
 * `289:7520` — where the photograph is cropped.
 *
 * All eight frames draw the portrait as an 89 × 134 box at `(−0.889, −12)` inside the 85 × 90
 * panel, so 12 of the 44pt of vertical overflow sits above the face and 32 below it.
 * `resizeMode="cover"` centres instead, which discarded 18.75 from the top of Cook Rekha's 2:3
 * portrait and cut her hair off. The other three exports are square and have no vertical overflow
 * at all, which is why this read as one cook's photo being broken rather than the rule being wrong.
 */
describe('the cook photograph is cropped where the design crops it', () => {
  const PANEL_WIDTH = 85;
  const PANEL_HEIGHT = 90;

  function cropAfterLoad(source: { width: number; height: number }) {
    render(<CookCard cook={{ ...DEMO_COOK_REKHA, photoUrl: 'https://cdn.example/r.png' }} />);
    const image = screen.getByTestId('cook-card-avatar').findByType(Image);
    fireEvent(image, 'load', { nativeEvent: { source } });
    return StyleSheet.flatten(image.props.style) as Record<string, number>;
  }

  it('keeps a 2:3 portrait from losing the top of the head', () => {
    // Cook Rekha's export is 512 × 768.
    const crop = cropAfterLoad({ width: 512, height: 768 });

    expect(crop['width']).toBeCloseTo(PANEL_WIDTH, 3);
    expect(crop['height']).toBeCloseTo(127.5, 1);
    // The frame's share of the overflow, not half of it.
    expect(crop['top']).toBeCloseTo(-(127.5 - PANEL_HEIGHT) * (12 / 44), 2);
    // The regression this exists to catch: a centred cover took 18.75 off the top.
    expect(Math.abs(crop['top'] ?? 0)).toBeLessThan(18.75);
  });

  it('leaves a square portrait exactly where it was', () => {
    // The other three exports are 512 × 512: they cover the panel by HEIGHT, so there is no
    // vertical overflow to bias and this rule must not move them.
    const crop = cropAfterLoad({ width: 512, height: 512 });

    expect(crop['height']).toBeCloseTo(PANEL_HEIGHT, 3);
    expect(crop['top']).toBeCloseTo(0, 6);
    expect(crop['left']).toBeCloseTo(-(PANEL_HEIGHT - PANEL_WIDTH) / 2, 3);
  });

  it('guesses no crop before the source reports its size', () => {
    render(<CookCard cook={{ ...DEMO_COOK_REKHA, photoUrl: 'https://cdn.example/r.png' }} />);
    const style = StyleSheet.flatten(
      screen.getByTestId('cook-card-avatar').findByType(Image).props.style,
    ) as Record<string, unknown>;
    expect(style['width']).toBe('100%');
  });
});
