import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../utils/api";
import { socket } from "../utils/socket";

const cache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const usePublishedTrips = () => {
  const [data, setData] = useState(cache.data);
  const [isLoading, setIsLoading] = useState(!cache.data);
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async (force = false) => {
    // Return cached data if valid and not forced
    if (!force && cache.data && Date.now() - cache.timestamp < CACHE_DURATION_MS) {
      setData(cache.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl("trips/published"), { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }

      const resData = await res.json();
      if (resData.success) {
        cache.data = resData.trips || [];
        cache.timestamp = Date.now();
        setData(cache.data);
      } else {
        throw new Error(resData.message || "Failed to fetch published trips");
      }
    } catch (err) {
      console.error("[usePublishedTrips] Error fetching trips:", err);
      setError(err.message || "Something went wrong while fetching trips");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    const handleTripDeleted = (deletedId) => {
      console.log("[usePublishedTrips] Live trip_deleted event:", deletedId);
      if (cache.data) {
        cache.data = cache.data.filter(t => t._id !== deletedId);
      }
      setData(prev => (prev ? prev.filter(t => t._id !== deletedId) : []));
    };

    socket.on("trip_deleted", handleTripDeleted);
    return () => {
      socket.off("trip_deleted", handleTripDeleted);
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchTrips(true),
  };
};

export default usePublishedTrips;
