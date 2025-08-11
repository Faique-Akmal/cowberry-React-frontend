import React, { useEffect, useState } from "react";
import { GroupIcon } from "../../icons";
import API from "../../api/axios";
import { CiUser } from "react-icons/ci";
import { FcDepartment } from "react-icons/fc";
import { GrUserManager } from "react-icons/gr";

export default function Metrics() {
  const [loading, setLoading] = useState(true);
  const [roleStats, setRoleStats] = useState({
    employee: 0,
    department_head: 0,
    manager: 0,
    hr: 0,
    admin:0,
  });
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchEmployeeStats = async () => {
    try {
      const response = await API.get("/employee-stats/");
      const combinations = response.data?.department_role_combination || [];

      const counts: any = {
        employee: 0,
        department_head: 0,
        manager: 0,
        hr: 0,
        admin:0,
      };

      let total = 0;

      combinations.forEach((item: any) => {
        const role = item.role__name?.toLowerCase();
        const count = item.count || 0;

        if (counts.hasOwnProperty(role)) {
          counts[role] += count;
        }

        total += count;
      });

      setRoleStats(counts);
      setTotalUsers(total);
    } catch (error) {
      console.error("Failed to fetch employee stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeStats();
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: loading ? "..." : totalUsers.toLocaleString(),
      icon: <CiUser className="h-6 w-6 text-indigo-600" />,
      iconBg: "bg-indigo-100",
    },
    {
      title: "Total Employees",
      value: loading ? "..." : roleStats.employee.toLocaleString(),
      icon: <GroupIcon className="h-6 w-6 text-indigo-600" />,
      iconBg: "bg-indigo-100",
    },
    {
      title: "Total Department Heads",
      value: loading ? "..." : roleStats.department_head.toLocaleString(),
      icon: <FcDepartment className="h-6 w-6 text-yellow-500" />,
      iconBg: "bg-yellow-100",
    },
    {
      title: "Total Managers",
      value: loading ? "..." : roleStats.manager.toLocaleString(),
      icon: <GrUserManager className="h-6 w-6 text-green-600" />,
      iconBg: "bg-green-100",
    },
    {
      title: "Total HR",
      value: loading ? "..." : roleStats.hr.toLocaleString(),
      icon: <GrUserManager className="h-6 w-6 text-orange-500" />,
      iconBg: "bg-orange-100",
    },
     {
      title: "Total Admin",
      value: loading ? "..." : roleStats.admin.toLocaleString(),
      icon: <GrUserManager className="h-6 w-6 text-blue-500" />,
      iconBg: "bg-blue-100",
    },
  ];

  return (
   <div className="grid grid-cols-2 gap-4 md:grid-cols-3 w-full">
  {cards.map((card, index) => (
    <div
      key={index}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 w-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm text-black dark:text-gray-300 font-medium">
            {card.title}
          </h4>
          <p className="text-3xl font-bold text-gray-500 dark:text-white mt-2">
            {card.value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${card.iconBg}`}>{card.icon}</div>
      </div>
    </div>
  ))}
</div>

  );
}
