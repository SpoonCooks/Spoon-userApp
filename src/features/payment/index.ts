/**
 * Feature: payment.
 *
 * The backend owns order creation, signature verification, webhook verification and
 * reconciliation. This module asks for an order, hands the checkout result back for VERIFICATION,
 * and then re-reads the booking. It never decides that a payment succeeded.
 */
export * from './api';
