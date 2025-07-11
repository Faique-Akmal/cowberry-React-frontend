import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UserInfoCard({ userId }) {
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

  //   const accessToken = localStorage.getItem("accessToken");
  //   const refreshToken = localStorage.getItem("refreshToken");

  //    console.log("Access Token:", accessToken); // For debugging
  //    console.log(refreshToken); // For debugging
  // // ✅ Create a custom Axios instance with interceptors
  const axiosInstance = axios.create({
    baseURL: "http://192.168.0.136:8000/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // ✅ Attach access token on every request
  axiosInstance.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");
  

   
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  // ✅ Auto-refresh access token if it expired
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = localStorage.getItem("refreshToken");

          const res = await axios.post("http://192.168.0.136:8000/api/token/refresh/", {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem("accessToken", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (err) {
          console.error("Token refresh failed:", err);
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );

  // ✅ Fetch user details from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/me/`);
        console.log(response.data+"bavew"); // For debugging
        setUser(response.data);
      } catch (err) {
        setError("Failed to fetch user details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-xl mx-auto rounded-lg shadow border">
      <h2 className="text-xl font-bold mb-4">User Profile</h2>
      <div className="space-y-2 text-gray-800">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
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
