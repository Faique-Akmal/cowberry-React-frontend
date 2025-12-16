import React, { useEffect, useState } from "react";
import { GroupIcon } from "../../icons";
import { CiUser } from "react-icons/ci";
import { FcDepartment } from "react-icons/fc";
import { GrUserManager } from "react-icons/gr";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useData } from "../../context/DataProvider";

export default function Metrics() {
    const { themeConfig, isDarkMode } = useTheme();
    const { fetchUsers } = useData();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [roleStats, setRoleStats] = useState({
        employee: 0,
        department_head: 0,
        hod: 0,
        hr: 0,
        admin: 0,
    });
    const [totalUsers, setTotalUsers] = useState(0);

    useEffect(() => {
        const loadUserStats = async () => {
            try {
                setLoading(true);
                const result = await fetchUsers();
                
                if (result.success) {
                    const users = result.data || [];
                    
                    // Calculate total users
                    setTotalUsers(users.length);
                    
                    // Count users by role
                    const stats = {
                        employee: users.filter(user => 
                            user.role?.toLowerCase() === 'fieldemployee' || 
                            user.role?.toLowerCase() === 'employee'
                        ).length,
                        department_head: users.filter(user => 
                            user.role?.toLowerCase() === 'department_head'
                        ).length,
                        hod: users.filter(user => 
                            user.role?.toLowerCase() === 'hod'
                        ).length,
                        hr: users.filter(user => 
                            user.role?.toLowerCase() === 'hr'
                        ).length,
                        admin: users.filter(user => 
                            user.role?.toLowerCase() === 'admin'
                        ).length,
                    };
                    
                    setRoleStats(stats);
                } else {
                    // console.error('Failed to fetch users:', result.error);
                }
            } catch (error) {
                // console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserStats();
    }, [fetchUsers]);

    // Glassmorphism styles based on theme
    const glassStyles = {
        light: {
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)'
        },
        dark: {
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }
    };

    const currentGlassStyle = isDarkMode ? glassStyles.dark : glassStyles.light;

    const cards = [
        {
            title: t("home.Total Users"),
            value: loading ? "..." : totalUsers.toLocaleString(),
            icon: <CiUser className="h-3 w-3" />,
            iconColor: "text-indigo-600 dark:text-indigo-400",
            iconBg: "bg-indigo-100/80 dark:bg-indigo-900/30",
            gradient: "from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent"
        },
        {
            title: t("home.Field Employees"),
            value: loading ? "..." : roleStats.employee.toLocaleString(),
            icon: <GroupIcon className="h-3 w-3" />,
            iconColor: "text-blue-600 dark:text-blue-400",
            iconBg: "bg-blue-100/80 dark:bg-blue-900/30",
            gradient: "from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent"
        },
        {
            title: t("home.Total Managers"),
            value: loading ? "..." : roleStats.department_head.toLocaleString(),
            icon: <FcDepartment className="h-3 w-3" />,
            iconColor: "text-yellow-600 dark:text-yellow-400",
            iconBg: "bg-yellow-100/80 dark:bg-yellow-900/30",
            gradient: "from-yellow-50/50 to-transparent dark:from-yellow-950/20 dark:to-transparent"
        },
        // {
        //     title: t("home.Total HOD"),
        //     value: loading ? "..." : roleStats.hod.toLocaleString(),
        //     icon: <GrUserManager className="h-3 w-3" />,
        //     iconColor: "text-green-600 dark:text-green-400",
        //     iconBg: "bg-green-100/80 dark:bg-green-900/30",
        //     gradient: "from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent"
        // },
        {
            title: t("home.Total HR"),
            value: loading ? "..." : roleStats.hr.toLocaleString(),
            icon: <GrUserManager className="h-3 w-3" />,
            iconColor: "text-orange-600 dark:text-orange-400",
            iconBg: "bg-orange-100/80 dark:bg-orange-900/30",
            gradient: "from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent"
        },
        {
            title: t("home.Total Admin"),
            value: loading ? "..." : roleStats.admin.toLocaleString(),
            icon: <GrUserManager className="h-3 w-3" />,
            iconColor: "text-purple-600 dark:text-purple-400",
            iconBg: "bg-purple-100/80 dark:bg-purple-900/30",
            gradient: "from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent"
        },
    ];

    return (
        <div className="grid grid-cols- gap-3 md:grid-cols-3 lg:grid-cols-5 p-4 w-full">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`
                        relative rounded-2xl p-4 w-full flex flex-col justify-between 
                        hover:scale-[1.02] transition-all duration-300
                        before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br ${card.gradient}
                        overflow-hidden group
                    `}
                    style={{
                        ...currentGlassStyle,
                        backgroundColor: isDarkMode 
                            ? 'rgba(30, 41, 59, 0.7)' 
                            : 'rgba(255, 255, 255, 0.7)',
                    }}
                >
                    {/* Optional: Subtle background pattern */}
                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-r from-current to-transparent opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    </div>

                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h4 className={`
                                text-sm font-medium 
                                ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                                mb-2
                            `}>
                                {card.title}
                            </h4>
                            <p className={`
                                text-3xl font-bold 
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}
                                mt-1
                            `}>
                                {card.value}
                            </p>
                        </div>
                        <div className={`
                            p-3 rounded-full backdrop-blur-sm 
                            ${card.iconBg} 
                            transition-transform duration-300 
                            group-hover:scale-110
                        `}>
                            <div className={card.iconColor}>
                                {card.icon}
                            </div>
                        </div>
                    </div>

                    {/* Optional: Progress indicator or decorative element */}
                    <div className={`
                        relative mt-4 h-1 w-full rounded-full 
                        ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}
                        overflow-hidden
                    `}>
                        <div className={`
                            absolute inset-0 w-0 group-hover:w-full 
                            ${card.iconBg.replace('bg-', 'bg-gradient-to-r from-').replace('/80', '')} 
                            transition-all duration-500 ease-out
                        `}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}