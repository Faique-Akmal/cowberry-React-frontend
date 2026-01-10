import React, { useEffect, useState, useMemo } from "react";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useUserStore } from "../../store/useUserStore";
import { User } from "../../types/userTypes";

const BirthdayCardList: React.FC = () => {
  const { isDarkMode } = useTheme(); // Removed unused themeConfig
  const { t } = useTranslation();

  // ✅ Access store state and actions
  const { users, fetchUsers, isLoading } = useUserStore();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // ✅ Fetch users on mount
  // The store handles deduplication (isInitialized check), so this is safe.
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Helper Functions ---

  const isBirthdayToday = (birthDateString: string): boolean => {
    if (!birthDateString) return false;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return false;
    return (
      birthDate.getDate() === today.getDate() &&
      birthDate.getMonth() === today.getMonth()
    );
  };

  const calculateAge = (birthDateString: string): number => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return 0;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatBirthDate = (birthDateString: string): string => {
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return "Invalid date";
    return birthDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
    });
  };

  const getRoleName = (roleString: string): string => {
    if (!roleString) return "Unknown";
    const roleMap: Record<string, string> = {
      fieldemployee: "Field Employee",
      employee: "Employee",
      hr: "HR",
      hod: "Head of Department",
      admin: "Admin",
      department_head: "Department Head",
      zonalmanager: "Zonal Manager",
    };
    return roleMap[roleString.toLowerCase()] || roleString;
  };

  // ✅ Derive birthday list using useMemo
  // This replaces the local 'birthdayUsers' state and the complex useEffect
  const birthdayUsers = useMemo(() => {
    // Cast 'users' to local User type if necessary, or rely on store types
    const validUsers = users as unknown as User[];

    return validUsers.filter((user) => {
      if (!user.birthDate) return false;
      return isBirthdayToday(user.birthDate);
    });
  }, [users]);

  // Handle Window Resize (Confetti)
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  return (
    <div
      className="relative rounded-2xl p-6 h-70vh overflow-hidden group transition-all duration-500"
      style={{
        ...currentGlassStyle,
        background: isDarkMode
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
      }}
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-linear-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-linear-to-r from-yellow-500/20 to-orange-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Confetti for birthdays */}
      {birthdayUsers.length > 0 && (
        <>
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={birthdayUsers.length * 50}
            recycle={true}
            gravity={0.1}
            colors={["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"]}
          />

          {/* Extra floating elements */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl opacity-10 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                }}
              >
                🎂
              </div>
            ))}
          </div>
        </>
      )}

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center p-4 rounded-2xl backdrop-blur-sm mb-4"
            style={{
              background: isDarkMode
                ? "rgba(139, 92, 246, 0.2)"
                : "rgba(139, 92, 246, 0.1)",
              border: isDarkMode
                ? "1px solid rgba(139, 92, 246, 0.3)"
                : "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <h2 className="text-2xl font-bold bg-linear-to-r from-green-600 to-gray-600 bg-clip-text text-transparent">
              🎉 {t("home.Today’s Birthdays") || "Today's Birthdays"}
            </h2>
          </div>

          {birthdayUsers.length > 0 && (
            <div
              className="px-4 py-2 rounded-full inline-flex items-center ml-3 gap-2 backdrop-blur-sm "
              style={{
                background: isDarkMode
                  ? "rgba(139, 92, 246, 0.2)"
                  : "rgba(139, 92, 246, 0.1)",
                border: isDarkMode
                  ? "1px solid rgba(139, 92, 246, 0.2)"
                  : "1px solid rgba(139, 92, 246, 0.1)",
              }}
            >
              <span className="w-2 h-2 bg-linear-to-r from-green-500 to-gray-900 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {birthdayUsers.length} birthday
                {birthdayUsers.length !== 1 ? "s" : ""} today!
              </span>
            </div>
          )}
        </div>

        {/* ✅ Logic: Check isLoading first, but prevent loading screen if data exists */}
        {isLoading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full backdrop-blur-sm animate-spin border-4 border-transparent border-t-purple-500 border-r-pink-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🎂</span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {t("home.Loading birthdays...") || "Loading birthdays..."}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Checking for celebrations...
            </p>
          </div>
        ) : birthdayUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div
                className="w-24 h-24 rounded-2xl backdrop-blur-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{
                  background: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.3)",
                  border: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.05)",
                }}
              >
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"
                  />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-linear-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm shadow-lg">
                ?
              </div>
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-3">
              {t("home.No birthdays today.") || "No birthdays today."}
            </p>
            <p
              className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto backdrop-blur-sm p-3 rounded-xl"
              style={{
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.02)",
              }}
            >
              No cake today, but check back tomorrow for celebrations! 🎂
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-hidden overflow-x-hidden  pr-1 space-y-4">
            {birthdayUsers.map((user, index) => {
              const age = calculateAge(user.birthDate);
              const formattedDate = formatBirthDate(user.birthDate);

              return (
                <div
                  key={user.userId}
                  className="relative rounded-xl p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group/card overflow-hidden"
                  style={{
                    background: isDarkMode
                      ? `rgba(139, 92, 246, ${0.2 + index * 0.02})`
                      : `rgba(255, 255, 255, ${0.7 - index * 0.02})`,
                    border: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.1)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {/* Glow effect on hover */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.1), transparent 50%)",
                    }}
                  ></div>

                  <div className="relative z-10 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg backdrop-blur-sm group-hover/card:scale-110 transition-transform duration-300"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))",
                          border: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.2)"
                            : "1px solid rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        <span className="text-2xl">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div
                        className="absolute -top-3 -right-3 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg animate-bounce"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(236, 72, 153, 0.9))",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        <span className="text-lg">🎂</span>
                      </div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-linear-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-xs font-bold text-white shadow-md">
                        {age}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate group-hover/card:text-transparent group-hover/card:bg-clip-text group-hover/card:bg-linear-to-r group-hover/card:from-purple-600 group-hover/card:to-pink-600 transition-all duration-300">
                        {user.full_name}
                      </h3>

                      <div className="flex flex-wrap gap-2 mt-2 mb-3">
                        <span
                          className="text-xs px-3 py-1 rounded-full backdrop-blur-sm truncate max-w-[120px]"
                          style={{
                            background: isDarkMode
                              ? "rgba(30, 41, 59, 0.5)"
                              : "rgba(255, 255, 255, 0.5)",
                            border: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {user.employee_code}
                        </span>
                        <span
                          className="text-xs px-3 py-1 rounded-full backdrop-blur-sm truncate max-w-[140px]"
                          style={{
                            background: isDarkMode
                              ? "rgba(139, 92, 246, 0.2)"
                              : "rgba(139, 92, 246, 0.1)",
                            border: isDarkMode
                              ? "1px solid rgba(139, 92, 246, 0.3)"
                              : "1px solid rgba(139, 92, 246, 0.2)",
                          }}
                        >
                          {user.department || "No Department"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className="text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1"
                          style={{
                            background: isDarkMode
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(16, 185, 129, 0.1)",
                            border: isDarkMode
                              ? "1px solid rgba(16, 185, 129, 0.3)"
                              : "1px solid rgba(16, 185, 129, 0.2)",
                          }}
                        >
                          <span className="text-xs">🎂</span>
                          <span className="font-medium">{formattedDate}</span>
                        </span>

                        <span
                          className="text-xs px-3 py-1 rounded-full backdrop-blur-sm truncate max-w-[120px]"
                          style={{
                            background: isDarkMode
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(59, 130, 246, 0.1)",
                            border: isDarkMode
                              ? "1px solid rgba(59, 130, 246, 0.3)"
                              : "1px solid rgba(59, 130, 246, 0.2)",
                          }}
                        >
                          {getRoleName(user.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating action button or info */}
        <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div
            className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 backdrop-blur-sm p-3 rounded-xl"
            style={{
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.02)",
            }}
          >
            <span className="w-2 h-2 bg-linear-to-r from-purple-500 to-pink-500 rounded-full"></span>
            <span>
              {birthdayUsers.length > 0
                ? `Wish them a happy birthday! 🎉`
                : `Next birthday might be tomorrow! 🎂`}
            </span>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BirthdayCardList;
