
import { useState, useCallback } from 'react';

export interface AsyncState<T> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: Error | null;
  loading: boolean;
}

type AsyncFn<T> = (...args: any[]) => Promise<T>;

export function useAsync<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: initialData,
    error: null,
    loading: false,
  });

  const run = useCallback(async (promise: Promise<T>) => {
    if (!promise || !promise.then) {
      throw new Error('The argument passed to useAsync().run must be a promise');
    }
    
    setState({ status: 'pending', data: null, error: null, loading: true });
    
    try {
      const data = await promise;
      setState({ status: 'success', data, error: null, loading: false });
      return data;
    } catch (error) {
      setState({ 
        status: 'error', 
        data: null, 
        error: error instanceof Error ? error : new Error(String(error)), 
        loading: false 
      });
      throw error;
    }
  }, []);

  return {
    ...state,
    run,
  };
}
