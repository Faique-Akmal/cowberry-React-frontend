import React, { useEffect, useState } from "react";
import {
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import API from "../../api/axios";
import { role } from "../../store/store";

export default function EcommerceMetrics() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [departmentHeadCount, setDepartmentHeadCount] = useState(0);
  const [managerCount, setManagerCount] = useState(0);
  const [hrCount, setHrCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getRoleName = (roleId: number): string => {
    const roleObj = role.find((r) => r.id === roleId);
    return roleObj ? roleObj.name.toLowerCase() : "unknown";
  };

  const fetchAllUsers = async () => {
    let page = 1;
    let allUsers: any[] = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await API.get("/users/", {
          params: { page },
        });

        const pageUsers = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
          ? response.data
          : [];

        allUsers = [...allUsers, ...pageUsers];

        // For DRF-style pagination
        hasMore = !!response.data.next;
        page++;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }

    return allUsers;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const users = await fetchAllUsers();

      const roleCounts = {
        employee: 0,
        department_head: 0,
        manager: 0,
        hr: 0,
      };

      users.forEach((user) => {
        const roleId = user.role || user.user_role || user.type;
        const roleName = getRoleName(Number(roleId));
        if (roleCounts[roleName] !== undefined) {
          roleCounts[roleName]++;
        }
      });

      setTotalUsers(roleCounts.employee);
      setDepartmentHeadCount(roleCounts.department_head);
      setManagerCount(roleCounts.manager);
      setHrCount(roleCounts.hr);
      setLoading(false);
    };

    fetchData();
  }, []);

  const cards = [
    {
      title: "Total Employees",
      value: loading ? "..." : totalUsers.toLocaleString(),
      icon: <GroupIcon className="h-6 w-6 text-indigo-600" />,
      iconBg: "bg-indigo-100",
    },
    {
      title: "Total Department Heads",
      value: loading ? "..." : departmentHeadCount.toLocaleString(),
      icon: <GroupIcon className="h-6 w-6 text-yellow-500" />,
      iconBg: "bg-yellow-100",
    },
    {
      title: "Total Managers",
      value: loading ? "..." : managerCount.toLocaleString(),
      icon: <GroupIcon className="h-6 w-6 text-green-600" />,
      iconBg: "bg-green-100",
    },
    {
      title: "Total HR",
      value: loading ? "..." : hrCount.toLocaleString(),
      icon: <BoxIconLine className="h-6 w-6 text-orange-500" />,
      iconBg: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 dark:text-gray-300 font-medium">
                {card.title}
              </h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
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
