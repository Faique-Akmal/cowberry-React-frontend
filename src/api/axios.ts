import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// --- Configuration ---
const API_URL = import.meta.env.VITE_BASE_URL;

// --- Types ---
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

// --- State Variables ---
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

// --- Helper: Queue Process ---
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// --- Axios Instance ---
const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request Interceptor ---
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Safety check: Avoid loop if refresh endpoint itself fails
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(API(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // localStorage.clear();
        // window.location.href = "/signin";
        return Promise.reject(error);
      }

      try {
        console.log("Rotating tokens...");

        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken: refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (!accessToken || !newRefreshToken) {
          throw new Error("Tokens not returned properly");
        }

        // ✅ IMPORTANT: Update BOTH tokens (Rotation Logic)
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        console.log("Tokens rotated successfully");

        // Update Axios Defaults
        API.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        // Process Queue
        processQueue(null, accessToken);

        // Retry Original Request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        console.error("Session expired completely.", err);
        // localStorage.clear();
        // window.location.href = "/signin";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;