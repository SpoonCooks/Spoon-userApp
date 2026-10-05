import {
  FOOTER_BUFFER,
  FOOTER_IN_CURVE,
  FOOTER_IN_MS,
  FOOTER_OUT_CURVE,
  FOOTER_OUT_MS,
  FOOTER_SHOW_ABOVE,
  footerVisibleAt,
} from './stickyFooter';

describe('the sticky footer rule', () => {
  it('is parked at the top, where the Schedule Now tag is on screen', () => {
    expect(footerVisibleAt(false, 0)).toBe(false);
    expect(footerVisibleAt(false, 120)).toBe(false);
  });

  it('comes in only once the tag has gone past the top: scrollY above 254', () => {
    expect(footerVisibleAt(false, FOOTER_SHOW_ABOVE)).toBe(false);
    expect(footerVisibleAt(false, FOOTER_SHOW_ABOVE + 1)).toBe(true);
    expect(footerVisibleAt(false, 900)).toBe(true);
  });

  it('holds through the 8pt buffer on the way back, so it does not bounce at the threshold', () => {
    const out = FOOTER_SHOW_ABOVE - FOOTER_BUFFER;
    expect(footerVisibleAt(true, FOOTER_SHOW_ABOVE)).toBe(true);
    expect(footerVisibleAt(true, FOOTER_SHOW_ABOVE - 1)).toBe(true);
    expect(footerVisibleAt(true, out)).toBe(true);
    expect(footerVisibleAt(true, out - 1)).toBe(false);
    expect(footerVisibleAt(true, 0)).toBe(false);
  });

  it('does not flicker as the page jitters around the threshold', () => {
    let visible = false;
    const trace: boolean[] = [];
    // Crosses 254 up, then wobbles 250 ↔ 256, then drops below 246.
    for (const y of [240, 255, 250, 256, 249, 255, 247, 246, 245, 256]) {
      visible = footerVisibleAt(visible, y);
      trace.push(visible);
    }
    expect(trace).toEqual([false, true, true, true, true, true, true, true, false, true]);
  });

  it('takes 220 ms in on cubic-bezier(.2, .8, .2, 1) and 180 ms out, ease-in', () => {
    expect(FOOTER_IN_MS).toBe(220);
    expect(FOOTER_IN_CURVE).toEqual([0.2, 0.8, 0.2, 1]);
    expect(FOOTER_OUT_MS).toBe(180);
    expect(FOOTER_OUT_CURVE).toEqual([0.42, 0, 1, 1]);
  });
});
