import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UserInfoCard() {
  const [user, setUser] = useState({
    id: '',
    username: '',
    email: '',
    role: '',
    department: '',
    mobile_no: '',
    birth_date: '',
    address: '',
    profile_image: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create a persistent Axios instance
  const axiosInstance = axios.create({
    baseURL: "http://192.168.0.144:8000/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add request interceptor (runs once)
  axiosInstance.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  // Add response interceptor for token refreshing
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("No refresh token");

          const res = await axios.post("http://192.168.0.144:8000/api/token/refresh/", {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem("accessToken", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest); // Retry original request
        } catch (err) {
          console.error("Refresh token failed", err);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setError("Session expired. Please log in again.");
        }
      }

      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/me/`);
        setUser(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto rounded-lg shadow border ">
      <h2 className="text-xl font-bold mb-4">User Profile</h2>
      <div className="space-y-2 text-gray-800">
     
      <div className="mb-4 ">
          <p><strong>Email:</strong> {user.email}</p>
      </div>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Department:</strong> {user.department}</p>
        <p><strong>Mobile No:</strong> {user.mobile_no}</p>
        <p><strong>Birth Date:</strong> {user.birth_date}</p>
        <p><strong>Address:</strong> {user.address}</p>
        {user.profile_image && (
          <div>
            <strong>Profile Image:</strong>
            <div className="mt-2">
              <img src={user.profile_image} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
