import { PAYMENTS_MODE_HEADER, paymentsModeHeader } from './paymentsMode';

describe('paymentsModeHeader', () => {
  it('asks for the live Razorpay account on Android', () => {
    expect(paymentsModeHeader('android')).toEqual({ [PAYMENTS_MODE_HEADER]: 'live' });
  });

  it('asks for the live Razorpay account on iOS too, now the app is released', () => {
    expect(paymentsModeHeader('ios')).toEqual({ [PAYMENTS_MODE_HEADER]: 'live' });
  });

  it('sends nothing anywhere else, which stays on the default account', () => {
    expect(paymentsModeHeader('web')).toEqual({});
  });
});
