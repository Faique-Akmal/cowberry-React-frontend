import React, { useState, useEffect } from "react";
import LoadingAnimation from "../pages/UiElements/loadingAnimation";
import API from "../api/axios";

// Define types based on API response
interface LeaveBalance {
  leave_type: string;
  total_allocated: number;
  used: number;
  pending_approval: number;
  remaining: number;
}

interface LeaveBalanceResponse {
  success: boolean;
  employee_code: string;
  employee_name: string;
  fiscal_year: string;
  leave_balances: LeaveBalance[];
}

// Types for leave requests (for future implementation)
interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  totalDays: number;
  createdAt: string;
  reporteeStatus?: string;
  reportee?: { fullName: string };
  hrStatus?: string;
  hrManager?: { fullName: string };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

interface LeaveStatusProps {
  token: string;
}

const LeaveStatus: React.FC<LeaveStatusProps> = ({ token }) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState({
    employee_code: "",
    employee_name: "",
    fiscal_year: "",
  });
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterLeaveType, setFilterLeaveType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Get employee code from localStorage
  const getEmployeeCode = (): string => {
    return localStorage.getItem("employee_code") || "";
  };

  // Fetch leave balances from your backend API
  const fetchLeaveBalances = async () => {
    try {
      const employee_code = getEmployeeCode();
      if (!employee_code) {
        throw new Error("Employee code not found");
      }

      // Using your API instance to fetch leave balance
      const response = await API.get<{ message: LeaveBalanceResponse }>(
        `/leaves/get-erp-leave-balance`,
        {
          params: {
            employee_code: employee_code,
          },
        },
      );

      // Fix: Use response.data.message directly since your API returns { message: {...} }
      const responseData = response.data.message;

      if (responseData.success) {
        setLeaveBalances(responseData.leave_balances || []);
        setEmployeeInfo({
          employee_code: responseData.employee_code,
          employee_name: responseData.employee_name,
          fiscal_year: responseData.fiscal_year,
        });
      } else {
        throw new Error(
          responseData.message || "Failed to fetch leave balances",
        );
      }
    } catch (err: any) {
      console.error("Error fetching leave balances:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leave balances",
      );
      throw err;
    }
  };

  // Fetch leave requests - Commented out until API is available
  // const fetchLeaveRequests = async (page: number = 1) => {
  //   try {
  //     const employee_code = getEmployeeCode();
  //     if (!employee_code) {
  //       throw new Error("Employee code not found");
  //     }
  //
  //     // Using your backend API endpoint for fetching leave requests
  //     const response = await API.get(`/leaves/get-leave-requests`, {
  //       params: {
  //         employee_code: employee_code,
  //         page: page,
  //         limit: 10,
  //       },
  //     });
  //
  //     const responseData = response.data;
  //
  //     if (responseData.success) {
  //       setLeaves(responseData.leave_requests || []);
  //       setPagination(responseData.pagination || null);
  //     } else {
  //       throw new Error(
  //         responseData.message || "Failed to fetch leave requests"
  //       );
  //     }
  //   } catch (err: any) {
  //     console.error("Error fetching leave requests:", err);
  //
  //     // If endpoint doesn't exist, just set empty array without error
  //     if (err.response?.status === 404) {
  //       console.warn("Leave requests endpoint not implemented yet");
  //       setLeaves([]);
  //       setPagination(null);
  //     } else {
  //       setError(err.response?.data?.message || "Failed to fetch leave requests");
  //       setLeaves([]);
  //       setPagination(null);
  //     }
  //   }
  // };

  // Fetch all data (only leave balances for now)
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only fetch leave balances since leave requests API is not available
      await fetchLeaveBalances();

      // Commented out until API is available
      // await fetchLeaveRequests(currentPage);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []); // Remove dependencies since we're not fetching leave requests yet

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "CASUAL LEAVE":
      case "CASUAL":
        return "bg-blue-100 text-blue-800";
      case "SICK LEAVE":
      case "SICK":
        return "bg-purple-100 text-purple-800";
      case "HALF DAY":
      case "HALFDAY":
        return "bg-indigo-100 text-indigo-800";
      case "COMPENSATORY LEAVE":
      case "COMPENSATORY":
        return "bg-pink-100 text-pink-800";
      case "LEAVE WITHOUT PAY":
      case "LEAVEWITHOUTPAY":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      setCurrentPage(page);
    }
  };

  const handleFilterReset = () => {
    setFilterLeaveType("ALL");
    setFilterStatus("ALL");
    setCurrentPage(1);
  };

  // Calculate statistics from leave balances
  const totalLeaveTypes = leaveBalances.length;
  const totalRemainingLeaves = leaveBalances.reduce(
    (sum, balance) => sum + balance.remaining,
    0,
  );
  const totalUsedLeaves = leaveBalances.reduce(
    (sum, balance) => sum + balance.used,
    0,
  );
  const totalPendingApproval = leaveBalances.reduce(
    (sum, balance) => sum + balance.pending_approval,
    0,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center m-auto">
        <LoadingAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <button
          onClick={() => fetchAllData()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Information Card */}
      {employeeInfo.employee_name && (
        <div className="shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-lantern-blue-600">
            <h2 className="text-lg text-white font-semibold">
              Employee Information
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Employee Code</p>
                <p className="font-medium">{employeeInfo.employee_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee Name</p>
                <p className="font-medium">{employeeInfo.employee_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fiscal Year</p>
                <p className="font-medium">{employeeInfo.fiscal_year}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Balance Summary */}
      {leaveBalances.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-lantern-blue-600">
            <h2 className="text-lg font-semibold text-white">
              Leave Balance Summary
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Allocated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Approval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveBalances.map((balance, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLeaveTypeColor(balance.leave_type)}`}
                      >
                        {balance.leave_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.total_allocated.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.used}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {balance.pending_approval}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {balance.remaining.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Leave Types</p>
                <p className="text-2xl font-bold text-blue-700">
                  {totalLeaveTypes}
                </p>
              </div>
              <div className="text-blue-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">
                  Remaining Leaves
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {totalRemainingLeaves.toFixed(2)}
                </p>
              </div>
              <div className="text-green-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">Used Leaves</p>
                <p className="text-2xl font-bold text-red-700">
                  {totalUsedLeaves}
                </p>
              </div>
              <div className="text-red-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Pending Approval
                </p>
                <p className="text-2xl font-bold text-yellow-700">
                  {totalPendingApproval}
                </p>
              </div>
              <div className="text-yellow-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div> */}

      {/* Leave Requests Section - Placeholder until API is available */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Leave Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Note: Leave requests history will be available once the API endpoint
            is implemented. Currently showing leave balance summary.
          </p>
        </div>
        <div className="p-8 text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Leave Application feature coming soon
          </h3>
          <p className="text-gray-500">
            The API endpoint for fetching leave requests is being integrated.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaveStatus;
