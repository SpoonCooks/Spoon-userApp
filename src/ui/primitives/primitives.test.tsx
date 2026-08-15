import { fireEvent, render, screen } from '@testing-library/react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';
import { layout, lightColors, ratingFill } from '@ui/tokens/semantic';
import { palette } from '@ui/tokens/primitives';

import { Badge } from './Badge';
import { Button } from './Button';
import { Chip } from './Chip';
import { ChipGroup } from './ChipGroup';
import { DetailRows } from './DetailRows';
import { PriceTile } from './PriceTile';

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, entry) => ({ ...acc, ...flatten(entry) }),
      {},
    );
  }
  return typeof style === 'object' && style !== null ? (style as Record<string, unknown>) : {};
}

describe('Button', () => {
  it('presses, and reports disabled and busy state to assistive tech', () => {
    const onPress = jest.fn();
    const { rerender } = render(<Button label="Book Now" onPress={onPress} testID="btn" />);

    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('btn').props.accessibilityRole).toBe('button');

    rerender(<Button label="Book Now" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('btn').props.accessibilityState.disabled).toBe(true);

    rerender(<Button label="Book Now" onPress={onPress} loading testID="btn" />);
    expect(screen.getByTestId('btn').props.accessibilityState.busy).toBe(true);
    expect(screen.getByTestId('btn-spinner')).toBeTruthy();
  });

  it('meets the minimum touch target at every size', () => {
    expect(layout.minTouchTarget).toBeGreaterThanOrEqual(44);

    // `lg` (`37:3908`): 14pt padding each side around a 20pt line = 48pt, drawn.
    const lg = render(<Button label="Book Now" onPress={jest.fn()} testID="btn" />);
    const lgPadding = Number(flatten(screen.getByTestId('btn').props.style).paddingVertical);
    expect(lgPadding * 2 + 20).toBeGreaterThanOrEqual(layout.minTouchTarget);
    lg.unmount();

    // `bar` (`1:821`): the frame fixes the height at 34, so `hitSlop` supplies the rest.
    render(<Button label="Book Now" onPress={jest.fn()} size="bar" testID="btn" />);
    const bar = screen.getByTestId('btn');
    const barHeight = Number(flatten(bar.props.style).height);
    expect(barHeight).toBe(34);
    expect(barHeight + Number(bar.props.hitSlop) * 2).toBeGreaterThanOrEqual(layout.minTouchTarget);
  });

  it('draws every variant from semantic colour tokens, never a raw hex literal', () => {
    const variants = [
      // `1:821` — the CTA bar is `#FFD600` (`surfaceCta`), not the `#FFE666` tile yellow.
      ['primary', lightColors.surfaceCta],
      ['accent', lightColors.accentSecondary],
      ['inverse', lightColors.surfaceInverse],
      ['danger', lightColors.dangerSurface],
    ] as const;

    variants.forEach(([variant, expected]) => {
      const view = render(<Button label="x" onPress={jest.fn()} variant={variant} testID="btn" />);
      expect(flatten(screen.getByTestId('btn').props.style).backgroundColor).toBe(expected);
      view.unmount();
    });
  });
});

describe('Chip and ChipGroup', () => {
  it('announces selection and disabled state', () => {
    render(<Chip label="06:30 AM" selected onPress={jest.fn()} testID="chip" />);

    const chip = screen.getByTestId('chip');
    expect(chip.props.accessibilityState.selected).toBe(true);
    expect(chip.props.accessibilityState.disabled).toBe(false);
  });

  it('does not fire when disabled — availability is a server decision, rendered only', () => {
    const onPress = jest.fn();
    render(<Chip label="05:00 AM" disabled onPress={onPress} testID="chip" />);

    fireEvent.press(screen.getByTestId('chip'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('reads caption and label together for day chips', () => {
    render(<Chip label="Aug 7" caption="Fri" onPress={jest.fn()} testID="chip" />);

    expect(screen.getByTestId('chip').props.accessibilityLabel).toBe('Fri Aug 7');
  });

  it('selects a single option and exposes radio-group semantics', () => {
    const onSelect = jest.fn();
    render(
      <ChipGroup
        options={[
          { id: 'a', label: 'Morning' },
          { id: 'b', label: 'Evening', disabled: true },
        ]}
        selectedId="a"
        onSelect={onSelect}
        testID="group"
      />,
    );

    expect(screen.getByTestId('group').props.accessibilityRole).toBe('radiogroup');
    expect(screen.getByTestId('group-a').props.accessibilityState.selected).toBe(true);

    fireEvent.press(screen.getByTestId('group-b'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('PriceTile', () => {
  it('renders server-provided prices verbatim and never computes a discount', () => {
    render(
      <PriceTile
        density="wide"
        label="1.5 hr"
        price="₹189"
        strikePrice="₹450"
        badge="Popular"
        testID="tile"
      />,
    );

    expect(screen.getByText('₹189')).toBeTruthy();
    expect(screen.getByText('₹450')).toBeTruthy();
    expect(screen.getByText('Popular')).toBeTruthy();
  });

  it('draws the badge only at the density that has room for it', () => {
    // `1:788` draws the "Popular" chip; the 107 × 52 compact tile (`37:3779`) draws none, and on
    // device it landed on top of the label. The FLAG is still accepted either way.
    render(
      <PriceTile
        density="compact"
        label="1.5 hr"
        price="₹189"
        strikePrice="₹450"
        badge="Popular"
        testID="tile"
      />,
    );

    expect(screen.getByText('₹189')).toBeTruthy();
    expect(screen.queryByText('Popular')).toBeNull();
    // The flag still reaches assistive tech even though it is not drawn.
    expect(screen.getByTestId('tile').props.accessibilityLabel).toContain('Popular');
  });

  it('describes itself fully for screen readers', () => {
    render(<PriceTile label="1.5 hr" price="₹189" strikePrice="₹450" disabled testID="tile" />);

    expect(screen.getByTestId('tile').props.accessibilityLabel).toBe(
      '1.5 hr, ₹189, reduced from ₹450, unavailable',
    );
  });

  it('renders without a struck price when the server sends none', () => {
    render(<PriceTile label="1 hr" price="₹129" testID="tile" />);

    expect(screen.getByTestId('tile').props.accessibilityLabel).toBe('1 hr, ₹129');
  });
});

describe('Badge', () => {
  it('uses the presentation tone palette rather than a status lookup', () => {
    render(<Badge label="Completed" tone="positive" testID="badge" />);

    expect(flatten(screen.getByTestId('badge').props.style).backgroundColor).toBe(
      lightTheme.tones.positive.surface,
    );
  });
});

describe('DetailRows', () => {
  it('renders label/value pairs and computes nothing', () => {
    render(
      <DetailRows
        rows={[
          { label: 'Original Booking Paid', value: '₹135' },
          { label: 'Cancellation Processing Fee', value: '₹0' },
          { label: 'Refund Amount', value: '₹135', emphasis: 'total' },
        ]}
        testID="rows"
      />,
    );

    expect(screen.getByTestId('rows-row-0').props.accessibilityLabel).toBe(
      'Original Booking Paid: ₹135',
    );
    expect(screen.getByText('₹0')).toBeTruthy();
    expect(screen.getAllByText('₹135')).toHaveLength(2);
  });
});

describe('token layering', () => {
  it('maps every semantic colour onto a primitive, so components never need raw hex', () => {
    const primitiveValues = new Set<string>(Object.values(palette));

    Object.entries(lightColors).forEach(([name, value]) => {
      expect(primitiveValues.has(value)).toBe(true);
      expect(name).not.toMatch(/^#/);
    });
  });

  it('keeps the rating ramp on the semantic layer', () => {
    Object.values(ratingFill).forEach((value) => {
      expect(new Set<string>(Object.values(palette)).has(value)).toBe(true);
    });
  });
});
