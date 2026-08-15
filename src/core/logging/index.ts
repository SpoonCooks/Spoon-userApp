import { getConfig } from '@core/config';

import { consoleSink, createLogger, noopSink } from './logger';
import type { Logger } from './logger';

let root: Logger | undefined;

/**
 * The app logger. Sink choice is environment-driven: console in development, no-op in
 * production until a real sink is chosen (crash reporting is deferred — §12).
 */
export function getLogger(scope?: string): Logger {
  if (root === undefined) {
    const { logLevel, appEnv } = getConfig();
    root = createLogger({
      level: logLevel,
      sink: appEnv === 'production' ? noopSink : consoleSink,
    });
  }
  return scope === undefined ? root : root.child(scope);
}

/** Test-only: clears the memoised root logger. */
export function resetLoggerCache(): void {
  root = undefined;
}

export { consoleSink, createLogger, noopSink } from './logger';
export type { Logger, LogContext, LogRecord, LogSink } from './logger';
export { redact, REDACTED } from './redact';
