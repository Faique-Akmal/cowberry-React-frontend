import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import axios from "axios";
import API from "../../api/axios";

interface AttendanceRecord {
  name: string; // User's name
  start: number; // Start time in hours (decimal)
  end: number;   // End time in hours (decimal)
}

interface User {
  id: number;
  username: string;
  department?: string;
}

export default function AttendanceChart({ userRole, department }: { userRole: string; department?: string }) {
  const [chartData, setChartData] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        let users: User[] = [];

        if (userRole === "Admin") {
          const res = await API.get("/users/"); // API to get all users
          users = res.data;
        } else if (userRole === "department_head" || userRole === "manager") {
          const res = await API.get(`/users?department=${department}`); // API to get only dept users
          users = res.data;
        }

        const attendanceData: AttendanceRecord[] = [];

        for (const user of users) {
          const startRes = await API.get(`/attendance-start?user=${user.id}`);
          const endRes = await API.get(`/attendance-end?user=${user.id}`);

          const startTime = startRes.data?.start_time
            ? new Date(startRes.data.start_time)
            : null;
          const endTime = endRes.data?.end_time
            ? new Date(endRes.data.end_time)
            : null;

          if (startTime && endTime) {
            attendanceData.push({
              name: user.username,
              start: startTime.getHours() + startTime.getMinutes() / 60,
              end: endTime.getHours() + endTime.getMinutes() / 60,
            });
          }
        }

        setChartData(attendanceData);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchAttendanceData();
  }, [userRole, department]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 w-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-gray-800">Attendance Overview</h4>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorStart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEnd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 24]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}:00`} />
          <Tooltip
            formatter={(value: number) => `${Math.floor(value)}:${Math.round((value % 1) * 60).toString().padStart(2, "0")}`}
            labelFormatter={(label) => `User: ${label}`}
          />
          <Legend verticalAlign="top" height={30} />
          <Area
            type="monotone"
            dataKey="start"
            name="Attendance Start"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorStart)"
          />
          <Area
            type="monotone"
            dataKey="end"
            name="Attendance End"
            stroke="#f59e0b"
            fillOpacity={1}
            fill="url(#colorEnd)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
