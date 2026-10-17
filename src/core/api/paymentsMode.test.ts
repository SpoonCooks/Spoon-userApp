import { PAYMENTS_MODE_HEADER, paymentsModeHeader } from './paymentsMode';

describe('paymentsModeHeader', () => {
  it('asks for the live Razorpay account on Android', () => {
    expect(paymentsModeHeader('android')).toEqual({ [PAYMENTS_MODE_HEADER]: 'live' });
  });

  it('sends nothing on iOS, which stays on the default account', () => {
    expect(paymentsModeHeader('ios')).toEqual({});
  });
});
