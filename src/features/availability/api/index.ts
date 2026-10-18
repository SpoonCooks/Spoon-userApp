export { AVAILABILITY_PATHS, createAvailabilityApi } from './availabilityApi';
export type { AvailabilityApi } from './availabilityApi';
export {
  useInstantAvailabilities,
  useInstantAvailability,
  useScheduledAvailability,
} from './hooks';
export { availabilityKeys } from './keys';
export { instantAvailabilitySchema, scheduledAvailabilitySchema } from './schemas';
export type { InstantAvailabilityDto, ScheduledAvailabilityDto, ScheduledSlotDto } from './schemas';
