import React from "react";
import { Statistics } from "../types/leaves";

interface StatisticsPanelProps {
  statistics: Statistics;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics }) => {
  const statusColors: { [key: string]: string } = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const typeColors: { [key: string]: string } = {
    CASUAL: "bg-blue-100 text-blue-800",
    SICK: "bg-purple-100 text-purple-800",
    COMPENSATORY: "bg-indigo-100 text-indigo-800",
    MATERNITY: "bg-pink-100 text-pink-800",
    PATERNITY: "bg-teal-100 text-teal-800",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Total Leaves
        </h3>
        <div className="text-3xl font-bold text-gray-900">
          {statistics.total}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Current Year Pending
        </h3>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {statistics.currentYear.pending.count}
            </div>
            <div className="text-sm text-gray-600">
              {statistics.currentYear.pending.totalDays} days
            </div>
          </div>
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
            Pending
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">By Status</h3>
        <div className="space-y-2">
          {Object.entries(statistics.byStatus).map(([status, data]) => (
            <div key={status} className="flex justify-between items-center">
              <span
                className={`px-2 py-1 rounded-full text-xs ${statusColors[status] || "bg-gray-100 text-gray-800"}`}
              >
                {status}
              </span>
              <div className="text-right">
                <div className="font-medium">{data.count}</div>
                <div className="text-xs text-gray-600">
                  {data.totalDays} days
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">By Type</h3>
        <div className="space-y-2">
          {Object.entries(statistics.byType).map(([type, data]) => (
            <div key={type} className="flex justify-between items-center">
              <span
                className={`px-2 py-1 rounded-full text-xs ${typeColors[type] || "bg-gray-100 text-gray-800"}`}
              >
                {type}
              </span>
              <div className="text-right">
                <div className="font-medium">{data.count}</div>
                <div className="text-xs text-gray-600">
                  {data.totalDays} days
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
