import { Image, StyleSheet, Text, View } from 'react-native';

import { ART } from '../assets';
import { USE_CASES } from '../content';
import { C, F } from '../theme';

/** Artboard width every coordinate below was read from; right-hand items anchor from this edge. */
const W = 402;
const right = (left: number, width: number) => W - left - width;

/**
 * `784:115` "Use cases · Your day, sorted" — 658pt. A dashed arc carries 1 PM / 5 PM across the
 * top, then a dashed spine drops from 5 AM to 8 PM beside the five use cases.
 */
export function DaySorted() {
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

      <Image source={ART.dayLine} style={styles.spine} resizeMode="stretch" />

      <View style={styles.cases}>
        {USE_CASES.map((useCase) => (
          <View key={useCase.title} style={styles.useCase}>
            <Text style={styles.caseTitle}>{useCase.title}</Text>
            <View>
              {useCase.body.map((line) => (
                <Text key={line} style={styles.caseBody}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* `1095:8010` — a 32pt glyph rotated 9.71° inside its 36.94pt bounding box. */}
      <View style={[styles.rotBox, { left: 99.53, top: 5.53, width: 36.94, height: 36.94 }]}>
        <Image source={ART.noon} style={[styles.icon32, { transform: [{ rotate: '9.71deg' }] }]} />
      </View>
      <View style={[styles.rotBox, { left: 15, top: 274, width: 32.08, height: 32.08 }]}>
        <Image
          source={ART.noonB}
          style={[styles.icon32, { transform: [{ rotate: '-0.15deg' }] }]}
        />
      </View>
      <Image source={ART.sunset} style={[styles.icon, { right: right(277, 32), top: 8 }]} />
      <Image source={ART.sunset} style={[styles.icon, { left: 13, top: 398 }]} />
      <Image source={ART.sunrise} style={[styles.icon, { left: 15, top: 151 }]} />
      <Image source={ART.night} style={[styles.icon, { left: 16, top: 586 }]} />
      <Image source={ART.night} style={[styles.icon, { right: right(352, 32), top: 151 }]} />
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
  /**
   * `1095:8027` — a 409pt vertical rule at x 31 from y 179. The asset is the 411 × 2 horizontal
   * dash (`inset-[-1px_-0.24%]`) turned upright about its centre (31, 383.5).
   */
  spine: {
    position: 'absolute',
    left: 31 - 205.5,
    top: 383.5 - 1,
    width: 411,
    height: 2,
    transform: [{ rotate: '90deg' }],
  },
  cases: { position: 'absolute', left: 55, right: 16, top: 194, gap: 16 },
  useCase: { gap: 4 },
  caseTitle: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24, color: C.text },
  caseBody: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary },
  rotBox: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  icon32: { width: 32, height: 32 },
  icon: { position: 'absolute', width: 32, height: 32 },
});
