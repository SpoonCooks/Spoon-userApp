import { consoleSink, createLogger, REDACTED } from './index';
import type { LogRecord, LogSink } from './logger';

function createRecordingSink(): LogSink & { records: LogRecord[] } {
  const records: LogRecord[] = [];
  return {
    records,
    write(record) {
      records.push(record);
    },
  };
}

describe('createLogger', () => {
  it('suppresses records below the configured level', () => {
    const sink = createRecordingSink();
    const logger = createLogger({ level: 'warn', sink });

    logger.debug('nope');
    logger.info('nope');
    logger.warn('yes');
    logger.error('yes');

    expect(sink.records.map((record) => record.level)).toEqual(['warn', 'error']);
  });

  it('writes nothing at silent', () => {
    const sink = createRecordingSink();
    createLogger({ level: 'silent', sink }).error('boom');

    expect(sink.records).toHaveLength(0);
  });

  it('prefixes scopes and nests child scopes', () => {
    const sink = createRecordingSink();
    const logger = createLogger({ level: 'debug', sink, scope: 'api' });

    logger.info('root');
    logger.child('auth').info('nested');

    expect(sink.records.map((record) => record.message)).toEqual([
      '[api] root',
      '[api:auth] nested',
    ]);
  });

  it('redacts context before it reaches the console sink', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => undefined);

    createLogger({ level: 'debug', sink: consoleSink }).info('sending otp', { otp: '4821' });

    expect(spy).toHaveBeenCalledWith('sending otp', { otp: REDACTED });
    spy.mockRestore();
  });
});
