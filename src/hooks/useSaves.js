import { useCallback, useEffect, useState } from 'react';
import { savesApi } from '../lib/api.js';

// Saved elements sync to Airtable when the deployment has credentials.
// When it doesn't (local dev, fresh fork), the hook silently falls back to
// localStorage so the feature still works. The UI shows which mode is live.

const LOCAL_KEY = 'elementary:saves';

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocal(saves) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(saves));
  } catch {
    // Nothing sensible to do if storage is blocked.
  }
}

export function useSaves() {
  const [saves, setSaves] = useState([]);
  const [mode, setMode] = useState('checking'); // 'airtable' | 'local' | 'checking'

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { saves: remote } = await savesApi.list();
        if (!alive) return;
        setSaves(remote);
        setMode('airtable');
      } catch {
        if (!alive) return;
        setSaves(readLocal());
        setMode('local');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isSaved = useCallback(
    (symbol) => saves.some((s) => s.symbol === symbol),
    [saves]
  );

  const toggle = useCallback(
    async (element) => {
      const existing = saves.find((s) => s.symbol === element.symbol);

      if (mode === 'airtable') {
        // Optimistic update; revert on failure.
        if (existing) {
          setSaves((prev) => prev.filter((s) => s.symbol !== element.symbol));
          try {
            await savesApi.remove(existing.id);
          } catch {
            setSaves((prev) => [...prev, existing]);
          }
        } else {
          const optimistic = { id: `tmp-${element.symbol}`, symbol: element.symbol, name: element.name };
          setSaves((prev) => [...prev, optimistic]);
          try {
            const created = await savesApi.add(element.symbol, element.name);
            setSaves((prev) => prev.map((s) => (s.id === optimistic.id ? created : s)));
          } catch {
            setSaves((prev) => prev.filter((s) => s.id !== optimistic.id));
          }
        }
        return;
      }

      // Local mode.
      setSaves((prev) => {
        const next = existing
          ? prev.filter((s) => s.symbol !== element.symbol)
          : [...prev, { id: element.symbol, symbol: element.symbol, name: element.name }];
        writeLocal(next);
        return next;
      });
    },
    [saves, mode]
  );

  return { saves, mode, isSaved, toggle };
}
