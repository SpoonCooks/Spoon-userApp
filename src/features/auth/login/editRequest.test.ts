import { consumePhoneEdit, requestPhoneEdit } from './editRequest';

describe('requestPhoneEdit', () => {
  afterEach(() => jest.useRealTimers());

  it('is consumed once', () => {
    requestPhoneEdit();
    expect(consumePhoneEdit()).toBe(true);
    expect(consumePhoneEdit()).toBe(false);
  });

  it('expires, so a Login reached much later does not steal focus', () => {
    jest.useFakeTimers();
    requestPhoneEdit();
    jest.advanceTimersByTime(2000);
    expect(consumePhoneEdit()).toBe(false);
  });
});
