import { View } from 'react-native';

import { DurationGuideTable } from '@ui';

import { HOME_DESIGN, useHomeContentWidth } from '../layout';
import type { HomeDurationGuideRow } from '../types';
import { SectionTitle, sectionStyles } from './SectionTitle';

const { section: SECTION } = HOME_DESIGN;

/**
 * "How to choose a duration?" - Figma `135:79`, table `135:93`.
 *
 * The TABLE itself now lives in `@ui` as `DurationGuideTable`, because the final file draws the
 * same one inside the "Help me pick" sheet (`333:3643`) raised from the Duration step of
 * Scheduled and Instant. This component is what Home adds around it: the shared section title and
 * Home's own measured content width, which is already computed once for the whole page and is
 * therefore passed in rather than re-measured per table.
 *
 * Every measurement — the 21pt `#FFE666` header, the 18pt alternating rows, the 40 -> 10pt
 * collapsing gutter — moved with the table and is unchanged.
 *
 * This table is CONTENT, not logic. It does not drive, validate or constrain the duration options
 * offered anywhere in the booking flows — those are backend-owned.
 */
export interface HomeDurationMatrixProps {
  readonly title: string;
  readonly columns: readonly [string, string, string];
  readonly rows: readonly HomeDurationGuideRow[];
}

export function HomeDurationMatrix({ title, columns, rows }: HomeDurationMatrixProps) {
  const contentWidth = useHomeContentWidth() - SECTION.paddingHorizontal * 2;

  return (
    <View style={sectionStyles.section} testID="home-duration-guide">
      <SectionTitle>{title}</SectionTitle>
      <DurationGuideTable columns={columns} rows={rows} contentWidth={contentWidth} />
    </View>
  );
}
