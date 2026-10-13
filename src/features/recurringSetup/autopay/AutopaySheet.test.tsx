import { fireEvent, render, screen } from '@testing-library/react-native';

import { AutopaySheet } from './AutopaySheet';
import type { AutopaySheetProps } from './AutopaySheet';
import type { AutopayState } from './machine';
import { autopaySummary } from './summary';
import type { UpiApp } from './upiApps';

const APPS: UpiApp[] = [
  { id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app' },
  { id: 'gpay', name: 'Google Pay', packageName: null },
  { id: 'paytm', name: 'Paytm', packageName: null },
  { id: 'bhim', name: 'BHIM', packageName: null },
];
const NOW = Date.UTC(2026, 9, 13, 6, 0, 0);
const noop = () => undefined;

function renderSheet(state: AutopayState, overrides: Partial<AutopaySheetProps> = {}) {
  const props: AutopaySheetProps = {
    visible: true,
    state,
    summary: autopaySummary({
      plansCount: 2,
      visitsCount: 12,
      prices: [{ pricePaise: 29_900, gstPaise: 1_495 }],
      maxChargePaise: 100_000,
    }),
    apps: APPS,
    lastUsedId: 'phonepe',
    showAllApps: false,
    now: NOW,
    onPick: noop,
    onMoreApps: noop,
    onClose: noop,
    onOpenAgain: noop,
    onCancel: noop,
    onTryAgain: noop,
    onChooseAnother: noop,
    onBackToHome: noop,
    onViewPlan: noop,
    onRescan: noop,
    ...overrides,
  };
  return render(<AutopaySheet {...props} />);
}

const PHONEPE = APPS[0]!;

describe('AutopaySheet', () => {
  it('lists three apps, the last used tagged, then "More UPI apps" (2316:3558)', () => {
    const onPick = jest.fn();
    const onMoreApps = jest.fn();
    renderSheet({ kind: 'choose', notice: null }, { onPick, onMoreApps });
    expect(screen.getByText('Approve UPI Autopay')).toBeTruthy();
    expect(screen.getByText('₹1 to approve, refunded · up to ₹1,000 per charge')).toBeTruthy();
    expect(screen.getByText('2 plans · 12 visits')).toBeTruthy();
    expect(screen.getByText('Last used')).toBeTruthy();
    expect(screen.queryByText('BHIM')).toBeNull();
    expect(screen.queryByText(/UPI ID/)).toBeNull();
    fireEvent.press(screen.getByTestId('autopay-sheet-app-gpay'));
    expect(onPick).toHaveBeenCalledWith(APPS[1]);
    fireEvent.press(screen.getByTestId('autopay-sheet-more-apps'));
    expect(onMoreApps).toHaveBeenCalled();
  });

  it('counts the request down while waiting (2317:3577)', () => {
    const onOpenAgain = jest.fn();
    renderSheet(
      {
        kind: 'waiting',
        app: PHONEPE,
        link: 'upi://mandate?x',
        startedAt: NOW,
        expiresAt: NOW + 292_000,
        authorizedAt: null,
      },
      { onOpenAgain },
    );
    expect(screen.getByText('Approve Autopay in PhonePe')).toBeTruthy();
    expect(screen.getByText('Request expires in 4:52')).toBeTruthy();
    fireEvent.press(screen.getByText('Open PhonePe again'));
    expect(onOpenAgain).toHaveBeenCalled();
  });

  it.each([
    [{ kind: 'left', app: PHONEPE } as const, 'Autopay not set up yet'],
    [{ kind: 'failed', app: PHONEPE } as const, 'Autopay approval didn’t go through'],
    [{ kind: 'confirming', app: PHONEPE } as const, 'Confirming your Autopay'],
    [{ kind: 'noApp' } as const, 'No UPI app found'],
  ])('draws %o', (state, title) => {
    renderSheet(state);
    expect(screen.getByText(title)).toBeTruthy();
  });

  it('gives the refund timing when approval did not go through (2317:3753)', () => {
    renderSheet({ kind: 'failed', app: PHONEPE });
    expect(
      screen.getByText(
        'If any money was taken, it’ll be refunded to your account in 5-7 working days.',
      ),
    ).toBeTruthy();
  });

  it('shows the per-visit price and the app with the masked handle once on (2317:4009)', () => {
    const onViewPlan = jest.fn();
    renderSheet({ kind: 'active', app: PHONEPE, handleMasked: '••••@ybl' }, { onViewPlan });
    expect(screen.getByText('Autopay is on')).toBeTruthy();
    expect(screen.getByText('₹299 + 5% tax')).toBeTruthy();
    expect(screen.getByText('PhonePe · ••••@ybl')).toBeTruthy();
    fireEvent.press(screen.getByText('View my plan'));
    expect(onViewPlan).toHaveBeenCalled();
  });
});
