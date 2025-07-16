import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const accessToken:string | null = localStorage.getItem('accessToken');
  if (accessToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// API.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Global error handling
//     if (error.response?.status === 401) {
//       // Token expired, redirect to login, or refresh token logic
//     }
//     return Promise.reject(error);
//   }
// );

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          "/token/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.data.access;

        localStorage.setItem("accessToken", newToken);
        API.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return API(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed");
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
