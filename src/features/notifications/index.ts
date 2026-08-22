/**
 * Feature: notifications.
 *
 * Owns the push-token registration call and nothing else. Delivery, the outbox and the lifecycle
 * jobs belong to the backend worker, which this app never contacts directly.
 */
export * from './api';
export { usePushNotifications } from './usePushNotifications';
export { KNOWN_EVENT_TYPES, isKnownEventType, routeForNotification } from './deepLink';
export type { KnownEventType } from './deepLink';
