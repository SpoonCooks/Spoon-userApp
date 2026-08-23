/**
 * Feature: availability.
 *
 * Owns no screen — the Instant sheet and the Schedule screen render it. It exists so both read
 * the same server answer through one typed module, and so neither generates a slot locally.
 */
export * from './api';
