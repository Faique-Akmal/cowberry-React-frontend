import { useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useUserStore } from "../../store/useUserStore";
import LoadingAnimation from "../../pages/UiElements/loadingAnimation";

interface DepartmentCount {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#92400E",
];

export default function EmployeeChart() {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  // ✅ Access state and actions from Zustand store
  const { users, fetchUsers, isLoading, error, resetStore } = useUserStore();

  // ✅ Fetch data on mount (store handles deduplication via isInitialized)
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const { chartData, totalEmployees } = useMemo(() => {
    const total = users.length;
    const departmentMap = new Map<string, number>();

    // 1. Count employees per department
    users.forEach((user) => {
      // Fallback to role or 'Unknown' if department is missing
      const key = user.department || user.role || "Unknown";
      const currentCount = departmentMap.get(key) || 0;
      departmentMap.set(key, currentCount + 1);
    });

    // 2. Convert to Array
    const rawData: DepartmentCount[] = [];
    let colorIndex = 0;
    departmentMap.forEach((count, name) => {
      rawData.push({
        name,
        value: count,
        color: COLORS[colorIndex % COLORS.length],
      });
      colorIndex++;
    });

    // 3. Sort by count descending
    rawData.sort((a, b) => b.value - a.value);

    // 4. Top 10 + Others Logic
    const finalData = rawData.slice(0, 10);
    if (rawData.length > 10) {
      const othersCount = rawData
        .slice(10)
        .reduce((sum, item) => sum + item.value, 0);
      if (othersCount > 0) {
        finalData.push({
          name: "Others",
          value: othersCount,
          color: "#94A3B8",
        });
      }
    }

    return { chartData: finalData, totalEmployees: total };
  }, [users]);

  // ✅ Optimized Reload: Clear store cache then fetch
  const reloadData = async () => {
    resetStore();
    fetchUsers();
  };

  // Styles
  const glassStyles = {
    light: {
      background: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
    },
    dark: {
      background: "rgba(30, 41, 59, 0.7)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    },
  };

  const currentGlassStyle = isDarkMode ? glassStyles.dark : glassStyles.light;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage =
        totalEmployees > 0
          ? ((item.value / totalEmployees) * 100).toFixed(1)
          : "0.0";

      return (
        <div
          className="p-4 rounded-xl shadow-lg border backdrop-blur-lg"
          style={{
            background: isDarkMode
              ? "rgba(30, 41, 59, 0.9)"
              : "rgba(255, 255, 255, 0.9)",
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <p className="font-semibold text-gray-800 dark:text-white mb-2">
            {item.name}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Employees:{" "}
              <span className="font-bold ml-1 text-blue-600 dark:text-blue-400">
                {item.value}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Percentage:{" "}
              <span className="font-semibold ml-1">{percentage}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // ✅ Render Loading State (from store)
  // Check users.length === 0 to avoid flashing loading screen during background re-fetches
  if (isLoading && users.length === 0)
    return (
      <div
        className="relative rounded-2xl p-8 flex flex-col items-center justify-center h-96 overflow-hidden group"
        style={{
          ...currentGlassStyle,
          background: isDarkMode
            ? "rgba(30, 41, 59, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <LoadingAnimation />
      </div>
    );

  // ✅ Render Error State (from store)
  if (error)
    return (
      <div
        className="relative rounded-2xl p-8 flex flex-col items-center justify-center h-96 overflow-hidden"
        style={{
          ...currentGlassStyle,
          background: isDarkMode
            ? "rgba(30, 41, 59, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4 text-lg font-medium">
            {error}
          </p>
          <button
            onClick={reloadData}
            className="px-8 py-3 rounded-xl backdrop-blur-sm bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {t("home.Retry") || "Retry"}
          </button>
        </div>
      </div>
    );

  // ✅ Render Empty State
  if (chartData.length === 0)
    return (
      <div
        className="relative rounded-2xl p-8 flex flex-col items-center justify-center h-96 overflow-hidden group"
        style={{
          ...currentGlassStyle,
          background: isDarkMode
            ? "rgba(30, 41, 59, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-gray-400/20 to-gray-600/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-3 text-lg font-medium">
            {t("home.NoDepartmentData") || "No department data available"}
          </p>
        </div>
      </div>
    );

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden group transition-all duration-500 hover:shadow-2xl"
      style={{
        ...currentGlassStyle,
        background: isDarkMode
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
      }}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-linear-to-r from-blue-500/20 to-purple-500/20 blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-linear-to-r from-green-500/20 to-teal-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-center mb-8 bg-lantern-blue-600 to-gray-600 bg-clip-text text-transparent">
          Users By Department
        </h2>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
          {/* Pie Chart Container */}
          <div className="w-full lg:w-1/2">
            <div
              className="relative backdrop-blur-sm rounded-2xl p-6"
              style={{
                background: isDarkMode
                  ? "rgba(30, 41, 59, 0.4)"
                  : "rgba(255, 255, 255, 0.4)",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={130}
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth={1.5}
                    paddingAngle={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={
                          isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(255, 255, 255, 0.5)"
                        }
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Total Users Badge */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div
                  className="px-6 py-3 rounded-full backdrop-blur-md"
                  style={{
                    background: isDarkMode
                      ? "rgba(30, 41, 59, 0.6)"
                      : "rgba(255, 255, 255, 0.6)",
                    border: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.2)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("home.TotalUsers") || "Total Users"}:{" "}
                    <span className="font-bold text-xl text-blue-600 dark:text-blue-400 ml-2">
                      {totalEmployees}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend Container */}
          <div className="w-full lg:w-1/2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chartData.map((item, index) => {
                const percentage =
                  totalEmployees > 0
                    ? ((item.value / totalEmployees) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={index}
                    className="relative rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group/legend"
                    style={{
                      background: isDarkMode
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.5)",
                      border: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover/legend:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}10, transparent)`,
                      }}
                    ></div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-5 h-5 rounded-full shrink-0 shadow-md"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <h4 className="font-semibold text-gray-800 dark:text-white truncate text-sm">
                          {item.name}
                        </h4>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {t("home.Users") || "Users"}
                          </span>
                          <span className="font-bold text-lg text-gray-800 dark:text-white">
                            {item.value}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {t("home.Share") || "Share"}
                          </span>
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 group-hover/legend:shadow-md"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                            boxShadow: `0 0 10px ${item.color}50`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
