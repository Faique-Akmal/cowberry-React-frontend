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

const dummyChartData = [
  { name: "5k", Sales: 25, Profit: 20 },
  { name: "10k", Sales: 70, Profit: 30 },
  { name: "15k", Sales: 40, Profit: 25 },
  { name: "20k", Sales: 35, Profit: 20 },
  { name: "25k", Sales: 55, Profit: 45 },
  { name: "30k", Sales: 50, Profit: 35 },
  { name: "35k", Sales: 45, Profit: 90 },
  { name: "40k", Sales: 60, Profit: 50 },
  { name: "45k", Sales: 65, Profit: 60 },
  { name: "50k", Sales: 40, Profit: 35 },
  { name: "55k", Sales: 80, Profit: 55 },
  { name: "60k", Sales: 30, Profit: 20 },
];

export default function RevenueChart() {
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  useEffect(() => {
    // Replace with your actual user ID or fetch dynamically
    const userId = 14;

    // Fetch attendance start time
    axios
      .get(`/attendance-start?user=${userId}`)
      .then((res) => {
        const time = res.data?.start_time;
        if (time) setStartTime(new Date(time).toLocaleTimeString());
      })
      .catch((err) => {
        console.error("Failed to fetch start time", err);
      });

    // Fetch attendance end time
    axios
      .get(`/attendance-end?user=${userId}`)
      .then((res) => {
        const time = res.data?.end_time;
        if (time) setEndTime(new Date(time).toLocaleTimeString());
      })
      .catch((err) => {
        console.error("Failed to fetch end time", err);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 w-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-gray-800">Employee Attendance</h4>
        <select className="text-sm border border-gray-200 rounded px-2 py-1">
          <option>October</option>
          <option>September</option>
          <option>August</option>
        </select>
      </div>

      {/* Display attendance times */}
      <div className="mb-4 text-sm text-gray-600">
        <p>Start Time: <span className="font-medium">{startTime || "Loading..."}</span></p>
        <p>End Time: <span className="font-medium">{endTime || "Loading..."}</span></p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={dummyChartData}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend verticalAlign="top" height={30} />
          <Area
            type="monotone"
            dataKey="Sales"
            stroke="#c084fc"
            fillOpacity={1}
            fill="url(#colorSales)"
          />
          <Area
            type="monotone"
            dataKey="Profit"
            stroke="#fb7185"
            fillOpacity={1}
            fill="url(#colorProfit)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
