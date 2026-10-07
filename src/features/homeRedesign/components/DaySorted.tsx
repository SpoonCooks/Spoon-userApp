import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { ART } from '../assets';
import { USE_CASES } from '../content';
import { C, F } from '../theme';

/** Artboard width every coordinate below was read from; right-hand items anchor from this edge. */
const W = 402;
const right = (left: number, width: number) => W - left - width;

/**
 * `784:115` "Use cases · Your day, sorted" — 658pt. A dashed arc carries 1 PM / 5 PM across the
 * top, then a dashed spine drops from 5 AM to 8 PM beside the five use cases.
 *
 * The spine's glyphs belong to use cases — noon to lunch, sunset to the snack, night to the
 * office call — so each is laid out in its row, centred on the title's first line, rather than at
 * the frame's fixed y: the copy wraps differently by device, and a fixed glyph drifts off its
 * title. Every glyph and the spine share one centre line, x 31.
 */
export function DaySorted() {
  // Until the last row is measured, end where the frame does (`1095:8027`, 409pt from y 179).
  const [spineEnd, setSpineEnd] = useState(SPINE_TOP + 409);
  return (
    <View style={styles.section}>
      {/* `784:116` — a 340pt ellipse whose top half is drawn; the image is inset as Figma insets it. */}
      <View style={styles.arcBox}>
        <Image source={ART.dayArc} style={styles.arc} resizeMode="stretch" />
      </View>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>How to use Spoon?</Text>
        <Text style={styles.title}>Get your day sorted!</Text>
      </View>

      <Text style={[styles.time, { left: 47, top: 160 }]}>5 AM</Text>
      <Text style={[styles.time, { left: 103, top: 41 }]}>1 PM</Text>
      <Text style={[styles.time, styles.timeRight, { right: right(278, 29), top: 41 }]}>5 PM</Text>
      <Text style={[styles.time, styles.timeRight, { right: right(323, 29), top: 159 }]}>8 PM</Text>

      <Spine top={SPINE_TOP} bottom={spineEnd} />

      <View style={styles.cases}>
        {USE_CASES.map((useCase, index) => {
          const glyph = CASE_GLYPHS[index];
          const last = index === LAST_GLYPH;
          return (
            <View
              key={useCase.title}
              style={styles.useCase}
              onLayout={
                last
                  ? (event) => setSpineEnd(CASES_TOP + event.nativeEvent.layout.y + GLYPH_TOP)
                  : undefined
              }
            >
              {glyph ? <Image source={glyph} style={styles.caseGlyph} /> : null}
              <Text style={styles.caseTitle}>{useCase.title}</Text>
              <View>
                {useCase.body.map((line) => (
                  <Text key={line} style={styles.caseBody}>
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* `1095:8010` — a 32pt glyph rotated 9.71° inside its 36.94pt bounding box. */}
      <View style={[styles.rotBox, { left: 99.53, top: 5.53, width: 36.94, height: 36.94 }]}>
        <Image source={ART.noon} style={[styles.icon32, { transform: [{ rotate: '9.71deg' }] }]} />
      </View>
      <Image source={ART.sunset} style={[styles.icon, { right: right(277, 32), top: 8 }]} />
      <Image source={ART.sunrise} style={[styles.icon, { left: SPINE_X - 16, top: 151 }]} />
      <Image source={ART.night} style={[styles.icon, { right: right(352, 32), top: 151 }]} />
    </View>
  );
}

/** `1095:8027` — the spine's centre line and where it starts, under the 5 AM sunrise. */
const SPINE_X = 31;
const SPINE_TOP = 179;
/** The cases' column; its left edge leaves the spine's 32pt glyphs their lane. */
const CASES_LEFT = 55;
const CASES_TOP = 194;
/** A glyph is centred on the title's first 24pt line: 4pt above it. */
const GLYPH_TOP = (24 - 32) / 2;

/**
 * The frame's glyph per use case: `1095:8011` noon by lunch, `1095:8013` sunset by the snack and
 * `1095:8015` night by the office call, where the spine ends.
 */
const CASE_GLYPHS: readonly (ImageSourcePropType | undefined)[] = [
  undefined,
  ART.noonB,
  ART.sunset,
  undefined,
  ART.night,
];
const LAST_GLYPH = CASE_GLYPHS.length - 1;

/** `1095:8027` — 2pt black-25 % dashes, 6 on / 6 off, centred on x 31. */
const DASH = 6;
const GAP = 6;
function Spine({ top, bottom }: { readonly top: number; readonly bottom: number }) {
  const count = Math.max(0, Math.floor((bottom - top + GAP) / (DASH + GAP)));
  return (
    <View style={[styles.spine, { top, height: Math.max(0, bottom - top) }]} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { height: 658, width: '100%', overflow: 'hidden' },
  arcBox: { position: 'absolute', alignSelf: 'center', top: 3, width: 340, height: 340 },
  /** `inset-[-0.14%_0_49.71%_-0.15%]` of the 340pt box. */
  arc: { position: 'absolute', left: -0.51, top: -0.48, width: 340.51, height: 171.49 },
  header: {
    position: 'absolute',
    top: 83,
    alignSelf: 'center',
    width: 219,
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 20,
    color: C.textSecondary,
  },
  title: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: F.bold,
    fontSize: 20,
    lineHeight: 28,
    color: C.text,
  },
  time: {
    position: 'absolute',
    fontFamily: F.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: C.text,
  },
  timeRight: { width: 29 },
  spine: { position: 'absolute', left: SPINE_X - 1, width: 2, gap: GAP, overflow: 'hidden' },
  dash: { width: 2, height: DASH, borderRadius: 1, backgroundColor: C.spine },
  cases: { position: 'absolute', left: CASES_LEFT, right: 16, top: CASES_TOP, gap: 16 },
  useCase: { gap: 4 },
  /** In the spine's lane: centred on x 31, and on the title's first line. */
  caseGlyph: {
    position: 'absolute',
    left: SPINE_X - 16 - CASES_LEFT,
    top: GLYPH_TOP,
    width: 32,
    height: 32,
  },
  caseTitle: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24, color: C.text },
  caseBody: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary },
  rotBox: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  icon32: { width: 32, height: 32 },
  icon: { position: 'absolute', width: 32, height: 32 },
});
