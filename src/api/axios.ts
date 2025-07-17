import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true,
});

API.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken && config.headers) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refreshToken");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshToken
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/token/refresh`,
          { refresh: refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = res.data.access;
        localStorage.setItem("accessToken", newAccessToken);

        API.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return API(originalRequest);
      } catch (err) {
        console.error("Token refresh failed.");
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
