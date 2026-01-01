import React, { createContext, useContext, useState } from "react";
import API from "../api/axios";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [users, setUsers] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [myTasks, setMyTasks] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [locations, setLocations] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Flexible user fetcher (with pagination/search support)
const fetchUsers = async (
  { search = "", sort_order = "asc" } = {},
  force = false
) => {
  // Check if we should use cached data
  if (users && !force && !search) {
    return {
      data: users,
      success: true
    };
  }

  setLoading(true);
  try {
    const params = {};
    
    // Use the correct parameter name for search
    // From your screenshot, it seems to search by name
    if (search) {
      params.full_name = search; 
    }
    
    if (sort_order) {
      params.sort_order = sort_order;
    }

    const res = await API.get("/admin/users/", { params });
    
    // Extract data from the response structure
    let userData = [];
    let success = false;
    
    if (res.data && res.data.success !== undefined) {
      // Response has {data: [...], success: true} structure
      userData = Array.isArray(res.data.data) ? res.data.data : [];
      success = res.data.success;
    } else if (Array.isArray(res.data)) {
      // Direct array response (fallback)
      userData = res.data;
      success = true;
    } else if (Array.isArray(res.data.data)) {
      // Alternative structure {data: [...]}
      userData = res.data.data;
      success = true;
    }
    
    // Update state
    setUsers(userData);
    
    // Return consistent response structure
    return {
      data: userData,
      success: success,
      total: userData.length // Add total count
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return error structure
    return {
      data: [],
      success: false,
      error: error.message || "Failed to fetch users"
    };
  } finally {
    setLoading(false);
  }
};
  const fetchTasks = async (force = false) => {
    if (tasks && !force) return tasks;
    setLoading(true);
    try {
      const res = await API.get("/tasks/");
      setTasks(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

const fetchMyTasks = async (force = false) => {
  // ✅ return cached tasks if they already exist
  if (myTasks && !force) return myTasks;

  setLoading(true);
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("User not authenticated. Please log in again.");

    const res = await API.get("/my-assigned-tasks/", { timeout: 10000 });

    let responseTasks: any[] = [];
    if (Array.isArray(res.data)) {
      responseTasks = res.data;
    } else if (typeof res.data === "object") {
      responseTasks =
        res.data.tasks ||
        res.data.results ||
        res.data.data ||
        res.data.items ||
        [];
    }

    if (!Array.isArray(responseTasks)) throw new Error("Invalid data format");

    setMyTasks(responseTasks); // ✅ store only once
    return responseTasks;
  } finally {
    setLoading(false);
  }
};


  const fetchAttendance = async (force = false) => {
    if (attendance && !force) return attendance;
    setLoading(true);
    try {
      const res = await API.get("/attendance/");
      setAttendance(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  // const fetchLocations = async (force = false) => {
  //   if (locations && !force) return locations;
  //   setLoading(true);
  //   try {
  //     const res = await API.get("/locations/");
  //     setLocations(res.data);
  //     return res.data;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <DataContext.Provider
      value={{
        users,
       
       
        locations,
      
        fetchUsers,
        fetchTasks,
        fetchMyTasks,
        fetchAttendance,
        // fetchLocations,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
