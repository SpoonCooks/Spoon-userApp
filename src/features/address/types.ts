/**
 * Address view models.
 *
 * Ruling R-4: serviceability is a BACKEND decision surfaced inside the map step. The client never
 * evaluates coverage, distance or geofences, and there is no separate rejection flow — hence
 * `serviceabilityMessage` on the location step rather than a rejection screen.
 *
 * TODO(backend-contract): field names, the serviceability response, and whether
 * `receiver { name, phone }` is per-address (as drawn) or per-booking (blocker B-13).
 */

export interface SavedAddressViewModel {
  readonly id: string;
  readonly label: string;
  readonly line: string;
  readonly selected?: boolean;
}

export interface AddressListViewModel {
  readonly title: string;
  readonly addCtaLabel: string;
  readonly sectionTitle: string;
  readonly addresses: readonly SavedAddressViewModel[];
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}

export interface AddressLocationViewModel {
  readonly title: string;
  /** `53:63` — "Area, Street or Building Name", the label above the search field. */
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly searchValue: string;
  readonly helperText: string;
  readonly resolvedTitle: string;
  readonly resolvedLine: string;
  readonly confirmLabel: string;
  /** Ruling R-4: set by the server when the pinned area is outside the serviceable area. */
  readonly serviceabilityMessage?: string;
}

/**
 * `228:1801` "Page 17a- Address edit" — NEW in `1kd1u3WEc00SENkToIPloW`.
 *
 * A bottom sheet raised from a saved address, offering Edit and Delete over the list. It is not a
 * screen: `230:1924` is a 504pt sheet at a 20pt top radius over an `rgba(0,0,0,0.8)` scrim, and
 * the card inside it is the SAME `6:700` card the list already draws.
 *
 * Every string is supplied. Nothing here decides whether an address may be deleted — that is a
 * backend rule (an address in use by a live booking, the last remaining address, and so on).
 */
export interface AddressEditViewModel {
  /** `230:1926` — "Edit addresss" as drawn; the frame's spelling. */
  readonly title: string;
  /** `6:706` — "Edit this addresses" as drawn. */
  readonly cardTitle: string;
  readonly address: SavedAddressViewModel;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

/**
 * `215:1472` "Page 16d- Address out of service" — NEW in `1kd1u3WEc00SENkToIPloW`.
 *
 * PRODUCT_DESIGN_CONFLICT with ruling R-4, which said the map step surfaces serviceability inline
 * and "do not invent another separate failure flow". The designer has now drawn exactly such a
 * screen. The new file wins on visuals, so it is built; which surface the flow actually uses is a
 * product decision, and the inline `serviceabilityMessage` on the map step is left in place.
 *
 * The client still evaluates no coverage: every string, including the headline, is server copy.
 */
export interface AddressOutOfServiceViewModel {
  /** `218:1537` / `218:1538` — the banner shows the address that was found to be unserviceable. */
  readonly addressLabel: string;
  readonly addressLine: string;
  /** `221:1554` — "Coming soon to your area!" */
  readonly title: string;
  /** `221:1555` — the apology line. */
  readonly message: string;
  /** The account avatar in the banner. Remote, never bundled. */
  readonly avatarUrl?: string;
}

export interface AddressLabelOption {
  readonly id: string;
  readonly label: string;
}

export interface AddressDetailsViewModel {
  readonly title: string;
  readonly flatPlaceholder: string;
  readonly buildingPlaceholder: string;
  readonly areaTitle: string;
  readonly areaValue: string;
  readonly changeLabel: string;
  readonly labelTitle: string;
  /** Figma shows Home · Parents · Friends · Others — supplied as data, not hardcoded. */
  readonly labelOptions: readonly AddressLabelOption[];
  /**
   * NEW in `60:655` — a free-text "Save as" field below the label chips, and an "(Optional)"
   * qualifier beside the Receiver's-details heading. Both are absent when the server omits them,
   * so no field is invented for a payload that does not carry one.
   */
  readonly saveAsPlaceholder?: string;
  readonly saveAsValue?: string;
  readonly receiverOptionalLabel?: string;
  readonly receiverTitle: string;
  readonly receiverNamePlaceholder: string;
  readonly receiverPhonePlaceholder: string;
  readonly ctaLabel: string;

  /**
   * EDITING an existing address. Receiver details are stored on the address record (B-13), so
   * opening a saved address PREFILLS these and the user edits in place. Absent = adding a new
   * address, and every field starts empty.
   */
  readonly flatValue?: string;
  readonly buildingValue?: string;
  readonly selectedLabelId?: string;
  readonly receiverName?: string;
  readonly receiverPhone?: string;
}
