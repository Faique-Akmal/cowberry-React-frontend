import { useEffect, useMemo, useState } from "react";
import { CiUser } from "react-icons/ci";
import { FcDepartment } from "react-icons/fc";
import { HiOutlineUserGroup } from "react-icons/hi";
import { FaUserCheck, FaUserTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useUserStore } from "../../store/useUserStore";

export default function ManagerDashboard() {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const { users, fetchUsers, isLoading } = useUserStore();
  const [managerDepartment, setManagerDepartment] = useState<string>("");

  useEffect(() => {
    fetchUsers();
    // Get manager's department from localStorage
    const dept = localStorage.getItem("department");
    if (dept) {
      setManagerDepartment(dept);
    }
  }, [fetchUsers]);

  const stats = useMemo(() => {
    // Helper for safe lowercase comparison
    const checkRole = (role: string | undefined, target: string) =>
      role?.toLowerCase() === target.toLowerCase();

    const checkDepartment = (dept: string | undefined) => {
      if (!dept || !managerDepartment) return false;
      return dept.toLowerCase() === managerDepartment.toLowerCase();
    };

    // All users in the manager's department
    const departmentUsers = users.filter((user) =>
      checkDepartment(user.department),
    );

    // All users in the organization
    const allUsers = users;

    // Count present/absent based on is_checkin
    const presentToday = departmentUsers.filter(
      (user) => user.is_checkin === true,
    ).length;
    
    const absentToday = departmentUsers.filter(
      (user) => user.is_checkin === false,
    ).length;

    // Count roles in the manager's department
    const departmentTotal = departmentUsers.length;
    
    const departmentZonalManagers = departmentUsers.filter((user) =>
      checkRole(user.role, "ZonalManager"),
    ).length;
    
    const departmentManagers = departmentUsers.filter((user) =>
      checkRole(user.role, "Manager"),
    ).length;
    
    const departmentEmployees = departmentUsers.filter(
      (user) =>
        checkRole(user.role, "fieldemployee") ||
        checkRole(user.role, "employee") ||
        checkRole(user.role, "associate"),
    ).length;

    // Count roles in entire organization
    const totalZonalManagers = allUsers.filter((user) =>
      checkRole(user.role, "ZonalManager"),
    ).length;
    
    const totalManagers = allUsers.filter((user) =>
      checkRole(user.role, "Manager"),
    ).length;
    
    const totalEmployees = allUsers.filter(
      (user) =>
        checkRole(user.role, "fieldemployee") ||
        checkRole(user.role, "employee") ||
        checkRole(user.role, "associate"),
    ).length;

    return {
      // Department-specific stats
      departmentTotal: departmentTotal,
      presentToday: presentToday,
      absentToday: absentToday,
      departmentZonalManagers: departmentZonalManagers,
      departmentManagers: departmentManagers,
      departmentEmployees: departmentEmployees,
      
      // Organization-wide stats
      totalZonalManagers: totalZonalManagers,
      totalManagers: totalManagers,
      totalEmployees: totalEmployees,
      totalUsers: allUsers.length,
      
      // Placeholder stats (these should come from other APIs)
      pendingApprovals: 5,
      activeProjects: 8,
    };
  }, [users, managerDepartment]);

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

  // ✅ Cards Configuration for MANAGER
  const cards = useMemo(
    () => [
      {
        title: t("My Department"),
        value: stats.departmentTotal.toLocaleString(),
        subtitle: `All Users in ${managerDepartment || "Department"}`,
        icon: <FcDepartment className="h-4 w-4" />,
        iconColor: "text-indigo-600 dark:text-indigo-400",
        iconBg: "bg-indigo-100/80 dark:bg-indigo-900/30",
        gradient:
          "from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent",
      },
      {
        title: t("Present Today"),
        value: stats.presentToday.toLocaleString(),
        subtitle: "Checked In Staff",
        icon: <FaUserCheck className="h-4 w-4" />,
        iconColor: "text-green-600 dark:text-green-400",
        iconBg: "bg-green-100/80 dark:bg-green-900/30",
        gradient:
          "from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent",
      },
      {
        title: t("Absent Today"),
        value: stats.absentToday.toLocaleString(),
        subtitle: "Not Checked In",
        icon: <FaUserTimes className="h-4 w-4" />,
        iconColor: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-100/80 dark:bg-rose-900/30",
        gradient:
          "from-rose-50/50 to-transparent dark:from-rose-950/20 dark:to-transparent",
      },
    //   {
    //     title: t("Department Managers"),
    //     value: stats.departmentManagers.toLocaleString(),
    //     subtitle: "In My Department",
    //     icon: <GrUserManager className="h-4 w-4" />,
    //     iconColor: "text-blue-600 dark:text-blue-400",
    //     iconBg: "bg-blue-100/80 dark:bg-blue-900/30",
    //     gradient:
    //       "from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent",
    //   },
      {
        title: t("Department Zonal Managers"),
        value: stats.departmentZonalManagers.toLocaleString(),
        subtitle: "In My Department",
        icon: <HiOutlineUserGroup className="h-4 w-4" />,
        iconColor: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-purple-100/80 dark:bg-purple-900/30",
        gradient:
          "from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent",
      },
      {
        title: t("Department Employees"),
        value: stats.departmentEmployees.toLocaleString(),
        subtitle: "In My Department",
        icon: <CiUser className="h-4 w-4" />,
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100/80 dark:bg-amber-900/30",
        gradient:
          "from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent",
      },
   
     
    ],
    [t, stats, managerDepartment],
  );

  // ✅ Skeleton Loading Logic
  if (isLoading && users.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 p-4 w-full">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className={`
              relative rounded-2xl p-4 w-full flex flex-col justify-between 
              overflow-hidden animate-pulse
            `}
            style={currentGlassStyle}
          >
            <div className="relative z-10 flex justify-between items-center">
              <div className="space-y-3">
                <div
                  className={`h-4 w-20 rounded ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`h-8 w-12 rounded ${
                    isDarkMode ? "bg-gray-600" : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <div
                className={`p-3 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-300"
                }`}
              >
                <div className="opacity-0">
                  <CiUser className="h-3 w-3" />
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

  return (
    <div>
      {/* Department Header */}
      {managerDepartment && (
        <div className="px-4 pt-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {managerDepartment} Department Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overview of your department's performance and attendance
          </p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 p-4 w-full">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`
              relative rounded-2xl p-4 w-full flex flex-col justify-between 
              hover:scale-[1.02] transition-all duration-300
              before:absolute before:inset-0 before:rounded-2xl before:bg-linear-to-br ${card.gradient}
              overflow-hidden group
            `}
            style={currentGlassStyle}
          >
            {/* Optional: Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-linear-to-r from-current to-transparent opacity-20 group-hover:opacity-30 transition-opacity"></div>
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h4
                  className={`
                    text-sm font-medium 
                    ${isDarkMode ? "text-gray-300" : "text-gray-700"}
                    mb-1
                  `}
                >
                  {card.title}
                </h4>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {card.subtitle}
                  </p>
                )}
                <p
                  className={`
                    text-3xl font-bold 
                    ${isDarkMode ? "text-white" : "text-gray-900"}
                    mt-1 transition-all duration-300
                    ${isLoading ? "opacity-50" : "opacity-100"}
                  `}
                >
                  {card.value}
                </p>
              </div>
              <div
                className={`
                  p-3 rounded-full backdrop-blur-sm 
                  ${card.iconBg} 
                  transition-transform duration-300 
                  group-hover:scale-110
                `}
              >
                <div className={card.iconColor}>{card.icon}</div>
              </div>
            </div>

            {/* Optional: Progress indicator or decorative element */}
            <div
              className={`
                relative mt-4 h-1 w-full rounded-full 
                ${isDarkMode ? "bg-gray-700/50" : "bg-gray-200/50"}
                overflow-hidden
              `}
            >
              <div
                className={`
                  absolute inset-0 w-0 group-hover:w-full 
                  ${card.iconBg
                    .replace("bg-", "bg-linear-to-r from-")
                    .replace("/80", "")} 
                  transition-all duration-500 ease-out
                `}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}