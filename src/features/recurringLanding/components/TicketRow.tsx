import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { TICKET_NOTCH } from '../art';
import type { SampleTicket } from '../content';

/**
 * "Example routine" — `983:6039`: three sample bookings drawn as tickets, 8 apart, each tilted a
 * little so they read as scattered rather than tabulated. Each sits in a slot as wide as a third of
 * the row; the slot is as tall as its ticket's tilt makes it, and the slots hang from the top so
 * the row is as tall as the tallest (`970:5416`, with its 4 above).
 */
export interface TicketRowProps {
  readonly tickets: readonly SampleTicket[];
  readonly testID?: string;
}

export function TicketRow({ tickets, testID = 'ticket-row' }: TicketRowProps) {
  return (
    <View style={styles.row} testID={testID}>
      {tickets.map((ticket) => (
        <View
          key={`${ticket.day}-${ticket.time}`}
          style={[styles.slot, { paddingTop: ticket.slotTop }]}
        >
          <View style={{ height: ticket.slotHeight, justifyContent: 'center' }}>
            <Ticket ticket={ticket} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * `789:165` — Recurring B / Ticket: a `#FFF7CC` card at a 10 radius, px 12 / py 10, with the day, the
 * time in bold and the duration; a white 12pt notch is cut into each side at the middle (`789:169`,
 * 6 out of the edge and clipped by it, so it bites 6 in).
 */
function Ticket({ ticket }: { readonly ticket: SampleTicket }) {
  return (
    <View
      style={[styles.ticket, { transform: [{ rotate: `${ticket.tilt}deg` }] }]}
      accessible
      accessibilityLabel={`${ticket.day}, ${ticket.time}, ${ticket.duration}`}
    >
      <Text variant="body" color="textPrimary">
        {ticket.day}
      </Text>
      <Text variant="title" color="textPrimary">
        {ticket.time}
      </Text>
      <Text variant="body" color="textPrimary">
        {ticket.duration}
      </Text>
      <Image source={TICKET_NOTCH} style={[styles.notch, styles.notchLeft]} />
      <Image source={TICKET_NOTCH} style={[styles.notch, styles.notchRight]} />
    </View>
  );
}

const NOTCH = 12;

const styles = StyleSheet.create({
  /** `983:6039` — 8 apart, py 6. */
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: lightTheme.space.sm,
    paddingVertical: lightTheme.space.s6,
  },
  slot: { flex: 1 },
  ticket: {
    backgroundColor: lightTheme.colors.surfaceAccent,
    borderRadius: lightTheme.radius.r10,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s10,
    overflow: 'hidden',
  },
  notch: {
    position: 'absolute',
    top: '50%',
    marginTop: -NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
  },
  notchLeft: { left: -NOTCH / 2 },
  notchRight: { right: -NOTCH / 2 },
});
