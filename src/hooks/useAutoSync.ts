// ── Move auto-sync hook from BunpoTab / VocabSetTab into a shared hook ──
import { useEffect, useRef, useCallback } from 'react';
import { SyncBackend } from '../services/syncBackend';

/**
 * useAutoSync — bidirectional sync between localStorage and configured backend.
 *
 * On first connect: PULL from server → overwrite local (server is source of truth).
 * Then periodically: PUSH local changes to server (last-writer-wins for ongoing edits).
 * Only runs when backend is a real sync target (not 'none').
 */
export function useAutoSync(backend: SyncBackend | null, intervalMs = 15_000) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Keep mounted flag for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const push = useCallback(async () => {
    if (!backend || backend.id === 'none') return;
    try {
      const { gatherProgress, gatherConfig } = await import('../services/syncBackend');
      const progress = gatherProgress();
      await backend.putProgress(progress);
      const config = gatherConfig();
      await backend.putConfig(config);
    } catch (err) {
      console.warn('[sync] push failed:', err);
    }
  }, [backend]);

  // ── Initial pull: on first connect, download server data to overwrite local ──
  // Uses localStorage flag so it survives the page reload triggered on success.
  useEffect(() => {
    if (!backend || backend.id === 'none') return;

    const PULL_DONE_KEY = 'nihongo-master-sync-pull-done';

    // Already pulled in a previous page load? Skip.
    if (localStorage.getItem(PULL_DONE_KEY)) return;

    // Set flag immediately so concurrent renders don't duplicate the pull.
    localStorage.setItem(PULL_DONE_KEY, 'true');

    (async () => {
      try {
        const { applyProgress } = await import('../services/syncBackend');
        const result = await backend.getProgress();

        // Only overwrite local if the server has actual data.
        if (result.data && Object.keys(result.data).length > 0) {
          applyProgress(result);
          console.log('[sync] pulled server data → overwrote local');
          // Reload so all React components re-initialize from the updated localStorage.
          window.location.reload();
        } else {
          console.log('[sync] server empty — local stays, push will populate it');
          // No reload needed — component state already reflects localStorage.
        }
      } catch (err) {
        // Server unreachable — clear flag so we retry on next app launch.
        localStorage.removeItem(PULL_DONE_KEY);
        console.log('[sync] pull failed, will retry next time:', err);
      }
    })();
  }, [backend]);

  // ── Push interval: periodically save local changes to server ──
  useEffect(() => {
    if (!backend || backend.id === 'none') return;
    timerRef.current = setInterval(push, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [backend, push, intervalMs]);
}

/**
 * Manual sync trigger — call after major data changes (quiz completion, SRS update, etc.)
 */
export function useManualSync(backend: SyncBackend | null) {
  return useCallback(async () => {
    if (!backend || backend.id === 'none') return;
    try {
      const { gatherProgress } = await import('../services/syncBackend');
      const progress = gatherProgress();
      await backend.putProgress(progress);
    } catch (err) {
      console.warn('[sync] manual push failed:', err);
    }
  }, [backend]);
}
