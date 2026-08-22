/**
 * Feature: support — the WhatsApp handoff behind every `Help` control.
 *
 * The destination itself lives in `@core/support`, which is pure and testable. This module adds
 * only the one thing that needs app context: preferring the catalogue's published support number
 * over the founder-mandated fallback.
 */
export { useWhatsAppHelp } from './useWhatsAppHelp';
