import React, { useEffect, useState } from "react";

import axios from "axios";
import { role , department } from "../../store/store";


export default function UserInfoCard() {
  const [user, setUser] = useState({
    id: '',
    username: '',
    first_name: '',
    last_name: '',
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
     
   const getRoleName = (roleId: number): string => {
      const roleObj = role.find((r) => r.id === roleId);
      return roleObj ? roleObj.name : "Unknown";
    };
    
  const getDepartmentName = (departmentId: number): string => {
      const departmentObj = department.find((d) => d.id === departmentId);
      return departmentObj ? departmentObj.name : "Unknown";
    };
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


  //     if (error.response?.status === 401 && !originalRequest._retry) {
  //       originalRequest._retry = true;

  //       try {
  //         const refreshToken = localStorage.getItem("refreshToken");
  //         if (!refreshToken) throw new Error("No refresh token");



  //         const newAccessToken = res.data.access;
  //         localStorage.setItem("accessToken", newAccessToken);

  //         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
  //         return axiosInstance(originalRequest); // Retry original request
  //       } catch (err) {
  //         console.error("Refresh token failed", err);
  //         localStorage.removeItem("accessToken");
  //         localStorage.removeItem("refreshToken");
  //         setError("Session expired. Please log in again.");
  //       }
  //     }

  //     return Promise.reject(error);
  //   }
  // );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const response = await axiosInstance.get(`/me/`);
     localStorage.setItem("meuser" , JSON.stringify(response.data)); 

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
    <div className="p-3 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">

      {/* user profile */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
              {user.first_name|| "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                {user.last_name|| "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {user.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.mobile_no || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Role
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
             {getRoleName(user.role)}
              </p>
            </div>
             <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Department
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
             {getDepartmentName(user.department)}
              </p>
            </div>
               <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
             {user.address}
              </p>
            </div>
          </div>
        </div>

          </div>
   </div>
   </div>

  );
}
