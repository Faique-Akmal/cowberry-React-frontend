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
  remarks: string;
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

// ─── Main Component ───────────────────────────────────────────────────────────

const LeaveManagementReportee: React.FC = () => {
  // Read once from localStorage on mount — stable refs
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

  // Pagination helpers
  const totalItems = leaves.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedLeaves = leaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ── Fetch (Reportee API) ───────────────────────────────────────────────────

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        manager_employee_code: managerEmployeeCode, // ← reportee param
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
  }, [statusFilter, fromDate, toDate, managerEmployeeCode, apiBaseUrl]);

  // ── Actions (approve / reject with correct endpoints) ───────────────────

  const handleApproveReject = async (action: "approve" | "reject") => {
    if (!selectedLeave) return;

    try {
      const payload: ApprovePayload = {
        approver_employee_code: managerEmployeeCode,
        lantern360_leave_id: selectedLeave.lantern360_leave_id,
        remarks: remarks || (action === "approve" ? "Approved" : "Rejected"),
      };

      // Use different endpoints based on action
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

      // Check response structure - handle both patterns
      const isSuccess = data.message?.success || data.success;

      if (isSuccess) {
        await fetchLeaves();
        closeModal();
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
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
    setRemarks("");
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
    <div className=" bg-gray-50 min-h-screen">
      <div className="px-4 w-full sm:px-6 py-6">
        {/* ── Header ── */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6">
          <div className="px-4 sm:px-6 py-4 bg-lantern-blue-600 rounded-t-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Leave Management
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Manage leave requests for your reportees
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-black"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>
                <button
                  onClick={fetchLeaves}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Filters Panel ── */}
          {showFilters && (
            <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 rounded-b-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                  >
                    <option value="All">All</option>
                    <option value="Open">Open</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
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

        {/* ── Table Card ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center m-6">
              <p className="text-red-700">{error}</p>
              <button
                onClick={fetchLeaves}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No leave requests found
              </h3>
              <p className="text-gray-500">
                No leave applications match your current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto ">
                <table className=" w-full divide-y divide-gray-200 text-sm table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leave Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied On
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLeaves.map((leave) => (
                      <tr
                        key={leave.lantern360_leave_id}
                        className="hover:bg-gray-50 transition-colors"
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
                        <td className="px-4 py-3 w-48">
                          <div className="text-gray-900 break-words line-clamp-2">
                            {leave.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          {formatDate(leave.applied_on)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Reportee: approve & reject only on Open leaves, no Modify */}
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              <div className="border-t border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span>
                      Showing{" "}
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
                          {n} per page
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-1.5 rounded-lg border ${currentPage === 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-1.5 rounded-lg border ${currentPage === totalPages ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal (approve / reject only) ── */}
      {isModalOpen && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === "approve"
                  ? "Approve Leave Request"
                  : "Reject Leave Request"}
              </h2>
            </div>

            <div className="px-6 py-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Employee:</span>{" "}
                  {selectedLeave.employee_name} ({selectedLeave.employee_code})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Leave:</span>{" "}
                  {selectedLeave.leave_type} ({selectedLeave.total_days} day
                  {selectedLeave.total_days !== 1 ? "s" : ""})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span>{" "}
                  {formatDate(selectedLeave.from_date)}
                  {selectedLeave.from_date !== selectedLeave.to_date &&
                    ` – ${formatDate(selectedLeave.to_date)}`}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reason:</span>{" "}
                  {selectedLeave.reason}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalMode === "approve"
                    ? "Approval Remarks"
                    : "Rejection Reason"}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder={
                    modalMode === "approve"
                      ? "Add approval remarks (optional)"
                      : "Provide reason for rejection"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveReject(modalMode)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
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
