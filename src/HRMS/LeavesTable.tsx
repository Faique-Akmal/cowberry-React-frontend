import React, { useState } from "react";
import { Leave } from "../types/leaves";

interface LeavesTableProps {
  leaves: Leave[];
  userRole: string;
  currentUserId: number;
  onApproveReject: (
    leaveId: number,
    action: "APPROVE" | "REJECT",
    comments: string,
  ) => void;
  managerDepartmentName?: string;
}

const LeavesTable: React.FC<LeavesTableProps> = ({
  leaves,
  userRole,
  currentUserId,
  onApproveReject,
  managerDepartmentName,
}) => {
  const [selectedLeave, setSelectedLeave] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");

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
      case "COMPENSATORY":
        return "bg-indigo-100 text-indigo-800";
      case "MATERNITY":
        return "bg-pink-100 text-pink-800";
      case "PATERNITY":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleActionClick = (leaveId: number, action: "APPROVE" | "REJECT") => {
    console.log("Action clicked:", {
      leaveId,
      action,
      userRole,
      currentUserId,
    });
    setSelectedLeave(leaveId);
    setActionType(action);
    setComments("");
    setShowModal(true);
  };

  const handleConfirmAction = () => {
    if (selectedLeave && actionType) {
      console.log("Confirming action:", {
        selectedLeave,
        actionType,
        comments,
      });
      onApproveReject(selectedLeave, actionType, comments);
      setShowModal(false);
      setSelectedLeave(null);
      setComments("");
    }
  };

  const canTakeAction = (leave: Leave) => {
    if (!userRole || currentUserId === 0) {
      console.log("No user role or ID found:", { userRole, currentUserId });
      return false;
    }

    if (userRole.toLowerCase() === "hr") {
      const can = leave.hrStatus === "PENDING";
      console.log("HR can take action:", can);
      return can;
    } else if (userRole.toLowerCase() === "zonalmanager") {
      const can =
        leave.reporteeStatus === "PENDING" &&
        leave.reportee?.id === currentUserId;
      console.log("Zonal Manager can take action:", can, {
        reporteeStatus: leave.reporteeStatus,
        isReportee:
          leave.reportee?.id === currentUserId ||
          leave.reporteeId === currentUserId,
      });

      return can;
    } else if (userRole.toLowerCase() === "manager") {
      const isFromDepartment = managerDepartmentName
        ? leave.user?.department === managerDepartmentName
        : true;
      const can =
        leave.reporteeStatus === "PENDING" &&
        (leave.reportee?.id === currentUserId ||
          leave.reporteeId === currentUserId) &&
        isFromDepartment;
      console.log("MANAGER can take action:", can, {
        reporteeStatus: leave.reporteeStatus,
        isFromDepartment,
        managerDepartmentName,
        leaveDepartment: leave.user?.department,
        isReportee: leave.reportee?.id === currentUserId,
      });
      return can;
    }

    console.log("Default: cannot take action - unknown role:", userRole);
    return false;
  };

  // Helper function to safely get display name
  const getDisplayName = (item: any): string => {
    if (!item) return "N/A";
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      // Check if it's a user object with name property
      if ("name" in item && typeof item.name === "string") {
        return item.name;
      }
      // If it's an object without name, stringify it for debugging
      console.warn("Unexpected object structure:", item);
      return String(item);
    }
    return String(item);
  };

  // Helper function to safely get employee code
  const getEmployeeCode = (item: any): string => {
    if (!item) return "N/A";
    if (typeof item === "object" && item !== null) {
      if ("employeeCode" in item && typeof item.employeeCode === "string") {
        return item.employeeCode;
      }
    }
    return "N/A";
  };

  // Helper function to safely get designation
  const getDesignation = (item: any): string => {
    if (!item) return "N/A";
    if (typeof item === "object" && item !== null) {
      if ("designation" in item && typeof item.designation === "string") {
        return item.designation;
      }
    }
    return "N/A";
  };

  // Helper function to safely get department
  const getDepartment = (item: any): string => {
    if (!item) return "N/A";
    if (typeof item === "object" && item !== null) {
      if ("department" in item && typeof item.department === "string") {
        return item.department;
      }
    }
    return "N/A";
  };

  // Helper function to safely get zone
  const getZone = (item: any): string => {
    if (!item) return "N/A";
    if (typeof item === "object" && item !== null) {
      if ("zone" in item && typeof item.zone === "string") {
        return item.zone;
      }
    }
    return "N/A";
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => {
                const canAction = canTakeAction(leave);
                console.log(`Leave ${leave.id} canAction:`, canAction);

                // Safely extract user info
                const userName = getDisplayName(
                  leave.user.fullName || leave.user,
                );
                const userEmployeeCode = getEmployeeCode(leave.user);
                const userDesignation = getDesignation(leave.user);
                const userDepartment = getDepartment(leave.user);
                const userZone = getZone(leave.user);

                // Safely extract reportee info
                const reporteeName = getDisplayName(leave.reportee);
                const reporteeEmployeeCode = getEmployeeCode(leave.reportee);

                return (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userEmployeeCode}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userDesignation}
                          </div>
                          <div className="text-xs text-gray-400">
                            {userDepartment} • {userZone}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Reportee: {reporteeName} ({reporteeEmployeeCode})
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getLeaveTypeColor(leave.leaveType)}`}
                          >
                            {leave.leaveType}
                          </span>
                          <span className="text-sm text-gray-600">
                            {leave.totalDays} day
                            {leave.totalDays !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">
                          {formatDate(leave.startDate)} -{" "}
                          {formatDate(leave.endDate)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {leave.reason}
                        </div>
                        <div className="text-xs text-gray-500">
                          Applied: {formatDate(leave.createdAt)}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(leave.status)}`}
                          >
                            Overall: {leave.status}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(leave.reporteeStatus)}`}
                          >
                            Reportee: {leave.reporteeStatus}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(leave.hrStatus)}`}
                          >
                            HR: {leave.hrStatus}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleActionClick(leave.id, "APPROVE")}
                          disabled={!canAction}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            canAction
                              ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleActionClick(leave.id, "REJECT")}
                          disabled={!canAction}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            canAction
                              ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {leaves.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No leaves found</div>
            <div className="text-gray-500 mt-2">Try adjusting your filters</div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {actionType === "APPROVE" ? "Approve" : "Reject"} Leave
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please add comments for your action:
              </p>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter your comments..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 rounded-md text-white transition-colors ${
                    actionType === "APPROVE"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirm {actionType}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeavesTable;
