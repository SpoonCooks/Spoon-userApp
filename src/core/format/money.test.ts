import { formatPaise, formatPaiseGrouped } from './money';

describe('formatPaiseGrouped', () => {
  it('groups rupees the Indian way, as formatPaise otherwise', () => {
    expect(formatPaiseGrouped(100)).toBe('₹1');
    expect(formatPaiseGrouped(100_000)).toBe('₹1,000');
    expect(formatPaiseGrouped(1_000_000)).toBe('₹10,000');
    expect(formatPaiseGrouped(12_345_678)).toBe('₹1,23,456.78');
    expect(formatPaiseGrouped(-150_000)).toBe('-₹1,500');
    expect(formatPaise(100_000)).toBe('₹1000');
  });
});
