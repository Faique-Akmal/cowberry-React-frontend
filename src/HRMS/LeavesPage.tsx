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
import Filters from "./FiltersLeave";
import StatisticsPanel from "./StatisticsPanel";
import API from "../api/axios";
import Loader from "../pages/UiElements/Loader";
import Button from "../components/ui/button/Button";

const LeavesPage: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [allLeaves, setAllLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<FilterUser[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
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
    const userDepartment = localStorage.getItem("department");
    const userEmployeeCode = localStorage.getItem("employee_code");
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
      if (userRole.toLowerCase() === "manager" && userDepartment) {
        setManagerDepartmentName(userDepartment);
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

  // Fetch leaves when filters change - with debouncing
  useEffect(() => {
    if (userData && !initialLoadRef.current) {
      const timeoutId = setTimeout(() => {
        fetchLeaves();
      }, 500);

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

      // Build query parameters - REMOVE search from params
      let params: any = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      };

      // Add filters only if they have values - DON'T include search
      if (filters.status) params.status = filters.status;
      if (filters.leaveType) params.leaveType = filters.leaveType;
      // REMOVE THIS LINE: if (filters.search) params.search = filters.search;
      if (filters.departmentId)
        params.departmentId = Number(filters.departmentId);
      if (filters.zoneId) params.zoneId = Number(filters.zoneId);
      if (filters.userId) params.userId = Number(filters.userId);
      if (filters.year) params.year = Number(filters.year);
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      try {
        let endpoint = "/leaves/admin/all-leaves";
        let response: any;

        // Check if user is MANAGER or zonalmanager
        if (
          userData.role.toLowerCase() === "manager" ||
          userData.role.toLowerCase() === "zonalmanager"
        ) {
          // For manager and zonal manager, use the reportee API
          endpoint = `/leaves/reportee/${userData.id}`;

          response = await API.get<LeavesResponse>(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params,
            timeout: 30000,
          });
        } else {
          // For HR and other roles, use the admin API
          response = await API.get<LeavesResponse>(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params,
            timeout: 30000,
          });
        }

        if (response.data.success) {
          const fetchedLeaves = response.data.data.leaves;

          // Store ALL fetched leaves in a separate state for client-side filtering
          setAllLeaves(fetchedLeaves); // Add this line

          // Apply client-side search filter if search exists
          let filteredLeaves = fetchedLeaves;

          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredLeaves = fetchedLeaves.filter((leave) => {
              const userName = leave.user?.name || "";
              const employeeCode = leave.user?.employeeCode || "";
              const designation = leave.user?.designation || "";

              return (
                userName.toLowerCase().includes(searchLower) ||
                employeeCode.toLowerCase().includes(searchLower) ||
                designation.toLowerCase().includes(searchLower)
              );
            });
          }

          // Apply manager department filter after search filter
          if (userData.role.toLowerCase() === "MANAGER") {
            if (managerDepartmentName) {
              filteredLeaves = filteredLeaves.filter((leave) => {
                const isFromDepartment =
                  leave.user?.department === managerDepartmentName;
                return isFromDepartment;
              });
            }
          }

          setLeaves(filteredLeaves);

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

          // Update statistics based on filtered leaves
          statisticsData = {
            ...statisticsData,
            total: filteredLeaves.length,
          };

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
          setError(response.data.message || "Failed to fetch leaves");
        }
      } catch (apiError: any) {
        console.error("API Error details:", apiError);

        if (apiError.response) {
          if (apiError.response.status === 401) {
            setError("Authentication failed. Please log in again.");
          } else if (apiError.response.status === 403) {
            setError("You don't have permission to access this resource.");
          } else if (apiError.response.status === 404) {
            setError("The requested resource was not found.");
          } else if (apiError.response.status === 500) {
            // If it's still 500, check if it's because of other parameters
            console.error(
              "Server 500 error. Check if backend supports these filters:",
              params,
            );
            setError(
              "Server error. Please try with fewer filters or contact support.",
            );
          } else {
            setError(
              `API Error: ${apiError.response.data?.message || apiError.response.statusText || "Unknown error"}`,
            );
          }
        } else if (apiError.request) {
          console.error("No response received:", apiError.request);
          setError("No response from server. Please check your connection.");
        } else {
          console.error("Error setting up request:", apiError.message);
          setError(`Request error: ${apiError.message}`);
        }
      }
    } catch (err: any) {
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
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchLeaves(); // This will apply all current filters
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleApproveReject = async (
    leaveId: number,
    action: "APPROVE" | "REJECT" | "CANCEL",
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

      // Authorization check - SIMPLIFIED AND FIXED
      let hasPermission = false;
      let statusToCheck = "";
      let permissionMessage = "";

      // Normalize the role for comparison
      const userRole = userData.role.toUpperCase();

      // Debug information

      if (
        userRole.toLowerCase() === "hr" ||
        userRole.toLowerCase() === "admin"
      ) {
        // HR can approve any leave where HR status is pending
        hasPermission = leave.hrStatus === "PENDING";
        statusToCheck = "HR";
        permissionMessage = hasPermission
          ? "HR can approve this leave"
          : "HR can only approve leaves with PENDING HR status";
      } else if (userRole === "MANAGER") {
        // Manager can approve if they are the reportee AND leave is pending for reportee approval
        const isReportee =
          leave.reporteeId === userData.id ||
          leave.reportee?.id === userData.id;
        const isFromDepartment = managerDepartmentName
          ? leave.user?.department === managerDepartmentName
          : true;
        const isPending = leave.reporteeStatus === "PENDING";

        hasPermission = isReportee && isFromDepartment && isPending;
        statusToCheck = "Reportee";

        if (!isReportee) {
          permissionMessage = `You are not the reportee for this employee. Reportee ID: ${leave.reporteeId || leave.reportee?.id}, Your ID: ${userData.id}`;
        } else if (!isFromDepartment) {
          permissionMessage = `Manager can only approve leaves from ${managerDepartmentName} department. This leave is from ${leave.user?.department || "unknown"} department.`;
        } else if (!isPending) {
          permissionMessage =
            "This leave is not pending for reportee approval.";
        } else {
          permissionMessage = "Manager can approve this leave";
        }
      } else if (userRole === "ZONALMANAGER") {
        // Zonal managers can approve leaves where they are the reportee
        const isReportee =
          leave.reporteeId === userData.id ||
          leave.reportee?.id === userData.id;
        const isPending = leave.reporteeStatus === "PENDING";

        hasPermission = isReportee && isPending;
        statusToCheck = "Reportee";

        if (!isReportee) {
          permissionMessage = `You are not the reportee for this employee. Reportee ID: ${leave.reporteeId || leave.reportee?.id}, Your ID: ${userData.id}`;
        } else if (!isPending) {
          permissionMessage =
            "This leave is not pending for reportee approval.";
        } else {
          permissionMessage = "Zonal Manager can approve this leave";
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
    if (userData?.role === "HR" || userData?.role.toLowerCase() === "admin") {
      return "View and manage all leaves";
    } else if (userData?.role === "Manager") {
      if (managerDepartmentName) {
        return `Viewing pending leaves for approval in ${managerDepartmentName} department where you are the reportee`;
      }
      return "Viewing pending leaves for your approval";
    } else if (userData?.role.toLowerCase() === "zonalmanager") {
      return "Viewing pending leaves where you are the reportee";
    }
    return "View leaves";
  };

  // Loading states
  if (!userData && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <div className="ml-4">Loading user data...</div> */}
        <Loader />
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Leaves Management
          </h1>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => (window.location.href = "/getself-leaves")}
              className="inline-flex items-center px-4 py-2 bg-cowberry-green-600 text-white rounded-md hover:bg-cowberry-green-700 transition-colors"
            >
              Show My Leaves
            </button>

            <button
              onClick={() => (window.location.href = "/new-leaves")}
              className="inline-flex items-center px-4 py-2 bg-cowberry-green-600 text-white rounded-md hover:bg-lantern-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Leave Application
            </button>
          </div>
        </div>

        <p className="text-gray-600 mt-2">{getDisplayTitle()}</p>

        {(userData?.role === "MANAGER" ||
          userData?.role.toLowerCase() === "zonalmanager") && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded inline-block">
            {userData?.role === "MANAGER"
              ? "Department & Reportee Restricted: Only showing leaves from your department where you are the reportee"
              : "Reportee Restricted: Only showing leaves where you are the reportee"}
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
          {(userData?.role.toLowerCase() === "manager" ||
            userData?.role.toLowerCase() === "zonalmanager") && (
            <span className="ml-4 text-blue-600">
              (
              {userData?.role === "MANAGER"
                ? "From your department where you are reportee"
                : "Where you are reportee"}
              )
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
