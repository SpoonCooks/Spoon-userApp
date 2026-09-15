import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { LEGAL_DOCUMENTS, LegalDocumentView, legalDocumentFor } from './index';

/**
 * The two customer legal documents and the in-app viewer.
 *
 * These replace `Linking.openURL`, which handed the customer to an external browser to read the
 * terms they are being asked to accept — and, with no legal URL published by any endpoint, had
 * nothing to open in the first place.
 */

describe('the published documents', () => {
  it('publishes exactly the two customer documents', () => {
    expect(Object.keys(LEGAL_DOCUMENTS).sort()).toEqual(['privacy', 'terms']);
  });

  /**
   * The Privacy Policy sits ONE ROW above Delete Account on the Account screen, so a store
   * reviewer testing the new deletion flow is one tap from reading it. It shipped contradicting
   * that flow outright: "processed within 30 days" and "7 years" against a sheet that says the
   * deletion is immediate and names 8. Apple and Google both check that a policy matches what the
   * app actually does, and account deletion is the thing a reviewer exercises first.
   *
   * Prose is normally not worth pinning. This is, because the two texts live in different
   * features and nothing else makes them move together — which is exactly how they drifted.
   */
  it('describes deletion the way the app performs it, not on a 30-day cycle', () => {
    const privacy = LEGAL_DOCUMENTS.privacy.html;

    expect(privacy).toContain('deleted immediately');
    expect(privacy).toContain('Deletion is immediate and cannot be undone');
    expect(privacy).not.toContain('deletion requests are processed within 30 days');
    expect(privacy).not.toContain('associated personal data within 30 days');
  });

  /**
   * The retention figure the sheet states and the one the policy states are the same claim about
   * the same records. `DeleteAccountSheet` says 8 years, citing Indian tax law; a policy saying 7
   * makes one of them false. Whichever number is legally right, they cannot disagree.
   */
  it('states the same retention period the delete sheet promises', () => {
    const privacy = LEGAL_DOCUMENTS.privacy.html;

    expect(privacy).toContain('8 years as required by Indian tax law');
    expect(privacy).not.toContain('retained for 7 years');
  });

  it('names each document as the PDF names it', () => {
    expect(LEGAL_DOCUMENTS.terms.title).toBe('Customer Terms of Service');
    expect(LEGAL_DOCUMENTS.privacy.title).toBe('Customer Privacy Policy');
  });

  /**
   * Self-contained is a hard requirement, not a preference: the viewer refuses every navigation,
   * so a document reaching for a remote stylesheet, font or image would render degraded with no
   * indication anything was missing. It also has to be readable with no connection at all.
   */
  it.each(['terms', 'privacy'] as const)('keeps %s free of external references', (id) => {
    const { html } = LEGAL_DOCUMENTS[id];

    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/<img\b/i);
  });

  /**
   * Each carries its own source PDF's "Last Updated", so the app never states a date Legal did not.
   * The two dates differ: the Privacy Policy PDF was revised on September 15, the Terms were not.
   */
  it.each([
        ['terms', 'May 1, 2026'],
    ['privacy', 'September 15, 2026'],
  ] as const)('carries the source date for %s', (id, date) => {
    expect(LEGAL_DOCUMENTS[id].updated).toBe(`Last Updated: ${date}`);
    expect(LEGAL_DOCUMENTS[id].html).toContain(date);
  });

  /** Spot-checks that the transcription reached the end of each document, not just the opening. */
  it('transcribes the Terms through to the final clause', () => {
    const { html } = LEGAL_DOCUMENTS.terms;

    expect(html).toContain('Limitation of Liability');
    expect(html).toContain('INR 10,000');
    expect(html).toContain('Grievance Officer');
    expect(html).toContain('Changes to These Terms');
  });

  it('transcribes the Privacy Policy through to the final clause', () => {
    const { html } = LEGAL_DOCUMENTS.privacy;

    expect(html).toContain('Digital Personal Data Protection Act, 2023');
    expect(html).toContain('We never sell your data');
    expect(html).toContain('Data Retention');
    expect(html).toContain('Contact Us');
  });

  /**
   * ALWAYS light, on every handset.
   *
   * These honoured `prefers-color-scheme` at first, which on a dark-mode phone drew a dark
   * document under the app's white native header — `lightTheme` is the only theme the app has, so
   * every other screen stayed light. One screen, two colour schemes.
   */
  it.each(['terms', 'privacy'] as const)('pins %s to the light scheme', (id) => {
    const { html } = LEGAL_DOCUMENTS[id];

    expect(html).toContain('color-scheme: light');
    expect(html).toContain('name="color-scheme" content="light"');
    // No OS-driven palette swap: the app has no dark mode, so neither does the document.
    expect(html).not.toContain('prefers-color-scheme');
  });

  /** The two are different instruments; shipping one under both ids would be a legal defect. */
  it('does not serve the same document under both ids', () => {
    expect(LEGAL_DOCUMENTS.terms.html).not.toBe(LEGAL_DOCUMENTS.privacy.html);
  });
});

describe('resolving a route parameter', () => {
  it.each(['terms', 'privacy'] as const)('accepts %s', (id) => {
    expect(legalDocumentFor(id)).toBe(id);
  });

  /** Anything else is refused so the route can redirect rather than render an empty viewer. */
  it.each([undefined, '', 'TERMS', 'refunds', '../terms'])('refuses %p', (value) => {
    expect(legalDocumentFor(value as string | undefined)).toBeNull();
  });
});

describe('the in-app viewer', () => {
  const onBack = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders the document under its own title', () => {
    render(<LegalDocumentView document={LEGAL_DOCUMENTS.terms} onBack={onBack} />);

    expect(screen.getByTestId('legal-document-screen')).toBeTruthy();
    expect(screen.getByText('Customer Terms of Service')).toBeTruthy();
  });

  it('hands the document straight to the WebView', () => {
    render(<LegalDocumentView document={LEGAL_DOCUMENTS.privacy} onBack={onBack} />);

    const webview = screen.getByTestId('legal-document-webview');
    expect(webview.props.source.html).toBe(LEGAL_DOCUMENTS.privacy.html);
    // The page carries no script, so enabling JS would only widen what a document could do.
    expect(webview.props.javaScriptEnabled).toBe(false);
  });

  it('returns the customer to where they came from', () => {
    render(<LegalDocumentView document={LEGAL_DOCUMENTS.terms} onBack={onBack} />);

    fireEvent.press(screen.getByTestId('legal-document-header-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('what the viewer will and will not load', () => {
  const navigate = (url: string): boolean => {
    render(<LegalDocumentView document={LEGAL_DOCUMENTS.terms} onBack={jest.fn()} />);
    const webview = screen.getByTestId('legal-document-webview');
    return webview.props.onShouldStartLoadWithRequest({ url }) as boolean;
  };

  beforeEach(() => jest.clearAllMocks());

  /** How the two platforms report an inline-HTML load: iOS `about:`, Android `data:`. */
  it.each(['about:blank', 'data:text/html;charset=utf-8,%3Cp%3E'])('loads %s', (url) => {
    expect(navigate(url)).toBe(true);
  });

  /**
   * Everything else is REFUSED. A document that can be made to navigate is a document that can be
   * made to render something other than the terms the customer thinks they are reading.
   */
  it.each(['https://example.com', 'http://spoonhelp.com', 'file:///etc/passwd', 'spoon://home'])(
    'refuses %s',
    (url) => {
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

      expect(navigate(url)).toBe(false);
      expect(openURL).not.toHaveBeenCalled();
    },
  );

  /** The grievance-officer address is in both documents and has to be tappable. */
  it('hands a mailto to the OS without navigating the document', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    expect(navigate('mailto:admin@spoonhelp.com')).toBe(false);
    expect(openURL).toHaveBeenCalledWith('mailto:admin@spoonhelp.com');
  });
});
