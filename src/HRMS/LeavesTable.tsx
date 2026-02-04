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
}

const LeavesTable: React.FC<LeavesTableProps> = ({
  leaves,
  userRole,
  currentUserId,
  onApproveReject,
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
    console.log("Checking canTakeAction for leave:", {
      leaveId: leave.id,
      userRole,
      currentUserId,
      reporteeId: leave.reportee?.id,
      hrStatus: leave.hrStatus,
      reporteeStatus: leave.reporteeStatus,
      userDepartment: leave.user?.department,
    });

    // If userRole is not loaded yet, cannot take action
    if (!userRole || currentUserId === 0) {
      console.log("No user role or ID found:", { userRole, currentUserId });
      return false;
    }

    if (userRole === "HR") {
      // HR can approve any leave where HR status is pending
      const can = leave.hrStatus === "PENDING";
      console.log("HR can take action:", can);
      return can;
    } else if (userRole === "ZONAL_MANAGER") {
      // Zonal manager can only approve leaves where they are the reportee
      const can =
        leave.reporteeStatus === "PENDING" &&
        leave.reportee?.id === currentUserId;
      console.log("ZONAL_MANAGER can take action:", can, {
        reporteeStatus: leave.reporteeStatus,
        reporteeId: leave.reportee?.id,
        currentUserId,
      });
      return can;
    } else if (userRole === "MANAGER") {
      // Manager can approve leaves where reportee status is pending
      // Note: Department check is done in the API permission check in LeavesPage
      const can = leave.reporteeStatus === "PENDING";
      console.log("MANAGER can take action:", can, {
        reporteeStatus: leave.reporteeStatus,
      });
      return can;
    }

    console.log("Default: cannot take action - unknown role:", userRole);
    return false;
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

                return (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {leave.user?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {leave.user?.employeeCode || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {leave.user?.designation || "N/A"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {leave.user?.department || "N/A"} •{" "}
                            {leave.user?.zone || "N/A"}
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
                        <button
                          className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          onClick={() => {
                            console.log("View details for leave:", leave);
                            // You can add a view details modal or page navigation here
                            alert(`Viewing details for leave ID: ${leave.id}`);
                          }}
                        >
                          View Details
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
