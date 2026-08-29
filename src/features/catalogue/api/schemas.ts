import { z } from 'zod';

/**
 * `GET /v1/catalogue` — the published business values a client renders instead of hardcoding.
 *
 * This endpoint is the single most important one for the "do not make the app a second backend"
 * rule. Before it existed, a release had to bake in prices, durations, the tax rate, the
 * cancellation schedule, the meal-period boundaries and the tip amounts. All of them are now
 * read.
 *
 * Verified against a live instance on 2026-08-18. Amounts are integer PAISE throughout; nothing
 * here is a float and nothing is divided by 100 except at the moment of display.
 */

export const catalogueDurationSchema = z.object({
  durationMinutes: z.number().int().positive(),
  serviceAmountPaise: z.number().int().nonnegative(),
  taxAmountPaise: z.number().int().nonnegative(),
  totalAmountPaise: z.number().int().nonnegative(),
  /** Latest local start minute this duration may still be booked at (the operating window). */
  latestStartLocalMinute: z.number().int().nonnegative(),
});

export type CatalogueDuration = z.infer<typeof catalogueDurationSchema>;

export const schedulePeriodSchema = z.object({
  /** `MORNING` / `NOON` / `EVENING` at the time of writing — read, never assumed. */
  id: z.string(),
  startMinute: z.number().int().nonnegative(),
  endMinute: z.number().int().nonnegative(),
});

export type SchedulePeriod = z.infer<typeof schedulePeriodSchema>;

export const cancellationBandSchema = z.object({
  band: z.string(),
  minMinutesToStart: z.number().int().nonnegative().optional(),
  maxMinutesToStart: z.number().int().nonnegative().optional(),
  refundPercent: z.number(),
  chargePercent: z.number().optional(),
});

/**
 * One selectable cancellation reason.
 *
 * `requiresDetail` is DATA. The free-text field appears because the catalogue said so, never
 * because the client matched on the label "Others" — and the backend refuses a cancellation that
 * omits a required detail, so the two cannot drift.
 */
export const cancellationReasonSchema = z.object({
  code: z.string(),
  label: z.string(),
  requiresDetail: z.boolean(),
});

export type CancellationReasonOption = z.infer<typeof cancellationReasonSchema>;

export const catalogueExtensionOptionSchema = z.object({
  minutes: z.number().int().positive(),
  pricePaise: z.number().int().nonnegative(),
  taxAmountPaise: z.number().int().nonnegative(),
  totalAmountPaise: z.number().int().nonnegative(),
});

export type CatalogueExtensionOption = z.infer<typeof catalogueExtensionOptionSchema>;

export const catalogueSchema = z.object({
  currency: z.literal('INR'),
  taxRateBps: z.number().int().nonnegative(),
  pricingVersion: z.string(),
  bookingPolicyVersion: z.string(),
  durations: z.array(catalogueDurationSchema),
  operatingWindow: z.object({
    timeZone: z.string(),
    openLocalMinute: z.number().int().nonnegative(),
    closeLocalMinute: z.number().int().nonnegative(),
  }),
  scheduled: z.object({
    horizonDays: z.number().int().positive(),
    slotIntervalMinutes: z.number().int().positive(),
    periods: z.array(schedulePeriodSchema),
  }),
  instant: z.object({
    /**
     * The ARRIVAL PROMISE, in minutes. It is NOT an ETA: it is the operating promise the product
     * makes ("a cook in 30 minutes"), not a prediction about a specific cook on a specific
     * journey. The live ETA for a real booking comes from tracking. Conflating the two is
     * explicitly forbidden, and the naming here keeps them apart.
     */
    arrivalPromiseMinutes: z.number().int().nonnegative(),
  }),
  /**
   * `null` when no extension pricing policy is resolvable. A client then offers NO extension
   * rather than one at an assumed price — the create endpoint fails closed on the same condition.
   */
  extension: z
    .object({
      currency: z.literal('INR'),
      pricingVersion: z.string(),
      taxRateBps: z.number().int().nonnegative(),
      options: z.array(catalogueExtensionOptionSchema),
    })
    .nullable(),
  cancellation: z.object({
    policyVersion: z.string(),
    /**
     * What the percentages apply to.
     *
     * The deployed backend moved this from `service_amount` to `captured_gross` (captured-gross
     * refunds, live on staging 2026-08-26). Pinning the old literal made the whole catalogue
     * parse throw on a 200 — and because the catalogue feeds the cancel sheet, the reschedule
     * screen, the schedule screen and the instant duration list, every one of those actions
     * collapsed into "Something went wrong". Both published values parse; rendering reads the
     * bands themselves, never this label.
     */
    refundBasis: z.enum(['captured_gross', 'service_amount']),
    bands: z.array(cancellationBandSchema),
    reasons: z.array(cancellationReasonSchema),
    reasonCatalogueVersion: z.string(),
  }),
  tips: z.object({
    /** Suggestions only — the tip endpoint accepts any positive amount. */
    suggestedAmountsPaise: z.array(z.number().int().positive()),
    currency: z.literal('INR'),
  }),
  mealBrief: z.object({
    minGuests: z.number().int().positive(),
    maxGuests: z.number().int().positive(),
    /** Four-valued diet axis; never a boolean. */
    dietPreferences: z.array(z.string()),
  }),
  /**
   * Support channels. Every field is optional and the deployment currently publishes NONE, so a
   * Help destination still does not exist — which is the long-standing product gap B-10, now
   * visible in the contract rather than only in the design file.
   */
  support: z.object({
    whatsappPhone: z.string().optional(),
    callPhone: z.string().optional(),
    email: z.string().optional(),
    helpUrl: z.string().optional(),
  }),
});

export type Catalogue = z.infer<typeof catalogueSchema>;
