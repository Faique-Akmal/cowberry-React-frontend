import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import {
  Search,
  Filter,
  Calendar,
  Hash,
  Clock,
  LogIn,
  LogOut,
  Download,
  RefreshCw,
  Eye,
  Tag,
  ChevronUp,
  ChevronDown,
  Calendar1,
  MapPin,
  X,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import PageMeta from "../common/PageMeta";
import LoadingAnimation from "../../pages/UiElements/loadingAnimation";
import { useAttendanceStore } from "../../store/attendanceStore";

// Types remain the same as before
interface CheckLog {
  userId: number;
  fullName: string;
  employee_code: string;
  logType: "check_in" | "check_out";
  timestamp: string;
  latitude?: number;
  longitude?: number;
  location?: string | null;
  department?: string | null;
  zone?: string | null;
}

interface GroupedLog {
  userId: number;
  fullName: string;
  employee_code: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInTimestamp: string | null;
  checkOutTimestamp: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
}

interface LogDetail {
  fullName: string;
  employee_code: string;
  date: string;
  checkIn: {
    time: string | null;
    timestamp: string | null;
    latitude: number | null;
    longitude: number | null;
    location: string | null;
  };
  checkOut: {
    time: string | null;
    timestamp: string | null;
    latitude: number | null;
    longitude: number | null;
    location: string | null;
  };
}

// ============================================================
// SENTINEL CHECKOUT DETECTION
// ============================================================
// Your API sends a system-generated checkout timestamp whenever
// no real checkout happened. It always lands at local 23:59:59
// (formatted as "11:59:59 PM"). We check this against the RAW
// ISO timestamp — never against a formatted display string —
// because formatted strings vary with locale/spacing and are
// unreliable to compare.
const isSentinelCheckout = (timestamp: string | null | undefined): boolean => {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return false;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  return hours === 23 && minutes === 59 && seconds >= 59;
};

// Helper functions remain the same
const filterLogsByRole = (rawLogs: CheckLog[]): CheckLog[] => {
  const role = (localStorage.getItem("userRole") || "").trim().toLowerCase();

  if (role === "hr" || role === "admin") {
    return rawLogs;
  }

  if (role === "manager") {
    const myDepartment = localStorage.getItem("department");
    if (!myDepartment) return [];
    return rawLogs.filter(
      (log) =>
        (log.department || "").toLowerCase() === myDepartment.toLowerCase(),
    );
  }

  if (
    role === "zonal manager" ||
    role === "zonal_manager" ||
    role === "zonalmanager"
  ) {
    const myZone = localStorage.getItem("zone");
    if (!myZone) return [];
    return rawLogs.filter(
      (log) => (log.zone || "").toLowerCase() === myZone.toLowerCase(),
    );
  }

  return [];
};

const groupLogsByUserAndDate = (logs: CheckLog[]): GroupedLog[] => {
  const grouped = new Map<string, GroupedLog>();

  logs.forEach((log) => {
    const date = new Date(log.timestamp).toDateString();
    const key = `${log.userId}-${date}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        userId: log.userId,
        fullName: log.fullName,
        employee_code: log.employee_code,
        date: date,
        checkInTime: null,
        checkOutTime: null,
        checkInTimestamp: null,
        checkOutTimestamp: null,
        checkInLatitude: null,
        checkInLongitude: null,
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkInLocation: null,
        checkOutLocation: null,
      });
    }

    const entry = grouped.get(key)!;
    if (log.logType === "check_in") {
      entry.checkInTime = formatTime(log.timestamp);
      entry.checkInTimestamp = log.timestamp;
      entry.checkInLatitude = log.latitude || null;
      entry.checkInLongitude = log.longitude || null;
      entry.checkInLocation = log.location || null;
    } else {
      // If this is the system-generated 11:59:59 PM sentinel,
      // don't show a display time at all — leave checkOutTime null.
      // We still keep checkOutTimestamp (raw) so status/working-hours
      // logic downstream knows a "missing checkout" situation exists.
      const sentinel = isSentinelCheckout(log.timestamp);
      entry.checkOutTime = sentinel ? null : formatTime(log.timestamp);
      entry.checkOutTimestamp = log.timestamp;
      entry.checkOutLatitude = log.latitude || null;
      entry.checkOutLongitude = log.longitude || null;
      entry.checkOutLocation = log.location || null;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const dateA = new Date(a.checkInTimestamp || a.checkOutTimestamp || 0);
    const dateB = new Date(b.checkInTimestamp || b.checkOutTimestamp || 0);
    return dateB.getTime() - dateA.getTime();
  });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const EmployeeCheckin = () => {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();

  // Use Zustand store
  const { logs, isLoading, fetchLogs, getFilteredLogs } = useAttendanceStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"fullName" | "employee_code">(
    "fullName",
  );
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [startDate, endDate] = dateRange;
  const [filteredLogs, setFilteredLogs] = useState<GroupedLog[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLogDetail, setSelectedLogDetail] = useState<LogDetail | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate working hours and status
  const calculateStatus = useCallback((log: GroupedLog): string => {
    // If no check-in and no check-out, mark as Absent
    if (!log.checkInTimestamp && !log.checkOutTimestamp) {
      return "Absent";
    }

    // If no check-in, mark as Absent
    if (!log.checkInTimestamp) {
      return "Absent";
    }

    // System-generated sentinel checkout (11:59:59 PM) = no real checkout
    if (log.checkOutTimestamp && isSentinelCheckout(log.checkOutTimestamp)) {
      return "Checkout Missing";
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the date of the log entry
    const logDate = new Date(log.checkInTimestamp);
    logDate.setHours(0, 0, 0, 0);

    // Check if this is today's log
    const isToday = today.getTime() === logDate.getTime();

    // If no check-out and it's today, show "Active"
    if (!log.checkOutTimestamp && isToday) {
      return "Active";
    }

    // If no check-out and it's NOT today, show "Checkout Missing"
    if (!log.checkOutTimestamp && !isToday) {
      return "Checkout Missing";
    }

    // If both check-in and check-out exist, calculate working hours
    const checkIn = new Date(log.checkInTimestamp);
    const checkOut = new Date(log.checkOutTimestamp!);

    const workingHours =
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    // Working hours logic
    if (workingHours > 8.5) {
      return "Present";
    } else if (workingHours > 4 && workingHours < 8.5) {
      return "Half Day";
    } else if (workingHours > 0 && workingHours < 4) {
      return "Absent";
    } else {
      return "Unknown";
    }
  }, []);

  const calculateWorkingHours = useCallback((log: GroupedLog): string => {
    if (log.checkInTimestamp && log.checkOutTimestamp) {
      // Sentinel checkout (11:59:59 PM) — no real checkout happened,
      // so working hours can't be calculated.
      if (isSentinelCheckout(log.checkOutTimestamp)) {
        return "N/A";
      }

      const checkIn = new Date(log.checkInTimestamp);
      const checkOut = new Date(log.checkOutTimestamp);
      const diffMs = checkOut.getTime() - checkIn.getTime();

      if (diffMs < 0) return "N/A";

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min`;
      } else if (hours > 0) {
        return `${hours} hr${hours > 1 ? "s" : ""}`;
      } else {
        return `${minutes} min`;
      }
    }

    return "N/A";
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200";
      case "Short Day":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
      case "Half Day":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200";
      case "Checkout Missing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
      case "Active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
      case "Absent":
        return "bg-red-800 text-white dark:bg-gray-900/30 dark:text-gray-400 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200";
    }
  }, []);

  const getStatusIcon = useCallback((status: string): string => {
    switch (status) {
      case "Present":
        return "✅";
      case "Short Day":
        return "📉";
      case "Half Day":
        return "🌓";
      case "Checkout Missing":
        return "⚠️";
      case "Active":
        return "🟢";
      case "Absent":
        return "❌";
      default:
        return "❓";
    }
  }, []);

  const handleRowClick = (log: GroupedLog) => {
    const detail: LogDetail = {
      fullName: log.fullName,
      employee_code: log.employee_code,
      date: log.date,
      checkIn: {
        time: log.checkInTime,
        timestamp: log.checkInTimestamp,
        latitude: log.checkInLatitude || null,
        longitude: log.checkInLongitude || null,
        location: log.checkInLocation || null,
      },
      checkOut: {
        // checkOutTime is already null here if it was the sentinel value —
        // set at the grouping stage — so nothing extra needed.
        time: log.checkOutTime,
        timestamp: log.checkOutTimestamp,
        latitude: log.checkOutLatitude || null,
        longitude: log.checkOutLongitude || null,
        location: log.checkOutLocation || null,
      },
    };
    setSelectedLogDetail(detail);
    setShowDetailModal(true);
  };

  const openGoogleMaps = (
    latitude: number | null,
    longitude: number | null,
  ) => {
    if (latitude === null || longitude === null) {
      alert("Location coordinates not available for this entry");
      return;
    }
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedLogDetail(null);
  };

  // Fetch logs on mount (with cache)
  useEffect(() => {
    fetchLogs(); // This will use cache if available
  }, [fetchLogs]);

  // Handle refresh with force refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchLogs(true); // Force refresh
    setIsRefreshing(false);
  }, [fetchLogs]);

  // Pure client-side filtering
  useEffect(() => {
    const filters: any = {};

    if (searchQuery.trim()) {
      filters.searchQuery = searchQuery;
      filters.searchType = searchType;
    }

    if (startDate) {
      filters.startDate = startDate;
    }

    if (endDate) {
      filters.endDate = endDate;
    }

    const roleFilteredLogs = filterLogsByRole(logs);
    const filtered =
      Object.keys(filters).length > 0
        ? getFilteredLogs(filters)
        : roleFilteredLogs;

    setFilteredLogs(groupLogsByUserAndDate(filtered));
  }, [logs, searchQuery, searchType, startDate, endDate, getFilteredLogs]);

  const uniqueUsersCount = useMemo(() => {
    return new Set(logs.map((log) => log.userId)).size;
  }, [logs]);

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange([null, null]);
    setSearchType("fullName");
  };

  const handleSearch = () => {
    // Filtering is already reactive
  };

  // Export to Excel (unchanged except using filteredLogs)
  const exportToExcel = async () => {
    try {
      if (filteredLogs.length === 0) {
        alert("No data to export for the current filters.");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Attendance System";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Attendance Report", {
        properties: { tabColor: { argb: "FF1E90FF" } },
        pageSetup: {
          orientation: "landscape",
          fitToPage: true,
          margins: {
            left: 0.7,
            right: 0.7,
            top: 0.7,
            bottom: 0.7,
            header: 0.3,
            footer: 0.3,
          },
        },
      });

      worksheet.columns = [
        { header: "S.No", key: "sno", width: 8 },
        { header: "Full Name", key: "fullName", width: 25 },
        { header: "Employee Code", key: "employeeCode", width: 18 },
        { header: "Date", key: "date", width: 18 },
        { header: "Check-in Time", key: "checkIn", width: 18 },
        { header: "Check-out Time", key: "checkOut", width: 18 },
        { header: "Working Hours", key: "workingHours", width: 16 },
        { header: "Status", key: "status", width: 22 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E90FF" },
        };
        cell.font = {
          name: "Calibri",
          size: 12,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF2E8B57" } },
          left: { style: "thin", color: { argb: "FF2E8B57" } },
          bottom: { style: "medium", color: { argb: "FF2E8B57" } },
          right: { style: "thin", color: { argb: "FF2E8B57" } },
        };
      });

      filteredLogs.forEach((log, index) => {
        const status = calculateStatus(log);
        const workingHours = calculateWorkingHours(log);
        const rowNumber = index + 2;

        // checkOutTime is already null when it's the sentinel value,
        // so this naturally falls back to "N/A" — no extra check needed.
        const row = worksheet.addRow({
          sno: index + 1,
          fullName: log.fullName,
          employeeCode: log.employee_code,
          date: log.date,
          checkIn: log.checkInTime || "N/A",
          checkOut: log.checkOutTime || "N/A",
          workingHours: workingHours,
          status: status,
        });

        row.height = 25;
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFC0C0C0" } },
            left: { style: "thin", color: { argb: "FFC0C0C0" } },
            bottom: { style: "thin", color: { argb: "FFC0C0C0" } },
            right: { style: "thin", color: { argb: "FFC0C0C0" } },
          };

          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 1 ? "center" : "left",
            wrapText: true,
          };

          cell.font = {
            name: "Calibri",
            size: 11,
            color: { argb: "FF000000" },
          };

          if (colNumber === 8) {
            const statusValue = cell.value?.toString() || "";
            let color = "FFFFFFFF";

            if (statusValue === "Present") {
              color = "FF90EE90";
            } else if (statusValue === "Short Day") {
              color = "FFFFA500";
            } else if (statusValue === "Half Day") {
              color = "FFFFFF00";
            } else if (statusValue === "Checkout Missing") {
              color = "FFFFA500";
            } else if (statusValue === "Active") {
              color = "FF87CEEB";
            } else if (statusValue === "Absent") {
              color = "FFFF0000";
            }

            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: color },
            };
          }

          if (rowNumber % 2 === 0 && colNumber !== 8) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0F8FF" },
            };
          }
        });
      });

      worksheet.autoFilter = {
        from: "A1",
        to: `H${filteredLogs.length + 1}`,
      };

      worksheet.views = [
        {
          state: "frozen",
          ySplit: 1,
        },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `attendance_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  return (
    <div
      className="
        w-full
        max-w-[100vw]
        h-screen
        overflow-hidden
        bg-gradient-to-br from-white/10 via-white/5 to-white/2
        dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-900/5
        backdrop-blur-2xl
        border border-white/30 dark:border-white/10
        shadow-[0_8px_32px_rgba(31,38,135,0.15)]
        dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]
        rounded-3xl 
        p-3 sm:p-4 lg:p-6
        relative
        flex flex-col
      "
    >
      <PageMeta
        title="employee checkin page"
        description="employee checkin & checkout logs page"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

      {/* Header - Fixed */}
      <div className="flex-shrink-0 relative z-10">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <h1 className="text-lg font-bold">Employee Attendance Logs</h1>
                <p className="text-gray-600 dark:text-gray-300 text-xs hidden md:block">
                  Monitor employee check-in and check-out activities with status
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => (window.location.href = "/attandance-calendar")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5
        bg-lantern-blue-600 hover:bg-lantern-yellow-400
        text-white rounded-lg text-sm"
              >
                <Calendar1 className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={exportToExcel}
                disabled={isLoading || filteredLogs.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5
        bg-lantern-blue-600 hover:bg-lantern-yellow-400
        text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5
        bg-lantern-blue-600 text-white rounded-lg hover:bg-cyan-700 text-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading || isRefreshing ? "animate-spin" : ""}`}
                />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5
        bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg
        border border-white/50 dark:border-gray-700/50 rounded-lg text-sm
        font-medium text-gray-700 dark:text-gray-300"
              >
                {showFilters ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Filters</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end"></div>
          {showFilters && (
            <>
              <div
                className="
              bg-gradient-to-br from-white/40 to-white/20
              dark:from-gray-800/40 dark:to-gray-900/20
              backdrop-blur-xl
              border border-white/40 dark:border-gray-700/40
              rounded-xl sm:rounded-2xl p-3 sm:p-4
              shadow-[0_8px_32px_rgba(31,38,135,0.1)]
              dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
              mb-2
            "
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="
                    p-1.5 rounded-lg flex-shrink-0
                    bg-gradient-to-br from-blue-500/10 to-cyan-500/10
                    border border-blue-500/20
                  "
                    >
                      <Filter className="w-4 h-4 text-blue-500" />
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      Filters
                    </h2>
                  </div>

                  <button
                    onClick={clearFilters}
                    className="
                  px-3 py-1.5
                  bg-gradient-to-r from-gray-200/50 to-gray-300/30
                  dark:from-gray-700/50 dark:to-gray-800/30
                  backdrop-blur-sm
                  border border-gray-300/60 dark:border-gray-600/60
                  text-gray-700 dark:text-gray-300
                  rounded-lg
                  hover:from-gray-300/60 hover:to-gray-400/40
                  dark:hover:from-gray-600/60 dark:hover:to-gray-700/40
                  transition-all duration-300
                  shadow-sm hover:shadow
                  text-xs sm:text-sm
                "
                  >
                    Clear
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <div
                        className="
                      absolute left-2.5 top-1/2 transform -translate-y-1/2
                      p-1 rounded-md
                      bg-white/50 dark:bg-gray-700/50
                      backdrop-blur-sm
                      z-10
                    "
                      >
                        <Search className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        placeholder={`Search by ${searchType === "fullName" ? "fullName" : "employee code"}`}
                        className="
                      w-full pl-9 pr-24 py-2
                      bg-white/50 dark:bg-gray-700/50
                      backdrop-blur-sm
                      border border-white/60 dark:border-gray-600/60
                      rounded-lg
                      focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                      focus:outline-none
                      transition-all duration-300
                      text-sm
                    "
                      />
                      <select
                        value={searchType}
                        onChange={(e) =>
                          setSearchType(
                            e.target.value as "fullName" | "employee_code",
                          )
                        }
                        className="
                      absolute right-1 top-1/2 transform -translate-y-1/2
                      px-2 py-1
                      bg-white/50 dark:bg-gray-700/50
                      backdrop-blur-sm
                      border border-white/60 dark:border-gray-600/60
                      rounded-lg
                      focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                      focus:outline-none
                      transition-all duration-300
                      text-xs
                      w-20
                    "
                      >
                        <option value="fullName">User</option>
                        <option value="employee_code">Emp ID</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 relative ">
                    <div className="relative">
                      <div
                        className="
                      absolute left-2.5 top-1/2 transform -translate-y-1/2
                      p-1 rounded-md
                      bg-white/50 dark:bg-gray-700/50
                      backdrop-blur-sm
                      z-30
                      pointer-events-none
                    "
                      >
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <DatePicker
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(update) => {
                          setDateRange(update);
                        }}
                        isClearable={true}
                        placeholderText="Date range"
                        className="
                      w-full pl-9 pr-3 py-2
                      bg-white/50 dark:bg-gray-700/50
                      backdrop-blur-sm
                      border border-white/60 dark:border-gray-600/60
                      rounded-lg
                      focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                      focus:outline-none
                      transition-all duration-300
                      text-sm
                      relative
                      z-20
                    "
                        withPortal
                        portalId="datepicker-portal"
                        popperClassName="z-[9999]"
                        calendarClassName="z-[9999]"
                        popperPlacement="bottom-start"
                      />
                    </div>
                  </div>
                </div>

                {(searchQuery || startDate || endDate) && (
                  <div className="mt-3 p-2 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/40 dark:border-gray-700/40">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Tag className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Active Filters
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {searchQuery && (
                        <span
                          className="
                        inline-flex items-center gap-1 px-1.5 py-0.5
                        bg-gradient-to-r from-blue-100/80 to-cyan-100/60
                        dark:from-blue-900/40 dark:to-cyan-900/30
                        backdrop-blur-sm
                        border border-blue-200/60 dark:border-blue-700/40
                        text-blue-800 dark:text-blue-300
                        rounded text-xs
                        truncate max-w-[150px]
                      "
                        >
                          <span className="truncate">
                            {searchType === "fullName" ? "👤" : "🔢"}:{" "}
                            {searchQuery}
                          </span>
                          <button
                            onClick={() => setSearchQuery("")}
                            className="
                          ml-0.5 p-0.5 rounded flex-shrink-0
                          hover:bg-blue-200/50 dark:hover:bg-blue-700/50
                          transition-colors text-[10px]
                        "
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {startDate && (
                        <span
                          className="
                        inline-flex items-center gap-1 px-1.5 py-0.5
                        bg-gradient-to-r from-green-100/80 to-emerald-100/60
                        dark:from-green-900/40 dark:to-emerald-900/30
                        backdrop-blur-sm
                        border border-green-200/60 dark:border-green-700/40
                        text-green-800 dark:text-green-300
                        rounded text-xs
                        truncate max-w-[120px]
                      "
                        >
                          <span className="truncate">
                            📅 {formatDate(startDate.toISOString())}
                          </span>
                          <button
                            onClick={() => setDateRange([null, endDate])}
                            className="
                          ml-0.5 p-0.5 rounded flex-shrink-0
                          hover:bg-green-200/50 dark:hover:bg-green-700/50
                          transition-colors text-[10px]
                        "
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {endDate && (
                        <span
                          className="
                        inline-flex items-center gap-1 px-1.5 py-0.5
                        bg-gradient-to-r from-purple-100/80 to-pink-100/60
                        dark:from-purple-900/40 dark:to-pink-900/30
                        backdrop-blur-sm
                        border border-purple-200/60 dark:border-purple-700/40
                        text-purple-800 dark:text-purple-300
                        rounded text-xs
                        truncate max-w-[100px]
                      "
                        >
                          <span className="truncate">
                            → {formatDate(endDate.toISOString())}
                          </span>
                          <button
                            onClick={() => setDateRange([startDate, null])}
                            className="
                          ml-0.5 p-0.5 rounded flex-shrink-0
                          hover:bg-purple-200/50 dark:hover:bg-purple-700/50
                          transition-colors text-[10px]
                        "
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Section - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          className="
            flex-1
            bg-gradient-to-br from-white/40 to-white/20
            dark:from-gray-800/40 dark:to-gray-900/20
            backdrop-blur-xl
            border border-white/40 dark:border-gray-700/40
            rounded-xl sm:rounded-2xl
            shadow-[0_8px_32px_rgba(31,38,135,0.1)]
            dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
            overflow-hidden
            flex flex-col
          "
        >
          {isLoading ? (
            <div className="p-6 text-center">
              <LoadingAnimation />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Loading attendance logs...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This runs once — after that, filtering and export are instant.
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-6 text-center">
              <div
                className="
                  w-12 h-12 mx-auto mb-2
                  bg-gradient-to-br from-gray-200/50 to-gray-300/30
                  dark:from-gray-700/50 dark:to-gray-800/30
                  backdrop-blur-sm
                  border border-gray-300/60 dark:border-gray-600/60
                  rounded-xl flex items-center justify-center
                "
              >
                <Eye className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No logs found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <>
              {/* Table Section - Scrollable */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div
                  className="
      flex-1
      bg-gradient-to-br from-white/40 to-white/20
      dark:from-gray-800/40 dark:to-gray-900/20
      backdrop-blur-xl
      border border-white/40 dark:border-gray-700/40
      rounded-xl sm:rounded-2xl
      shadow-[0_8px_32px_rgba(31,38,135,0.1)]
      dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
      overflow-hidden
      flex flex-col
    "
                >
                  <div
                    className="
        flex-shrink-0
        p-3 sm:p-4
        border-b border-white/30 dark:border-gray-700/30
        bg-gradient-to-r from-white/50 to-transparent
        dark:from-gray-800/50 dark:to-transparent
      "
                  ></div>

                  {isLoading ? (
                    <div className="p-6 text-center flex-1 flex items-center justify-center">
                      <div>
                        <LoadingAnimation />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Loading attendance logs...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          This runs once — after that, filtering and export are
                          instant.
                        </p>
                      </div>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="p-6 text-center flex-1 flex items-center justify-center">
                      <div>
                        <div
                          className="
              w-12 h-12 mx-auto mb-2
              bg-gradient-to-br from-gray-200/50 to-gray-300/30
              dark:from-gray-700/50 dark:to-gray-800/30
              backdrop-blur-sm
              border border-gray-300/60 dark:border-gray-600/60
              rounded-xl flex items-center justify-center
            "
                        >
                          <Eye className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          No logs found
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Try adjusting your filters or check back later
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto">
                        <div className="min-w-[640px] sm:min-w-0">
                          <table className="w-full table-auto border-collapse">
                            <thead
                              className="
                  sticky top-0 z-10
                  bg-gradient-to-r from-white/95 to-white/90
                  dark:from-gray-800/95 dark:to-gray-900/90
                  backdrop-blur-md
                  shadow-[0_2px_4px_rgba(0,0,0,0.05)]
                "
                            >
                              <tr>
                                {[
                                  {
                                    key: "fullName",
                                    label: "Full Name",
                                    className: "w-[180px] sm:w-auto",
                                  },
                                  {
                                    key: "employee_code",
                                    label: "Employee Code",
                                    className: "w-[120px] sm:w-auto",
                                  },
                                  {
                                    key: "date",
                                    label: "Date",
                                    className: "w-[100px] sm:w-auto",
                                  },
                                  {
                                    key: "check_in",
                                    label: "Check-in",
                                    className: "w-[80px] sm:w-auto",
                                  },
                                  {
                                    key: "check_out",
                                    label: "Check-out",
                                    className: "w-[80px] sm:w-auto",
                                  },
                                  {
                                    key: "working_hours",
                                    label: "Working Hours",
                                    className: "w-[100px] sm:w-auto",
                                  },
                                  {
                                    key: "status",
                                    label: "Status",
                                    className: "w-[150px] sm:w-auto",
                                  },
                                ].map((header, idx) => (
                                  <th
                                    key={`${header.key}-${idx}`}
                                    className={`
                        px-2 sm:px-3 py-3 text-left text-xs font-semibold
                        text-gray-600 dark:text-gray-300
                        uppercase tracking-wider
                        border-b-2 border-white/30 dark:border-gray-700/30
                        backdrop-blur-sm
                        whitespace-nowrap
                        ${header.className}
                      `}
                                  >
                                    {header.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20 dark:divide-gray-700/20">
                              {filteredLogs.map((log, index) => {
                                const status = calculateStatus(log);
                                const workingHours = calculateWorkingHours(log);
                                const statusColor = getStatusColor(status);
                                const statusIcon = getStatusIcon(status);

                                return (
                                  <tr
                                    key={`${log.userId}-${log.date}-${index}`}
                                    onClick={() => handleRowClick(log)}
                                    className="
                        hover:bg-white/30 dark:hover:bg-gray-800/30
                        transition-all duration-300
                        backdrop-blur-sm
                        cursor-pointer
                      "
                                  >
                                    <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="
                              w-6 h-6 sm:w-8 sm:h-8 rounded-lg
                              bg-gradient-to-br from-blue-500/20 to-cyan-500/20
                              border border-blue-500/30
                              flex items-center justify-center
                              backdrop-blur-sm
                              flex-shrink-0
                            "
                                        >
                                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                            {log.fullName
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                          {log.fullName}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">
                                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                        <span className="text-xs sm:text-sm truncate">
                                          {log.employee_code}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">
                                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                        <div
                                          className="
                              p-1 rounded-md
                              bg-gradient-to-br from-yellow-100/50 to-orange-100/30
                              dark:from-yellow-900/30 dark:to-orange-900/20
                              backdrop-blur-sm
                            "
                                        >
                                          <Calendar className="w-3 h-3" />
                                        </div>
                                        <span className="text-xs truncate">
                                          {formatDate(
                                            log.checkInTimestamp ||
                                              log.checkOutTimestamp ||
                                              "",
                                          )}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">
                                      {log.checkInTime ? (
                                        <div className="flex items-center gap-1.5">
                                          <div
                                            className="
                                p-1 rounded-md
                                bg-gradient-to-br from-green-100/50 to-emerald-100/30
                                dark:from-green-900/30 dark:to-emerald-900/20
                                backdrop-blur-sm
                              "
                                          >
                                            <LogIn className="w-3 h-3 text-green-600 dark:text-green-400" />
                                          </div>
                                          <span className="text-xs font-medium text-green-700 dark:text-green-400 truncate">
                                            {log.checkInTime}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">
                                      {/* log.checkOutTime is already null when it's the
                                          11:59:59 PM sentinel, thanks to groupLogsByUserAndDate.
                                          So this falls through to N/A automatically —
                                          the raw sentinel value is never shown. */}
                                      {log.checkOutTime ? (
                                        <div className="flex items-center gap-1.5">
                                          <div
                                            className="
                                p-1 rounded-md
                                bg-gradient-to-br from-red-100/50 to-pink-100/30
                                dark:from-red-900/30 dark:to-pink-900/20
                                backdrop-blur-sm
                              "
                                          >
                                            <LogOut className="w-3 h-3 text-red-600 dark:text-red-400" />
                                          </div>
                                          <span className="text-xs font-medium text-red-700 dark:text-red-400 truncate">
                                            {log.checkOutTime}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">
                                      {workingHours !== "N/A" ? (
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                          {workingHours}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">
                                      <span
                                        className={`
                            px-2 py-1 rounded-lg text-xs font-medium
                            backdrop-blur-sm border inline-flex items-center gap-1
                            ${statusColor}
                          `}
                                      >
                                        <span>{statusIcon}</span>
                                        <span>{status}</span>
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLogDetail && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={closeModal}
          />

          <div
            className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-2xl bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-900/90 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/30 dark:border-gray-700/30 bg-lantern-blue-600 dark:bg-gray-800/80 backdrop-blur-sm rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-white dark:text-gray-200">
                  Attendance Details
                </h3>
                <p className="text-sm text-white dark:text-gray-400">
                  {selectedLogDetail.fullName} •{" "}
                  {selectedLogDetail.employee_code}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg bg-black hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <X className="w-5 h-5 text-white dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedLogDetail.date)}</span>
              </div>

              {/* Check-in Details */}
              <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-4 border border-green-200/50 dark:border-green-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-800 dark:text-green-300">
                      Check-in
                    </h4>
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400">
                    {selectedLogDetail.checkIn.time || "N/A"}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {selectedLogDetail.checkIn.latitude &&
                      selectedLogDetail.checkIn.longitude ? (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            Lat: {selectedLogDetail.checkIn.latitude.toFixed(6)}
                            , Lng:{" "}
                            {selectedLogDetail.checkIn.longitude.toFixed(6)}
                          </span>
                          <button
                            onClick={() =>
                              openGoogleMaps(
                                selectedLogDetail.checkIn.latitude,
                                selectedLogDetail.checkIn.longitude,
                              )
                            }
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            Open in Maps
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          No location data
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedLogDetail.checkIn.location && (
                    <div className="text-gray-600 dark:text-gray-400 text-xs pl-6">
                      📍 {selectedLogDetail.checkIn.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Check-out Details */}
              <div className="bg-gradient-to-r from-red-50/50 to-pink-50/30 dark:from-red-900/20 dark:to-pink-900/10 rounded-xl p-4 border border-red-200/50 dark:border-red-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <h4 className="font-semibold text-red-800 dark:text-red-300">
                      Check-out
                    </h4>
                  </div>
                  {/* selectedLogDetail.checkOut.time is already null when it's the
                      11:59:59 PM sentinel — nothing renders here in that case. */}
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {selectedLogDetail.checkOut.time || ""}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {selectedLogDetail.checkOut.latitude &&
                      selectedLogDetail.checkOut.longitude ? (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            Lat:{" "}
                            {selectedLogDetail.checkOut.latitude.toFixed(6)},
                            Lng:{" "}
                            {selectedLogDetail.checkOut.longitude.toFixed(6)}
                          </span>
                          <button
                            onClick={() =>
                              openGoogleMaps(
                                selectedLogDetail.checkOut.latitude,
                                selectedLogDetail.checkOut.longitude,
                              )
                            }
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            Open in Maps
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          No location data
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedLogDetail.checkOut.location && (
                    <div className="text-gray-600 dark:text-gray-400 text-xs pl-6">
                      📍 {selectedLogDetail.checkOut.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Summary */}
              {(() => {
                const tempLog: GroupedLog = {
                  userId: 0,
                  fullName: selectedLogDetail.fullName,
                  employee_code: selectedLogDetail.employee_code,
                  date: selectedLogDetail.date,
                  checkInTime: selectedLogDetail.checkIn.time,
                  checkOutTime: selectedLogDetail.checkOut.time,
                  checkInTimestamp: selectedLogDetail.checkIn.timestamp,
                  checkOutTimestamp: selectedLogDetail.checkOut.timestamp,
                };
                const status = calculateStatus(tempLog);
                const workingHours = calculateWorkingHours(tempLog);
                const statusColor = getStatusColor(status);
                const statusIcon = getStatusIcon(status);

                return (
                  <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                          Attendance Summary
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColor}`}
                        >
                          {statusIcon} {status}
                        </span>
                        {workingHours !== "N/A" && (
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {workingHours}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 p-4 border-t border-white/30 dark:border-gray-700/30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-b-2xl">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-200/80 hover:bg-gray-300/80 dark:bg-gray-700/80 dark:hover:bg-gray-600/80 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeCheckin;
