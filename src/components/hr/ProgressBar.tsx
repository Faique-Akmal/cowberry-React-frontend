// components/PerformanceOverview.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Calendar, Search, User, ChevronDown, RefreshCw } from "lucide-react";
import { useTravelSessionStore } from "../../store/useTravelSessionStore";
import { useAuthStore } from "../../store/authStore";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import type { TravelSession, UserListItem } from "../../types/travelSession";
import LoadingAnimation from "../../pages/UiElements/loadingAnimation";

type TimeFilter = "day" | "week" | "month" | "year";
type ChartType = "line" | "bar";
type StatusFilter = "all" | "approved" | "pending" | "rejected";

interface ChartDataPoint {
  date: string;
  distance: number;
  label: string;
  sessionCount: number;
}

// Helper function to convert meters to kilometers
const metersToKm = (meters: number): number => {
  return Math.round((meters / 1000) * 100) / 100;
};

// Helper to safely extract zone name from zone object or string
const extractZoneName = (zone: any): string => {
  if (!zone) return "";
  if (typeof zone === "string") return zone;
  if (typeof zone === "object") {
    return zone.name || zone.zoneId || zone.area || "";
  }
  return "";
};

// Helper to safely extract zone ID from zone object or string
const extractZoneId = (zone: any): string => {
  if (!zone) return "";
  if (typeof zone === "string") return zone;
  if (typeof zone === "object") {
    return zone.id?.toString() || zone.zoneId || "";
  }
  return "";
};

const PerformanceOverview: React.FC = () => {
  const {
    travelSessions,
    users,
    isLoadingSessions,
    loadAllSessions,
    refreshSessions,
    currentUserInfo,
    setCurrentUserInfo,
    lastUpdateTime,
  } = useTravelSessionStore();

  const { user } = useAuthStore();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Set current user info. Reads the flat localStorage keys
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedDepartment = localStorage.getItem("department");
    const storedArea =
      localStorage.getItem("allocatedArea") ||
      localStorage.getItem("allocatedarea");
    const storedZone = localStorage.getItem("zone");
    const storedZoneId = localStorage.getItem("zoneId");

    if (storedRole) {
      setCurrentUserInfo({
        userRole: storedRole,
        department: storedDepartment || undefined,
        allocatedArea: storedArea || undefined,
        zone: storedZone || undefined,
        zoneId: storedZoneId || undefined,
      });
      return;
    }

    // Fallback: Zustand auth store
    if (user) {
      setCurrentUserInfo({
        userRole: user.userRole,
        department: user.department,
        allocatedArea: user.allocatedarea,
        zone: (user as any).zone,
        zoneId: (user as any).zoneId,
      });
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUserInfo({
          userRole: parsedUser.userRole,
          department: parsedUser.department,
          allocatedArea: parsedUser.allocatedarea || parsedUser.allocatedArea,
          zone: parsedUser.zone,
          zoneId: parsedUser.zoneId,
        });
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, [user, setCurrentUserInfo]);

  // Load sessions on mount and when user changes
  useEffect(() => {
    if (currentUserInfo) {
      console.log("Loading sessions for user:", currentUserInfo);
      loadAllSessions();
    }
  }, [currentUserInfo, loadAllSessions]);

  // ✅ FIXED: Custom role-based user filtering with proper zone object handling
  const getFilteredUsers = useCallback((): UserListItem[] => {
    // Get unique users from travelSessions
    const uniqueUsersMap = new Map<number, UserListItem>();

    travelSessions.forEach((session) => {
      if (!uniqueUsersMap.has(session.userId)) {
        // Extract zone information properly - zone can be an object or string
        const sessionAny = session as any;
        const zoneObj = sessionAny.zone;

        // Extract zone name and ID from the zone object
        const zoneName = extractZoneName(zoneObj);
        const zoneId = extractZoneId(zoneObj);

        uniqueUsersMap.set(session.userId, {
          userId: session.userId,
          fullName: session.fullName,
          username: session.username,
          employeeCode: session.employeeCode,
          department: session.department || "Unknown",
          allocatedArea: session.allocatedArea || "Unknown",
          zone: zoneName || sessionAny.allocatedArea || "Unknown",
          zoneId: zoneId || sessionAny.zoneId?.toString() || undefined,
          // Store the full zone object for debugging
          zoneObject: zoneObj,
        });
      }
    });

    let uniqueUsers = Array.from(uniqueUsersMap.values());

    // If no users from sessions, try using the store's users
    if (uniqueUsers.length === 0 && users.length > 0) {
      uniqueUsers = users.map((u) => {
        const uAny = u as any;
        const zoneObj = uAny.zone;
        return {
          ...u,
          zone: extractZoneName(zoneObj) || uAny.allocatedArea || "Unknown",
          zoneId: extractZoneId(zoneObj) || uAny.zoneId?.toString(),
          zoneObject: zoneObj,
        };
      });
    }

    // Log for debugging
    console.log("Current User Info:", currentUserInfo);
    console.log("Total Sessions:", travelSessions.length);
    console.log("Unique Users before filtering:", uniqueUsers.length);
    if (uniqueUsers.length > 0) {
      console.log("Sample user (first):", {
        ...uniqueUsers[0],
        zoneObject: undefined, // Don't log the full object to keep console clean
      });
      console.log(
        "Sample user zone object:",
        (uniqueUsers[0] as any).zoneObject,
      );
    }

    // If no currentUserInfo, return all users
    if (!currentUserInfo) {
      return uniqueUsers;
    }

    const role = currentUserInfo.userRole?.toLowerCase().trim() || "";

    // Helper for safe string comparison
    const safeLowerCase = (value: any): string => {
      if (value === null || value === undefined) return "";
      return String(value).toLowerCase().trim();
    };

    // HR/Admin: Show all users
    if (role === "hr" || role === "admin" || role === "superadmin") {
      console.log("HR/Admin: Showing all users");
      return uniqueUsers;
    }

    // Manager: Show only users from their department
    if (role === "manager") {
      const managerDept = safeLowerCase(currentUserInfo.department);
      const filtered = uniqueUsers.filter(
        (user) => safeLowerCase(user.department) === managerDept,
      );
      console.log(
        `Manager: Showing ${filtered.length} users from department: ${currentUserInfo.department}`,
      );
      return filtered;
    }

    // Zonal Manager: Show only users from their zone
    if (
      role === "zonalmanager" ||
      role === "zonal_manager" ||
      role === "zonal head"
    ) {
      // Get all possible zone identifiers from the current user
      const managerZone = safeLowerCase(
        currentUserInfo.zone || currentUserInfo.allocatedArea,
      );
      const managerZoneId = safeLowerCase(currentUserInfo.zoneId);
      const managerDept = safeLowerCase(currentUserInfo.department);

      console.log(
        `Zonal Manager - Zone: "${managerZone}", ZoneId: "${managerZoneId}", Dept: "${managerDept}"`,
      );

      // Try multiple filtering strategies
      let filtered: UserListItem[] = [];

      // Strategy 1: Filter by zone name (extracted from zone object)
      if (managerZone) {
        filtered = uniqueUsers.filter((user) => {
          const userZone = safeLowerCase(user.zone);
          return userZone === managerZone;
        });
        console.log(`Strategy 1 (zone name): Found ${filtered.length} users`);

        // If no exact match, try partial match
        if (filtered.length === 0) {
          filtered = uniqueUsers.filter((user) => {
            const userZone = safeLowerCase(user.zone);
            return (
              userZone.includes(managerZone) || managerZone.includes(userZone)
            );
          });
          console.log(
            `Strategy 1b (zone name partial): Found ${filtered.length} users`,
          );
        }
      }

      // Strategy 2: If no users found, try by zoneId
      if (filtered.length === 0 && managerZoneId) {
        filtered = uniqueUsers.filter((user) => {
          const userZoneId = safeLowerCase(user.zoneId);
          return (
            userZoneId === managerZoneId || userZoneId.includes(managerZoneId)
          );
        });
        console.log(`Strategy 2 (zoneId): Found ${filtered.length} users`);
      }

      // Strategy 3: If still no users, try by department
      if (filtered.length === 0 && managerDept) {
        filtered = uniqueUsers.filter((user) => {
          const userDept = safeLowerCase(user.department);
          const userZone = safeLowerCase(user.zone);
          return userDept === managerDept || userZone === managerDept;
        });
        console.log(`Strategy 3 (department): Found ${filtered.length} users`);
      }

      // Strategy 4: If still no users, try by allocatedArea
      if (filtered.length === 0 && managerZone) {
        filtered = uniqueUsers.filter((user) => {
          const userArea = safeLowerCase(user.allocatedArea);
          return userArea === managerZone || userArea.includes(managerZone);
        });
        console.log(
          `Strategy 4 (allocatedArea): Found ${filtered.length} users`,
        );
      }

      // Strategy 5: Last resort - if no users found, show all (but log warning)
      if (filtered.length === 0) {
        console.warn(
          "⚠️ No users found with any strategy. Check if zone data is correctly populated.",
        );
        console.warn("Current user zone info:", {
          zone: currentUserInfo.zone,
          zoneId: currentUserInfo.zoneId,
        });
        // Show all users as fallback
        filtered = uniqueUsers;
      }

      console.log(`Zonal Manager: Final - Showing ${filtered.length} users`);
      return filtered;
    }

    // HOD: Show users from their department
    if (
      role === "headofdepartment" ||
      role === "head_of_department" ||
      role === "hod"
    ) {
      const hodDept = safeLowerCase(currentUserInfo.department);
      const filtered = uniqueUsers.filter(
        (user) => safeLowerCase(user.department) === hodDept,
      );
      console.log(
        `HOD: Showing ${filtered.length} users from department: ${currentUserInfo.department}`,
      );
      return filtered;
    }

    // Default: return all users
    return uniqueUsers;
  }, [travelSessions, users, currentUserInfo]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    const roleFilteredUsers = getFilteredUsers();

    if (!searchQuery) return roleFilteredUsers;

    return roleFilteredUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [getFilteredUsers, searchQuery]);

  // Filter sessions by status
  const filterSessionsByStatus = useCallback(
    (sessions: TravelSession[]) => {
      if (statusFilter === "all") return sessions;

      return sessions.filter((session) => {
        switch (statusFilter) {
          case "approved":
            return session.isFinalApproved === true;
          case "pending":
            return (
              session.finalStatus === "PENDING" ||
              session.isFinalApproved === null
            );
          case "rejected":
            return (
              session.isFinalApproved === false ||
              session.finalStatus === "REJECTED"
            );
          default:
            return true;
        }
      });
    },
    [statusFilter],
  );

  // Generate chart data based on time filter
  const generateChartData = useCallback((): ChartDataPoint[] => {
    if (!selectedUser) return [];

    let userSessions = travelSessions.filter(
      (s) => s.userId === selectedUser.userId,
    );
    userSessions = filterSessionsByStatus(userSessions);

    if (userSessions.length === 0) return [];

    const now = new Date();
    let startDate: Date, endDate: Date;
    let interval: "day" | "month";

    switch (timeFilter) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        );
        interval = "day";
        break;
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        interval = "day";
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        interval = "day";
        break;
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        interval = "month";
        break;
    }

    const groupedData = new Map<string, { distance: number; count: number }>();

    if (interval === "day") {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      days.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const daySessions = userSessions.filter((s) => {
          const sessionDate = parseISO(s.startTime);
          return format(sessionDate, "yyyy-MM-dd") === dateStr;
        });
        const totalDistanceMeters = daySessions.reduce(
          (sum, s) => sum + (s.totalDistance || 0),
          0,
        );
        groupedData.set(dateStr, {
          distance: metersToKm(totalDistanceMeters),
          count: daySessions.length,
        });
      });
    } else if (interval === "month") {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      months.forEach((month) => {
        const monthStr = format(month, "yyyy-MM");
        const monthSessions = userSessions.filter((s) => {
          const sessionDate = parseISO(s.startTime);
          return format(sessionDate, "yyyy-MM") === monthStr;
        });
        const totalDistanceMeters = monthSessions.reduce(
          (sum, s) => sum + (s.totalDistance || 0),
          0,
        );
        groupedData.set(monthStr, {
          distance: metersToKm(totalDistanceMeters),
          count: monthSessions.length,
        });
      });
    }

    return Array.from(groupedData.entries()).map(([date, data]) => ({
      date,
      distance: data.distance,
      sessionCount: data.count,
      label: format(parseISO(date), timeFilter === "year" ? "MMM" : "dd MMM"),
    }));
  }, [selectedUser, travelSessions, timeFilter, filterSessionsByStatus]);

  const chartData = generateChartData();

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!chartData.length) return null;

    const totalDistance = chartData.reduce((sum, d) => sum + d.distance, 0);
    const avgDistance = totalDistance / chartData.length;
    const maxDistance = Math.max(...chartData.map((d) => d.distance));
    const minDistance = Math.min(...chartData.map((d) => d.distance));
    const totalSessions = chartData.reduce((sum, d) => sum + d.sessionCount, 0);

    return {
      totalDistance,
      avgDistance,
      maxDistance,
      minDistance,
      totalSessions,
    };
  }, [chartData]);

  // Handle user selection
  const handleUserSelect = (user: UserListItem) => {
    setSelectedUser(user);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSessions();
    setIsRefreshing(false);
  };

  // Get role display name
  const getRoleDisplayName = (): string => {
    if (!currentUserInfo?.userRole) return "";
    const role = currentUserInfo.userRole.toLowerCase();
    switch (role) {
      case "hr":
        return "HR";
      case "admin":
      case "superadmin":
        return "Administrator";
      case "manager":
        return "Manager";
      case "headofdepartment":
        return "Head of Department";
      case "zonalmanager":
        return "Zonal Manager";
      case "zonalhead":
      case "zonal_head":
        return "Zonal Head";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Get user count info
  const getUserCountInfo = (): string => {
    const total = filteredUsers.length;
    const role = currentUserInfo?.userRole?.toLowerCase() || "";

    if (role === "hr" || role === "admin" || role === "superadmin") {
      return `Showing all ${total} employees`;
    }
    return `Showing ${total} employees`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600 font-medium">
            Distance: {data.distance.toFixed(2)} km
          </p>
          {data.sessionCount > 0 && (
            <p className="text-gray-600 text-sm">
              Sessions: {data.sessionCount}
            </p>
          )}

          <p>
            <p>
              reimbursement:{" "}
              {data.sessionCount > 0
                ? `₹${(data.distance * 3.5).toFixed(2)}`
                : "₹0.00"}
            </p>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoadingSessions && travelSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl shadow-sm">
        <div className="text-center">
          <LoadingAnimation />
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-lantern-blue-600">
            Performance Overview
          </h2>
          <p className="text-black text-sm">
            Distance travelled by employees
            {lastUpdateTime && (
              <span className="ml-2 text-xs text-gray-400">
                Last updated: {format(lastUpdateTime, "hh:mm a")}
              </span>
            )}
          </p>
          {/* Role-based info */}
          {/* {currentUserInfo && (
            <p className="text-xs text-gray-400 mt-1">
              {getUserCountInfo()} • Role: {getRoleDisplayName()}
              {currentUserInfo.department &&
                ` • Dept: ${currentUserInfo.department}`}
              {currentUserInfo.zone && ` • Zone: ${currentUserInfo.zone}`}
              {currentUserInfo.allocatedArea &&
                !currentUserInfo.zone &&
                ` • Area: ${currentUserInfo.allocatedArea}`}
            </p>
          )} */}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="bg-gray-100 rounded-lg px-3 py-1.5 text-xs font-medium capitalize text-gray-600 hover:text-gray-800 border-0 outline-none cursor-pointer appearance-none pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              backgroundSize: "16px",
            }}
          >
            {(["all sessions", "approved", "pending", "rejected"] as const).map(
              (status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ),
            )}
          </select>

          {/* Search/User Selector */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors min-w-[200px]"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-sm text-gray-700 truncate">
                {selectedUser ? selectedUser.fullName : "Search user..."}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search by name, username, or code..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="p-2">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {searchQuery
                        ? "No users found matching your search"
                        : "No users available for your role"}
                      {currentUserInfo?.department &&
                        ` in ${currentUserInfo.department} department`}
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.employeeCode} • {user.department || "Unknown"}
                            {user.zone && ` • Zone: ${user.zone}`}
                            {!user.zone &&
                              user.allocatedArea &&
                              ` • ${user.allocatedArea}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Time Filter Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["day", "week", "month", "year"] as TimeFilter[]).map(
              (filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timeFilter === filter
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => setTimeFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ),
            )}
          </div>

          {/* Chart Type Toggle */}
          <button
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            onClick={() => setChartType(chartType === "line" ? "bar" : "line")}
            title="Toggle chart type"
          >
            {chartType === "line" ? "📊" : "📈"}
          </button>

          {/* Refresh Button */}
          <button
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        {selectedUser ? (
          chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value.toFixed(1)} km`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="distance"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Distance (km)"
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value.toFixed(1)} km`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="distance"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    name="Distance (km)"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  No travel data available for this period
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Try selecting a different time range or status filter
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Select a user to view performance</p>
              <p className="text-gray-400 text-sm mt-1">
                Search and select an employee from the dropdown
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {selectedUser && statistics && chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Distance</p>
            <p className="text-2xl font-bold text-blue-600">
              {statistics.totalDistance.toFixed(2)} km
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Reimburshement</p>
            <p className="text-2xl font-bold text-green-600">
              {(statistics.totalDistance * 3.5).toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Sessions</p>
            <p className="text-2xl font-bold text-purple-600">
              {statistics.totalSessions}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Best </p>
            <p className="text-2xl font-bold text-orange-600">
              {statistics.maxDistance.toFixed(2)} km
            </p>
          </div>
        </div>
      )}

      {/* User Info Card */}
      {selectedUser && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>
              <span className="font-medium">Employee:</span>{" "}
              {selectedUser.fullName}
            </span>
            <span>
              <span className="font-medium">Code:</span>{" "}
              {selectedUser.employeeCode}
            </span>
            <span>
              <span className="font-medium">Department:</span>{" "}
              {selectedUser.department || "N/A"}
            </span>
            <span>
              <span className="font-medium">Zone:</span>{" "}
              {selectedUser.zone || selectedUser.allocatedArea || "N/A"}
            </span>
            <span className="text-xs text-gray-400">
              {
                travelSessions.filter((s) => s.userId === selectedUser.userId)
                  .length
              }{" "}
              total sessions
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOverview;
