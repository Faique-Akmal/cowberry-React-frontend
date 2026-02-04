import React, { useState, useEffect, useRef } from "react";
import {
  LeavesResponse,
  Leave,
  Department,
  Zone,
  FilterUser,
  Statistics,
  LocalStorageUser,
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
    itemsPerPage: 100,
  });

  // Filters state
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

  // User state from localStorage
  const [userData, setUserData] = useState<LocalStorageUser | null>(null);

  // Store manager's department name directly from localStorage
  const [managerDepartmentName, setManagerDepartmentName] =
    useState<string>("");

  // Track initial load
  const initialLoadRef = useRef(true);

  // Initialize user data from localStorage
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userDepartment = localStorage.getItem("userDepartment");
    const userEmployeeCode = localStorage.getItem("userEmployeeCode");
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to access leaves management.");
      return;
    }

    if (!userRole || !userId) {
      setError("User data not found. Please log in again.");
      return;
    }

    try {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new Error("Invalid user ID");
      }

      const userData: LocalStorageUser = {
        id: parsedUserId,
        role: userRole,
        department: userDepartment || undefined,
        name: userName || undefined,
        employeeCode: userEmployeeCode || undefined,
      };

      setUserData(userData);

      // Store manager's department name directly
      if (userRole === "MANAGER" && userDepartment) {
        setManagerDepartmentName(userDepartment);
        console.log("Manager's department from localStorage:", userDepartment);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setError("Invalid user data. Please log in again.");
    }
  }, []);

  // Fetch leaves when user data is loaded
  useEffect(() => {
    if (userData && initialLoadRef.current) {
      initialLoadRef.current = false;
      fetchLeaves();
    }
  }, [userData]);

  // Fetch leaves when pagination changes
  useEffect(() => {
    if (userData && !initialLoadRef.current) {
      fetchLeaves();
    }
  }, [pagination.currentPage]);

  // Fetch leaves when filters change
  useEffect(() => {
    if (userData && !initialLoadRef.current) {
      // Debounce to prevent too many API calls
      const timeoutId = setTimeout(() => {
        fetchLeaves();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [filters]);

  const fetchLeaves = async () => {
    if (!userData) {
      console.error("Cannot fetch leaves: userData is null");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      // Build query parameters
      let params: any = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      };

      // Add filters only if they have values
      if (filters.status) params.status = filters.status;
      if (filters.leaveType) params.leaveType = filters.leaveType;
      if (filters.search) params.search = filters.search;
      if (filters.departmentId)
        params.departmentId = Number(filters.departmentId); // Convert to number if needed
      if (filters.zoneId) params.zoneId = Number(filters.zoneId); // Convert to number if needed
      if (filters.userId) params.userId = Number(filters.userId); // Convert to number if needed
      if (filters.year) params.year = Number(filters.year); // Convert to number if needed
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      console.log("User role:", userData.role);
      console.log("User ID:", userData.id);
      console.log(
        "Manager department from localStorage:",
        managerDepartmentName,
      );

      // ========== IMPORTANT: For Manager and Zonal Manager, filter by reportee ID ==========
      if (userData.role === "MANAGER" || userData.role === "ZONAL_MANAGER") {
        // Always filter by reportee ID for both roles
        params.reporteeId = userData.id;
        console.log("Filtering leaves by reportee ID:", userData.id);

        // For manager, also filter by department if available
        if (userData.role === "MANAGER" && managerDepartmentName) {
          params.departmentName = managerDepartmentName;
          console.log(
            "Manager also filtering by department:",
            managerDepartmentName,
          );
        }
      }

      console.log(
        "Fetching leaves with params:",
        JSON.stringify(params, null, 2),
      );

      // Log the full request URL for debugging
      const fullUrl = `/leaves/admin/all-leaves?${new URLSearchParams(params).toString()}`;
      console.log("Full URL:", fullUrl);

      try {
        const response = await API.get<LeavesResponse>(
          "/leaves/admin/all-leaves",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params,
            // Add timeout and error handling
            timeout: 30000, // 30 seconds timeout
          },
        );

        if (response.data.success) {
          let fetchedLeaves = response.data.data.leaves;
          console.log("Leaves fetched:", fetchedLeaves.length);

          // Ensure statistics object exists with defaults
          const defaultStatistics = {
            total: 0,
            currentYear: {
              pending: { count: 0, totalDays: 0 },
            },
            byStatus: {},
            byType: {},
          };

          let statisticsData =
            response.data.data.statistics || defaultStatistics;

          // ========== CRITICAL FIX: Additional frontend filtering ==========
          if (
            userData.role === "MANAGER" ||
            userData.role === "ZONAL_MANAGER"
          ) {
            // Filter leaves where the current user is the reportee
            const filteredLeaves = fetchedLeaves.filter((leave) => {
              const isReportee = leave.reportee?.id === userData.id;
              console.log(
                `Leave ${leave.id}: Reportee ID=${leave.reportee?.id}, Is Reportee=${isReportee}`,
              );
              return isReportee;
            });

            console.log(
              `After reportee filtering: ${filteredLeaves.length} leaves where user is reportee`,
            );

            // For manager, also filter by department
            if (userData.role === "MANAGER" && managerDepartmentName) {
              const departmentFilteredLeaves = filteredLeaves.filter(
                (leave) => {
                  const employeeDepartment = leave.user?.department;
                  return employeeDepartment === managerDepartmentName;
                },
              );
              console.log(
                `After department filtering: ${departmentFilteredLeaves.length} leaves from ${managerDepartmentName} department`,
              );
              setLeaves(departmentFilteredLeaves);
            } else {
              setLeaves(filteredLeaves);
            }

            // Update statistics with filtered data
            statisticsData = {
              ...statisticsData,
              total:
                userData.role === "MANAGER" && managerDepartmentName
                  ? filteredLeaves.filter(
                      (l) => l.user?.department === managerDepartmentName,
                    ).length
                  : filteredLeaves.length,
            };
          } else {
            // HR can see all leaves without filtering
            setLeaves(fetchedLeaves);
          }

          setStatistics(statisticsData);
          setDepartments(response.data.data.filters?.departments || []);
          setZones(response.data.data.filters?.zones || []);
          setUsers(response.data.data.filters?.users || []);
          setPagination(
            response.data.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false,
              itemsPerPage: 100,
            },
          );
          setError(null);
        } else {
          // Handle API success: false case
          setError(response.data.message || "Failed to fetch leaves");
        }
      } catch (apiError: any) {
        // Handle API-specific errors
        console.error("API Error details:", apiError);

        if (apiError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("API Error Response:", apiError.response.data);
          console.error("API Error Status:", apiError.response.status);
          console.error("API Error Headers:", apiError.response.headers);

          if (apiError.response.status === 401) {
            setError("Authentication failed. Please log in again.");
          } else if (apiError.response.status === 403) {
            setError("You don't have permission to access this resource.");
          } else if (apiError.response.status === 404) {
            setError("The requested resource was not found.");
          } else if (apiError.response.status === 500) {
            setError(
              "Server error. Please try again later or contact support.",
            );
          } else {
            setError(
              `API Error: ${apiError.response.data?.message || apiError.response.statusText || "Unknown error"}`,
            );
          }
        } else if (apiError.request) {
          // The request was made but no response was received
          console.error("No response received:", apiError.request);
          setError("No response from server. Please check your connection.");
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error setting up request:", apiError.message);
          setError(`Request error: ${apiError.message}`);
        }
      }
    } catch (err: any) {
      // Catch any unexpected errors
      console.error("Unexpected error in fetchLeaves:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    try {
      fetchLeaves();
    } catch (error) {
      console.error("Error applying filters:", error);
      setError("Failed to apply filters. Please try again.");
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleApproveReject = async (
    leaveId: number,
    action: "APPROVE" | "REJECT",
    comments: string,
  ) => {
    if (!userData) {
      alert("User data not loaded. Please refresh the page.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authentication token found");
        return;
      }

      // Find the leave
      const leave = leaves.find((l) => l.id === leaveId);
      if (!leave) {
        alert("Leave not found");
        return;
      }

      // Authorization check
      let hasPermission = false;
      let statusToCheck = "";
      let permissionMessage = "";

      if (userData.role === "HR") {
        hasPermission = leave.hrStatus === "PENDING";
        statusToCheck = "HR";
        permissionMessage = "HR can approve any pending leave";
      } else if (userData.role === "MANAGER") {
        // Check if employee is in manager's department AND manager is their reportee
        const isSameDepartment =
          leave.user?.department === managerDepartmentName;
        const isReportee = leave.reportee?.id === userData.id;
        const isPending = leave.reporteeStatus === "PENDING";

        hasPermission = isSameDepartment && isReportee && isPending;
        statusToCheck = "Reportee";

        if (!isSameDepartment) {
          permissionMessage = `Manager can only approve leaves from ${managerDepartmentName} department. This leave is from ${leave.user?.department || "unknown"} department.`;
        } else if (!isReportee) {
          permissionMessage =
            "Manager can only approve leaves where they are the direct reportee.";
        } else if (!isPending) {
          permissionMessage =
            "This leave is not pending for reportee approval.";
        }
      } else if (userData.role === "ZONAL_MANAGER") {
        const isReportee = leave.reportee?.id === userData.id;
        const isPending = leave.reporteeStatus === "PENDING";
        hasPermission = isReportee && isPending;
        statusToCheck = "Reportee";

        if (!isReportee) {
          permissionMessage = `Zonal manager can only approve leaves where they are the reportee (ID: ${userData.id})`;
        } else if (!isPending) {
          permissionMessage =
            "This leave is not pending for reportee approval.";
        }
      } else {
        permissionMessage = `Unknown role: ${userData.role}`;
      }

      if (!hasPermission) {
        alert(
          `You don't have permission to perform this action.\n${permissionMessage}`,
        );
        return;
      }

      // Check if leave is already processed
      if (statusToCheck === "HR" && leave.hrStatus !== "PENDING") {
        alert(
          `This leave has already been ${leave.hrStatus.toLowerCase()} by HR`,
        );
        return;
      } else if (
        statusToCheck === "Reportee" &&
        leave.reporteeStatus !== "PENDING"
      ) {
        alert(
          `This leave has already been ${leave.reporteeStatus.toLowerCase()} by reportee`,
        );
        return;
      }

      const response = await API.put(
        `/leaves/approve-reject/${leaveId}`,
        {
          action: action,
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
      } else {
        alert(response.data.message || "Failed to update leave status");
      }
    } catch (err: any) {
      console.error("Error updating leave status:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update leave status";
      alert(`Error: ${errorMessage}`);
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
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setTimeout(() => {
      try {
        fetchLeaves();
      } catch (error) {
        console.error("Error resetting filters:", error);
        setError("Failed to reset filters. Please try again.");
      }
    }, 100);
  };

  // Get display title based on role
  const getDisplayTitle = () => {
    if (userData?.role === "HR") {
      return "View and manage all leaves";
    } else if (userData?.role === "MANAGER") {
      if (managerDepartmentName) {
        return `Viewing leaves for your reportees in ${managerDepartmentName} department`;
      }
      return "Viewing leaves for your reportees";
    } else if (userData?.role === "ZONAL_MANAGER") {
      return "Viewing leaves for your reportees";
    }
    return "View leaves";
  };

  // Loading states
  if (!userData && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <div className="ml-4">Loading user data...</div>
      </div>
    );
  }

  if (loading && leaves.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <div className="ml-4">Loading leaves...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold mb-2">Error</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Leaves Management
        </h1>

        <p className="text-gray-600 mt-2">{getDisplayTitle()}</p>

        {(userData?.role === "MANAGER" ||
          userData?.role === "ZONAL_MANAGER") && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded inline-block">
            Reportee Restricted: Only showing leaves where you are the reportee
          </div>
        )}

        {userData?.role === "MANAGER" && managerDepartmentName && (
          <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded inline-block ml-2">
            Department: {managerDepartmentName}
          </div>
        )}
      </div>

      {statistics && <StatisticsPanel statistics={statistics} />}

      <Filters
        filters={filters}
        departments={departments}
        zones={zones}
        users={users}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        userRole={userData?.role || ""}
        onApplyFilters={handleApplyFilters}
      />

      <LeavesTable
        leaves={leaves}
        userRole={userData?.role || ""}
        currentUserId={userData?.id || 0}
        onApproveReject={handleApproveReject}
        managerDepartmentName={managerDepartmentName}
      />

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Showing page {pagination.currentPage} of {pagination.totalPages}
          <span className="ml-4">Total {leaves.length} leaves</span>
          {(userData?.role === "MANAGER" ||
            userData?.role === "ZONAL_MANAGER") && (
            <span className="ml-4 text-blue-600">
              (Filtered to your reportees)
            </span>
          )}
          {userData?.role === "MANAGER" && managerDepartmentName && (
            <span className="ml-4 text-green-600">
              (From {managerDepartmentName} department)
            </span>
          )}
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
