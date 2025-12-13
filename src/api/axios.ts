import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// --- Configuration ---
const API_URL = import.meta.env.VITE_BASE_URL;

// --- Types ---
// Queue item structure to hold pending requests
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

// --- State Variables ---
let isRefreshing = false; // Flag to prevent multiple refresh calls
let failedQueue: FailedRequest[] = []; // Queue for requests waiting for new token

// --- Helper: Process the Queue ---
// Retry all queued requests with the new token
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
  // withCredentials: true, // Enable if your backend expects cookies
});

// --- Request Interceptor ---
// Attaches the Access Token to every request
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
// Handles 401 errors and manages the Token Refresh flow
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 1. Check if error is 401 (Unauthorized) and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Safety: Don't retry if the failed URL is the refresh endpoint itself
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        return Promise.reject(error);
      }

      // 2. If Refresh is already in progress, Queue this request
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

      // 3. Start Refresh Process
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      // If no refresh token, logout immediately
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(error);
      }

      try {
        console.log("Attempting to refresh token...");

        // FIX: Changed payload key from 'refresh' to 'refreshToken' to match your backend/Postman
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken: refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = response.data.accessToken;

        if (!newAccessToken) {
          throw new Error("New access token not returned by backend");
        }

        // A. Update Local Storage
        localStorage.setItem("accessToken", newAccessToken);
        console.log("Token Refreshed Successfully");

        // B. Update Axios Defaults
        API.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // C. Process Queued Requests
        processQueue(null, newAccessToken);

        // D. Retry Original Request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return API(originalRequest);
      } catch (err) {
        // Refresh Failed? Logout User
        processQueue(err, null);

        console.error("Session expired or refresh failed.", err);
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;