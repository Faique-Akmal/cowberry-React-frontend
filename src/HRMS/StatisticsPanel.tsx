import React, { useMemo } from "react";
import { Statistics } from "../types/leaves";

interface StatisticsPanelProps {
  statistics: Statistics | null;
  leaves?: any[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  leaves = [],
}) => {
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
    LEAVEWITHOUTPAY: "bg-orange-100 text-orange-800",
  };

  // Calculate statistics from leaves if statistics is null/empty
  const calculatedStats = useMemo(() => {
    if (statistics && statistics.total > 0) {
      return statistics;
    }

    // Calculate from leaves array
    const currentYear = new Date().getFullYear();
    let currentYearPendingCount = 0;
    let currentYearPendingDays = 0;

    const byStatus: { [key: string]: { count: number; totalDays: number } } =
      {};
    const byType: { [key: string]: { count: number; totalDays: number } } = {};

    leaves.forEach((leave) => {
      // Current year pending
      const leaveYear = new Date(leave.createdAt).getFullYear();
      if (leaveYear === currentYear && leave.status === "PENDING") {
        currentYearPendingCount++;
        currentYearPendingDays += leave.totalDays || 0;
      }

      // By status
      const status = leave.status || "UNKNOWN";
      if (!byStatus[status]) {
        byStatus[status] = { count: 0, totalDays: 0 };
      }
      byStatus[status].count++;
      byStatus[status].totalDays += leave.totalDays || 0;

      // By type
      const type = leave.leaveType || "UNKNOWN";
      if (!byType[type]) {
        byType[type] = { count: 0, totalDays: 0 };
      }
      byType[type].count++;
      byType[type].totalDays += leave.totalDays || 0;
    });

    return {
      total: leaves.length,
      currentYear: {
        pending: {
          count: currentYearPendingCount,
          totalDays: currentYearPendingDays,
        },
      },
      byStatus,
      byType,
      byStatusAndType: {},
    };
  }, [statistics, leaves]);

  // Don't render if no data at all
  if (!statistics && leaves.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Safe access to properties with defaults
  const safeTotal = calculatedStats.total || 0;
  const safeCurrentYear = calculatedStats.currentYear || {
    pending: { count: 0, totalDays: 0 },
  };

  // Ensure byStatus and byType are properly formatted
  const safeByStatus = calculatedStats.byStatus || {};
  const safeByType = calculatedStats.byType || {};

  // Function to safely get status display name
  const getStatusDisplayName = (status: any): string => {
    if (typeof status === "string") return status;
    if (status && typeof status === "object" && "name" in status) {
      return String(status.name);
    }
    return String(status);
  };

  // Function to safely get type display name
  const getTypeDisplayName = (type: any): string => {
    if (typeof type === "string") return type;
    if (type && typeof type === "object" && "name" in type) {
      return String(type.name);
    }
    return String(type);
  };

  // Function to safely get count and days
  const getCountAndDays = (data: any) => {
    if (data && typeof data === "object") {
      return {
        count: data.count || 0,
        totalDays: data.totalDays || 0,
      };
    }
    return { count: 0, totalDays: 0 };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Total Leaves
        </h3>
        <div className="text-3xl font-bold text-gray-900">{safeTotal}</div>
        {leaves.length > 0 && !statistics && (
          <div className="text-xs text-gray-500 mt-1">
            Calculated from displayed leaves
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Current Year Pending
        </h3>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {safeCurrentYear.pending?.count || 0}
            </div>
            <div className="text-sm text-gray-600">
              {safeCurrentYear.pending?.totalDays || 0} days
            </div>
          </div>
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
            Pending
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">By Status</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(safeByStatus).length > 0 ? (
            Object.entries(safeByStatus).map(([statusKey, data]) => {
              const displayName = getStatusDisplayName(statusKey);
              const { count, totalDays } = getCountAndDays(data);

              return (
                <div
                  key={displayName}
                  className="flex justify-between items-center"
                >
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusColors[displayName] || "bg-gray-100 text-gray-800"}`}
                  >
                    {displayName}
                  </span>
                  <div className="text-right">
                    <div className="font-medium">{count}</div>
                    <div className="text-xs text-gray-600">
                      {totalDays} days
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 text-sm py-2">
              No status data available
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">By Type</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(safeByType).length > 0 ? (
            Object.entries(safeByType).map(([typeKey, data]) => {
              const displayName = getTypeDisplayName(typeKey);
              const { count, totalDays } = getCountAndDays(data);

              return (
                <div
                  key={displayName}
                  className="flex justify-between items-center"
                >
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${typeColors[displayName] || "bg-gray-100 text-gray-800"}`}
                  >
                    {displayName}
                  </span>
                  <div className="text-right">
                    <div className="font-medium">{count}</div>
                    <div className="text-xs text-gray-600">
                      {totalDays} days
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 text-sm py-2">
              No type data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
