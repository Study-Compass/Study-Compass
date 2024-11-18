import { useState, useEffect } from "react";
import axios from "axios";

export const useFetch = (url, options = { method: "GET", data: null }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; //track whether component is mounted
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios({
          url,
          method: options.method || "GET",
          data: options.data || null,
          headers: options.headers || {"Authorization": `Bearer ${localStorage.getItem("token")}`},
        });
        console.log(response);
        if (isMounted) setData(response.data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false; //avoid setting state on unmounted component
    };
  }, [url, options.method, options.data, options.headers]);

  return { data, loading, error };
};
