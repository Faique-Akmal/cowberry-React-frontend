import React, { useState, useEffect, useCallback, useRef } from "react";
import LoadingAnimation from "../pages/UiElements/loadingAnimation";
import API from "../api/axios";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface EmployeeLeavesResponse {
  message: {
    success: boolean;
    employee_code: string;
    total: number;
    leaves: LeaveRecord[];
  };
}

interface LeaveStatusProps {
  token: string;
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
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DatePickerProps {
  label: string;
  value: string; // "YYYY-MM-DD"
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
          {/* Month/Year nav */}
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

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
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
                  className={`
                    w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors
                    ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : isToday
                          ? "border border-blue-400 text-blue-600 hover:bg-blue-50"
                          : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                setViewMonth(t.getMonth());
                setViewYear(t.getFullYear());
                selectDate(t.getDate());
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

const LeaveStatus: React.FC<LeaveStatusProps> = ({ token }) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState({
    employee_code: "",
    employee_name: "",
    fiscal_year: "",
  });
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split("T")[0];
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const getEmployeeCode = (): string =>
    localStorage.getItem("employee_code") || "";

  // Frontend pagination
  const totalItems = leaves.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedLeaves = leaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLeaveBalances = async () => {
    const employee_code = getEmployeeCode();
    if (!employee_code) throw new Error("Employee code not found");

    const response = await API.get<{ message: LeaveBalanceResponse }>(
      `/leaves/get-erp-leave-balance`,
      { params: { employee_code } },
    );
    const data = response.data.message;
    if (data.success) {
      setLeaveBalances(data.leave_balances || []);
      setEmployeeInfo({
        employee_code: data.employee_code,
        employee_name: data.employee_name,
        fiscal_year: data.fiscal_year,
      });
    } else {
      throw new Error("Failed to fetch leave balances");
    }
  };

  const fetchEmployeeLeaves = useCallback(async () => {
    const employee_code = getEmployeeCode();
    if (!employee_code) throw new Error("Employee code not found");

    const params: Record<string, any> = { employee_code, limit: 1000 };
    if (statusFilter) params.status = statusFilter;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;

    try {
      const response = await API.get<EmployeeLeavesResponse>(
        `/leaves/erp-employee-leaves`,
        { params },
      );
      const data = response.data.message;
      if (data.success) {
        setLeaves(data.leaves || []);
        setCurrentPage(1);
      } else {
        throw new Error("Failed to fetch leave history");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setLeaves([]);
      } else {
        throw err;
      }
    }
  }, [statusFilter, fromDate, toDate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchLeaveBalances(), fetchEmployeeLeaves()]);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!loading) fetchEmployeeLeaves();
  }, [statusFilter, fromDate, toDate]);

  // ── Helpers ────────────────────────────────────────────────────────────────

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
      case "OPEN":
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
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    const d1 = new Date();
    d1.setMonth(d1.getMonth() - 3);
    const d2 = new Date();
    d2.setMonth(d2.getMonth() + 3);
    setFromDate(d1.toISOString().split("T")[0]);
    setToDate(d2.toISOString().split("T")[0]);
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

  const totalRemainingLeaves = leaveBalances.reduce(
    (s, b) => s + b.remaining,
    0,
  );
  const totalUsedLeaves = leaveBalances.reduce((s, b) => s + b.used, 0);
  const totalPendingApproval = leaveBalances.reduce(
    (s, b) => s + b.pending_approval,
    0,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-6">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <button
          onClick={fetchAllData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden bg-gray-50 min-h-screen mb-10">
      <div className="px-4 sm:px-6 py-6">
        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Leave Status</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your leave balances and request history
          </p>
        </div>

        {/* ── Employee Info ── */}
        {employeeInfo.employee_name && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-lantern-blue-600 rounded-t-lg">
              <h2 className="text-lg text-white font-semibold">
                Employee Information
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee Code</p>
                  <p className="font-medium text-gray-900">
                    {employeeInfo.employee_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee Name</p>
                  <p className="font-medium text-gray-900">
                    {employeeInfo.employee_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fiscal Year</p>
                  <p className="font-medium text-gray-900">
                    {employeeInfo.fiscal_year}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stat Cards ── */}
        {leaveBalances.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Remaining Leaves",
                value: totalRemainingLeaves.toFixed(2),
                color: "text-green-600",
                iconColor: "text-green-400",
              },
              {
                label: "Used Leaves",
                value: totalUsedLeaves,
                color: "text-blue-600",
                iconColor: "text-blue-400",
              },
              {
                label: "Pending Approval",
                value: totalPendingApproval,
                color: "text-yellow-600",
                iconColor: "text-yellow-400",
              },
            ].map(({ label, value, color, iconColor }) => (
              <div
                key={label}
                className="bg-white shadow-sm border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                  <Calendar className={`w-8 h-8 ${iconColor}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Leave Balance Table ── */}
        {leaveBalances.length > 0 && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-semibold text-gray-900">
                Leave Balance Details
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Leave Type",
                      "Total Allocated",
                      "Used",
                      "Pending Approval",
                      "Remaining",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
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
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {balance.total_allocated.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {balance.used}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-yellow-600 font-medium">
                        {balance.pending_approval}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                        {balance.remaining.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Leave History ── */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Leave History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  View all your leave applications and their status
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Filters</span>
                </button>
                <button
                  onClick={fetchAllData}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Filters Panel ── */}
          {showFilters && (
            <div className="border-b border-gray-200 px-4 sm:px-6 py-4 bg-gray-50">
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
                    <option value="">All Status</option>
                    <option value="Open">Open</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* From Date — custom calendar */}
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={setFromDate}
                />

                {/* To Date — custom calendar */}
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={setToDate}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* ── Table ── */}
          <div className="overflow-x-auto w-full">
            {leaves.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No leave requests found
                </h3>
                <p className="text-gray-500">
                  {statusFilter
                    ? "No leave applications match your current filters."
                    : "You haven't applied for any leaves yet."}
                </p>
              </div>
            ) : (
              <>
                <table className="w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Leave Type",
                        "Duration",
                        "Days",
                        "Status",
                        "Reason",
                        "Applied On",
                        "Approved By",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLeaves.map((leave) => (
                      <tr
                        key={leave.lantern360_leave_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLeaveTypeColor(leave.leave_type)}`}
                          >
                            {leave.leave_type}
                          </span>
                          {leave.half_day && (
                            <span className="ml-1 text-xs text-gray-500">
                              (Half)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          {formatDate(leave.from_date)}
                          {leave.from_date !== leave.to_date &&
                            ` – ${formatDate(leave.to_date)}`}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          {leave.total_days}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="truncate text-gray-900">
                            {leave.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          {formatDate(leave.applied_on)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-900">
                            {leave.approved_on ? leave.approver_name : "–"}
                          </div>
                          {leave.approved_on && (
                            <div className="text-xs text-gray-500">
                              {formatDate(leave.approved_on)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

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
                        {[5, 10, 20, 50].map((n) => (
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
      </div>
    </div>
  );
};

export default LeaveStatus;
