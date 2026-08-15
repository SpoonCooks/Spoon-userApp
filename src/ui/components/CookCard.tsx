import { Fragment } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { CookViewModel, DishViewModel } from '@ui/types/viewModels';

import { COOK_ATTRIBUTE_ART, COOK_CALL_GLYPH, COOK_SPECIALTIES_GLYPH } from './cookAssets';
import { SpecialtyGrid } from './SpecialtyGrid';
import { TrustBadges } from './TrustBadges';

/**
 * The cook profile card — Figma `94:906`, embedded unchanged in Confirmation (`3:1041`),
 * En route (`3:1381` / `99:1413`), Arrived (`3:1658`), In service (`101:1812`) and
 * Completion (`143:207`).
 *
 * Geometry, verbatim:
 *   card    white, 1pt `#FFD600` border, radius 24, px 15.889 / py 20, gap 21,
 *           `0 0 2 rgba(0,0,0,0.08)`
 *   photo   `94:909` — an 85 × 90 `#FFF7CC` PANEL at a 16pt radius, cover-cropped.
 *           NOT a circular avatar; the previous card drew one.
 *   name    Livvic Black 16/24, black
 *   meta    `94:915` — a wrapping row of 16pt exported glyphs with Livvic Medium 11/16.5
 *           `rgba(0,0,0,0.7)` labels, separated by `#FFD600` bullets
 *   call    `94:937` — a `#E2FF68` pill at a 8pt radius, 21pt tall, with a 14pt handset and a
 *           Livvic SemiBold 10/13.33 label
 *   header  `94:943` — a 16pt frying pan + "What {first} cooks best?" Livvic Bold 12/16
 *
 * Confirmed C-6: the regular and pure-veg cards are identical in every respect EXCEPT the 3×3
 * specialty grid — same photo, name, attribute row, CTA and trust row. So `variant` selects which
 * dish list is shown and changes nothing else. It is a display filter, not a second roster.
 *
 * Calling: `onCallCook` is a CALLBACK. No phone number is a prop, so this component cannot
 * render, log or leak one, and it does not know how a call is placed.
 *
 * Heading: always interpolated as "What {firstName} cooks best?" — the Figma file hardcodes
 * "rekha" on 6 of 8 cards (defect D-4).
 */

export type CookCardVariant = 'standard' | 'pureVeg';

export interface CookCardProps {
  readonly cook: CookViewModel;
  readonly variant?: CookCardVariant;
  /** Omit to hide the CTA — e.g. after service completion. */
  readonly onCallCook?: () => void;
  readonly showSpecialties?: boolean;
  readonly testID?: string;
}

interface Attribute {
  readonly key: string;
  readonly art: ImageSourcePropType | undefined;
  readonly value: string;
}

function attributesOf(cook: CookViewModel): readonly Attribute[] {
  const languages = cook.languages ?? [];

  const candidates: readonly (Attribute | null)[] = [
    cook.gender === undefined
      ? null
      : { key: 'gender', art: COOK_ATTRIBUTE_ART['gender'], value: cook.gender },
    cook.cuisine === undefined
      ? null
      : { key: 'cuisine', art: COOK_ATTRIBUTE_ART['cuisine'], value: cook.cuisine },
    cook.homeState === undefined
      ? null
      : { key: 'homeState', art: COOK_ATTRIBUTE_ART['homeState'], value: cook.homeState },
    languages.length === 0
      ? null
      : { key: 'languages', art: COOK_ATTRIBUTE_ART['languages'], value: languages.join(', ') },
  ];

  return candidates.filter((attribute): attribute is Attribute => attribute !== null);
}

/** The photo panel's fallback when the payload carries no `photoUrl`. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

/**
 * `94:915` is a 2 × 2 GRID, not a wrapping list: each row is `col1 • col2`, with the bullets
 * vertically aligned at x = 90 because column one is a fixed 86 wide.
 *
 * Rendering it as one flowing list put a separator BEFORE every item but the first, so when the
 * list wrapped, row one ended with a dangling "•" that the frame does not draw. Pairing the
 * attributes makes the separator an in-row element, which is what the node actually contains.
 */
function attributeRows(attributes: readonly Attribute[]): readonly (readonly Attribute[])[] {
  const rows: Attribute[][] = [];
  for (let index = 0; index < attributes.length; index += 2) {
    rows.push(attributes.slice(index, index + 2));
  }
  return rows;
}

function dishesFor(cook: CookViewModel, variant: CookCardVariant): readonly DishViewModel[] {
  if (variant === 'pureVeg') {
    return cook.pureVegSpecialties ?? [];
  }
  return cook.specialties ?? [];
}

export function CookCard({
  cook,
  variant = 'standard',
  onCallCook,
  showSpecialties = true,
  testID = 'cook-card',
}: CookCardProps) {
  const attributes = attributesOf(cook);
  const dishes = dishesFor(cook, variant);

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.identity}>
        <View style={styles.photo} testID={`${testID}-avatar`}>
          {cook.photoUrl === undefined ? (
            <Text variant="heading" color="textPrimary" align="center">
              {initialsOf(cook.displayName)}
            </Text>
          ) : (
            <Image
              source={{ uri: cook.photoUrl }}
              style={styles.photoImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          )}
        </View>

        <View style={styles.identityText}>
          <Text variant="heading" color="textPrimary" accessibilityRole="header" numberOfLines={1}>
            {cook.displayName}
          </Text>

          {attributes.length === 0 ? null : (
            <View style={styles.attributes} testID={`${testID}-attributes`}>
              {attributeRows(attributes).map((row) => (
                <View key={row[0]?.key ?? 'row'} style={styles.attributeRow}>
                  {row.map((attribute, column) => (
                    <Fragment key={attribute.key}>
                      {column === 0 ? null : (
                        <Text variant="labelMedium" color="surfaceCta" style={styles.separator}>
                          •
                        </Text>
                      )}
                      <View
                        style={column === 0 ? styles.attributeLead : styles.attribute}
                        accessible
                      >
                        {attribute.art === undefined ? null : (
                          <Image
                            source={attribute.art}
                            style={styles.attributeGlyph}
                            resizeMode="contain"
                            accessibilityIgnoresInvertColors
                          />
                        )}
                        <Text variant="labelMedium" color="textSecondary" numberOfLines={1}>
                          {attribute.value}
                        </Text>
                      </View>
                    </Fragment>
                  ))}
                </View>
              ))}
            </View>
          )}

          {onCallCook === undefined ? null : (
            <Pressable
              onPress={onCallCook}
              accessibilityRole="button"
              accessibilityLabel={`Call ${cook.firstName}`}
              hitSlop={12}
              style={styles.call}
              testID={`${testID}-call`}
            >
              <Image
                source={COOK_CALL_GLYPH}
                style={styles.callGlyph}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Text variant="captionStrong" color="textSecondary">
                Call Cook
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {showSpecialties && dishes.length > 0 ? (
        <View style={styles.specialties}>
          <View style={styles.specialtiesHeading}>
            <Image
              source={COOK_SPECIALTIES_GLYPH}
              style={styles.attributeGlyph}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text variant="bodyBold" color="textPrimary" accessibilityRole="header">
              {`What ${cook.firstName} cooks best?`}
            </Text>
          </View>
          <SpecialtyGrid dishes={dishes} testID={`${testID}-specialties`} />
        </View>
      ) : null}

      <TrustBadges
        {...(cook.badges === undefined ? {} : { badges: cook.badges })}
        testID={`${testID}-badges`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: 21,
    paddingHorizontal: 15.889,
    paddingVertical: 20,
    borderRadius: lightTheme.layout.cardRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surface,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.md },
  /** `94:909` — an 85 × 90 panel, not a circle. */
  photo: {
    width: 85,
    height: 90,
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccent,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  photoImage: { width: '100%', height: '100%' },
  identityText: { flex: 1, minWidth: 0, gap: lightTheme.space.sm, paddingVertical: 5 },
  /** `94:915` — two 16pt rows 3.5pt apart. */
  attributes: { gap: 3.5 },
  attributeRow: { flexDirection: 'row', alignItems: 'center' },
  /** `94:916` / `94:926` — column one is a fixed 86 so the two bullets line up at x = 90. */
  attributeLead: { flexDirection: 'row', alignItems: 'center', gap: 3, width: 86 },
  attribute: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 },
  /** `94:920` sits at x 90 with column two at 98.93 — 4pt clear on each side. */
  separator: { marginHorizontal: 4 },
  attributeGlyph: { width: 16, height: 16 },
  /** `94:937` — a canary pill, 21pt tall. `hitSlop` restores the 44pt target. */
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: lightTheme.space.s6,
    minWidth: 90,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: 5.889,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceEta,
  },
  callGlyph: { width: 14, height: 14 },
  specialties: { gap: 9 },
  specialtiesHeading: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
});
