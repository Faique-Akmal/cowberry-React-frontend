import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // Add this import
import { toast, Toaster } from "react-hot-toast";
import API from "../api/axios";
import {
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Briefcase,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Users,
} from "lucide-react";

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

interface FilterState {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

// Portal component for modals - Using createPortal from react-dom
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return createPortal(children, document.body);
};

const ReporteeTravelSessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<TravelSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TravelSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<TravelSession | null>(
    null,
  );
  const [comments, setComments] = useState<string>("");
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<TravelSession[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    status: "ALL",
  });

  const fetchPendingSessions = async () => {
    try {
      setLoading(true);
      const response = await API.get<ApiResponse>(
        "/tracking/travel-sessions/pending/reportee",
      );

      if (response.data.success) {
        setSessions(response.data.data);
        setFilteredSessions(response.data.data);
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

  // Filter and search functionality
  useEffect(() => {
    let result = [...sessions];

    // Search filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      result = result.filter(
        (session) =>
          session.fullName.toLowerCase().includes(searchLower) ||
          session.username.toLowerCase().includes(searchLower) ||
          session.employeeCode.toLowerCase().includes(searchLower) ||
          session.userId.toString().includes(searchLower),
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(
        (session) => new Date(session.startTime) >= fromDate,
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(
        (session) => new Date(session.startTime) <= toDate,
      );
    }

    // Status filter
    if (filters.status !== "ALL") {
      if (filters.status === "PENDING_REPORTEE") {
        result = result.filter((session) => canApproveByReportee(session));
      } else if (filters.status === "APPROVED_REPORTEE") {
        result = result.filter((session) => session.isApprovedByReportee);
      } else if (filters.status === "REJECTED_REPORTEE") {
        result = result.filter((session) => session.isRejectedByReportee);
      } else {
        result = result.filter(
          (session) => session.finalStatus === filters.status,
        );
      }
    }

    setFilteredSessions(result);

    // Update suggestions
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      const matched = sessions
        .filter(
          (session) =>
            session.fullName.toLowerCase().includes(searchLower) ||
            session.username.toLowerCase().includes(searchLower) ||
            session.employeeCode.toLowerCase().includes(searchLower),
        )
        .slice(0, 10);
      setSuggestions(matched);
      setShowSuggestions(matched.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [filters, sessions]);

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
        setShowActionModal(false);
        setComments("");
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

  const openActionModal = (
    session: TravelSession,
    action: "approve" | "reject",
  ) => {
    setSelectedSession(session);
    setActionType(action);
    setComments("");
    setShowActionModal(true);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
  };

  const openDetailsModal = (session: TravelSession) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedSession(null);
    setComments("");
    // Restore body scroll
    document.body.style.overflow = "unset";
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSession(null);
    // Restore body scroll
    document.body.style.overflow = "unset";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatCoordinates = (lat: string, lng: string) => {
    if (!lat || !lng) return "N/A";
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      APPROVED: "bg-green-100 text-green-800 border-green-300",
      REJECTED: "bg-red-100 text-red-800 border-red-300",
      COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
    };

    return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const canApproveByReportee = (session: TravelSession) => {
    return !session.isApprovedByReportee && !session.isRejectedByReportee;
  };

  const handleSuggestionClick = (session: TravelSession) => {
    setFilters({
      ...filters,
      searchTerm: session.fullName,
    });
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
      status: "ALL",
    });
    setShowSuggestions(false);
  };

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm font-medium">{label}</span>
      <span className="text-gray-900 text-sm text-right font-medium">
        {value}
      </span>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
      <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-white/10 backdrop-blur-sm p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Reportee Travel Sessions
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Review and manage pending travel session approvals
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchPendingSessions}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-lantern-blue-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4">
            <p className="text-sm text-gray-500">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredSessions.length}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4">
            <p className="text-sm text-gray-500">Pending Actions</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredSessions.filter((s) => canApproveByReportee(s)).length}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredSessions.filter((s) => !canApproveByReportee(s)).length}
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar with Suggestions */}
            <div className="flex-1 relative z-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, username, employee code..."
                  value={filters.searchTerm}
                  onChange={(e) => {
                    setFilters({ ...filters, searchTerm: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (filters.searchTerm.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {filters.searchTerm && (
                  <button
                    onClick={() => {
                      setFilters({ ...filters, searchTerm: "" });
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-72 overflow-y-auto z-[9999]">
                  {suggestions.map((session) => (
                    <button
                      key={session.sessionId}
                      onClick={() => handleSuggestionClick(session)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left"
                    >
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{session.username} • {session.employeeCode}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        #{session.sessionId}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all whitespace-nowrap"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {(filters.dateFrom ||
                filters.dateTo ||
                filters.status !== "ALL") && (
                <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING_REPORTEE">Pending - Reportee</option>
                    <option value="APPROVED_REPORTEE">
                      Approved by Reportee
                    </option>
                    <option value="REJECTED_REPORTEE">
                      Rejected by Reportee
                    </option>
                    <option value="PENDING">Pending - Final</option>
                    <option value="APPROVED">Approved - Final</option>
                    <option value="REJECTED">Rejected - Final</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                >
                  Clear All Filters
                </button>
                <span className="text-sm text-gray-500 ml-auto">
                  Showing {filteredSessions.length} of {sessions.length}{" "}
                  sessions
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600 mt-4">Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium">
                No sessions found
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden cursor-pointer"
                  onClick={() => openDetailsModal(session)}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {session.fullName}
                          </h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            {session.employeeCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            {formatDate(session.startTime)}
                          </p>
                        </div>
                      </div>
                      <span className="ml-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium whitespace-nowrap">
                        #{session.sessionId}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Reportee</span>
                        <span className="text-gray-900 font-medium">
                          {session.reporteeInfo?.fullName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">HR Manager</span>
                        <span className="text-gray-900 font-medium">
                          {session.hrManagerInfo?.fullName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Distance</span>
                        <span className="text-gray-900 font-medium">
                          {(session.totalDistance / 1000).toFixed(2)} km
                        </span>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {canApproveByReportee(session) ? (
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openActionModal(session, "approve")}
                            disabled={processing === session.sessionId}
                            className="flex-1 px-4 py-2.5 bg-green-800 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4 inline mr-1.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal(session, "reject")}
                            disabled={processing === session.sessionId}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-4 h-4 inline mr-1.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                          <span className="text-gray-700 font-medium">
                            {session.isApprovedByReportee ? (
                              <span className="text-green-600">
                                ✓ Approved by Reportee
                              </span>
                            ) : session.isRejectedByReportee ? (
                              <span className="text-red-600">
                                ✗ Rejected by Reportee
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                Action not available
                              </span>
                            )}
                          </span>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals rendered at root level using Portal */}
      {showActionModal && selectedSession && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {actionType === "approve" ? "Approve" : "Reject"} Session
                  </h2>
                  <p className="text-gray-500 text-sm">
                    #{selectedSession.sessionId}
                  </p>
                </div>
                <button
                  onClick={closeActionModal}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">User</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {selectedSession.username} ({selectedSession.employeeCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Reportee</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {selectedSession.reporteeInfo?.fullName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">HR Manager</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {selectedSession.hrManagerInfo?.fullName || "N/A"}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  rows={3}
                  placeholder={`Enter ${actionType} comments...`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeActionModal}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAction(selectedSession.sessionId, actionType)
                  }
                  disabled={processing === selectedSession.sessionId}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === "approve"
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20"
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
        </ModalPortal>
      )}

      {showDetailsModal && selectedSession && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-6 flex justify-between items-start z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Session Details
                  </h2>
                  <p className="text-gray-500 text-sm">
                    #{selectedSession.sessionId} • {selectedSession.fullName}
                  </p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* Status Badge */}
                <div className="mb-6">
                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border ${getStatusBadge(selectedSession.finalStatus)}`}
                  >
                    {getStatusIcon(selectedSession.finalStatus)}
                    {selectedSession.finalStatus}
                  </span>
                </div>

                {/* User Information */}
                <SectionHeader title="User Information" />
                <div className="bg-gray-50 rounded-xl p-4">
                  <DetailRow label="User ID" value={selectedSession.userId} />
                  <DetailRow
                    label="Username"
                    value={selectedSession.username}
                  />
                  <DetailRow
                    label="Full Name"
                    value={selectedSession.fullName}
                  />
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
                <div className="bg-gray-50 rounded-xl p-4">
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
                    value={`${(selectedSession.totalDistance / 1000).toFixed(2)} km`}
                  />
                </div>

                {/* Approval Information */}
                <SectionHeader title="Approval Information" />
                <div className="bg-gray-50 rounded-xl p-4">
                  <DetailRow
                    label="Reportee Approval"
                    value={
                      selectedSession.isApprovedByReportee ? (
                        <span className="text-green-600">✓ Approved</span>
                      ) : selectedSession.isRejectedByReportee ? (
                        <span className="text-red-600">✗ Rejected</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Pending</span>
                      )
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
                      selectedSession.isApprovedByHR ? (
                        <span className="text-green-600">✓ Approved</span>
                      ) : selectedSession.isRejectedByHR ? (
                        <span className="text-red-600">✗ Rejected</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Pending</span>
                      )
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
                      selectedSession.isFinalApproved === true ? (
                        <span className="text-green-600">✓ Yes</span>
                      ) : selectedSession.isFinalApproved === false ? (
                        <span className="text-red-600">✗ No</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Pending</span>
                      )
                    }
                  />
                </div>

                {/* Close Button */}
                <div className="mt-6">
                  <button
                    onClick={closeDetailsModal}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }
        .fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .zoom-in {
          animation: zoomIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReporteeTravelSessionManager;
