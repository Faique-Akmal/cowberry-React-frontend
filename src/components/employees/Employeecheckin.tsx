import React, { useEffect, useState, useCallback, useRef } from "react";
import API from "../../api/axios";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import {
  Search,
  Filter,
  Calendar,
  User,
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

import PageMeta from "../common/PageMeta";
import LoadingAnimation from "../../pages/UiElements/loadingAnimation";

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
  // NOTE: your sample API response didn't include this field yet.
  // Add "zone" to your backend's check-logs response for zonal managers to work.
  zone?: string | null;
}

interface CheckLogsResponse {
  success: boolean;
  total: number;
  data: CheckLog[];
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
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

// ---- Role-based visibility ----
// hr / admin        -> see every log
// manager           -> see logs where log.department === current user's department
// zonal manager     -> see logs where log.zone === current user's zone
// anything else     -> sees nothing (default-deny, safer than leaking data)
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
    // If your localStorage key for zone is named differently, change it here.
    const myZone = localStorage.getItem("zone");
    if (!myZone) return [];
    return rawLogs.filter(
      (log) => (log.zone || "").toLowerCase() === myZone.toLowerCase(),
    );
  }

  // Unknown/unhandled role -> show nothing rather than risk leaking data.
  return [];
};

const EmployeeCheckin = () => {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<CheckLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLogDetail, setSelectedLogDetail] = useState<LogDetail | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const itemsPerPage = 20;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchCheckLogs = useCallback(
    async (page = 1, append = false) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await API.get<CheckLogsResponse>("/admin/check-logs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page,
            limit: itemsPerPage,
          },
        });

        if (response.data.success) {
          // Apply role-based visibility BEFORE anything else touches the data,
          // so grouping / search / date filter / CSV export all inherit it.
          const roleScopedLogs = filterLogsByRole(response.data.data);

          const sortedLogs = roleScopedLogs.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );

          let nextLogs: CheckLog[];
          if (append) {
            nextLogs = [...logs, ...sortedLogs];
            setLogs(nextLogs);
          } else {
            nextLogs = sortedLogs;
            setLogs(nextLogs);
          }

          const responseHasMore =
            response.data.hasMore ||
            (response.data.totalPages && page < response.data.totalPages) ||
            response.data.data.length === itemsPerPage;

          setHasMore(responseHasMore);
          setCurrentPage(page);

          const grouped = groupLogsByUserAndDate(nextLogs);
          setFilteredLogs(grouped);
        }
      } catch (error) {
        console.error("Error fetching check logs:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [logs],
  );

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
        entry.checkOutTime = formatTime(log.timestamp);
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

  useEffect(() => {
    fetchCheckLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadMore();
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, hasMore]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCheckLogs(currentPage + 1, true);
    }
  };

  useEffect(() => {
    // `logs` already only contains what the current user's role is allowed to see
    // (filtering happens once, in fetchCheckLogs), so we just group + apply
    // the UI-level search / date filters here.
    let result = groupLogsByUserAndDate(logs);

    if (searchQuery.trim()) {
      result = result.filter((log) => {
        if (searchType === "fullName") {
          return log.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          return log.employee_code
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        }
      });
    }

    if (startDate && endDate) {
      result = result.filter((log) => {
        const logDate = new Date(
          log.checkInTimestamp || log.checkOutTimestamp || "",
        );
        return logDate >= startDate && logDate <= endDate;
      });
    } else if (startDate) {
      result = result.filter((log) => {
        const logDate = new Date(
          log.checkInTimestamp || log.checkOutTimestamp || "",
        );
        return logDate >= startDate;
      });
    } else if (endDate) {
      result = result.filter((log) => {
        const logDate = new Date(
          log.checkInTimestamp || log.checkOutTimestamp || "",
        );
        return logDate <= endDate;
      });
    }

    setFilteredLogs(result);
  }, [logs, searchQuery, searchType, startDate, endDate]);

  const uniqueUsersCount = new Set(logs.map((log) => log.userId)).size;

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

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange([null, null]);
    setSearchType("fullName");
    fetchCheckLogs(1);
  };

  const handleSearch = () => {
    fetchCheckLogs(1);
  };

  const exportToCSV = () => {
    const headers = [
      "fullName",
      "Employee Code",
      "Date",
      "Check-in Time",
      "Check-out Time",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [
          `"${log.fullName}"`,
          `"${log.employee_code}"`,
          `"${log.date}"`,
          `"${log.checkInTime || "N/A"}"`,
          `"${log.checkOutTime || "N/A"}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `check_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
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
        description="employee checkin & checkout logs page  "
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

      {/* Header - Fixed */}
      <div className="flex-shrink-0 relative z-10">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <h1 className="text-lg font-bold">Employee Check Logs</h1>
                <p className="text-gray-600 dark:text-gray-300 text-xs hidden md:block">
                  Monitor employee check-in and check-out activities
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
                onClick={exportToCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5
        bg-lantern-blue-600 hover:bg-lantern-yellow-400
        text-white rounded-lg text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              <button
                onClick={() => fetchCheckLogs(1)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5
        bg-lantern-blue-600 text-white rounded-lg hover:bg-cyan-700 text-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
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
                          if (update[0] && update[1]) {
                            setTimeout(() => handleSearch(), 100);
                          }
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
                            onClick={() => {
                              setDateRange([null, endDate]);
                              handleSearch();
                            }}
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
                            onClick={() => {
                              setDateRange([startDate, null]);
                              handleSearch();
                            }}
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
          <div
            className="
              flex-shrink-0
              p-3 sm:p-4
              border-b border-white/30 dark:border-gray-700/30
              bg-gradient-to-r from-white/50 to-transparent
              dark:from-gray-800/50 dark:to-transparent
            "
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent truncate">
                  Employee Logs
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  Showing {filteredLogs.length} logs • Page {currentPage} •{" "}
                  {hasMore ? "Scroll to load more" : "All logs loaded"} • Click
                  any row to view details
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="
                    px-2 py-1
                    bg-white/50 dark:bg-gray-700/50
                    backdrop-blur-sm
                    border border-white/60 dark:border-gray-600/60
                    rounded-md
                    text-xs text-gray-700 dark:text-gray-300
                    whitespace-nowrap
                  "
                >
                  {filteredLogs.length} total
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <LoadingAnimation />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Loading check logs...
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
              <div className="flex-1 overflow-auto">
                <div className="min-w-[640px] sm:min-w-0">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead
                        className="
                          sticky top-0 z-10
                          bg-gradient-to-r from-white/60 to-white/40
                          dark:from-gray-800/60 dark:to-gray-900/40
                          backdrop-blur-md
                        "
                      >
                        <tr>
                          {[
                            {
                              key: "fullName",
                              label: "fullName",
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
                              key: "status",
                              label: "Status",
                              className: "w-[100px] sm:w-auto",
                            },
                          ].map((header, idx) => (
                            <th
                              key={`${header.key}-${idx}`}
                              className={`
                                px-2 sm:px-3 py-2 text-left text-xs font-semibold
                                text-gray-600 dark:text-gray-300
                                uppercase tracking-wider
                                border-b border-white/30 dark:border-gray-700/30
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
                        {filteredLogs.map((log, index) => (
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
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
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
                                    {log.fullName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                  {log.fullName}
                                </span>
                              </div>
                            </td>

                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                <div
                                  className="
                                    p-1 rounded-md
                                    bg-gradient-to-br from-gray-100/50 to-gray-200/30
                                    dark:from-gray-700/50 dark:to-gray-800/30
                                    backdrop-blur-sm
                                  "
                                >
                                  <Hash className="w-3 h-3" />
                                </div>
                                <span className="text-xs sm:text-sm truncate">
                                  {log.employee_code}
                                </span>
                              </div>
                            </td>

                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
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

                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                              {log.checkInTime ? (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="
                                      p-1 rounded-md
                                      bg-gradient-to-br from-green-100/50 to-emerald-100/30
                                      dark:from-green-900/30 dark:to-emerald-900/20
                                      backdrop-blur-sm
                                    "
                                  ></div>
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

                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                              {log.checkOutTime ? (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="
                                      p-1 rounded-md
                                      bg-gradient-to-br from-red-100/50 to-pink-100/30
                                      dark:from-red-900/30 dark:to-pink-900/20
                                      backdrop-blur-sm
                                    "
                                  ></div>
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

                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                              <span
                                className={`
                                  px-2 py-1 rounded-lg text-xs font-medium
                                  backdrop-blur-sm border inline-block truncate
                                  ${
                                    log.checkInTime && log.checkOutTime
                                      ? "bg-gradient-to-r from-blue-100/60 to-cyan-100/40 border-blue-200/60 text-blue-800 dark:from-blue-900/40 dark:to-cyan-900/30 dark:border-blue-700/40 dark:text-blue-300"
                                      : log.checkInTime
                                        ? "bg-gradient-to-r from-green-100/60 to-emerald-100/40 border-green-200/60 text-green-800 dark:from-green-900/40 dark:to-emerald-900/30 dark:border-green-700/40 dark:text-green-300"
                                        : "bg-gradient-to-r from-yellow-100/60 to-amber-100/40 border-yellow-200/60 text-yellow-800 dark:from-yellow-900/40 dark:to-amber-900/30 dark:border-yellow-700/40 dark:text-yellow-300"
                                  }
                                `}
                              >
                                {log.checkInTime && log.checkOutTime
                                  ? "Complete"
                                  : log.checkInTime
                                    ? "Checked In"
                                    : "Checked Out"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {loadingMore && (
                <div className="flex-shrink-0 p-4 text-center border-t border-white/30 dark:border-gray-700/30">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      Loading more logs...
                    </span>
                  </div>
                </div>
              )}

              {hasMore && !loadingMore && (
                <div
                  ref={loadMoreRef}
                  className="flex-shrink-0 p-4 text-center border-t border-white/30 dark:border-gray-700/30"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Scroll down to load more
                  </span>
                </div>
              )}

              {!hasMore && filteredLogs.length > 0 && (
                <div className="flex-shrink-0 p-4 text-center border-t border-white/30 dark:border-gray-700/30">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    All logs loaded ({filteredLogs.length} total)
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal - Fixed at top center */}
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
                  Check Log Details
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
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {selectedLogDetail.checkOut.time || "N/A"}
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
