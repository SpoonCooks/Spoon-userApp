/**
 * The customer legal documents, as self-contained HTML.
 *
 * ## Why the content is bundled rather than fetched
 *
 * BACKEND_GAP (recorded in `features/profile/types.ts`): no endpoint publishes a legal or policy
 * URL. `GET /v1/catalogue`'s `support` block carries WhatsApp, call, email and help fields and
 * nothing legal, and the deployment publishes none of those either. So there is no address to
 * point a viewer at, and the documents ship with the app.
 *
 * That is also the right default for this particular content: Terms and Privacy have to be
 * readable to someone deciding whether to accept them, which includes someone with no connection.
 * A remote document that fails to load is a legal notice the customer was never shown.
 *
 * ## Why HTML and not React Native views
 *
 * These are long-form legal documents with a fixed structure — numbered sections, sub-headings,
 * bulleted obligations, a signature block. HTML expresses that directly, and when Legal sends a
 * revised document it is replaced wholesale rather than re-expressed as a component tree. The
 * screen renders it in a `WebView`, so the markup below is the whole contract between the two.
 *
 * ## Transcription
 *
 * Both documents are transcribed from the supplied PDFs (`Spoon - Customer Terms of Service.pdf`,
 * `Spoon - Customer Privacy Policy.pdf`, both "Last Updated: September 1, 2026"). The wording is
 * verbatim: legal copy is not paraphrased, tidied or abridged here, and the section numbering is
 * the source's own so a customer quoting "clause 8" means what Legal means.
 *
 * WHEN THE DOCUMENTS CHANGE: replace the body constants and update `updated`. Nothing else on the
 * screen reads the date, so the two cannot drift apart.
 */

export type LegalDocumentId = 'terms' | 'privacy';

export interface LegalDocument {
  /** The header title — also what the Profile button says. */
  readonly title: string;
  /** Printed under the title, verbatim from the document. */
  readonly updated: string;
  /** A complete HTML document, self-contained: no external CSS, fonts, scripts or images. */
  readonly html: string;
}

/** The entity block both documents close with, and the address both print. */
const ENTITY = 'Tametoe Tomatoe Technologies Private Limited';
const CONTACT_EMAIL = 'admin@spoonhelp.com';
const OFFICE =
  'Innov8 Mantri Commercio, Tower A, 5th Floor, No. 51, Bellandur, Bengaluru – 560103, Karnataka, India';

/**
 * The shared stylesheet.
 *
 * Deliberately NOT an attempt to reproduce the app's Livvic type: the font is a bundled binary
 * asset that a `WebView` fed an HTML string cannot resolve, and base64-embedding a full family
 * for two documents would cost far more than it returns. It uses the platform's own UI face, at
 * the app's ink and accent colours, so the document reads as part of Spoon without pretending to
 * be a screen.
 *
 * ## Always LIGHT, deliberately
 *
 * This honoured `prefers-color-scheme` at first, on the reasonable-sounding argument that a
 * WebView follows the OS and white legal text would flash at night. On a dark-mode handset that
 * produced the opposite of consistency, and it was obvious the moment it was seen on a device: the
 * native header bar stayed white — because `lightTheme` is the app's ONLY theme and every other
 * screen is light — while the document beneath it went dark. One screen, two colour schemes.
 *
 * The app does not have a dark mode, so neither does this. `color-scheme: light` states that
 * explicitly rather than leaving it implied, which also stops Android's WebView applying its own
 * algorithmic darkening to a page that never asked for it.
 */
const STYLES = `
  :root {
    color-scheme: light;
    --ink: #0F172A;
    --muted: #64748B;
    --accent: #FFD600;
    --rule: #E2E8F0;
    --ground: #FFFFFF;
  }
  * { box-sizing: border-box; -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    padding: 20px 18px 56px;
    background: var(--ground);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
  .doc-title { font-size: 20px; font-weight: 700; margin: 4px 0 2px; }
  .tagline { color: var(--muted); font-style: italic; margin: 0 0 14px; }
  .meta {
    color: var(--muted);
    font-size: 12.5px;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    padding: 10px 0;
    margin-bottom: 26px;
  }
  h2 {
    font-size: 15.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin: 32px 0 10px;
    padding-bottom: 7px;
    border-bottom: 2px solid var(--accent);
  }
  h2 .n { color: var(--accent); margin-right: 6px; }
  h3 { font-size: 14.5px; font-weight: 700; margin: 20px 0 5px; }
  p { margin: 0 0 12px; }
  ul { margin: 0 0 12px; padding-left: 20px; }
  li { margin-bottom: 6px; }
  strong { font-weight: 700; }
  a { color: inherit; text-decoration: underline; word-break: break-word; }
  .callout {
    border-left: 3px solid var(--accent);
    padding: 10px 0 10px 12px;
    margin: 18px 0;
    font-weight: 600;
  }
  .close {
    margin-top: 34px;
    padding-top: 16px;
    border-top: 1px solid var(--rule);
    font-weight: 700;
  }
  .entity { color: var(--muted); font-size: 12.5px; font-weight: 400; margin-top: 8px; }
`;

/** Wraps a document body in the shared chrome. One template, so the two cannot drift apart. */
function page(input: { readonly title: string; readonly updated: string; readonly body: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
<meta name="color-scheme" content="light" />
<title>${input.title}</title>
<style>${STYLES}</style>
</head>
<body>
<p class="brand">spoon</p>
<p class="doc-title">${input.title}</p>
${input.body}
<p class="close">${
    input.title === 'Customer Terms of Service'
      ? 'By using Spoon, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.'
      : 'By using Spoon, you consent to the collection and use of your information as described in this Privacy Policy.'
  }</p>
<p class="entity">${ENTITY} · Bengaluru, Karnataka, India</p>
</body>
</html>`;
}

const TERMS_BODY = `
<p class="tagline">The terms that govern your use of the Spoon platform</p>
<p class="meta">Last Updated: September 1, 2026 · ${ENTITY} · ${CONTACT_EMAIL}</p>

<h2><span class="n">1.</span>About These Terms</h2>
<p>These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer") and Tametoe Tomatoe Technologies Private Limited ("Spoon"). They govern your access to and use of the Spoon mobile application, website, and all related services (the "Platform").</p>
<p>By downloading the app, creating an account, or placing a booking, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, discontinue use of the Platform immediately.</p>
<p>These Terms are published in compliance with the Indian Contract Act, 1872, the Information Technology Act, 2000, the Consumer Protection Act, 2019, and the Consumer Protection (E-Commerce) Rules, 2020.</p>

<h2><span class="n">2.</span>Eligibility</h2>
<p>Access to Spoon is restricted to individuals who:</p>
<ul>
  <li>Reside in India in a city where Spoon currently operates</li>
  <li>Have not previously had an account suspended or terminated by Spoon</li>
</ul>
<p>By accessing the Platform, you represent and warrant that you meet all eligibility criteria.</p>

<h2><span class="n">3.</span>Your Account</h2>
<h3>Registration and accuracy of information</h3>
<p>To use Spoon, you must register providing your mobile number, name, delivery address, and email. All information must be accurate, complete, and current. Spoon is not liable for loss resulting from your failure to maintain accurate information.</p>
<h3>Account security and responsibility</h3>
<p>You are solely responsible for maintaining confidentiality of your login credentials. You accept full responsibility for all activities under your account. Notify Spoon at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> immediately if you suspect unauthorised access.</p>
<h3>One account per person</h3>
<p>Each individual may hold only one active customer account. Creating multiple accounts to circumvent suspensions or abuse promotional offers is strictly prohibited and will result in permanent termination.</p>

<h2><span class="n">4.</span>Our Platform &amp; Cooks</h2>
<h3>What Spoon is</h3>
<p>Spoon is a technology platform that connects customers with trained, verified cooks who provide home cooking services. While Spoon manages the customer relationship, the actual cooking service is performed by the assigned Cook.</p>
<h3>Cook selection and verification</h3>
<p>All Cooks are:</p>
<ul>
  <li>Identity-verified using government-issued documents</li>
  <li>Background-screened before assignment</li>
  <li>Trained in food safety, hygiene, and professional conduct</li>
  <li>Continuously monitored through customer ratings and performance metrics</li>
  <li>Subject to deactivation if performance falls below standards or misconduct is reported</li>
</ul>
<h3>Limitations of our service</h3>
<p>While Spoon is committed to providing a high-quality, professional home cooking experience, the nature of the service means certain outcomes depend on factors outside our direct control. Accordingly:</p>
<ul>
  <li>Taste, presentation, and cooking style are inherently subjective — Spoon ensures professional standards are met but cannot guarantee that every dish will match your personal preference</li>
  <li>Cook availability depends on demand and geography — Spoon will notify you promptly if no Cook can be assigned and will offer alternatives or a full refund</li>
  <li>Platform availability may occasionally be affected by technical maintenance or circumstances beyond our control — we aim to minimise disruption and communicate in advance where possible</li>
  <li>Spoon is not liable for damage to kitchen equipment, utensils, or property arising from normal use during a session, or for adverse reactions to food where accurate allergy or dietary information was not disclosed at the time of booking</li>
</ul>

<h2><span class="n">5.</span>Bookings &amp; Sessions</h2>
<h3>Placing a booking</h3>
<p>A booking is confirmed only when: (a) you receive in-app or SMS confirmation from Spoon, and (b) the booking fee has been successfully processed. Spoon may decline any booking request at its sole discretion.</p>
<h3>Session OTP verification</h3>
<p>At the start of each session, you will receive a Session OTP. Share it with your Cook only after they have physically arrived at your premises. Do not share the OTP before the Cook's arrival.</p>
<h3>Your obligations during a session</h3>
<p>By confirming a booking, you agree to:</p>
<ul>
  <li>Ensure a safe, clean, and adequately equipped cooking space for the full session duration</li>
  <li>Provide all necessary food ingredients, utensils, and cooking equipment</li>
  <li>Ensure a responsible adult aged 18+ is present at the premises throughout the session</li>
  <li>Immediately disclose information relevant to Cook safety — pets, allergies, defective appliances, or safety hazards</li>
  <li>Provide the Cook with safe and unobstructed access to the kitchen</li>
</ul>
<h3>Session extensions</h3>
<p>Extensions are subject to the Cook's availability and consent. Additional charges are displayed and confirmed in the app before the extension commences.</p>

<h2><span class="n">6.</span>Pricing, Fees &amp; Payment</h2>
<p>Fees displayed at the time of booking may include: service charges, convenience fees, surge pricing (during high demand), and GST at the applicable rate. Fee changes do not apply to already-confirmed bookings.</p>
<p>All payments are processed exclusively through PCI-DSS Level 1 compliant payment processors. Spoon does not store your full card number, CVV, or banking credentials.</p>
<h3>Tips</h3>
<p>Tips are entirely voluntary and transferred in full to the Cook. Tips are non-refundable once paid.</p>
<h3>Failed and disputed payments</h3>
<p>If a payment fails, your booking will not be confirmed. For payment disputes, contact <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with the booking reference and transaction details.</p>

<h2><span class="n">7.</span>Cancellations &amp; Refunds</h2>
<h3>Cancellation by you</h3>
<p>You may cancel a confirmed booking through the app prior to session commencement. Cancellations within the free cancellation window (displayed at booking) are eligible for a full refund. Cancellations after this window may incur a cancellation fee.</p>
<h3>Cancellation by Spoon</h3>
<p>Spoon may cancel a booking if no Cook is available, if safety concerns exist, or if a force majeure event prevents service delivery. In such cases, you will receive a full refund.</p>
<h3>Refund processing</h3>
<p>Approved refunds are credited to your original payment method within 5–7 business days. Refunds may optionally be credited to your Spoon wallet for faster processing.</p>

<h2><span class="n">8.</span>Your Conduct</h2>
<h3>Respectful treatment of Cooks</h3>
<p>You must treat your Cook with dignity, courtesy, and professionalism at all times. Abusive, threatening, intimidating, sexually harassing, or demeaning behaviour is strictly prohibited and will result in immediate account suspension or termination.</p>
<h3>Non-solicitation of Cooks</h3>
<p>During your membership and for 12 months following your last completed session, you must not directly or indirectly solicit any Cook to provide services outside of the Spoon Platform. Violation may result in immediate account termination.</p>
<h3>Prohibited conduct</h3>
<p>You must not:</p>
<ul>
  <li>Use the Platform for any unlawful, fraudulent, or deceptive purpose</li>
  <li>Submit knowingly false or defamatory reviews or ratings</li>
  <li>Attempt to gain unauthorised access to accounts or Spoon systems</li>
  <li>Provide false information about your household, safety hazards, or session requirements</li>
</ul>

<h2><span class="n">9.</span>Ratings &amp; Reviews</h2>
<p>Post-session ratings and reviews must be based on genuine, first-hand experience and must not contain defamatory, offensive, or legally restricted material. By submitting a review, you grant Spoon a non-exclusive, royalty-free licence to reproduce and use it across the Platform and promotional channels.</p>

<h2><span class="n">10.</span>Disclaimers &amp; Warranties</h2>
<p>The Platform is provided on an "as is" and "as available" basis. While Spoon commits to rigorous Cook selection and training, Spoon does not warrant that the Platform will be continuously available or that the results of any session will meet your individual expectations.</p>
<p>Spoon shall not be liable for disputes arising solely from subjective satisfaction with food quality, presentation, or preparation style, provided the Cook has met Spoon's professional standards of food safety, hygiene, and conduct.</p>

<h2><span class="n">11.</span>Limitation of Liability</h2>
<p>Spoon's total aggregate liability for any claim shall not exceed the lower of: (a) the booking fee actually paid for the specific booking giving rise to the claim, or (b) INR 10,000. Spoon shall not be liable for indirect, incidental, special, consequential, or punitive damages.</p>

<h2><span class="n">12.</span>Governing Law &amp; Disputes</h2>
<p>These Terms are governed by the laws of India. Disputes shall first be referred to amicable resolution. If unresolved within 30 days, disputes shall be resolved by binding arbitration in Bengaluru, Karnataka, in English, per the Arbitration and Conciliation Act, 1996.</p>

<h2><span class="n">13.</span>Grievance Officer</h2>
<p><strong>Name:</strong> Harshvardhan Surana<br />
Designation: Grievance Officer<br />
Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a><br />
Address: ${OFFICE}</p>
<p>We will acknowledge within 48 hours and resolve all grievances within 30 days.</p>

<h2><span class="n">14.</span>Changes to These Terms</h2>
<p>Spoon will notify you via in-app notification or email at least 7 days before material changes take effect. Continued use of the Platform after changes constitutes your acceptance of the revised Terms.</p>
`;

const PRIVACY_BODY = `
<p class="tagline">How we collect, use, and protect your personal information</p>
<p class="meta">Last Updated: September 1, 2026 · ${ENTITY} · ${CONTACT_EMAIL}</p>

<h2><span class="n">1.</span>About This Policy</h2>
<p>This Privacy Policy describes how Tametoe Tomatoe Technologies Private Limited ("Spoon", "we", "us", or "our") collects, uses, shares, and protects your personal information when you use the Spoon customer application and related services (the "Platform").</p>
<p>By downloading the Spoon app, creating an account, or booking a cooking session, you agree to the practices described in this policy. If you do not agree, please do not use the Platform.</p>
<p>This policy is published in accordance with the Information Technology Act, 2000; the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011; the Consumer Protection Act, 2019; and the Digital Personal Data Protection Act, 2023.</p>

<h2><span class="n">2.</span>Information We Collect</h2>
<h3>Information you provide</h3>
<p>When you register or book a session, we collect: your name, mobile number, email address, delivery addresses (including GPS coordinates), household details including number and age of household members, preferred meal times, dietary preferences, regionality (Indian state-wise cuisine) preferences, special cooking requests, and payment method details.</p>
<h3>Payment information</h3>
<p>All payments are processed through PCI-DSS Level 1 compliant payment processors. Spoon never stores your full card number, CVV, or net banking credentials. We receive only tokenised transaction references and payment status.</p>
<h3>Location data</h3>
<p>While making bookings, we collect location through GPS to enable cook tagging, routing, and ETA calculation. We do not track your live location when the app is in the background or closed, except as necessary to complete the active session.</p>
<h3>Usage and technical data</h3>
<p>We automatically collect anonymised usage data: screens visited, session duration, device type, OS version, IP address, app crash logs, and feature usage patterns. This data helps diagnose issues and improve the Platform, and does not personally identify you.</p>
<h3>Communications and reviews</h3>
<p>We collect and display feedback shared through ratings, reviews, NPS, and related forms on Spoon apps, Play Store, and App Store. Support communications are stored for quality improvement and dispute resolution.</p>

<h2><span class="n">3.</span>How We Collect Information</h2>
<ul>
  <li><strong>Directly from you</strong> — when you register, book, update your profile, contact support, or submit a review</li>
  <li><strong>Automatically</strong> — through analytics SDKs, crash reporting tools, and app usage tracking</li>
  <li><strong>From third parties</strong> — payment processors, SMS gateways, push notification services, and customer feedback</li>
</ul>

<h2><span class="n">4.</span>How We Use Your Information</h2>
<p>We use your information to:</p>
<ul>
  <li>Create and manage your account</li>
  <li>Match you with suitable cooks based on your location, preferences, and availability</li>
  <li>Process payments and issue refunds or receipts</li>
  <li>Send booking confirmations, status updates, session reminders, and post-session follow-ups</li>
  <li>Improve matching algorithms, app features, and service quality</li>
  <li>Detect and prevent fraud, abuse, safety incidents, and policy violations</li>
  <li>Respond to your support queries and resolve disputes</li>
  <li>Send service-related announcements and comply with applicable laws</li>
</ul>
<p class="callout">We do NOT use your personal information for marketing purposes without your explicit consent.</p>

<h2><span class="n">5.</span>Sharing Your Information</h2>
<h3>With your assigned cook</h3>
<p>When a cook is assigned, they receive: your first name, delivery address, special requests, dietary restrictions or allergies, and relevant household information. Your phone number is accessible only through the in-app call feature during the active session and is never displayed in plain text.</p>
<h3>With service providers</h3>
<p>We share data with trusted third parties — payment processors, cloud hosting providers, SMS gateways, push notification services, and analytics providers. All are bound by confidentiality agreements and cannot use your data for their own purposes.</p>
<h3>For legal and safety reasons</h3>
<p>We may disclose your information if required by law, court order, government authority, or where necessary to protect the safety, rights, or property of Spoon, our cooks, or the public.</p>
<h3>We never sell your data</h3>
<p>Spoon does not sell, rent, or trade your personal information to any third party for marketing or commercial purposes.</p>

<h2><span class="n">6.</span>Third-Party Services</h2>
<p>The Spoon app may contain links to third-party services (e.g., Google Maps). Spoon is not responsible for their privacy practices. We encourage you to review their policies before use.</p>

<h2><span class="n">7.</span>International Data Transfers</h2>
<p>Your data is primarily stored on servers in India. Some third-party providers may process data outside India. Where such transfers occur, we ensure appropriate contractual safeguards are in place in accordance with applicable law.</p>

<h2><span class="n">8.</span>Data Retention</h2>
<p>We retain your personal data for as long as your account is active or as needed to provide services. Financial records are retained for 7 years for tax and legal compliance. Account deletion requests are processed within 30 days, except for data we are legally required to retain. Aggregated, anonymised data may be retained indefinitely for analytical purposes.</p>

<h2><span class="n">9.</span>Your Rights</h2>
<h3>Right to access</h3>
<p>You may request a copy of all personal data we hold about you at any time, including your booking history and payment records.</p>
<h3>Right to correction</h3>
<p>If any data is inaccurate or incomplete, you may request correction. You are responsible for keeping your profile information up to date.</p>
<h3>Right to deletion</h3>
<p>You may request deletion of your account and associated personal data within 30 days, subject to data we are legally required to retain.</p>
<h3>Right to withdraw consent</h3>
<p>You may withdraw consent to data processing at any time by emailing <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. Withdrawal may affect certain Platform features.</p>
<h3>How to exercise your rights</h3>
<p>Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with subject "Data Rights Request". We will respond within 30 days.</p>

<h2><span class="n">10.</span>Security</h2>
<p>We implement industry-standard security measures including:</p>
<ul>
  <li>HTTPS/TLS encryption for all data in transit</li>
  <li>Encryption of sensitive fields (payment information) at rest</li>
  <li>Role-based access controls limiting employee access to personal data</li>
  <li>Regular security audits and vulnerability assessments</li>
</ul>
<p>If you suspect unauthorised access to your account, contact <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> immediately.</p>

<h2><span class="n">11.</span>Changes to This Policy</h2>
<p>When we make material changes, we will notify you via in-app notification or email at least 7 days before changes take effect. Continued use of Spoon after changes constitutes your acceptance of the updated policy.</p>

<h2><span class="n">12.</span>Grievance Officer</h2>
<p><strong>Name:</strong> Harshvardhan Surana<br />
Designation: Grievance Officer<br />
Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a><br />
Address: ${OFFICE}</p>
<p>We will acknowledge receipt within 48 hours and resolve all complaints within 30 days.</p>

<h2><span class="n">13.</span>Contact Us</h2>
<p>${ENTITY}<br />
${OFFICE}<br />
Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
`;

export const LEGAL_DOCUMENTS: Readonly<Record<LegalDocumentId, LegalDocument>> = {
  terms: {
    title: 'Customer Terms of Service',
    updated: 'Last Updated: September 1, 2026',
    html: page({
      title: 'Customer Terms of Service',
      updated: 'September 1, 2026',
      body: TERMS_BODY,
    }),
  },
  privacy: {
    title: 'Customer Privacy Policy',
    updated: 'Last Updated: September 1, 2026',
    html: page({
      title: 'Customer Privacy Policy',
      updated: 'September 1, 2026',
      body: PRIVACY_BODY,
    }),
  },
};

/** Narrows a route parameter to a known document, or `null` for anything else. */
export function legalDocumentFor(id: string | undefined): LegalDocumentId | null {
  return id === 'terms' || id === 'privacy' ? id : null;
}
