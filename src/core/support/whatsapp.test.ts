import {
  SPOON_WHATSAPP_PHONE,
  normaliseWhatsAppPhone,
  openWhatsApp,
  resolveWhatsAppPhone,
  whatsAppDeepLink,
  whatsAppWebLink,
} from './whatsapp';

/** The founder ruling on the final Figma (task §15). Pinned so a typo cannot pass review. */
describe('the destination', () => {
  it('is 8792997836 in international form', () => {
    expect(SPOON_WHATSAPP_PHONE).toBe('918792997836');
  });

  it('is what both link forms address when nothing is published', () => {
    expect(whatsAppDeepLink()).toBe('whatsapp://send?phone=918792997836');
    expect(whatsAppWebLink()).toBe('https://wa.me/918792997836');
  });
});

describe('normaliseWhatsAppPhone', () => {
  it('adds the country code to a bare 10-digit Indian number', () => {
    expect(normaliseWhatsAppPhone('8792997836')).toBe('918792997836');
  });

  it('strips punctuation without adding a second country code', () => {
    expect(normaliseWhatsAppPhone('+91 87929-97836')).toBe('918792997836');
  });

  it('rejects a value that cannot be a phone number', () => {
    expect(normaliseWhatsAppPhone('help')).toBeNull();
    expect(normaliseWhatsAppPhone('12345')).toBeNull();
    expect(normaliseWhatsAppPhone(null)).toBeNull();
    expect(normaliseWhatsAppPhone(undefined)).toBeNull();
  });
});

describe('resolveWhatsAppPhone', () => {
  it('prefers a number the catalogue publishes', () => {
    expect(resolveWhatsAppPhone('9000000001')).toBe('919000000001');
  });

  it('falls back to the mandated line when the server publishes nothing', () => {
    expect(resolveWhatsAppPhone(null)).toBe(SPOON_WHATSAPP_PHONE);
    expect(resolveWhatsAppPhone(undefined)).toBe(SPOON_WHATSAPP_PHONE);
  });

  it('falls back rather than linking to a malformed server value', () => {
    expect(resolveWhatsAppPhone('n/a')).toBe(SPOON_WHATSAPP_PHONE);
  });
});

describe('openWhatsApp', () => {
  it('opens the installed app first', async () => {
    const openURL = jest.fn().mockResolvedValue(undefined);

    await expect(openWhatsApp({}, { openURL })).resolves.toBe('app');
    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith('whatsapp://send?phone=918792997836');
  });

  it('falls back to wa.me when WhatsApp is not installed', async () => {
    const openURL = jest
      .fn()
      .mockRejectedValueOnce(new Error('no activity found'))
      .mockResolvedValueOnce(undefined);

    await expect(openWhatsApp({}, { openURL })).resolves.toBe('browser');
    expect(openURL).toHaveBeenNthCalledWith(2, 'https://wa.me/918792997836');
  });

  it('reports unavailable instead of throwing when nothing can open a link', async () => {
    const openURL = jest.fn().mockRejectedValue(new Error('blocked'));

    // A Help button that cannot reach WhatsApp must not crash the screen it sits on.
    await expect(openWhatsApp({}, { openURL })).resolves.toBe('unavailable');
  });

  it('carries a prefilled message through both routes', async () => {
    const openURL = jest.fn().mockResolvedValue(undefined);

    await openWhatsApp({ message: 'Hi Spoon & team' }, { openURL });
    expect(openURL).toHaveBeenCalledWith(
      'whatsapp://send?phone=918792997836&text=Hi%20Spoon%20%26%20team',
    );

    expect(whatsAppWebLink({ message: 'Hi Spoon & team' })).toBe(
      'https://wa.me/918792997836?text=Hi%20Spoon%20%26%20team',
    );
  });
});
