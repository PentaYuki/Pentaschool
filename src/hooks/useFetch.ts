/**
 * useFetch - custom hook với AbortController để tránh memory leak
 * khi component unmount trong khi fetch đang chạy.
 *
 * Usage:
 *   const { get, post, loading } = useFetch();
 *   const data = await get('/api/pages');
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export function useFetch() {
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const get = useCallback(async <T = unknown>(url: string, options?: RequestInit): Promise<T | null> => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (mountedRef.current) setLoading(true);
    try {
      const res = await fetch(url, { ...options, signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data: T = await res.json();
      return data;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const post = useCallback(async <T = unknown>(url: string, body: unknown, options?: RequestInit): Promise<T | null> => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (mountedRef.current) setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        ...options,
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data: T = await res.json();
      return data;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  /** Abort tất cả fetch đang chạy - dùng khi unmount hoặc reset */
  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { get, post, abort, loading };
}

/**
 * useAbortEffect - wrapper useEffect với AbortController tích hợp.
 * Tự động abort khi dep thay đổi hoặc component unmount.
 *
 * Usage:
 *   useAbortEffect((signal) => {
 *     fetch('/api/data', { signal }).then(...)
 *   }, [dep]);
 */
export function useAbortEffect(
  effect: (signal: AbortSignal) => void | (() => void),
  deps: React.DependencyList,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const controller = new AbortController();
    const cleanup = effect(controller.signal);
    return () => {
      controller.abort();
      cleanup?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
