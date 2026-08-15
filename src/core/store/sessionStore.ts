import { create } from 'zustand';

import type { SessionEvent, SessionStatus } from '@core/auth/sessionMachine';
import { INITIAL_SESSION_STATUS, sessionReducer } from '@core/auth/sessionMachine';

/**
 * Auth STATUS only. Tokens live in SecureStore and never enter this store.
 * (FRONTEND_FOUNDATION_PLAN.md §7, §9)
 */

interface SessionState {
  readonly status: SessionStatus;
  dispatch: (event: SessionEvent) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: INITIAL_SESSION_STATUS,
  dispatch: (event) => set((state) => ({ status: sessionReducer(state.status, event) })),
  reset: () => set({ status: INITIAL_SESSION_STATUS }),
}));

/** Non-hook access for modules outside React (transport, controllers). */
export const sessionStore = {
  getStatus: (): SessionStatus => useSessionStore.getState().status,
  dispatch: (event: SessionEvent): void => useSessionStore.getState().dispatch(event),
  reset: (): void => useSessionStore.getState().reset(),
};
