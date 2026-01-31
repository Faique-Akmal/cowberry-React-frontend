import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LeavesResponse,
  Leave,
  Department,
  Zone,
  FilterUser,
  Statistics,
} from "../types/leaves";
import LeavesTable from "./LeavesTable";
import Filters from "./Filters";
import StatisticsPanel from "./StatisticsPanel";
import API from "../api/axios";

const LeavesPage: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<FilterUser[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
    itemsPerPage: 50,
  });

  // Main filters state (for UI)
  const [filters, setFilters] = useState({
    status: "",
    leaveType: "",
    search: "",
    departmentId: "",
    zoneId: "",
    userId: "",
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
  });

  // Debounced filters state (for API calls)
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [userRole, setUserRole] = useState<string>("");
  const [userDepartment, setUserDepartment] = useState<string>("");
  const [userId, setUserId] = useState<number>(0);
  const [applyFiltersManually, setApplyFiltersManually] = useState(false);

  // Initialize user data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserRole(userData.role || "");
        setUserDepartment(userData.department || "");
        setUserId(userData.id || 0);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    fetchLeaves();
  }, [debouncedFilters, pagination.currentPage]);

  // Debounce filter changes - only trigger API after user stops typing
  useEffect(() => {
    // Skip search field for debouncing - we'll handle it differently
    if (applyFiltersManually) {
      setApplyFiltersManually(false);
      setDebouncedFilters(filters);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      return;
    }

    const timerId = setTimeout(() => {
      // Don't debounce for search field - require manual apply
      // For other fields, update immediately
      const { search, ...otherFilters } = filters;
      const filtersToApply = applyFiltersManually 
        ? filters 
        : { ...otherFilters, search: debouncedFilters.search };
      
      setDebouncedFilters(filtersToApply);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [filters, applyFiltersManually]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Build query parameters based on user role
      let params: any = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...debouncedFilters,
      };

      // Role-based filtering
      if (userRole === "MANAGER") {
        params.departmentId = getDepartmentIdByName(userDepartment);
      } else if (userRole === "ZONAL_MANAGER") {
        params.reporteeId = userId;
      }

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await API.get<LeavesResponse>(
        "/leaves/admin/all-leaves",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        },
      );

      if (response.data.success) {
        setLeaves(response.data.data.leaves);
        setDepartments(response.data.data.filters.departments);
        setZones(response.data.data.filters.zones);
        setUsers(response.data.data.filters.users);
        setStatistics(response.data.data.statistics);
        setPagination(response.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch leaves");
      console.error("Error fetching leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentIdByName = (
    departmentName: string,
  ): number | undefined => {
    const dept = departments.find(
      (dept) => dept.name.toLowerCase() === departmentName.toLowerCase(),
    );
    return dept?.id;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Don't reset page here for search - let it be handled differently
    if (key !== "search") {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const handleApplyFilters = () => {
    setApplyFiltersManually(true);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  // FIXED: Implement approve/reject API correctly
  const handleApproveReject = async (
    leaveId: number,
    action: "APPROVE" | "REJECT",
    comments: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      
      // Use the correct API endpoint based on the curl example
      const endpoint = `/leaves/approve-reject/${leaveId}`;
      
      console.log(`Making ${action} request to:`, endpoint);
      
      const response = await API.put(
        endpoint,
        {
          action: action, // This should match the API expected field
          comments: comments,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        alert(`Leave ${action.toLowerCase()}d successfully!`);
        fetchLeaves(); // Refresh leaves list
      }
    } catch (err: any) {
      console.error("Error updating leave status:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Failed to update leave status";
      alert(errorMessage);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      leaveType: "",
      search: "",
      departmentId: "",
      zoneId: "",
      userId: "",
      year: new Date().getFullYear().toString(),
      startDate: "",
      endDate: "",
    });
    setDebouncedFilters({
      status: "",
      leaveType: "",
      search: "",
      departmentId: "",
      zoneId: "",
      userId: "",
      year: new Date().getFullYear().toString(),
      startDate: "",
      endDate: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  if (loading && leaves.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Leaves Management
        </h1>
        <p className="text-gray-600 mt-2">
          {userRole === "HR" && "View and manage all leaves"}
          {userRole === "MANAGER" &&
            `View leaves for ${userDepartment} department`}
          {userRole === "ZONAL_MANAGER" && "View leaves of your reportees"}
        </p>
      </div>

      {statistics && <StatisticsPanel statistics={statistics} />}

      <Filters
        filters={filters}
        departments={departments}
        zones={zones}
        users={users}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        userRole={userRole}
        onApplyFilters={handleApplyFilters}
      />

      <LeavesTable
        leaves={leaves}
        userRole={userRole}
        currentUserId={userId}
        onApproveReject={handleApproveReject}
      />

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Showing page {pagination.currentPage} of {pagination.totalPages}
          <span className="ml-4">Total {pagination.totalItems} leaves</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeavesPage;