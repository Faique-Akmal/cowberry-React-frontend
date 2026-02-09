import React, { useState, useEffect } from "react";
import { LeaveRequest, LeaveResponse, Pagination } from "../types/leaves";
import API from "../api/axios";

interface LeaveStatusProps {
  token: string;
}

const LeaveStatus: React.FC<LeaveStatusProps> = ({ token }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterLeaveType, setFilterLeaveType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchLeaves = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      // Add optional filters
      if (filterLeaveType !== "ALL") {
        params.append("leaveType", filterLeaveType);
      }

      if (filterStatus !== "ALL") {
        params.append("status", filterStatus);
      }

      const response = await API.get<LeaveResponse>(
        `/leaves/my-leaves?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;

      if (data.success) {
        setLeaves(data.data.leaveRequests);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || "Failed to fetch leaves");
      }
    } catch (err: any) {
      if (err.response) {
        const errorMessage =
          err.response.data?.message || `Server error: ${err.response.status}`;
        setError(errorMessage);
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.message || "An error occurred");
      }
      console.error("Error fetching leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(currentPage);
  }, [currentPage, filterLeaveType, filterStatus, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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
    switch (type) {
      case "CASUAL":
        return "bg-blue-100 text-blue-800";
      case "SICK":
        return "bg-purple-100 text-purple-800";
      case "HALFDAY":
        return "bg-indigo-100 text-indigo-800";
      case "COMPENSATORY":
        return "bg-pink-100 text-pink-800";
      case "  LEAVEWITHOUTPAY":
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

  // Calculate statistics
  const totalLeaves = pagination?.totalItems || 0;
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedLeaves = leaves.filter((l) => l.status === "REJECTED").length;

  // Get unique leave types from leaves
  const leaveTypes = Array.from(
    new Set(leaves.map((leave) => leave.leaveType)),
  ).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <button
          onClick={() => fetchLeaves(currentPage)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
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
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Leaves Found
        </h3>
        <p className="text-gray-500">You haven't applied for any leaves yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Leaves</h2>
          {pagination && (
            <p className="text-gray-600">
              Showing {leaves.length} of {totalLeaves} leave requests
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            {/* Leave Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              <select
                value={filterLeaveType}
                onChange={(e) => setFilterLeaveType(e.target.value)}
                className="block w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full md:w-48 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Reset Button */}
          {(filterLeaveType !== "ALL" || filterStatus !== "ALL") && (
            <button
              onClick={handleFilterReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Total Leaves</p>
              <p className="text-2xl font-bold text-blue-700">{totalLeaves}</p>
            </div>
            <div className="text-blue-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {pendingLeaves}
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
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Approved</p>
              <p className="text-2xl font-bold text-green-700">
                {approvedLeaves}
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
              <p className="text-sm font-medium text-red-900">Rejected</p>
              <p className="text-2xl font-bold text-red-700">
                {rejectedLeaves}
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
      </div>

      {/* Leaves Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="">
          <table className="max-w-2xl divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Duration
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reason
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Overall Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reportee Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  HR Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Applied On
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr
                  key={leave.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLeaveTypeColor(
                        leave.leaveType,
                      )}`}
                    >
                      {leave.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(leave.startDate)}
                    </div>
                    <div className="text-sm text-gray-500">to</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(leave.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm text-gray-900 max-w-xs truncate"
                      title={leave.reason}
                    >
                      {leave.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        leave.status,
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          leave.reporteeStatus,
                        )} mb-1`}
                      >
                        {leave.reporteeStatus}
                      </span>
                      <div className="text-xs text-gray-600">
                        {leave.reportee?.fullName || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          leave.hrStatus,
                        )} mb-1`}
                      >
                        {leave.hrStatus}
                      </span>
                      <div className="text-xs text-gray-600">
                        {leave.hrManager?.fullName || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(leave.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page{" "}
                <span className="font-medium">{pagination.currentPage}</span> of{" "}
                <span className="font-medium">{pagination.totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    pagination.hasPrevPage
                      ? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    pagination.hasNextPage
                      ? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveStatus;
