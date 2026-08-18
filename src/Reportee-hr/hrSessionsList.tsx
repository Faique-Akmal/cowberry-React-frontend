import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import API from "../api/axios";
import LoadingAnimation from "../pages/UiElements/loadingAnimation";

// Types
interface ReporteeInfo {
  id: number;
  username: string;
  fullName: string;
  employeeCode: string;
}

interface HRManagerInfo {
  id: number;
  username: string;
  fullName: string;
  employeeCode: string;
}

interface TravelSession {
  sessionId: number;
  userId: number;
  username: string;
  employeeCode: string;
  fullName: string;
  department: string | null;
  startTime: string;
  startLatitude: string;
  startLongitude: string;
  startDescription: string;
  endTime: string;
  endLatitude: string;
  endLongitude: string;
  endDescription: string;
  totalDistance: number;
  isApprovedByReportee: boolean;
  isRejectedByReportee: boolean;
  reporteeComments: string | null;
  reporteeApprovedAt: string | null;
  isApprovedByHR: boolean;
  isRejectedByHR: boolean;
  isFinalApproved: boolean | null;
  finalStatus: string;
  hrComments: string | null;
  hrApprovedAt: string | null;
  reporteeInfo: ReporteeInfo;
  hrManagerInfo: HRManagerInfo;
}

interface ApiResponse {
  success: boolean;
  total?: number;
  data: TravelSession[];
}

const TravelSessionHr: React.FC = () => {
  const [sessions, setSessions] = useState<TravelSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<TravelSession | null>(
    null,
  );
  const [comments, setComments] = useState<string>("");
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  // Fetch pending sessions
  const fetchPendingSessions = async () => {
    try {
      setLoading(true);
      const response = await API.get<ApiResponse>(
        "/tracking/travel-sessions/pending/hr",
      );

      if (response.data.success) {
        setSessions(response.data.data);
        if (response.data.data.length === 0) {
          toast.success("No pending sessions found");
        }
      } else {
        toast.error("Failed to fetch sessions");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Error fetching sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSessions();
  }, []);

  const handleAction = async (
    sessionId: number,
    action: "approve" | "reject",
  ) => {
    try {
      setProcessing(sessionId);

      const response = await API.post(
        `/tracking/travel-session/${sessionId}/hr-approve`,
        {
          action: action,
          comments: comments.trim() || `${action} by HR`,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        toast.success(`Session ${action}ed successfully`);
        setShowActionModal(false);
        setComments("");
        // Refresh the list
        fetchPendingSessions();
      } else {
        toast.error(`Failed to ${action} session`);
      }
    } catch (error) {
      console.error(`Error ${action}ing session:`, error);
      toast.error(`Error ${action}ing session`);
    } finally {
      setProcessing(null);
    }
  };

  // Open action modal
  const openActionModal = (
    session: TravelSession,
    action: "approve" | "reject",
  ) => {
    setSelectedSession(session); // <- delete the `e.stopPropagation();` line above this
    setActionType(action);
    setComments("");
    setShowActionModal(true);
  };

  // Open details modal
  const openDetailsModal = (session: TravelSession) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  // Close modals
  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedSession(null);
    setComments("");
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSession(null);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Format coordinates
  const formatCoordinates = (lat: string, lng: string) => {
    if (!lat || !lng) return "N/A";
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      APPROVED: "bg-green-100 text-green-800 border-green-300",
      REJECTED: "bg-red-100 text-red-800 border-red-300",
      COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
    };

    return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  // Detail row component for modal
  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex justify-between py-2 border-b border-gray-200 last:border-0">
      <span className="text-gray-600 text-sm font-medium">{label}</span>
      <span className="text-gray-900 text-sm text-right">{value}</span>
    </div>
  );

  // Section header component
  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4 first:mt-0">
      {title}
    </h3>
  );

  // Get status color for border
  const getStatusColor = (session: TravelSession) => {
    if (session.finalStatus === "APPROVED" || session.isFinalApproved) {
      return "#22c55e";
    } else if (
      session.finalStatus === "REJECTED" ||
      session.isRejectedByReportee ||
      session.isRejectedByHR
    ) {
      return "#ef4444";
    } else {
      return "#eab308";
    }
  };

  return (
    <div className="min-h-screen bg-white/10 backdrop-blur-sm p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-blue/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Travel Session Management
              </h1>
              <p className="text-black/80">
                Review and manage pending travel session approvals
              </p>
            </div>
            <button
              onClick={fetchPendingSessions}
              className="px-6 py-2 bg-lantern-blue-600 backdrop-blur-sm rounded-lg text-white transition-all border border-white/20 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2 ">Refreshing</span>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="glass-container p-6 rounded-2xl">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingAnimation />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black/80 text-lg">
                No pending travel sessions for HR approval
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden cursor-pointer p-4"
                  onClick={() => openDetailsModal(session)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-black">
                        {session.fullName} ({session.employeeCode})
                      </h3>
                      <p className="text-black/70 text-sm">
                        Session #{session.sessionId}
                        <span className="mx-1 p-3 bg-white/10 rounded-lg text-black/80">
                          {formatDate(session.startTime)}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(session.finalStatus)}`}
                    >
                      {session.finalStatus}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-black/80">
                      <span>Reportee:</span>
                      <span className="text-black font-medium">
                        {session.reporteeInfo?.fullName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-black/80">
                      <span>HR Manager:</span>
                      <span className="text-black font-medium">
                        {session.hrManagerInfo?.fullName || "N/A"}
                      </span>
                    </div>
                    {session.reporteeApprovedAt && (
                      <div className="flex justify-between text-black/80">
                        <span>Reportee Approved:</span>
                        <span className="text-black">
                          {formatDate(session.reporteeApprovedAt)}
                        </span>
                      </div>
                    )}
                    {session.reporteeComments && (
                      <div className="mt-2 p-3 bg-white/10 rounded-lg">
                        <p className="text-black/70 text-xs">
                          Reportee Comments:
                        </p>
                        <p className="text-black">{session.reporteeComments}</p>
                      </div>
                    )}
                    {session.hrComments && (
                      <div className="mt-2 p-3 bg-white/10 rounded-lg">
                        <p className="text-black/70 text-xs">HR Comments:</p>
                        <p className="text-black">{session.hrComments}</p>
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-4 flex space-x-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionModal(session, "approve");
                      }}
                      disabled={processing === session.sessionId}
                      className="flex-1 px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-white font-medium transition-all border border-green-500/30 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionModal(session, "reject");
                      }}
                      disabled={processing === session.sessionId}
                      className="flex-1 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-white font-medium transition-all border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {actionType === "approve" ? "Approve" : "Reject"} Session #
                  {selectedSession.sessionId}
                </h2>
              </div>

              <div className="mb-4 space-y-2">
                <p className="text-black/80 text-sm">
                  <span className="font-medium">User:</span>{" "}
                  {selectedSession.username} ({selectedSession.employeeCode})
                </p>
                <p className="text-black/80 text-sm">
                  <span className="font-medium">Reportee:</span>{" "}
                  {selectedSession.reporteeInfo?.fullName || "N/A"}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-black/80 text-sm mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-black border border-black focus:outline-none focus:border-white/40 resize-none"
                  rows={4}
                  placeholder={`Enter ${actionType} comments...`}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeActionModal}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-black transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAction(selectedSession.sessionId, actionType)
                  }
                  disabled={processing === selectedSession.sessionId}
                  className={`flex-1 px-4 py-2 rounded-lg text-black font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === "approve"
                      ? "bg-green-500/30 hover:bg-green-500/40 border border-green-500/30"
                      : "bg-red-500/30 hover:bg-red-500/40 border border-red-500/30"
                  }`}
                >
                  {processing === selectedSession.sessionId
                    ? "Processing..."
                    : actionType === "approve"
                      ? "Approve"
                      : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDetailsModal && selectedSession && (
          <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-container max-w-2xl w-full p-6 rounded-2xl max-h-[90vh] overflow-y-auto border border-white/20">
              {/* Header */}
              <div className="flex justify-between items-start mb-4  border-black/10 pb-2 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {selectedSession.fullName} ({selectedSession.employeeCode})
                  </h2>
                  <p className="text-black/60 text-sm">
                    Session Details #{selectedSession.sessionId} |{" "}
                    <span className="text-black/80 px-3 py-1 bg-white/10 rounded-lg">
                      {formatDate(selectedSession.startTime)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-black/60 hover:text-black"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Status Badge
              <div className="mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedSession.finalStatus)}`}
                >
                  {selectedSession.finalStatus}
                </span>
              </div> */}

              {/* User Information */}
              <SectionHeader title="User Information" />
              <div className="bg-white rounded-lg p-4">
                <DetailRow label="User ID" value={selectedSession.userId} />
                <DetailRow label="Username" value={selectedSession.username} />
                <DetailRow label="Full Name" value={selectedSession.fullName} />
                <DetailRow
                  label="Employee Code"
                  value={selectedSession.employeeCode}
                />
                <DetailRow
                  label="Department"
                  value={selectedSession.department || "N/A"}
                />
              </div>

              {/* Travel Details */}
              <SectionHeader title="Travel Details" />
              <div className="bg-white rounded-lg p-4">
                <DetailRow
                  label="Start Time"
                  value={formatDate(selectedSession.startTime)}
                />
                <DetailRow
                  label="Start Location"
                  value={formatCoordinates(
                    selectedSession.startLatitude,
                    selectedSession.startLongitude,
                  )}
                />
                <DetailRow
                  label="Start Description"
                  value={selectedSession.startDescription || "N/A"}
                />
                <DetailRow
                  label="End Time"
                  value={formatDate(selectedSession.endTime)}
                />
                <DetailRow
                  label="End Location"
                  value={formatCoordinates(
                    selectedSession.endLatitude,
                    selectedSession.endLongitude,
                  )}
                />
                <DetailRow
                  label="End Description"
                  value={selectedSession.endDescription || "N/A"}
                />
                <DetailRow
                  label="Total Distance"
                  value={`${selectedSession.totalDistance} km`}
                />
              </div>

              {/* Approval Information */}
              <SectionHeader title="Approval Information" />
              <div className="bg-white rounded-lg p-4">
                <DetailRow
                  label="Reportee Approval"
                  value={
                    selectedSession.isApprovedByReportee
                      ? "✅ Approved"
                      : selectedSession.isRejectedByReportee
                        ? "❌ Rejected"
                        : "⏳ Pending"
                  }
                />
                {selectedSession.reporteeApprovedAt && (
                  <DetailRow
                    label="Reportee Approved At"
                    value={formatDate(selectedSession.reporteeApprovedAt)}
                  />
                )}
                {selectedSession.reporteeComments && (
                  <DetailRow
                    label="Reportee Comments"
                    value={selectedSession.reporteeComments}
                  />
                )}
                <DetailRow
                  label="HR Approval"
                  value={
                    selectedSession.isApprovedByHR
                      ? "✅ Approved"
                      : selectedSession.isRejectedByHR
                        ? "❌ Rejected"
                        : "⏳ Pending"
                  }
                />
                {selectedSession.hrApprovedAt && (
                  <DetailRow
                    label="HR Approved At"
                    value={formatDate(selectedSession.hrApprovedAt)}
                  />
                )}
                {selectedSession.hrComments && (
                  <DetailRow
                    label="HR Comments"
                    value={selectedSession.hrComments}
                  />
                )}
                <DetailRow
                  label="Final Approved"
                  value={
                    selectedSession.isFinalApproved === true
                      ? "✅ Yes"
                      : selectedSession.isFinalApproved === false
                        ? "❌ No"
                        : "⏳ Pending"
                  }
                />
              </div>

              {/* Team Information */}
              <SectionHeader title="Team Information" />
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-black/60 mb-2">
                  Reportee
                </h4>
                <DetailRow
                  label="ID"
                  value={selectedSession.reporteeInfo?.id || "N/A"}
                />
                <DetailRow
                  label="Username"
                  value={selectedSession.reporteeInfo?.username || "N/A"}
                />
                <DetailRow
                  label="Full Name"
                  value={selectedSession.reporteeInfo?.fullName || "N/A"}
                />
                <DetailRow
                  label="Employee Code"
                  value={selectedSession.reporteeInfo?.employeeCode || "N/A"}
                />

                <h4 className="text-sm font-semibold text-black/60 mb-2 mt-3">
                  HR Manager
                </h4>
                <DetailRow
                  label="ID"
                  value={selectedSession.hrManagerInfo?.id || "N/A"}
                />
                <DetailRow
                  label="Username"
                  value={selectedSession.hrManagerInfo?.username || "N/A"}
                />
                <DetailRow
                  label="Full Name"
                  value={selectedSession.hrManagerInfo?.fullName || "N/A"}
                />
                <DetailRow
                  label="Employee Code"
                  value={selectedSession.hrManagerInfo?.employeeCode || "N/A"}
                />
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={closeDetailsModal}
                  className="w-full px-4 py-2 bg-red-800 hover:bg-red-900 rounded-lg text-white font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .glass-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default TravelSessionHr;
