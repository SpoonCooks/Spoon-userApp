import { fireEvent, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';
import type { MeResponse } from '@features/auth';

import { DEMO_PROFILE } from '@/demo/fixtures/screens';
import { profileFromMe } from './adapters';
import { ProfileView } from './screens/ProfileScreen';

/**
 * Profile — Figma `6:663` "Page 16- Account", V8.
 *
 * ## What changed, and why these assertions are the reverse of the ones they replace
 *
 * The V7 pass REMOVED the completeness prompt. The reading was defensible at the time: `222:1570`
 * had been moved into the `V1s` section, `6:663` drew identity card / tile grid / legal row /
 * logout and nothing else, and the deployed backend was reporting `profileComplete: false` for
 * accounts that had finished everything V0 asked of them. So the flag was left unread and the
 * block deleted, and the old suite locked THAT in — "renders the same screen whether the server
 * says complete or not".
 *
 * The V8 file reverses the premise. `222:1570` is back on `6:663` itself, at y 79 between the
 * identity card and the tile grid; `456:3467` is its completed counterpart; and the founder's
 * ruling makes `338:4508` (profile details) a V0 screen rather than a V1 one. The flag drives a
 * surface again, so it is read again — and these tests assert the new shape.
 *
 * They assert the SURFACE, not a completeness rule. The rule is the server's (task §9); what is
 * locked here is that Profile renders the server's answer faithfully and routes both states to
 * the same page.
 */

const BASE_ME: MeResponse = {
  id: 'usr_1',
  role: 'user',
  status: 'active',
  phone: '+91 98765 00000',
  name: 'Aarav Mehta',
  householdStructure: null,
  mealStructure: null,
  pressingIssue: null,
  dietaryPreference: null,
  grownUpEating: null,
  regionPreference: null,
  genderPreference: null,
  profileComplete: true,
};

const actions = {
  onBack: jest.fn(),
  onSelectTile: jest.fn(),
  onOpenProfileDetails: jest.fn(),
  onOpenLink: jest.fn(),
  onLogout: jest.fn(),
  onRetry: jest.fn(),
};

function renderProfile(me: MeResponse) {
  const model = profileFromMe({ base: DEMO_PROFILE, me, namePlaceholder: 'Add your name' });
  return render(<ProfileView state={ready(model)} {...actions} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('V8 profile completeness (222:1570 / 456:3467)', () => {
  /** Test 9 — the INCOMPLETE component and its route. */
  it('draws the incomplete card and its "Complete profile" CTA when the server says false', () => {
    renderProfile({ ...BASE_ME, profileComplete: false });

    expect(screen.getByTestId('profile-incomplete')).toBeTruthy();
    expect(screen.getByText('Your profile is incomplete')).toBeTruthy();
    expect(screen.getByText('Complete profile')).toBeTruthy();
    expect(screen.queryByText('Your profile is completed')).toBeNull();
  });

  /** Test 10 — the COMPLETE component and its route. */
  it('draws the completed card and its "View profile" CTA when the server says true', () => {
    renderProfile({ ...BASE_ME, profileComplete: true });

    expect(screen.getByTestId('profile-complete')).toBeTruthy();
    expect(screen.getByText('Your profile is completed')).toBeTruthy();
    expect(screen.getByText('View profile')).toBeTruthy();
    expect(screen.queryByText('Your profile is incomplete')).toBeNull();
  });

  /** Both variants share the frame's own body copy, typo included. */
  it('draws the same body line in both states, verbatim from the frame', () => {
    const line = 'Share how your meal preferences, so that we can serve you better';

    renderProfile({ ...BASE_ME, profileComplete: false });
    expect(screen.getByText(line)).toBeTruthy();

    screen.unmount();

    renderProfile({ ...BASE_ME, profileComplete: true });
    expect(screen.getByText(line)).toBeTruthy();
  });

  /** Tests 9 + 10 — ONE destination for both states, per the founder's ruling. */
  it('routes both card states to the profile-details page', () => {
    renderProfile({ ...BASE_ME, profileComplete: false });
    fireEvent.press(screen.getByTestId('profile-incomplete-cta'));
    expect(actions.onOpenProfileDetails).toHaveBeenCalledTimes(1);

    screen.unmount();
    jest.clearAllMocks();

    renderProfile({ ...BASE_ME, profileComplete: true });
    fireEvent.press(screen.getByTestId('profile-complete-cta'));
    expect(actions.onOpenProfileDetails).toHaveBeenCalledTimes(1);
  });

  /**
   * The verdict is the SERVER's and is not second-guessed (task §9).
   *
   * A customer with no name is exactly the case the server currently calls incomplete. The screen
   * renders that answer — it does not recompute one from the fields it can see.
   */
  it('renders the server verdict rather than deriving one from the name', () => {
    renderProfile({ ...BASE_ME, name: null, profileComplete: false });

    expect(screen.getByTestId('profile-incomplete')).toBeTruthy();
    expect(screen.getByText('Add your name')).toBeTruthy();

    screen.unmount();

    // A named account the server still calls incomplete draws the incomplete card, and a nameless
    // one the server calls complete draws the complete card. The name never decides it.
    renderProfile({ ...BASE_ME, name: null, profileComplete: true });
    expect(screen.getByTestId('profile-complete')).toBeTruthy();
  });
});

describe('identity and structure', () => {
  it('shows the server identity, and never invents a name', () => {
    renderProfile(BASE_ME);

    expect(screen.getByText('Aarav Mehta')).toBeTruthy();
    expect(screen.getByText('+91 98765 00000')).toBeTruthy();
  });

  /** `69:418` / `69:347` / `69:486` / `69:502` — the 2 x 2 grid the final frame draws. */
  it('draws the four tiles with the final frame’s copy', () => {
    renderProfile(BASE_ME);

    for (const tile of [
      { title: 'My bookings', subtitle: 'View booking history' },
      { title: 'Addresses', subtitle: 'View or add addresses' },
      { title: 'My refunds', subtitle: 'View refund status' },
      { title: 'Help', subtitle: 'Get immediate help' },
    ]) {
      expect(screen.getByText(tile.title)).toBeTruthy();
      expect(screen.getByText(tile.subtitle)).toBeTruthy();
    }
  });

  /**
   * `6:779` / `6:789` — the legal controls and logout close the frame.
   *
   * TWO controls, not one. The frame draws a single "Terms of Service & Privacy Policy" label,
   * which is one control standing for two separate legal instruments — so it could only ever open
   * one of them. Each document now has its own button naming exactly what it opens.
   */
  it('draws both legal documents as separate controls, and logout', () => {
    renderProfile(BASE_ME);

    // `6:779`'s own line is UNCHANGED — same words, same Livvic Bold 11/14.67, underlined. What
    // changed is that each half is separately pressable; the "&" between them is inert copy.
    expect(screen.getByText('Terms of Service')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Log Out')).toBeTruthy();
  });

  /** The frame draws ONE sentence, so the row still reads as one. */
  it('keeps the frame’s single legal line', () => {
    renderProfile(BASE_ME);

    const row = screen.getByTestId('profile-legal');
    // Nested `Text` flattens, so the rendered line is the frame's own wording end to end.
    expect(row).toHaveTextContent('Terms of Service & Privacy Policy');
  });

  /** Both are real destinations now: the documents ship with the app, so neither is a dead row. */
  it('makes each legal control a live link', () => {
    renderProfile(BASE_ME);

    for (const id of ['terms', 'privacy']) {
      expect(screen.getByTestId(`profile-link-${id}`).props.accessibilityRole).toBe('link');
    }
  });
});
