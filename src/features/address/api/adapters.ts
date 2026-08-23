import type { AddressDto, ServiceabilityStatus } from './schemas';
import type { AddressListViewModel, SavedAddressViewModel } from '../types';

/**
 * Address DTO -> view model.
 *
 * The only judgement here is TYPOGRAPHIC: which of the seven address parts go on the single line
 * `6:700` draws, and in what order. That is presentation, and it is done once rather than in
 * every screen that shows an address.
 */

/**
 * `6:700` — the one-line address under the label.
 *
 * Parts are joined in postal order and empties are dropped, so a real address with no tower or
 * no city does not render "E102, , Silver County Road, , 560102". The line is deliberately NOT
 * truncated here: the designed card owns its own `numberOfLines`, and truncating twice loses
 * information the layout could have shown.
 */
export function addressLineOf(dto: AddressDto): string {
  return [dto.flat, dto.tower, dto.society, dto.street, dto.city, dto.pincode]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join(', ');
}

export function savedAddressFrom(dto: AddressDto): SavedAddressViewModel {
  return {
    id: dto.id,
    label: dto.label,
    line: addressLineOf(dto),
    // The server's default flag is the selection. The client does not pick one.
    ...(dto.isDefault ? { selected: true } : {}),
  };
}

export function addressListFrom(input: {
  readonly base: AddressListViewModel;
  readonly addresses: readonly AddressDto[];
}): AddressListViewModel {
  return { ...input.base, addresses: input.addresses.map(savedAddressFrom) };
}

/**
 * The serviceability verdict as the map step's inline message (ruling R-4).
 *
 * `undefined` for a serviceable point means the screen draws no message at all, which is what
 * the frame does. The two refusal messages are distinct because they mean different things to a
 * customer: one is "not yet", the other is "not now".
 *
 * FIGMA_PENDING: this copy is not in the design file — `215:1472` supplies a headline for the
 * dedicated out-of-service SCREEN, but the inline message on the map step has no drawn text.
 * These are neutral placeholders and are expected to be replaced when copy lands.
 */
export function serviceabilityMessageFor(status: ServiceabilityStatus): string | undefined {
  switch (status) {
    case 'serviceable':
      return undefined;
    case 'temporarily_unavailable':
      return 'We are not serving this area right now. Please try again later.';
    case 'outside_service_area':
      return 'We do not serve this area yet.';
  }
}

/** Whether the "Check Availability & Save" CTA may proceed. The SERVER decided this. */
export function isServiceable(status: ServiceabilityStatus): boolean {
  return status === 'serviceable';
}
