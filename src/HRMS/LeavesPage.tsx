import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  Edit2,
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
    caller_employee_code?: string;
  };
}

interface ModifyPayload {
  caller_employee_code: string;
  lantern360_leave_id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  half_day: boolean;
  half_day_date: string | null;
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
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-left transition-colors"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {displayValue}
        </span>
        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
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
                    ${isSelected ? "bg-lantern-blue-600 text-white" : isToday ? "border border-blue-400 text-blue-600 hover:bg-blue-50" : "text-gray-700 hover:bg-gray-100"}`}
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

// ─── Leave Details Modal ──────────────────────────────────────────────────────

interface LeaveDetailsModalProps {
  leave: LeaveRecord;
  onClose: () => void;
  onApprove?: (leave: LeaveRecord) => void;
  onReject?: (leave: LeaveRecord) => void;
  onModify?: (leave: LeaveRecord) => void;
  formatDate: (dateString: string) => string;
  getStatusBadge: (status: string) => string;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  leave,
  onClose,
  onApprove,
  onReject,
  onModify,
  formatDate,
  getStatusBadge,
}) => {
  return (
    <div className="w-full bg-gray-50 min-h-screen overflow-x-hidden">
      <div className="px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Leave Request Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div className="flex justify-end">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(leave.status)}`}
            >
              {leave.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Employee Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.employee_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Employee Code</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.employee_code}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Leave Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Leave Type</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.leave_type}
                  {leave.half_day && (
                    <span className="ml-1 text-xs text-gray-500">(Half)</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Days</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">From</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(leave.from_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">To</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(leave.to_date)}
                </p>
              </div>
              {leave.half_day && leave.half_day_date && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Half Day Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(leave.half_day_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Reason for Leave
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {leave.reason || "No reason provided"}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Application Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Applied On</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(leave.applied_on)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Approver</p>
                <p className="text-sm font-medium text-gray-900">
                  {leave.approver_name || "Not assigned"}
                </p>
              </div>
              {leave.approved_on && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Approved/Rejected On</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(leave.approved_on)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Additional Information
            </h3>
            <div>
              <p className="text-xs text-gray-500">Leave Application ID</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {leave.leave_application}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lantern360 Leave ID</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {leave.lantern360_leave_id}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {onModify && (
            <button
              onClick={() => onModify(leave)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modify
            </button>
          )}
          {leave.status === "Open" && onApprove && onReject && (
            <>
              <button
                onClick={() => onReject(leave)}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(leave)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Mobile Leave Card ────────────────────────────────────────────────────────

interface LeaveCardProps {
  leave: LeaveRecord;
  onView: (leave: LeaveRecord) => void;
  onApprove: (leave: LeaveRecord, mode: "approve") => void;
  onReject: (leave: LeaveRecord, mode: "reject") => void;
  onModify: (leave: LeaveRecord, mode: "modify") => void;
  formatDate: (d: string) => string;
  getStatusBadge: (s: string) => string;
}

const LeaveCard: React.FC<LeaveCardProps> = ({
  leave,
  onView,
  onApprove,
  onReject,
  onModify,
  formatDate,
  getStatusBadge,
}) => (
  <div
    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50 transition-colors"
    onClick={() => onView(leave)}
  >
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {leave.employee_name}
        </p>
        <p className="text-xs text-gray-500">{leave.employee_code}</p>
      </div>
      <span
        className={`inline-flex flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(leave.status)}`}
      >
        {leave.status}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
      <div>
        <p className="text-xs text-gray-400">Leave Type</p>
        <p className="text-sm text-gray-800 font-medium">
          {leave.leave_type}
          {leave.half_day && (
            <span className="text-xs text-gray-500 ml-1">(Half)</span>
          )}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Days</p>
        <p className="text-sm text-gray-800 font-medium">
          {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">From</p>
        <p className="text-sm text-gray-800">{formatDate(leave.from_date)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">To</p>
        <p className="text-sm text-gray-800">{formatDate(leave.to_date)}</p>
      </div>
    </div>

    {leave.reason && (
      <p className="text-xs text-gray-500 mb-3 line-clamp-2 bg-gray-50 rounded-lg px-3 py-2">
        {leave.reason}
      </p>
    )}

    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Applied {formatDate(leave.applied_on)}
      </p>
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {leave.status === "Open" && (
          <>
            <button
              onClick={() => onApprove(leave, "approve")}
              className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => onReject(leave, "reject")}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              title="Reject"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </>
        )}
        <button
          onClick={() => onModify(leave, "modify")}
          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          title="Modify"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const LeaveManagement: React.FC = () => {
  const callerEmployeeCode = useRef(
    localStorage.getItem("employee_code") ?? "",
  ).current;
  const apiBaseUrl = import.meta.env.VITE_BASE_URL;

  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | "modify">(
    "approve",
  );
  const [remarks, setRemarks] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [employeeCodeFilter, setEmployeeCodeFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [modifyForm, setModifyForm] = useState({
    leave_type: "",
    from_date: "",
    to_date: "",
    half_day: false,
    half_day_date: "",
    reason: "",
  });

  const sortedLeaves = React.useMemo(() => {
    return [...leaves].sort(
      (a, b) =>
        new Date(b.applied_on).getTime() - new Date(a.applied_on).getTime(),
    );
  }, [leaves]);

  const totalItems = sortedLeaves.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedLeaves = sortedLeaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        caller_employee_code: callerEmployeeCode,
        from_date: fromDate,
        to_date: toDate,
        limit: "1000",
      });
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (employeeCodeFilter)
        params.append("employee_code", employeeCodeFilter);

      const response = await fetch(
        `${apiBaseUrl}/leaves/erp-hr-leaves?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data: ApiResponse = await response.json();
      if (data.message.success) {
        setLeaves(data.message.leaves);
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
  }, [
    statusFilter,
    fromDate,
    toDate,
    employeeCodeFilter,
    callerEmployeeCode,
    apiBaseUrl,
  ]);

  const handleApproveReject = async (action: "approve" | "reject") => {
    if (!selectedLeave) return;
    try {
      const basePayload = {
        approver_employee_code: callerEmployeeCode,
        lantern360_leave_id: selectedLeave.lantern360_leave_id,
      };
      const endpoint =
        action === "approve"
          ? `${apiBaseUrl}/leaves/erp-approve-leave`
          : `${apiBaseUrl}/leaves/erp-reject-leave`;
      const payload =
        action === "approve"
          ? remarks
            ? { ...basePayload, remarks }
            : basePayload
          : { ...basePayload, reason: remarks || "Rejected" };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.message?.success) {
        await fetchLeaves();
        closeModal();
        closeDetailsModal();
      } else
        setError(
          data.message?.message || data.error || `Failed to ${action} request`,
        );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleModifyLeave = async () => {
    if (!selectedLeave) return;
    try {
      const payload: ModifyPayload = {
        caller_employee_code: callerEmployeeCode,
        lantern360_leave_id: selectedLeave.lantern360_leave_id,
        leave_type: modifyForm.leave_type,
        from_date: modifyForm.from_date,
        to_date: modifyForm.to_date,
        half_day: modifyForm.half_day,
        half_day_date: modifyForm.half_day_date || null,
        reason: modifyForm.reason,
      };
      const response = await fetch(`${apiBaseUrl}/leaves/erp-modify-leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.message.success) {
        await fetchLeaves();
        closeModal();
        closeDetailsModal();
      } else setError(data.message.message || "Failed to modify leave");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const openActionModal = (
    leave: LeaveRecord,
    mode: "approve" | "reject" | "modify",
  ) => {
    setSelectedLeave(leave);
    setModalMode(mode);
    setRemarks("");
    if (mode === "modify") {
      setModifyForm({
        leave_type: leave.leave_type,
        from_date: leave.from_date,
        to_date: leave.to_date,
        half_day: leave.half_day,
        half_day_date: leave.half_day_date || "",
        reason: leave.reason,
      });
    }
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
    // KEY FIX: min-h-screen + overflow-y-auto on the page root so mobile can scroll
    <div className="w-full bg-gray-50 min-h-screen mb-10">
      {/* KEY FIX: px-4 only, no max-w that clips on mobile, pb-8 so last card isn't cut off */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
        {/* ── Header ── */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6">
          <div className="px-4 sm:px-6 py-4 bg-lantern-blue-600 rounded-t-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {" "}
              <div>
                <h1 className="text-xl font-bold text-white">
                  Leave Management
                </h1>
                <p className="text-sm text-blue-100 mt-0.5">
                  Manage all employee leave requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>
                <button
                  onClick={fetchLeaves}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Filters Panel ── */}
          {showFilters && (
            <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="All">All</option>
                    <option value="Open">Open</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={employeeCodeFilter}
                    onChange={(e) => setEmployeeCodeFilter(e.target.value)}
                    placeholder="Filter by employee"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
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
              <div className="mt-3 flex justify-end">
                <button
                  onClick={fetchLeaves}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <p className="text-red-700 mb-2">{error}</p>
            <button
              onClick={fetchLeaves}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        ) : sortedLeaves.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No leave requests found
            </h3>
            <p className="text-gray-500 text-sm">
              No leave applications match your current filters.
            </p>
          </div>
        ) : (
          <>
            {/* ── Mobile: Card List (hidden on md+) ── */}
            <div className="flex flex-col gap-3 md:hidden">
              {paginatedLeaves.map((leave) => (
                <LeaveCard
                  key={leave.lantern360_leave_id}
                  leave={leave}
                  onView={openDetailsModal}
                  onApprove={(l, m) => openActionModal(l, m)}
                  onReject={(l, m) => openActionModal(l, m)}
                  onModify={(l, m) => openActionModal(l, m)}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>

            {/* ── Desktop: Table (hidden below md) ── */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* KEY FIX: overflow-x-auto on the wrapper, remove table-fixed */}
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Leave Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Days
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Applied On
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLeaves.map((leave) => (
                      <tr
                        key={leave.lantern360_leave_id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => openDetailsModal(leave)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {leave.employee_name}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {leave.employee_code}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {leave.leave_type}
                          {leave.half_day && (
                            <span className="ml-1 text-xs text-gray-500">
                              (Half)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          {formatDate(leave.from_date)}
                          {leave.from_date !== leave.to_date && (
                            <> – {formatDate(leave.to_date)}</>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          {leave.total_days}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(leave.status)}`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-gray-900 line-clamp-2">
                            {leave.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          {formatDate(leave.applied_on)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {leave.status === "Open" && (
                              <>
                                <button
                                  onClick={() =>
                                    openActionModal(leave, "approve")
                                  }
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    openActionModal(leave, "reject")
                                  }
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openActionModal(leave, "modify")}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Modify"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Pagination ── */}
            <div className="mt-4 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-xs sm:text-sm">
                    {totalItems === 0
                      ? 0
                      : (currentPage - 1) * itemsPerPage + 1}
                    –{Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems}
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${currentPage === 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm border transition-colors ${currentPage === pageNum ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${currentPage === totalPages ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Leave Details Modal ── */}
      {isDetailsModalOpen && selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={closeDetailsModal}
          onApprove={(l) => openActionModal(l, "approve")}
          onReject={(l) => openActionModal(l, "reject")}
          onModify={(l) => openActionModal(l, "modify")}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* ── Action Modal (Approve / Reject / Modify) ── */}
      {isModalOpen && selectedLeave && (
        // KEY FIX: slides up from bottom on mobile (items-end), centered on sm+
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900">
                {modalMode === "approve" && "Approve Leave Request"}
                {modalMode === "reject" && "Reject Leave Request"}
                {modalMode === "modify" && "Modify Leave Request"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto flex-1">
              {modalMode === "modify" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type
                    </label>
                    <select
                      value={modifyForm.leave_type}
                      onChange={(e) =>
                        setModifyForm({
                          ...modifyForm,
                          leave_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Unpaid Leave">Unpaid Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      label="From Date"
                      value={modifyForm.from_date}
                      onChange={(v) =>
                        setModifyForm({ ...modifyForm, from_date: v })
                      }
                    />
                    <DatePicker
                      label="To Date"
                      value={modifyForm.to_date}
                      onChange={(v) =>
                        setModifyForm({ ...modifyForm, to_date: v })
                      }
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="halfDay"
                      checked={modifyForm.half_day}
                      onChange={(e) =>
                        setModifyForm({
                          ...modifyForm,
                          half_day: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="halfDay"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Half Day
                    </label>
                  </div>
                  {modifyForm.half_day && (
                    <DatePicker
                      label="Half Day Date"
                      value={modifyForm.half_day_date}
                      onChange={(v) =>
                        setModifyForm({ ...modifyForm, half_day_date: v })
                      }
                    />
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={modifyForm.reason}
                      onChange={(e) =>
                        setModifyForm({ ...modifyForm, reason: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Employee:</span>{" "}
                      {selectedLeave.employee_name} (
                      {selectedLeave.employee_code})
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Leave:</span>{" "}
                      {selectedLeave.leave_type} ({selectedLeave.total_days} day
                      {selectedLeave.total_days !== 1 ? "s" : ""})
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(selectedLeave.from_date)}
                      {selectedLeave.from_date !== selectedLeave.to_date &&
                        ` – ${formatDate(selectedLeave.to_date)}`}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reason:</span>{" "}
                      {selectedLeave.reason}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {modalMode === "approve"
                        ? "Approval Remarks (optional)"
                        : "Rejection Reason"}
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      placeholder={
                        modalMode === "approve"
                          ? "Add approval remarks…"
                          : "Provide reason for rejection"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  modalMode === "modify"
                    ? handleModifyLeave
                    : () =>
                        handleApproveReject(modalMode as "approve" | "reject")
                }
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  modalMode === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : modalMode === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {modalMode === "approve" && "Approve"}
                {modalMode === "reject" && "Reject"}
                {modalMode === "modify" && "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
