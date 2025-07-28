import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  department_name: string;
}

interface DepartmentCount {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  "#1E40AF", "#DC2626", "#059669", "#D97706", "#7C3AED",
  "#DB2777", "#0891B2", "#65A30D", "#C2410C", "#7C2D12",
];

export default function EmployeeChart() {
  const [data, setData] = useState<DepartmentCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let allUsers: User[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await API.get("/users/", { params: { page } });
        let users: User[] = [];

        if (Array.isArray(res.data)) {
          users = res.data;
          hasMore = false;
        } else if (res.data.results) {
          users = res.data.results;
          hasMore = !!res.data.next;
        } else if (res.data.data) {
          users = res.data.data;
          hasMore = false;
        } else {
          console.warn("Unexpected response:", res.data);
          hasMore = false;
        }

        allUsers = [...allUsers, ...users];
        page += 1;
      }

      const departmentMap: { [key: string]: number } = {};
      allUsers.forEach((user) => {
        const dept = user.department_name?.trim() || "Admins";
        departmentMap[dept] = (departmentMap[dept] || 0) + 1;
      });

      const chartData = Object.entries(departmentMap).map(([name, value], i) => ({
        name,
        value,
        color: COLORS[i % COLORS.length],
      })).sort((a, b) => b.value - a.value);

      setData(chartData);
      setTotalEmployees(chartData.reduce((sum, item) => sum + item.value, 0));
    } catch (e) {
      console.error("Error:", e);
      setError("Failed to fetch employee data.");
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / totalEmployees) * 100).toFixed(1);
      return (
        <div className="bg-white p-2 rounded shadow text-sm border border-gray-200">
          <p className="font-semibold text-gray-700">{item.name}</p>
          <p>Employees: <span className="text-blue-600 font-bold">{item.value}</span></p>
          <p>Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="p-8 flex justify-center items-center text-gray-600">Loading chart...</div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-600">
      <p>{error}</p>
      <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Employee Distribution by Department
      </h2>

      <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={130}
                stroke="#ffffff"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center mt-4 text-sm text-gray-600">
            Total Employees: <span className="font-bold text-blue-600">{totalEmployees}</span>
          </p>
        </div>

        {/* Legend with Alternating Styles */}
        <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.map((item, index) => {
            const percentage = ((item.value / totalEmployees) * 100).toFixed(1);
            const alignRight = index % 2 === 1;

            return (
              <div
                key={index}
                className={`bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col justify-between ${
                  alignRight ? "sm:ml-auto" : "sm:mr-auto"
                } w-full sm:w-[90%]`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <h4 className="font-semibold text-gray-800">{item.name}</h4>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Employees: <span className="font-bold">{item.value}</span></p>
                  <p>Share: {percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
