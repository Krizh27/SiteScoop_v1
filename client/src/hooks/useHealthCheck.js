import { useState, useEffect, useCallback } from 'react';
import { fetchHealth } from '../services/api.js';

/**
 * Custom hook to monitor backend health status.
 */
export function useHealthCheck(pollIntervalMs = 15000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      const result = await fetchHealth();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
      setData(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    if (pollIntervalMs > 0) {
      const timer = setInterval(checkHealth, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [checkHealth, pollIntervalMs]);

  return {
    data,
    loading,
    error,
    lastChecked,
    refetch: checkHealth
  };
}
