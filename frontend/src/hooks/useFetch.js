import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useFetch = (url, options = { method: "GET", data: null }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios({
        url,
        method: options.method || "GET",
        data: options.data || null,
        headers: options.headers || {},
        withCredentials: true,
        params: options.params || {},
      });
      setData(response.data);
    } catch (err) {
      if (err.response?.status === 401 && 
          (err.response?.data?.code === 'TOKEN_EXPIRED' || err.response?.data?.code === 'NO_TOKEN')) {
        try {
          await axios.post('/refresh-token', {}, { withCredentials: true });
          
          const retryResponse = await axios({
            url,
            method: options.method || "GET",
            data: options.data || null,
            headers: options.headers || {},
            withCredentials: true,
            params: options.params || {},
          });
          setData(retryResponse.data);
        } catch (refreshError) {
          // Check if refresh token expired or is invalid
          if (refreshError.response?.data?.code === 'REFRESH_TOKEN_EXPIRED' || 
              refreshError.response?.data?.code === 'INVALID_REFRESH_TOKEN' ||
              refreshError.response?.data?.code === 'REFRESH_FAILED') {
            console.log('🚫 Refresh token expired or invalid, redirecting to login');
            window.location.href = '/login';
            setError('Authentication required');
          } else {
            console.log('🚫 Refresh failed, redirecting to login');
            window.location.href = '/login';
            setError('Authentication required');
          }
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [url, options.method, options.data, options.headers, options.params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
