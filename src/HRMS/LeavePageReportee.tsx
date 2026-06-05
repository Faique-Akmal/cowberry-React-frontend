import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar as CalendarIcon,
  FileText,
  Clock,
  UserCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveRecord {
  leave_application: string;
  lantern360_leave_id: string;
  employee_code: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  half_day: boolean;
  half_day_date: string | null;
  status: "Open" | "Approved" | "Rejected" | "Cancelled";
  reason: string;
  applied_on: string;
  approver_name: string;
  approved_on: string | null;
}

interface ApiResponse {
  message: {
    success: boolean;
    total: number;
    leaves: LeaveRecord[];
    manager_employee_code?: string;
  };
}

interface ApprovePayload {
  approver_employee_code: string;
  lantern360_leave_id: string;
  reason: string;
}

// ─── Custom Date Picker ───────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const selectDate = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Select date";

  const selectedDay = value
    ? (() => {
        const d = new Date(value + "T00:00:00");
        return d.getMonth() === viewMonth && d.getFullYear() === viewYear
          ? d.getDate()
          : -1;
      })()
    : -1;

  const today = new Date();
  const todayDay = today.getDate();
  const isCurrentMonthYear =
    today.getMonth() === viewMonth && today.getFullYear() === viewYear;

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-left transition-colors min-h-[44px]"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {displayValue}
        </span>
        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64 left-0">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              const isToday = isCurrentMonthYear && day === todayDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors
                    ${isSelected ? "bg-blue-600 text-white" : isToday ? "border border-blue-400 text-blue-600 hover:bg-blue-50" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                selectDate(t.getDate());
                setViewMonth(t.getMonth());
                setViewYear(t.getFullYear());
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-red-500 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Leave Card (Mobile-friendly card replacing table row) ────────────────────

interface LeaveCardProps {
  leave: LeaveRecord;
  onViewDetails: (leave: LeaveRecord) => void;
  onApprove: (leave: LeaveRecord) => void;
  onReject: (leave: LeaveRecord) => void;
  formatDate: (dateString: string) => string;
  getStatusBadge: (status: string) => string;
}

const LeaveCard: React.FC<LeaveCardProps> = ({
  leave,
  onViewDetails,
  onApprove,
  onReject,
  formatDate,
  getStatusBadge,
}) => {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow active:bg-gray-50"
      onClick={() => onViewDetails(leave)}
    >
      {/* Top row: employee + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {leave.employee_name}
          </p>
          <p className="text-xs text-gray-500">{leave.employee_code}</p>
        </div>
        <span
          className={`flex-shrink-0 inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(leave.status)}`}
        >
          {leave.status}
        </span>
      </div>

      {/* Leave type + days */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-800 font-medium truncate">
          {leave.leave_type}
        </span>
        {leave.half_day && (
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            Half Day
          </span>
        )}
        <span className="ml-auto flex-shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
        <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
        <span>
          {formatDate(leave.from_date)}
          {leave.from_date !== leave.to_date && (
            <> – {formatDate(leave.to_date)}</>
          )}
        </span>
      </div>

      {/* Reason */}
      {leave.reason && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {leave.reason}
        </p>
      )}

      {/* Applied on + actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Applied {formatDate(leave.applied_on)}
        </span>
        {leave.status === "Open" && (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onApprove(leave)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors min-h-[36px]"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={() => onReject(leave)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors min-h-[36px]"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Leave Details Modal ──────────────────────────────────────────────────────

interface LeaveDetailsModalProps {
  leave: LeaveRecord;
  onClose: () => void;
  onApprove?: (leave: LeaveRecord) => void;
  onReject?: (leave: LeaveRecord) => void;
  formatDate: (dateString: string) => string;
  getStatusBadge: (status: string) => string;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  leave,
  onClose,
  onApprove,
  onReject,
  formatDate,
  getStatusBadge,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Leave Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Status */}
          <div className="flex justify-end">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(leave.status)}`}
            >
              {leave.status}
            </span>
          </div>

          {/* Employee */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Employee
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.employee_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Code</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.employee_code}
                </p>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5" /> Leave Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Leave Type</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.leave_type}
                  {leave.half_day && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Half Day)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total Days</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">From</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(leave.from_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">To</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(leave.to_date)}
                </p>
              </div>
              {leave.half_day && leave.half_day_date && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Half Day Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(leave.half_day_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Reason
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {leave.reason || "No reason provided"}
            </p>
          </div>

          {/* Application Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Application Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Applied On</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(leave.applied_on)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Approver</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.approver_name || "Not assigned"}
                </p>
              </div>
              {leave.approved_on && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Actioned On</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(leave.approved_on)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* IDs */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5" /> Reference IDs
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  Leave Application ID
                </p>
                <p className="text-xs font-mono text-gray-800 break-all">
                  {leave.leave_application}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  Lantern360 Leave ID
                </p>
                <p className="text-xs font-mono text-gray-800 break-all">
                  {leave.lantern360_leave_id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {leave.status === "Open" && onApprove && onReject && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => onReject(leave)}
              className="flex-1 py-2.5 text-sm font-medium text-red-700 bg-red-100 rounded-xl hover:bg-red-200 transition-colors min-h-[44px]"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(leave)}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors min-h-[44px]"
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const LeaveManagementReportee: React.FC = () => {
  const managerEmployeeCode = useRef(
    localStorage.getItem("employee_code") ?? "",
  ).current;
  const apiBaseUrl = useRef(
    (import.meta as any).env?.VITE_BASE_URL ?? "",
  ).current;

  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"approve" | "reject">("approve");
  const [remarks, setRemarks] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const totalItems = leaves.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedLeaves = leaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        manager_employee_code: managerEmployeeCode,
        from_date: fromDate,
        to_date: toDate,
        include_indirect: "false",
        limit: "1000",
      });
      if (statusFilter !== "All") params.append("status", statusFilter);
      const url = `${apiBaseUrl}/leaves/erp-reportee-leaves?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data: ApiResponse = await response.json();
      if (data.message.success) {
        const sorted = [...data.message.leaves].sort(
          (a, b) =>
            new Date(b.applied_on).getTime() - new Date(a.applied_on).getTime(),
        );
        setLeaves(sorted);
        setCurrentPage(1);
      } else {
        setError("Failed to fetch leaves");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching leaves",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate, managerEmployeeCode, apiBaseUrl]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleApproveReject = async (action: "approve" | "reject") => {
    if (!selectedLeave) return;
    try {
      const payload = {
        approver_employee_code: managerEmployeeCode,
        lantern360_leave_id: selectedLeave.lantern360_leave_id,
        reason: remarks || (action === "approve" ? "Approved" : "Rejected"),
      };
      const endpoint =
        action === "approve"
          ? `${apiBaseUrl}/leaves/erp-approve-leave`
          : `${apiBaseUrl}/leaves/erp-reject-leave`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const isSuccess = data.message?.success || data.success;
      if (isSuccess) {
        await fetchLeaves();
        closeModal();
        closeDetailsModal();
      } else {
        setError(
          data.message?.message || data.message || "Failed to process request",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const openActionModal = (leave: LeaveRecord, mode: "approve" | "reject") => {
    setSelectedLeave(leave);
    setModalMode(mode);
    setRemarks("");
    setIsModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
    setRemarks("");
  };
  const openDetailsModal = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
    setIsDetailsModalOpen(true);
  };
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedLeave(null);
  };

  const handleApproveFromDetails = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
    setModalMode("approve");
    setRemarks("");
    setIsModalOpen(true);
    setIsDetailsModalOpen(false);
  };
  const handleRejectFromDetails = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
    setModalMode("reject");
    setRemarks("");
    setIsModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* ── Header ── */}
        <div className="bg-lantern-blue-600 px-4 pt-4 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Leave Management</h1>
              <p className="text-sm text-blue-100 mt-0.5">
                Manage reportee leave requests
              </p>
            </div>
            <button
              onClick={fetchLeaves}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium min-h-[40px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-black text-sm w-full justify-between min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(statusFilter !== "All" || fromDate || toDate) && (
                <span className="bg-white text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {
                    [statusFilter !== "All", !!fromDate, !!toDate].filter(
                      Boolean,
                    ).length
                  }
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* ── Filters Panel ── */}
        {showFilters && (
          <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm min-h-[44px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={setFromDate}
                />
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={setToDate}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStatusFilter("All");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    fetchLeaves();
                    setShowFilters(false);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-4 py-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-500">Loading leave requests...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <button
                onClick={fetchLeaves}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="w-14 h-14 text-gray-300 mb-4" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                No leave requests found
              </h3>
              <p className="text-sm text-gray-400">
                No applications match your current filters.
              </p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">
                  {totalItems} request{totalItems !== 1 ? "s" : ""}
                </p>
                <select
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleItemsPerPageChange(Number(e.target.value))
                  }
                  className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} per page
                    </option>
                  ))}
                </select>
              </div>

              {/* Cards list */}
              <div className="space-y-3">
                {paginatedLeaves.map((leave) => (
                  <LeaveCard
                    key={leave.lantern360_leave_id}
                    leave={leave}
                    onViewDetails={openDetailsModal}
                    onApprove={(l) => openActionModal(l, "approve")}
                    onReject={(l) => openActionModal(l, "reject")}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {(currentPage - 1) * itemsPerPage + 1}–
                    {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg border min-w-[36px] min-h-[36px] flex items-center justify-center ${currentPage === 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm border min-w-[36px] min-h-[36px] transition-colors ${currentPage === pageNum ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg border min-w-[36px] min-h-[36px] flex items-center justify-center ${currentPage === totalPages ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Leave Details Modal ── */}
      {isDetailsModalOpen && selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={closeDetailsModal}
          onApprove={handleApproveFromDetails}
          onReject={handleRejectFromDetails}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* ── Approve / Reject Confirmation Modal ── */}
      {isModalOpen && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {modalMode === "approve" ? "Approve Leave" : "Reject Leave"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-gray-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">
                    {selectedLeave.employee_name}
                  </span>
                  <span className="text-gray-500 ml-1">
                    ({selectedLeave.employee_code})
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  {selectedLeave.leave_type} · {selectedLeave.total_days} day
                  {selectedLeave.total_days !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedLeave.from_date)}
                  {selectedLeave.from_date !== selectedLeave.to_date &&
                    ` – ${formatDate(selectedLeave.to_date)}`}
                </p>
                {selectedLeave.reason && (
                  <p className="text-sm text-gray-500 line-clamp-2 pt-1 border-t border-gray-200 mt-1">
                    {selectedLeave.reason}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {modalMode === "approve"
                    ? "Remarks (optional)"
                    : "Reason for rejection"}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder={
                    modalMode === "approve"
                      ? "Add approval remarks..."
                      : "Provide reason for rejection..."
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                />
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveReject(modalMode)}
                className={`flex-1 py-3 text-sm font-medium text-white rounded-xl transition-colors min-h-[48px] ${
                  modalMode === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {modalMode === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementReportee;
