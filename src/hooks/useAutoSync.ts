// ── Move auto-sync hook from BunpoTab / VocabSetTab into a shared hook ──
import { useEffect, useRef, useCallback } from 'react';
import { SyncBackend } from '../services/syncBackend';

/**
 * useAutoSync — periodically pushes learning progress to the configured backend.
 * Only runs when backend is a real sync target (not 'none').
 */
export function useAutoSync(backend: SyncBackend | null, intervalMs = 15_000) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const lastSavedRef = useRef<string | null>(null);

  // Keep mounted flag for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track lastSaved so we don't push unchanged data
  useEffect(() => {
    const stored = localStorage.getItem('nihongo-master-sync-lastUpdated');
    lastSavedRef.current = stored;
    const onStorage = () => {
      const s = localStorage.getItem('nihongo-master-sync-lastUpdated');
      if (s) lastSavedRef.current = s;
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const push = useCallback(async () => {
    if (!backend || backend.id === 'none') return;
    try {
      const { gatherProgress, gatherConfig } = await import('../services/syncBackend');
      const progress = gatherProgress();
      await backend.putProgress(progress);
      // Config rarely changes, but push it too for completeness
      const config = gatherConfig();
      await backend.putConfig(config);
    } catch (err) {
      console.warn('[sync] push failed:', err);
    }
  }, [backend]);

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
