import { useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { Users, Mail, Activity, CheckCircle, XCircle } from "lucide-react";
// ✅ Import Zustand Store
import { useUserStore } from "../../store/useUserStore";
import LoadingAnimation from "../../pages/UiElements/loadingAnimation";

// --- Helper Components ---
const StatusPill = ({ status }: { status: string }) => {
  const isActive = status === "Active";
  const colorClass = isActive
    ? "bg-gradient-to-r from-green-400 to-emerald-500"
    : "bg-gradient-to-r from-red-400 to-rose-500";
  const Icon = isActive ? CheckCircle : XCircle;

  return (
    <div
      className="flex items-center space-x-2 backdrop-blur-sm rounded-full px-3 py-1.5"
      style={{
        background: "rgba(255, 255, 255, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${colorClass} shrink-0`} />
      <Icon className="w-4 h-4 shrink-0 text-white" />
      <span className="text-sm font-medium text-white truncate">{status}</span>
    </div>
  );
};

const HomeOfficePill = ({ active }: { active: boolean }) => (
  <div
    className="text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center justify-center gap-1.5 transition-all duration-300"
    style={{
      background: active
        ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))"
        : "rgba(255, 255, 255, 0.1)",
      border: active
        ? "1px solid rgba(34, 197, 94, 0.3)"
        : "1px solid rgba(255, 255, 255, 0.1)",
    }}
  >
    <div
      className={`w-1.5 h-1.5 rounded-full ${
        active ? "bg-green-400 animate-pulse" : "bg-gray-400"
      }`}
    ></div>
    <span
      className={`font-medium ${active ? "text-green-100" : "text-gray-300"}`}
    >
      {active ? "Online Now" : "Offline"}
    </span>
  </div>
);

// Helper function to normalize strings for comparison
const normalizeString = (str: string | null | undefined): string => {
  if (!str) return "";
  return str.trim().toLowerCase();
};

// --- Main Component ---
const EmployeeStatus = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const { users, fetchUsers, isLoading } = useUserStore();

  const [visibleCount, setVisibleCount] = useState(15);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Get user role, department and allocated area from localStorage
  const userRole = localStorage.getItem("userRole");
  const userDepartment = localStorage.getItem("department");
  const userAllocatedArea = localStorage.getItem("allocatedarea");

  // Debug logging (remove in production)
  useEffect(() => {}, [userRole, userDepartment, userAllocatedArea, users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on role with strict comparison
  const filteredUsers = useMemo(() => {
    if (!userRole) {
      return users;
    }

    const normalizedUserRole = normalizeString(userRole);
    const normalizedUserDepartment = normalizeString(userDepartment);
    const normalizedUserAllocatedArea = normalizeString(userAllocatedArea);

    let filtered = users;

    if (normalizedUserRole === "manager") {
      if (!normalizedUserDepartment) {
        return [];
      }

      filtered = users.filter((user) => {
        const userDept = normalizeString(user.department);
        const isMatch = userDept === normalizedUserDepartment;

        return isMatch;
      });
    } else if (normalizedUserRole === "zonalmanager") {
      if (!normalizedUserAllocatedArea) {
        return [];
      }

      filtered = users.filter((user) => {
        const userArea = normalizeString(user.allocatedArea);
        const isMatch = userArea === normalizedUserAllocatedArea;

        return isMatch;
      });
    } else if (
      normalizedUserRole === "admin" ||
      normalizedUserRole === "superadmin"
    ) {
      filtered = users;
    }

    return filtered;
  }, [users, userRole, userDepartment, userAllocatedArea]);

  const { onlineUsers, totalUsersCount, activeUsersCount } = useMemo(() => {
    const online = filteredUsers.filter((user) => user.is_checkin === true);
    return {
      onlineUsers: online,
      activeUsersCount: online.length,
      totalUsersCount: filteredUsers.length,
    };
  }, [filteredUsers]);

  const visibleUsers = useMemo(() => {
    return onlineUsers.slice(0, visibleCount);
  }, [onlineUsers, visibleCount]);

  const hasMore = visibleCount < activeUsersCount;

  // Handle Scroll to load more items
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // If scrolled to bottom (with 10px buffer) and there are more items
    if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore) {
      setVisibleCount((prev) => prev + 10);
    }
  };

  // Glassmorphism styles
  const glassStyles = {
    light: {
      background: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
    },
    dark: {
      background: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    },
  };

  const currentGlassStyle = isDarkMode ? glassStyles.dark : glassStyles.light;

  // Percentage Calculations
  const onlinePercentage =
    totalUsersCount > 0
      ? Math.round((activeUsersCount / totalUsersCount) * 100)
      : 0;

  return (
    <div
      className="relative rounded-2xl p-6 h-full overflow-hidden group transition-all duration-500 hover:shadow-2xl"
      style={{
        ...currentGlassStyle,
        background: isDarkMode
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
      }}
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-lantern-blue-600 blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-linear-to-r from-green-500/20 to-emerald-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Pulsing activity indicator */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <div className="w-3 h-3 bg-linear-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
          <div className="absolute top-0 w-3 h-3 bg-linear-to-r from-green-400 to-emerald-500 rounded-full"></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-3 rounded-2xl backdrop-blur-sm bg-lantern-blue-600"
                style={{
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black bg-clip-text ">
                  Live Status
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-linear-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        {activeUsersCount}
                      </span>{" "}
                      online
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    of <span className="font-semibold">{totalUsersCount}</span>{" "}
                    total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            className="relative rounded-xl p-4 backdrop-blur-sm group/card transition-all duration-300 hover:scale-[1.02]"
            style={{
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Online Now
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {activeUsersCount}
                </p>
              </div>
              <div className="p-2 rounded-lg backdrop-blur-sm">
                <Users className="w-5 h-5 text-black dark:text-white" />
              </div>
            </div>
            <div className="mt-2 h-1 bg-blue-200/50 dark:bg-blue-800/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                style={{
                  width: `${onlinePercentage}%`,
                }}
              />
            </div>
          </div>

          <div
            className="relative rounded-xl p-4 backdrop-blur-sm group/card transition-all duration-300 hover:scale-[1.02]"
            style={{
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Availability
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {onlinePercentage}%
                </p>
              </div>
              <div
                className="p-2 rounded-lg backdrop-blur-sm"
                style={{
                  background: "rgba(139, 92, 246, 0.2)",
                }}
              >
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>

          <div
            className="relative rounded-xl p-4 backdrop-blur-sm group/card transition-all duration-300 hover:scale-[1.02]"
            style={{
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Online Rate
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {onlinePercentage.toFixed(1)}%
                </p>
              </div>
              <div
                className="p-2 rounded-lg backdrop-blur-sm"
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                }}
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Headers */}
        <div
          className="hidden md:grid md:grid-cols-4 text-sm font-semibold text-gray-700 dark:text-gray-300 pb-3 mb-3"
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span className="flex items-center gap-2 pl-3">
            <Users className="w-4 h-4" />
            Employee
          </span>
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Contact
          </span>
          <span className=" ">Department</span>
          <span className="flex items-center gap-2">AllocatedArea</span>
        </div>

        {/* Users List Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] custom-scrollbar pr-2"
        >
          {/* Loading State */}
          {isLoading && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingAnimation />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Loading active users...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Fetching live status data
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && onlineUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div
                  className="w-20 h-20 rounded-2xl backdrop-blur-sm flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Users className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-linear-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white text-sm shadow-lg">
                  !
                </div>
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-3">
                {filteredUsers.length === 0
                  ? "No Employees Found"
                  : "All Quiet Zone"}
              </p>
              <p
                className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto backdrop-blur-sm p-3 rounded-xl"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                }}
              >
                {filteredUsers.length === 0
                  ? `No employees found for your ${userRole?.toLowerCase() === "manager" ? "department" : "allocated area"}.`
                  : "No employees are currently online. Check back later for updates."}
              </p>
            </div>
          )}

          {/* User List */}
          {visibleUsers.map((user, index) => (
            <div
              key={user.userId}
              className="relative rounded-xl p-4 mb-3 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg group/user overflow-hidden"
              style={{
                background: isDarkMode
                  ? `rgba(30, 41, 59, ${0.5 + index * 0.01})`
                  : `rgba(255, 255, 255, ${0.7 - index * 0.02})`,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Hover glow effect */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover/user:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1), transparent 50%)",
                }}
              ></div>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex flex-col gap-4 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-12 h-12 rounded-2xl backdrop-blur-sm flex items-center justify-center group-hover/user:scale-110 transition-transform duration-300"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                          }}
                        >
                          <span className="font-bold text-white text-lg">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-semibold text-sm capitalize truncate text-gray-800 dark:text-white">
                              {user.name}
                            </p>
                            <div className="flex-shrink-0">
                              <HomeOfficePill active={user.is_checkin} />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate mb-2">
                          {user.email}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="text-xs px-2 py-1 rounded-full backdrop-blur-sm truncate max-w-[120px]"
                            style={{
                              background: "rgba(139, 92, 246, 0.1)",
                              border: "1px solid rgba(139, 92, 246, 0.2)",
                            }}
                          >
                            {user.role || "Field Employee"}
                          </span>
                          <span
                            className="text-xs text-gray-500 px-2 py-1 rounded-full backdrop-blur-sm truncate max-w-[100px]"
                            style={{
                              background: "rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            {user.employee_code}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allocated Area - now on its own line for mobile */}
                  <div className="w-full">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Allocated Area:
                    </div>
                    <div
                      className="text-sm text-gray-800 dark:text-white p-3 rounded-lg backdrop-blur-sm break-words"
                      style={{
                        background: "rgba(59, 130, 246, 0.05)",
                        border: "1px solid rgba(59, 130, 246, 0.1)",
                      }}
                    >
                      {user.allocatedArea || "No area allocated"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-4 items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl backdrop-blur-sm bg-lantern-blue-600 flex items-center justify-center group-hover/user:scale-110 transition-transform duration-300"
                      style={{
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <span className="font-bold text-white text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-linear-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm capitalize truncate text-gray-800 dark:text-white">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-1 rounded-full backdrop-blur-sm truncate max-w-[120px]"
                        style={{
                          background: "rgba(139, 92, 246, 0.1)",
                          border: "1px solid rgba(139, 92, 246, 0.2)",
                        }}
                      >
                        {user.role || "Field Employee"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user.email}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {user.employee_code}
                  </span>
                </div>

                <div className="flex items-center">{user.department} </div>

                <div className="flex items-center">{user.allocatedArea}</div>
              </div>
            </div>
          ))}

          {/* Lazy Load Indicator */}
          {hasMore && onlineUsers.length > 0 && (
            <div className="text-center py-4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <span className="w-2 h-2 bg-linear-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce"></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Scroll for more...
                </span>
              </div>
            </div>
          )}

          {/* End of List */}
          {!hasMore && onlineUsers.length > 0 && (
            <div className="text-center py-4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <span className="w-2 h-2 bg-linear-to-r from-blue-400 to-indigo-400 rounded-full"></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {onlineUsers.length} online users
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Stats Footer */}
        <div
          className="md:hidden mt-6 pt-4"
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex justify-between items-center">
            <div
              className="text-center p-3 rounded-xl backdrop-blur-sm flex-1 mx-1"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <div className="text-green-600 dark:text-green-400 font-bold text-lg">
                {activeUsersCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Online
              </div>
            </div>
            <div
              className="text-center p-3 rounded-xl backdrop-blur-sm flex-1 mx-1"
              style={{
                background: "rgba(139, 92, 246, 0.1)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <div className="text-gray-700 dark:text-gray-300 font-bold text-lg">
                {totalUsersCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total
              </div>
            </div>
            <div
              className="text-center p-3 rounded-xl backdrop-blur-sm flex-1 mx-1"
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {onlinePercentage}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Rate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatus;
