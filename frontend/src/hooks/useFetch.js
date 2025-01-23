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
        headers: options.headers || { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log(response.data);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, options.method, options.data, options.headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
