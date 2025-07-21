// src/utils/tokenRefresher.ts
import axios from "axios";

export const startTokenRefreshInterval = () => {
  const refreshInterval = 20 * 60 * 1000; // 20 minutes

  const intervalId = setInterval(async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/token/refresh/`,
          { refresh: refreshToken },
          // { withCredentials: true }
        );

        const newAccessToken = res.data.access;
        localStorage.setItem("accessToken", newAccessToken);
        console.log("🔁 Access token refreshed automatically");
      } catch (error) {
        console.error("❌ Auto refresh token failed", error);
        localStorage.clear();
        window.location.href = "/signin";
      }
    }
  }, refreshInterval);

  return intervalId;
};
