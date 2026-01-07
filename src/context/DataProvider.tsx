import { createContext, useContext, useState } from "react";
import API from "../api/axios";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (
    { search = "", sort_order = "asc" } = {},
    force = false
  ) => {
    // Check if we should use cached data
    if (users && !force && !search) {
      return {
        data: users,
        success: true,
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
        total: userData.length, // Add total count
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      // Return error structure
      return {
        data: [],
        success: false,
        error: error.message || "Failed to fetch users",
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        users,
        fetchUsers,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
