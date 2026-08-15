import { singleFlight } from './singleFlight';

describe('singleFlight', () => {
  it('collapses concurrent callers into one execution', async () => {
    let calls = 0;
    let release: (value: string) => void = () => undefined;

    const run = singleFlight(async () => {
      calls += 1;
      return new Promise<string>((resolve) => {
        release = resolve;
      });
    });

    const results = Promise.all([run(), run(), run()]);
    release('token');

    await expect(results).resolves.toEqual(['token', 'token', 'token']);
    expect(calls).toBe(1);
  });

  it('allows a fresh execution once the previous one settles', async () => {
    let calls = 0;
    const run = singleFlight(async () => {
      calls += 1;
      return calls;
    });

    await run();
    await run();

    expect(calls).toBe(2);
  });

  it('does not latch a rejected promise', async () => {
    let calls = 0;
    const run = singleFlight(async () => {
      calls += 1;
      throw new Error(`boom ${calls}`);
    });

    await expect(run()).rejects.toThrow('boom 1');
    await expect(run()).rejects.toThrow('boom 2');
  });
});
