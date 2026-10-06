import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ART } from '../assets';
import { COOKS, TRUST_POINTS } from '../content';
import { C, F, SHADOW_CARD } from '../theme';

/** `1170:609` — 368 × 305 inside a 368 × 335 stack that leaves 30pt of air above it. */
const CARD = { width: 368, height: 305 };
/** `inset-[calc(42.62%-0.15px)_-1px_-1px_-1px]` — the band's top, measured inside the border. */
const BAND_TOP = 0.4262 * CARD.height - 0.15 - 1;

/**
 * `1134:604` "Cooks · Meet your cook". Figma stacks the cards on one spot, so exactly one card
 * shows; here each card is a full-width page, so at rest the screen matches the frame and a swipe
 * brings the next cook in.
 */
export function CooksTrust() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(CARD.width, width - 32);
  const [page, setPage] = useState(0);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={styles.section}>
      <View style={styles.titles}>
        <Text style={styles.eyebrow}>YOUR COOK</Text>
        <Text style={styles.title}>Cooks you can trust</Text>
        <Text style={styles.sub}>
          Every Spoon cook is trained, verified and rated before they reach your kitchen.
        </Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        style={styles.stack}
        accessibilityLabel={`Cook ${page + 1} of ${COOKS.length}`}
      >
        {COOKS.map((cook) => (
          <View key={cook.name} style={[styles.page, { width }]}>
            <View style={[styles.card, { width: cardWidth }, SHADOW_CARD]}>
              <View style={styles.cardHeader}>
                <View style={styles.description}>
                  <View style={styles.nameBlock}>
                    <Text style={styles.name}>{cook.name}</Text>
                    <Text style={styles.region}>{`Region: ${cook.region}`}</Text>
                  </View>
                  <View style={styles.rating}>
                    <Text style={styles.ratingText}>{`Rating: ${cook.rating}`}</Text>
                    <Image source={ART.star} style={styles.star} />
                  </View>
                </View>
                <View style={styles.photoFrame}>
                  <Image
                    source={ART.cooks[cook.photo] ?? ART.cooks[0]!}
                    style={styles.photo}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.band}>
                <Image source={ART.bandCurve} style={styles.curve} resizeMode="stretch" />
                <LinearGradient colors={[C.softer, C.tint]} style={styles.bandBody}>
                  {TRUST_POINTS.map((point) => (
                    <View key={point.title} style={styles.point}>
                      <Image source={ART.check} style={styles.check} />
                      <View>
                        <Text style={styles.pointTitle}>{point.title}</Text>
                        <Text style={styles.pointBody}>{point.body}</Text>
                      </View>
                    </View>
                  ))}
                </LinearGradient>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16, width: '100%' },
  titles: { gap: 4, paddingHorizontal: 16 },
  eyebrow: {
    fontFamily: F.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: C.textSecondary,
  },
  title: { fontFamily: F.bold, fontSize: 20, lineHeight: 28, color: C.text },
  sub: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary },
  stack: { flexGrow: 0 },
  /** 30pt of stack above the card, and the section's 8pt bottom padding inside the scroll view
   *  so the card's 6pt shadow is not clipped. */
  page: { paddingTop: 30, paddingBottom: 8, paddingLeft: 16 },
  card: {
    height: CARD.height,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.brand,
    backgroundColor: C.base,
  },
  cardHeader: { padding: 15 },
  description: { width: 231, gap: 8, paddingRight: 8 },
  nameBlock: { gap: 4 },
  name: { fontFamily: F.semibold, fontSize: 18, lineHeight: 26, color: C.text },
  region: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.text },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  star: { width: 12, height: 12 },
  /** `Header image` — right 16 / top 16 of the header, which is itself inset −1 over the border. */
  photoFrame: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: C.softer,
    overflow: 'hidden',
  },
  photo: { width: 100, height: 100 },
  band: {
    position: 'absolute',
    left: -1,
    right: -1,
    bottom: -1,
    top: BAND_TOP,
    overflow: 'hidden',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  curve: { width: '100%', height: 35 },
  bandBody: { flex: 1, gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  check: { width: 16, height: 16 },
  pointTitle: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  pointBody: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.textSecondary },
});
