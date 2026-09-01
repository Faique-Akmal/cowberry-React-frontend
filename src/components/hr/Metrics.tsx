import { useEffect, useMemo } from "react";
import { GroupIcon } from "../../icons";
import { CiUser } from "react-icons/ci";
import { FcDepartment } from "react-icons/fc";
import { GrUserManager } from "react-icons/gr";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useUserStore } from "../../store/useUserStore";

export default function Metrics() {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const { users, fetchUsers, isLoading } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ✅ Get current user role from localStorage
  const currentUserRole = useMemo(() => {
    return localStorage.getItem("userRole") || "";
  }, []);

  const currentUserDepartment = useMemo(() => {
    return localStorage.getItem("department") || "";
  }, []);

  const currentUserZone = useMemo(() => {
    return localStorage.getItem("zone") || "";
  }, []);

  const currentUserZoneId = useMemo(() => {
    return localStorage.getItem("zoneId") || "";
  }, []);

  // ✅ Filter users based on role with safe string conversion
  const filteredUsers = useMemo(() => {
    // Helper for safe lowercase comparison
    const checkRole = (role: string | undefined, target: string) =>
      role?.toLowerCase() === target.toLowerCase();

    // Helper to safely convert any value to string and lowercase
    const safeLowerCase = (value: any): string => {
      if (value === null || value === undefined) return "";
      return String(value).toLowerCase();
    };

    // Log for debugging
    console.log("Current User Role:", currentUserRole);
    console.log("Current User Zone:", currentUserZone);
    console.log("Current User Zone ID:", currentUserZoneId);
    console.log("Total Users:", users.length);

    // Log first few users to check their zone structure
    if (users.length > 0) {
      console.log(
        "Sample user zone values:",
        users.slice(0, 3).map((u) => ({
          name: u.full_name || u.name,
          zone: u.zone,
          zoneId: u.zoneId,
          department: u.department,
        })),
      );
    }

    // If user is HR or Admin, show all users
    if (
      checkRole(currentUserRole, "hr") ||
      checkRole(currentUserRole, "admin")
    ) {
      console.log("HR/Admin: Showing all users");
      return users;
    }

    // If user is Manager, show only employees from their department
    if (checkRole(currentUserRole, "manager")) {
      const filtered = users.filter((user) => {
        const userDept = safeLowerCase(user.department);
        const currentDept = safeLowerCase(currentUserDepartment);
        return userDept === currentDept;
      });
      console.log(
        `Manager: Found ${filtered.length} users in department ${currentUserDepartment}`,
      );
      return filtered;
    }

    // If user is Zonal Manager, show only employees from their zone
    if (checkRole(currentUserRole, "zonalmanager")) {
      // Try filtering by zone name first
      let filtered = users.filter((user) => {
        const userZone = safeLowerCase(user.zone);
        const currentZone = safeLowerCase(currentUserZone);
        return userZone === currentZone;
      });

      // If no users found by zone name, try filtering by zoneId
      if (filtered.length === 0 && currentUserZoneId) {
        console.log("No users found by zone name, trying zoneId...");
        filtered = users.filter((user) => {
          const userZoneId = safeLowerCase(user.zoneId);
          const currentZoneId = safeLowerCase(currentUserZoneId);
          return userZoneId === currentZoneId;
        });
      }

      // If still no users found, try filtering by department (as fallback)
      if (filtered.length === 0) {
        console.log("No users found by zone, trying department as fallback...");
        filtered = users.filter((user) => {
          const userDept = safeLowerCase(user.department);
          const currentDept = safeLowerCase(currentUserDepartment);
          return userDept === currentDept;
        });
      }

      console.log(
        `Zonal Manager: Found ${filtered.length} users in zone ${currentUserZone}`,
      );
      return filtered;
    }

    // Default: return all users (fallback)
    return users;
  }, [
    users,
    currentUserRole,
    currentUserDepartment,
    currentUserZone,
    currentUserZoneId,
  ]);

  // ✅ Calculation: Compute stats using filtered users
  const stats = useMemo(() => {
    const total = filteredUsers.length;

    // Helper for safe lowercase comparison
    const checkRole = (role: string | undefined, target: string) =>
      role?.toLowerCase() === target.toLowerCase();

    return {
      totalUsers: total,
      employee: filteredUsers.filter(
        (user) =>
          checkRole(user.role, "fieldemployee") ||
          checkRole(user.role, "employee"),
      ).length,
      department_head: filteredUsers.filter((user) =>
        checkRole(user.role, "department_head"),
      ).length,
      manager: filteredUsers.filter((user) => checkRole(user.role, "manager"))
        .length,
      hr: filteredUsers.filter((user) => checkRole(user.role, "hr")).length,
      zonalManager: filteredUsers.filter((user) =>
        checkRole(user.role, "zonalmanager"),
      ).length,
      headOfDepartment: filteredUsers.filter(
        (user) =>
          checkRole(user.role, "headofdepartment") ||
          checkRole(user.role, "head_of_department"),
      ).length,
    };
  }, [filteredUsers]);

  // Glassmorphism styles based on theme
  const glassStyles = {
    light: {
      background: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
    },
    dark: {
      background: "rgba(30, 41, 59, 0.7)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    },
  };

  const currentGlassStyle = isDarkMode ? glassStyles.dark : glassStyles.light;

  // ✅ Cards Configuration
  const cards = useMemo(
    () => [
      {
        title: t("Total Users"),
        value: stats.totalUsers.toLocaleString(),
        icon: <CiUser className="h-5 w-5" />,
        iconColor: "text-indigo-600 dark:text-indigo-400",
        iconBg: "bg-indigo-100/80 dark:bg-indigo-900/30",
        gradient:
          "from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent",
      },
      {
        title: t("Field Employees"),
        value: stats.employee.toLocaleString(),
        icon: <GroupIcon className="h-5 w-5" />,
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-100/80 dark:bg-blue-900/30",
        gradient:
          "from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent",
      },
      {
        title: t("Total Managers"),
        value: stats.manager.toLocaleString(),
        icon: <FcDepartment className="h-5 w-5" />,
        iconColor: "text-yellow-600 dark:text-yellow-400",
        iconBg: "bg-yellow-100/80 dark:bg-yellow-900/30",
        gradient:
          "from-yellow-50/50 to-transparent dark:from-yellow-950/20 dark:to-transparent",
      },
      {
        title: t("HR"),
        value: stats.hr.toLocaleString(),
        icon: <GrUserManager className="h-5 w-5" />,
        iconColor: "text-orange-600 dark:text-orange-400",
        iconBg: "bg-orange-100/80 dark:bg-orange-900/30",
        gradient:
          "from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent",
      },
      {
        title: t("Zonal Manager"),
        value: stats.zonalManager.toLocaleString(),
        icon: <GrUserManager className="h-5 w-5" />,
        iconColor: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-purple-100/80 dark:bg-purple-900/30",
        gradient:
          "from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent",
      },
      {
        title: t("H.O.D"),
        value: stats.headOfDepartment.toLocaleString(),
        icon: <FcDepartment className="h-5 w-5" />,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100/80 dark:bg-emerald-900/30",
        gradient:
          "from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent",
      },
      {
        title: t("Employees"),
        value: stats.employee.toLocaleString(),
        icon: <GroupIcon className="h-5 w-5" />,
        iconColor: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-100/80 dark:bg-rose-900/30",
        gradient:
          "from-rose-50/50 to-transparent dark:from-rose-950/20 dark:to-transparent",
      },
    ],
    [t, stats],
  );

  // ✅ Skeleton Loading Logic
  if (isLoading && users.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 p-4 w-full">
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div
            key={item}
            className={`
              relative rounded-2xl p-4 w-full overflow-hidden animate-pulse
              min-w-[150px] flex-1
            `}
            style={currentGlassStyle}
          >
            <div className="relative z-10 flex justify-between items-start gap-2">
              <div className="space-y-3 flex-1">
                <div
                  className={`h-4 w-24 rounded ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`h-8 w-16 rounded ${
                    isDarkMode ? "bg-gray-600" : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <div
                className={`p-3 rounded-full shrink-0 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-300"
                }`}
              >
                <div className="opacity-0">
                  <CiUser className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div
              className={`mt-4 h-1 w-full rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-gray-300"
              }`}
            ></div>
          </div>
        ))}
      </div>
    );
  }

  // Main Render - Fixed UI with proper alignment
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 p-4 w-full">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`
        relative rounded-2xl p-4 w-full flex flex-col
        hover:scale-[1.02] transition-all duration-300
        before:absolute before:inset-0 before:rounded-2xl before:bg-linear-to-br ${card.gradient}
        overflow-hidden group
      
      `}
          style={currentGlassStyle}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-linear-to-r from-current to-transparent opacity-20 group-hover:opacity-30 transition-opacity"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full gap-3">
            {/* Top section with title and icon - fixed layout */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h4
                  className={`
                text-xs sm:text-sm font-medium truncate
                ${isDarkMode ? "text-gray-300" : "text-gray-700"}
              `}
                  title={card.title}
                >
                  {card.title}
                </h4>
              </div>
            </div>

            {/* Value section - moved outside the flex row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <p
                className={`
      text-2xl sm:text-3xl font-bold flex-1
      ${isDarkMode ? "text-white" : "text-gray-900"}
      transition-all duration-300
      ${isLoading ? "opacity-50" : "opacity-100"}
      break-words
    `}
              >
                {card.value}
              </p>
              <div
                className={`
      p-2 rounded-full backdrop-blur-sm shrink-0
      ${card.iconBg} 
      transition-transform duration-300 
      group-hover:scale-110
    `}
                style={{ opacity: isLoading ? 0.5 : 1 }}
              >
                <div className={`${card.iconColor}`}>{card.icon}</div>
              </div>
            </div>

            {/* Progress bar - fixed to bottom */}
            <div
              className={`
            relative mt-auto pt-2 h-auto w-full rounded-full 
            ${isDarkMode ? "bg-gray-700/50" : "bg-gray-200/50"}
            overflow-hidden
          `}
            >
              <div
                className={`
              h-1 w-0 group-hover:w-full 
              ${card.iconBg
                .replace("bg-", "bg-linear-to-r from-")
                .replace("/80", "")} 
              transition-all duration-500 ease-out
              rounded-full
            `}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
