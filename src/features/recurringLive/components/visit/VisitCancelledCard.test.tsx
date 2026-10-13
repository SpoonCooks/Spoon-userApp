import { render, screen } from '@testing-library/react-native';

import { visitDemoModel } from '../../data/visit';
import { VisitCancelledCard } from './VisitCancelledCard';

const CANCELLED = visitDemoModel('cancelled').cancelled;

/** `Cook details` · Cancelled — one-time `2165:11853`, Recurring `1466:8451`. */
describe('VisitCancelledCard', () => {
  it('draws the snipped thread on a one-time visit, without "Your plan continues"', () => {
    render(<VisitCancelledCard cancelled={{ ...CANCELLED, nextVisit: null }} />);
    expect(screen.getByText(CANCELLED.title)).toBeTruthy();
    expect(
      screen.getByTestId('visit-cancelled-card-thread', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.queryByTestId('visit-cancelled-card-next-visit')).toBeNull();
  });

  it('adds "Your plan continues" under the thread for a Recurring plan', () => {
    render(<VisitCancelledCard cancelled={CANCELLED} />);
    expect(
      screen.getByTestId('visit-cancelled-card-thread', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByTestId('visit-cancelled-card-next-visit')).toBeTruthy();
  });
});
