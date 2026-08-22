import type { AddressLabelOption } from './types';

/**
 * `60:655` "Page 18b- Complete address" — what has to be true before Confirm may be pressed.
 *
 * ## Why this is a module and not an expression on the button
 *
 * The rule is a PRODUCT rule ("Confirm stays grey until the address is complete"), it is asked
 * twice — once to draw the CTA and once to refuse the handler — and it is asked about a form that
 * is edited in two modes. Spreading it as `!flat || !building || ...` across the screen and the
 * route is how the two copies drift, which is exactly how a greyed-out CTA ends up still firing
 * a `POST`.
 *
 * It stays in `features/address` rather than becoming a generic form abstraction: nothing else in
 * V0 collects these fields, and a shared validator would have to be told about them anyway.
 *
 * ## The field contract, read off `60:655` and the V7 founder comment
 *
 * REQUIRED    `60:697`   Flat no./ House no.
 *             `63:789`   Building/ Tower name or Plot no.  (ONE field — the frame's label is
 *                        "or", so a plot number satisfies it)
 *             `339:4600` Label as — one of Home · Parents · Friends · Others
 * CONDITIONAL `339:4609` Save as — drawn ONLY under Others, and REQUIRED there. Selecting a named
 *                        chip removes both the field and the requirement.
 * OPTIONAL    `222:1559` Receiver's name  and  `64:27` Receiver's phone. `64:6` marks the block
 *                        "(Optional)" in the frame itself, so neither is ever required here.
 *
 * The AREA (`339:4589`) is not in this list because it is not a field the customer fills: it is
 * the geocoder's reading of the point `53:31` produced. What the form needs from that step is the
 * CONFIRMED, server-approved coordinate, and that lives with the caller — see `locationReady` on
 * `AddressDetailsViewProps`.
 *
 * ## Whitespace
 *
 * `' '` is not a flat number. Every required text field is judged on its TRIMMED value, and the
 * same trimmed value is what gets submitted, so a field cannot pass validation and then be saved
 * as blank.
 */

/** The chip that opens the free-text name. `339:4608` is the fourth chip on `60:655`. */
const OTHERS_LABEL_ID = 'others';

/** The subset of the form the CTA's state depends on. Receiver details are deliberately absent. */
export interface AddressFormValues {
  readonly flat: string;
  readonly building: string;
  readonly labelId: string | null;
  readonly saveAs: string;
}

/** What the SERVER's copy makes available, which decides whether "Save as" is even in play. */
export interface AddressFormShape {
  /** The resolved id of the Others chip, or `null` when the supplied set has no such chip. */
  readonly othersLabelId: string | null;
  /** `339:4609` is drawn at all — the copy supplied a placeholder for it. */
  readonly saveAsOffered: boolean;
}

/** Named so a failing test says which requirement failed rather than just `false`. */
export type AddressRequiredField = 'flat' | 'building' | 'label' | 'saveAs';

/**
 * The Others chip, matched on its id first and on its drawn word second.
 *
 * The chip set is data (`labelOptions`), so a set that arrives from the server with different ids
 * still resolves without this screen hardcoding the copy — and a set with no Others chip at all
 * simply never puts "Save as" in play.
 */
export function othersLabelIdOf(options: readonly AddressLabelOption[]): string | null {
  const found = options.find(
    (option) => option.id === OTHERS_LABEL_ID || option.label.trim().toLowerCase() === 'others',
  );
  return found?.id ?? null;
}

export function isOthersSelected(labelId: string | null, shape: AddressFormShape): boolean {
  return shape.othersLabelId !== null && labelId === shape.othersLabelId;
}

/**
 * Every requirement the form does not yet meet, in the order the fields are drawn.
 *
 * Returned as a list rather than a boolean so the caller can say WHICH field is holding the CTA —
 * used by the tests, and available to the screen the day `60:655` draws a validation state.
 */
export function missingAddressFields(
  values: AddressFormValues,
  shape: AddressFormShape,
): readonly AddressRequiredField[] {
  const missing: AddressRequiredField[] = [];

  if (values.flat.trim() === '') missing.push('flat');
  if (values.building.trim() === '') missing.push('building');
  if (values.labelId === null || values.labelId === '') missing.push('label');
  // Others without a name is not a label — saving it would put the literal word "others" on
  // `68:214`. A named chip already IS the name, so the field is out of play and so is the rule.
  if (shape.saveAsOffered && isOthersSelected(values.labelId, shape) && values.saveAs.trim() === '')
    missing.push('saveAs');

  return missing;
}

export function isAddressFormComplete(values: AddressFormValues, shape: AddressFormShape): boolean {
  return missingAddressFields(values, shape).length === 0;
}

/**
 * The whole gate, in one place: the form, the confirmed location and the request in flight.
 *
 * `locationReady` is the caller's — the map step's server-approved point when adding, the saved
 * record's own point when editing. This module never evaluates coverage; it only refuses to let
 * Confirm fire without an answer.
 */
export interface AddressSubmitGate {
  readonly values: AddressFormValues;
  readonly shape: AddressFormShape;
  /** A confirmed, serviceability-checked coordinate exists for the address being saved. */
  readonly locationReady: boolean;
  /** `POST` / `PUT` already in flight — the double-submission guard. */
  readonly submitting: boolean;
}

export function canSubmitAddress(gate: AddressSubmitGate): boolean {
  return isAddressFormComplete(gate.values, gate.shape) && gate.locationReady && !gate.submitting;
}
