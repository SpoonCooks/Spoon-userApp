import { shareSpoon } from './share';

describe('shareSpoon', () => {
  it('opens WhatsApp first', async () => {
    const openURL = jest.fn().mockResolvedValue(undefined);
    const share = jest.fn();
    await expect(shareSpoon('hi there', { openURL, share })).resolves.toBe('whatsapp');
    expect(openURL).toHaveBeenCalledWith('whatsapp://send?text=hi%20there');
    expect(share).not.toHaveBeenCalled();
  });

  it('falls back to the system share sheet', async () => {
    const openURL = jest.fn().mockRejectedValue(new Error('no app'));
    const share = jest.fn().mockResolvedValue(undefined);
    await expect(shareSpoon('hi', { openURL, share })).resolves.toBe('sheet');
    expect(share).toHaveBeenCalledWith({ message: 'hi' });
  });

  it('never throws', async () => {
    const fail = jest.fn().mockRejectedValue(new Error('x'));
    await expect(shareSpoon('hi', { openURL: fail, share: fail })).resolves.toBe('unavailable');
  });
});
