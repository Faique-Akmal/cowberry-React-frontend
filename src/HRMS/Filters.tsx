import React, { useState } from "react";
import { Department, Zone, FilterUser } from "../types/leave";

interface FiltersProps {
  filters: {
    status: string;
    leaveType: string;
    search: string;
    departmentId: string;
    zoneId: string;
    userId: string;
    year: string;
    startDate: string;
    endDate: string;
  };
  departments: Department[];
  zones: Zone[];
  users: FilterUser[];
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  userRole: string;
  onApplyFilters?: () => void; // Add this prop
}

const Filters: React.FC<FiltersProps> = ({
  filters,
  departments,
  zones,
  users,
  onFilterChange,
  onReset,
  userRole,
  onApplyFilters, // Add this
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempSearch, setTempSearch] = useState(filters.search);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const leaveTypeOptions = [
    { value: "", label: "All Types" },
    { value: "CASUAL", label: "Casual" },
    { value: "SICK", label: "Sick" },
    { value: "COMPENSATORY", label: "Compensatory" },
    { value: "MATERNITY", label: "Maternity" },
    { value: "PATERNITY", label: "Paternity" },
  ];

  const yearOptions = [
    { value: "2026", label: "2026" },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
  ];

  const handleSearchApply = () => {
    onFilterChange("search", tempSearch);
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchApply();
    }
  };

  const handleSearchClear = () => {
    setTempSearch("");
    onFilterChange("search", "");
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  // Filter users based on role
  const filteredUsers = users.filter((user) => {
    if (userRole === "MANAGER") {
      const userDept = departments.find(
        (d) => d.id === parseInt(filters.departmentId),
      );
      return userDept ? user.department === userDept.name : true;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search with Apply Button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by name, employee code..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tempSearch && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleSearchApply}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
            >
              Search
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Press Enter or click Search to apply
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type
          </label>
          <select
            value={filters.leaveType}
            onChange={(e) => onFilterChange("leaveType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {leaveTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange("year", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 border-t pt-4">
          {/* Department - only for HR and Manager */}
          {(userRole === "HR" || userRole === "MANAGER") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.departmentId}
                onChange={(e) => onFilterChange("departmentId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zone
            </label>
            <select
              value={filters.zoneId}
              onChange={(e) => onFilterChange("zoneId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} ({zone.city})
                </option>
              ))}
            </select>
          </div>

          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <select
              value={filters.userId}
              onChange={(e) => onFilterChange("userId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Employees</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Actions */}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onReset}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default Filters;
