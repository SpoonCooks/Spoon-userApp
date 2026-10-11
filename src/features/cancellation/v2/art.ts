import type { ImageSourcePropType } from 'react-native';

/**
 * Artwork for the redesigned cancellation flow, rasterised at 3× from each Figma layer's own SVG
 * into `assets/figma/cancel-v2/` with transparent backgrounds (the app has no SVG renderer).
 */
const img = (source: unknown) => source as ImageSourcePropType;

export const CANCEL_ART = {
  chevronRight: img(require('../../../../assets/figma/cancel-v2/icon-chevron-right.png')),
  chevronLeft: img(require('../../../../assets/figma/cancel-v2/icon-chevron-left.png')),
  close: img(require('../../../../assets/figma/cancel-v2/icon-close.png')),
  calendar: img(require('../../../../assets/figma/cancel-v2/icon-calendar.png')),
  calendarClose: img(require('../../../../assets/figma/cancel-v2/icon-calendar-close.png')),
  ticketCloudA: img(require('../../../../assets/figma/cancel-v2/ticket-cloud-a.png')),
  ticketCloudB: img(require('../../../../assets/figma/cancel-v2/ticket-cloud-b.png')),
  restart: img(require('../../../../assets/figma/cancel-v2/icon-restart.png')),
  cookAssigned: img(require('../../../../assets/figma/cancel-v2/icon-cook-assigned.png')),
  check: img(require('../../../../assets/figma/cancel-v2/icon-check.png')),
  timelineCloudA: img(require('../../../../assets/figma/cancel-v2/timeline-cloud-a.png')),
  timelineCloudB: img(require('../../../../assets/figma/cancel-v2/timeline-cloud-b.png')),
  money: img(require('../../../../assets/figma/cancel-v2/icon-money.png')),
  onTheWay: img(require('../../../../assets/figma/cancel-v2/icon-on-the-way.png')),
  edit: img(require('../../../../assets/figma/cancel-v2/icon-edit.png')),
  profile: img(require('../../../../assets/figma/cancel-v2/icon-profile.png')),
  exclamation: img(require('../../../../assets/figma/cancel-v2/icon-exclamation.png')),
  cookingPot: img(require('../../../../assets/figma/cancel-v2/icon-cooking-pot.png')),
  dish: img(require('../../../../assets/figma/cancel-v2/icon-dish.png')),
  time: img(require('../../../../assets/figma/cancel-v2/icon-time.png')),
  checkSmall: img(require('../../../../assets/figma/cancel-v2/icon-check-small.png')),
  lock: img(require('../../../../assets/figma/cancel-v2/icon-lock.png')),
  stateCancelled: img(require('../../../../assets/figma/cancel-v2/state-cancelled.png')),
  bannerHalo3: img(require('../../../../assets/figma/cancel-v2/banner-halo-3.png')),
  bannerHalo2: img(require('../../../../assets/figma/cancel-v2/banner-halo-2.png')),
  bannerSun: img(require('../../../../assets/figma/cancel-v2/banner-sun.png')),
  bannerCloudA: img(require('../../../../assets/figma/cancel-v2/banner-cloud-a.png')),
  bannerCloudB: img(require('../../../../assets/figma/cancel-v2/banner-cloud-b.png')),
  checkTiny: img(require('../../../../assets/figma/cancel-v2/icon-check-tiny.png')),
  /**
   * The dashed rings (`2055:20876` timeline dot, `1461:6237` CANCELLED badge), drawn as images:
   * React Native's dashed border on a circle breaks unevenly around the curve.
   */
  dotPending: img(require('../../../../assets/figma/cancel-v2/dot-pending.png')),
  badgeRing: img(require('../../../../assets/figma/cancel-v2/badge-ring.png')),
} as const;
