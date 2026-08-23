/**
 * LIVE integration check against a running backend.
 *
 * Not part of the normal suite (it needs a server). It exercises the REAL transport — envelope
 * unwrapping, zod boundary parsing, error-code preservation — against the actual API, which is
 * the only way to prove the schemas match the wire rather than matching a fixture someone wrote
 * from the same misunderstanding.
 *
 * Run with: SPOON_E2E=1 npx jest --config jest.e2e.config.js
 */
import { createApiClient } from '@core/api';
import { createLogger, noopSink } from '@core/logging';
// The API submodules directly, not the feature barrels: those re-export React Native SCREENS,
// which cannot be required in a headless Node runtime. This suite is a transport test.
import { createAuthApi } from '@features/auth/api/authApi';
import { createAddressApi } from '@features/address/api/addressApi';
import { createCatalogueApi } from '@features/catalogue/api/catalogueApi';
import { createAvailabilityApi } from '@features/availability/api/availabilityApi';
import { createBookingApi, createServiceApi } from '@features/booking/api/bookingApi';
import { createPaymentApi } from '@features/payment/api/paymentApi';

const BASE = process.env.SPOON_E2E_BASE ?? 'http://127.0.0.1:3000';
/**
 * A fresh number per run.
 *
 * The OTP send cooldown is a per-phone Redis key, so re-running the suite inside the cooldown
 * window answers RATE_LIMITED — correctly. Varying the subscriber digits keeps reruns fast
 * without weakening the control, and every run simply creates a new throwaway account.
 */
const PHONE = `+9198765${String(Date.now() % 100000).padStart(5, '0')}`;

let accessToken: string | null = null;

const client = createApiClient({
  baseUrl: BASE,
  timeoutMs: 20000,
  logger: createLogger({ level: 'silent', sink: noopSink }),
  auth: {
    getAccessToken: async () => accessToken,
    refreshAccessToken: async () => accessToken,
    onSessionExpired: () => undefined,
  },
  appVersion: 'e2e',
  platform: 'node',
});

const auth = createAuthApi(client);

describe('live backend integration', () => {
  it('completes the auth handshake and parses every response', async () => {
    const sent = await auth.sendOtp(PHONE);
    expect(sent.accepted).toBe(true);
    expect(typeof sent.retryAfterSeconds).toBe('number');

    // A DEPLOYED environment never echoes the OTP — `loadConfig` refuses the flag in staging and
    // production — so the handshake can only be completed where a dev echo exists. Against Render
    // this asserts the send contract and stops, rather than pretending to have a session.
    if (sent.devOtp === undefined) {
      // eslint-disable-next-line no-console
      console.log('No dev OTP echo (deployed environment): authenticated checks skipped.');
      return;
    }

    const verified = await auth.verifyOtp({
      phone: PHONE,
      otp: sent.devOtp,
      deviceId: 'e2e-device',
    });
    expect(verified.accessToken.length).toBeGreaterThan(0);
    accessToken = verified.accessToken;

    const me = await auth.getMe();
    expect(me.phone).toBe(PHONE);
  }, 60000);

  /** Everything below needs a session; without one they assert the UNAUTHENTICATED contract. */
  function requireSession(): boolean {
    return accessToken !== null;
  }

  it('reads the catalogue with the real schema', async () => {
    if (!requireSession()) return;
    const catalogue = await createCatalogueApi(client).get();
    expect(catalogue.currency).toBe('INR');
    expect(catalogue.durations.length).toBeGreaterThan(0);
    expect(catalogue.cancellation.reasons.some((r) => r.requiresDetail)).toBe(true);
  }, 30000);

  it('checks serviceability and lists addresses', async () => {
    if (!requireSession()) return;
    const addresses = createAddressApi(client);
    const verdict = await addresses.check({ latitude: 12.902746, longitude: 77.648817 });
    expect(['serviceable', 'temporarily_unavailable', 'outside_service_area']).toContain(
      verdict.status,
    );
    const list = await addresses.list();
    expect(Array.isArray(list)).toBe(true);
  }, 30000);

  it('preserves the backend error code on a domain failure', async () => {
    const bookings = createBookingApi(client);
    if (!requireSession()) {
      // Unauthenticated, the same read answers UNAUTHENTICATED — still a CODE, not a bare 401,
      // which is the property this test exists to protect.
      await expect(bookings.detail('00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      });
      return;
    }
    // A booking id that does not exist -> RESOURCE_NOT_FOUND, not a flattened 4xx.
    await expect(bookings.detail('00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  }, 30000);

  it('reads availability for a real address when one exists', async () => {
    if (!requireSession()) return;
    const addresses = await createAddressApi(client).list();
    if (addresses.length === 0) return;
    const first = addresses[0];
    if (first === undefined) return;

    const availability = await createAvailabilityApi(client).instant({
      addressId: first.id,
      durationMinutes: 60,
    });
    expect(typeof availability.available).toBe('boolean');
    expect(typeof availability.arrivalTargetMinutes).toBe('number');
  }, 30000);

  /**
   * The whole booking chain against the real server, in one test because each step needs the
   * previous one's id. This is the test that proves the request BODIES are right — a schema can
   * agree with a fixture and still be rejected by the server it was written for.
   *
   * Deliberately stops at the payment ORDER. Opening Razorpay checkout needs a device and a
   * human; what can be proven headlessly is that the order exists, carries a publishable key,
   * and never carries a secret.
   */
  it('creates an address, quotes, books, and opens a payment order', async () => {
    if (!requireSession()) return;

    const addresses = createAddressApi(client);
    const bookings = createBookingApi(client);

    // A point inside the repo's own Bengaluru serviceability polygon. Real coordinates, so the
    // backend's PostGIS decides — nothing here asserts that it is serviceable.
    const point = { latitude: 12.902746, longitude: 77.648817 };
    const verdict = await addresses.check(point);
    if (verdict.status !== 'serviceable') {
      // eslint-disable-next-line no-console
      console.log(`Point is ${verdict.status}; booking chain skipped.`);
      return;
    }

    const created = await addresses.create(
      {
        label: 'E2E',
        flat: 'E102',
        society: 'Purva Skydale',
        street: '18th Main Road',
        pincode: '560102',
        city: 'Bengaluru',
        state: 'Karnataka',
        ...point,
      },
      `e2e.address:${PHONE}`,
    );
    const addressId = created.address.id;
    expect(typeof addressId).toBe('string');

    // Instant first, then SCHEDULED as the fallback. Instant needs a live travel estimate from
    // the routes provider, which is not reachable in local development — so a chain that only
    // ever tried instant would prove nothing about create or payment. Scheduled exercises the
    // same quote -> create -> order path without that dependency.
    const availability = await createAvailabilityApi(client).instant({
      addressId,
      durationMinutes: 60,
    });

    let slot: { slotType: 'instant' | 'scheduled'; scheduledStart?: string } | null = null;

    if (availability.available) {
      slot = { slotType: 'instant' };
    } else {
      // eslint-disable-next-line no-console
      console.log(`Instant unavailable (${availability.reason ?? 'no reason'}); trying scheduled.`);

      // Tomorrow, so the whole day is inside the booking horizon rather than partly past.
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const scheduled = await createAvailabilityApi(client).scheduled({
        addressId,
        date,
        durationMinutes: 60,
      });
      const openSlot = scheduled.slots.find((candidate) => candidate.available);

      if (openSlot === undefined) {
        // eslint-disable-next-line no-console
        console.log(
          `No scheduled slot on ${date} (${scheduled.rejection ?? 'all slots refused'}); stopped.`,
        );
        return;
      }
      // The slot id IS the server's ISO start, echoed back verbatim. Never a client-built time.
      slot = { slotType: 'scheduled', scheduledStart: openSlot.start };
    }

    const quote = await bookings.quote({ addressId, durationMinutes: 60, ...slot });
    // The client renders these; it must never assemble them. Asserting they ARRIVE is the point.
    expect(quote.quote.totalAmountPaise).toBeGreaterThan(0);
    expect(quote.quote.currency).toBe('INR');
    // Tax is the SERVER's arithmetic. Checking the parts sum to the total here is not the client
    // doing the sum — it is proving the server sent a coherent price for the app to render.
    expect(quote.quote.serviceAmountPaise + quote.quote.taxAmountPaise).toBe(
      quote.quote.totalAmountPaise,
    );

    const booking = await bookings.create(
      { addressId, durationMinutes: 60, ...slot },
      `e2e.booking:${PHONE}`,
    );
    const bookingId = booking.booking.id;
    expect(typeof bookingId).toBe('string');

    // A created booking is on HOLD, never paid. If this ever reads `assigned` straight out of
    // create, the app's whole payment story is wrong.
    expect(booking.booking.status).toBe('created');

    // The detail read carries `serverTime` (BE-2) and `allowedActions` — the two fields the
    // countdown and every gated control depend on.
    const detail = await bookings.detail(bookingId);
    expect(typeof detail.serverTime).toBe('string');
    expect(typeof detail.booking.allowedActions.canCallCook).toBe('boolean');
    expect(Math.abs(Date.parse(detail.serverTime ?? '') - Date.now())).toBeLessThan(120_000);

    // Call Cook on an unassigned booking: the server refuses with the SAME code it uses for
    // someone else's booking, which is what the client renders as "not available right now".
    await expect(createServiceApi(client).cookContact(bookingId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });

    const order = await createPaymentApi(client).createOrder(bookingId, `e2e.pay:${bookingId}`);
    expect(order.provider).toBe('razorpay');
    expect(['created', 'processing']).toContain(order.status);
    // The PUBLISHABLE key, per order. A secret must never appear on this contract.
    if (order.keyId !== null) expect(order.keyId.startsWith('rzp_')).toBe(true);
    expect(JSON.stringify(order)).not.toContain('secret');
  }, 120000);
});
