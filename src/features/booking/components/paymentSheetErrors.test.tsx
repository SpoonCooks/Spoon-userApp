import { render, screen } from '@testing-library/react-native';

import { DEMO_BOOKING_COMPLETION, DEMO_EXTENSION } from '@/demo/fixtures/booking';

import { ExtensionSheet } from './ExtensionSheet';
import { TipSheet } from './TipSheet';

/**
 * Both sheets used to swallow a failed payment whole: the CTA's spinner stopped and NOTHING else
 * changed, so a declined card looked exactly like a tap that did nothing. On the extension that
 * is the worse of the two — the customer believes they bought the cook another twenty minutes
 * and finds out otherwise when the cook packs up on the original schedule.
 *
 * What is asserted is only that the sheet can say so, and stays open to be retried. Whether a
 * given failure is worth reporting at all is `paymentErrorMessage`'s call, tested separately.
 */

const TIP = DEMO_BOOKING_COMPLETION.tip!;

describe('TipSheet — a tip the server did not take', () => {
  it('shows the failure and keeps the sheet open to retry', () => {
    render(
      <TipSheet
        visible
        tip={TIP}
        selectedOptionId={TIP.defaultOptionId ?? null}
        onSelectOption={jest.fn()}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        errorMessage="That payment did not go through."
      />,
    );

    expect(screen.getByTestId('tip-sheet-error')).toHaveTextContent(
      'That payment did not go through.',
    );
    // The CTA is still there: the amount stays chosen and one tap retries it.
    expect(screen.getByTestId('tip-sheet-confirm')).toBeTruthy();
  });

  it('says nothing when there is nothing to report', () => {
    render(
      <TipSheet
        visible
        tip={TIP}
        selectedOptionId={null}
        onSelectOption={jest.fn()}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('tip-sheet-error')).toBeNull();
  });
});

describe('ExtensionSheet — an extension the server did not grant', () => {
  it('shows the failure and keeps the sheet open to retry', () => {
    render(
      <ExtensionSheet
        visible
        extension={DEMO_EXTENSION}
        selectedOptionId={DEMO_EXTENSION.defaultOptionId ?? null}
        onSelectOption={jest.fn()}
        onClose={jest.fn()}
        onExtend={jest.fn()}
        onBookAnother={jest.fn()}
        errorMessage="That payment did not go through."
      />,
    );

    expect(screen.getByTestId('extension-error')).toHaveTextContent(
      'That payment did not go through.',
    );
    expect(screen.getByTestId('extension-submit')).toBeTruthy();
  });

  it('says nothing when there is nothing to report', () => {
    render(
      <ExtensionSheet
        visible
        extension={DEMO_EXTENSION}
        selectedOptionId={null}
        onSelectOption={jest.fn()}
        onClose={jest.fn()}
        onExtend={jest.fn()}
        onBookAnother={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('extension-error')).toBeNull();
  });
});
