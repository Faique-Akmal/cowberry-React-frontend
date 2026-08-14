import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import API from "../api/axios";

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
  isApprovedByReportee: boolean;
  isRejectedByReportee: boolean;
  isApprovedByHR: boolean;
  isRejectedByHR: boolean;
  isFinalApproved: boolean | null;
  finalStatus: string;
  reporteeComments: string | null;
  reporteeApprovedAt: string | null;
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

// API Configuration

const ReporteeTravelSessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<TravelSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<TravelSession | null>(
    null,
  );
  const [comments, setComments] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  // Fetch pending sessions for reportee
  const fetchPendingSessions = async () => {
    try {
      setLoading(true);
      const response = await API.get<ApiResponse>(
        "/tracking/travel-sessions/pending/reportee",
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

  // Handle approve/reject action for reportee
  const handleAction = async (
    sessionId: number,
    action: "approve" | "reject",
  ) => {
    try {
      setProcessing(sessionId);

      const response = await API.post(
        `/tracking/travel-session/${sessionId}/reportee-approve`,
        {
          action: action,
          comments: comments.trim() || `${action} by Reportee`,
        },
      );

      if (response.data.success) {
        toast.success(`Session ${action}ed successfully`);
        setShowModal(false);
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

  // Open modal for action
  const openActionModal = (
    session: TravelSession,
    action: "approve" | "reject",
  ) => {
    setSelectedSession(session);
    setActionType(action);
    setComments("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedSession(null);
    setComments("");
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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

  // Check if session can be approved by reportee
  const canApproveByReportee = (session: TravelSession) => {
    return !session.isApprovedByReportee && !session.isRejectedByReportee;
  };

  return (
    <div className="min-h-screen bg-white/10  p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-container p-6 mb-8 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Reportee Travel Session Management
              </h1>
              <p className="text-black/80">
                Review and manage pending travel session approvals as reportee
              </p>
            </div>
            <button
              onClick={fetchPendingSessions}
              className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-black hover:bg-white/30 transition-all border border-white/20 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </span>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black/80 text-lg">
                No pending travel sessions for reportee approval
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-black">
                        Session #{session.sessionId}
                      </h3>
                      <p className="text-black/70 text-sm">
                        {session.username} ({session.employeeCode})
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

                  <div className="mt-4 flex space-x-3">
                    {canApproveByReportee(session) ? (
                      <>
                        <button
                          onClick={() => openActionModal(session, "approve")}
                          disabled={processing === session.sessionId}
                          className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-black font-medium transition-all border border-green-500/30 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openActionModal(session, "reject")}
                          disabled={processing === session.sessionId}
                          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-black font-medium transition-all border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2 text-black/60 bg-white/5 rounded-lg">
                        {session.isApprovedByReportee
                          ? "Approved by Reportee"
                          : session.isRejectedByReportee
                            ? "Rejected by Reportee"
                            : "Action not available"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Modal */}
        {showModal && selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-container max-w-md w-full p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-black mb-4">
                {actionType === "approve" ? "Approve" : "Reject"} Session #
                {selectedSession.sessionId}
              </h2>

              <div className="mb-4 space-y-2">
                <p className="text-black/80 text-sm">
                  <span className="font-medium">User:</span>{" "}
                  {selectedSession.username} ({selectedSession.employeeCode})
                </p>
                <p className="text-black/80 text-sm">
                  <span className="font-medium">Reportee:</span>{" "}
                  {selectedSession.reporteeInfo?.fullName || "N/A"}
                </p>
                <p className="text-black/80 text-sm">
                  <span className="font-medium">HR Manager:</span>{" "}
                  {selectedSession.hrManagerInfo?.fullName || "N/A"}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-black/80 text-sm mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-black border border-white/20 focus:outline-none focus:border-white/40 resize-none"
                  rows={4}
                  placeholder={`Enter ${actionType} comments...`}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeModal}
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

export default ReporteeTravelSessionManager;
