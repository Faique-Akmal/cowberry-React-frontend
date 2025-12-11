import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// --- Configuration ---
const API_URL = import.meta.env.VITE_BASE_URL;

// --- Types ---
// Queue item ka structure: promise ko resolve ya reject karne ke liye
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

// --- State Variables ---
let isRefreshing = false; // Check karta hai ki refresh process chal raha hai ya nahi
let failedQueue: FailedRequest[] = []; // Ruke hue requests ko store karta hai

// --- Helper: Queue Process ---
// Jab naya token mil jaye, to ruke hue requests ko retry karwata hai
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
  // withCredentials: true, // Agar cookies use kar rahe hain to uncomment karein
});

// --- Request Interceptor ---
// Har request ke sath Access Token attach karta hai
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
// 401 Errors handle karta hai aur Token Refresh karta hai
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Agar 401 error hai aur ye request pehle retry nahi hua hai
    if (error.response?.status === 401 && !originalRequest._retry) {
      // CASE 1: Agar already koi refresh process chal raha hai
      // Toh is request ko queue mein daal do aur wait karo
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

      // CASE 2: Ye pehla 401 hai, Refresh process start karo
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      // Agar refresh token hi nahi hai, to seedha logout
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(error);
      }

      try {
        // Refresh API Call
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refresh: refreshToken },
          { withCredentials: true } // Important agar refresh logic cookies/session dependent hai
        );

        console.log("Token Refreshed :: ", response);
        // Backend response structure ke hisaab se adjust karein
        // Usually: response.data.accessToken ya response.data.access
        const newAccessToken =
          response.data.accessToken || response.data.access || response.data;

        // 1. Storage Update
        localStorage.setItem("accessToken", newAccessToken);

        // 2. Axios Defaults Update
        API.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // 3. Queue Process (Ruke hue requests ko naya token do)
        processQueue(null, newAccessToken);

        // 4. Current Request Retry
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return API(originalRequest);
      } catch (err) {
        // Refresh Failed (Token expired or invalid)
        processQueue(err, null);

        console.error("Session expired, logging out...");
        localStorage.clear(); // Saara data saaf
        window.location.href = "/signin"; // Redirect to Login
        return Promise.reject(err);
      } finally {
        // Flag reset karein taaki future requests normal flow mein chalein
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
