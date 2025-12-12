import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// 2. Axios Instance banao
const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Request Interceptor: Har request ke sath Access Token bhejo
API.interceptors.request.use(
  (config) => {
    // LocalStorage se access token nikalo
    const token = localStorage.getItem("accessToken");

    if (token) {
      // Agar token hai, to Authorization header mein jod do
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. Response Interceptor: Agar 401 aaye to Refresh Token use karo
API.interceptors.response.use(
  (response) => {
    // Agar sab sahi hai, to response return kar do
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check: Error 401 hai (Unauthorized) aur ye request pehle retry nahi hui hai
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Flag set karo taaki loop na bane

      try {
        // LocalStorage se Refresh Token nikalo
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          // Django ko request bhejo naya access token lene ke liye
          const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refresh: refreshToken,
          });

          // Naya token save karo
          const newAccessToken = response.data.access;
          localStorage.setItem("access", newAccessToken);

          // Original request ke headers update karo
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Original request wapas bhejo (Retry)
          return API(originalRequest);
        }
      } catch (refreshError) {
        // Agar Refresh Token bhi expire ho gaya hai, to user ko logout kar do
        console.log("Error 1: ", refreshError);
        console.error("Session expired. Please login again.");
        // localStorage.clear(); // Sare tokens hata do
        // window.location.href = "/login"; // Login page par bhej do
      }
    }

    // Agar error 401 nahi hai, ya refresh fail ho gaya, to error throw karo
    return Promise.reject(error);
  }
);

export default API;
