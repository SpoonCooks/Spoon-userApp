import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { AppRuntime } from './runtime';

/**
 * Makes the composition root reachable from feature hooks.
 *
 * A feature's `data.ts` needs the API client, and the alternatives are worse: a module-level
 * singleton makes the client impossible to swap in a test, and threading it through props makes
 * every screen aware of transport it should know nothing about. Context gives the hooks one
 * accessor and gives tests one override point.
 *
 * There is deliberately no default value. A missing provider is a wiring bug that must fail
 * loudly at the first render, not silently produce a client pointed at nothing.
 */

const RuntimeContext = createContext<AppRuntime | null>(null);

export interface RuntimeProviderProps {
  readonly runtime: AppRuntime;
  readonly children: ReactNode;
}

export function RuntimeProvider({ runtime, children }: RuntimeProviderProps) {
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useRuntime(): AppRuntime {
  const runtime = useContext(RuntimeContext);
  if (runtime === null) {
    throw new Error('useRuntime must be used inside <RuntimeProvider>');
  }
  return runtime;
}

/** The API client, which is what a feature hook almost always wants. */
export function useApi() {
  return useRuntime().api;
}
