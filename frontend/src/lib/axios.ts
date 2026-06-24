import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("skydrive_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / authorization errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("skydrive_token");
        // Only redirect if we are not already on the login or register pages
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Simple Local Storage caching layer for GET requests to prevent costly refetches on reload
const originalRequest = api.request;
api.request = async function (config: any): Promise<any> {
  const method = config.method?.toLowerCase() || "get";

  // Cache invalidation for mutative requests
  if (method !== "get") {
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("axios_cache_")) {
          localStorage.removeItem(key);
        }
      }
    }
    return originalRequest.call(this, config);
  }

  // Caching for GET requests (SWR pattern)
  if (typeof window === "undefined" || config.responseType === "blob") {
    return originalRequest.call(this, config);
  }

  const cacheKey = `axios_cache_${config.url || ""}_${JSON.stringify(config.params || {})}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // If cache is less than 5 minutes old, return it instantly
      if (age < 5 * 60 * 1000) {
        // Fetch in background silently to update the cache
        originalRequest.call(this, config).then((response: any) => {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: response.data,
            timestamp: Date.now()
          }));
        }).catch(() => {});

        return { data, status: 200, statusText: "OK", headers: {}, config };
      }
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  const response: any = await originalRequest.call(this, config);
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }));
  } catch (e) {}
  return response;
};

export default api;
