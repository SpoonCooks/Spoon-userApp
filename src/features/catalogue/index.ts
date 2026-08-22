/**
 * Feature: catalogue — `GET /v1/catalogue`.
 *
 * The published business values every other feature reads instead of hardcoding: durations and
 * their prices, the tax rate, the operating window, the scheduled horizon and meal periods, the
 * instant arrival promise, extension SKUs, the cancellation bands and reason list, suggested tip
 * amounts, meal-brief bounds and support channels.
 *
 * It owns no screen. It exists so that no screen owns a number.
 */
export * from './api';
