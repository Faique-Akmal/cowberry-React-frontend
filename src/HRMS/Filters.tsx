import React, { useState, useEffect } from "react";
import { Department, Zone, FilterUser } from "../types/leaves";

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
  onApplyFilters: () => void;
}

const Filters: React.FC<FiltersProps> = ({
  filters,
  departments,
  zones,
  users,
  onFilterChange,
  onReset,
  userRole,
  onApplyFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempSearch, setTempSearch] = useState(filters.search);
  const [filteredUsers, setFilteredUsers] = useState<FilterUser[]>([]);

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
    { value: "LEAVEWITHOUTPAY", label: "Leave Without Pay" },
  ];

  // Filter users based on role and department
  useEffect(() => {
    if (userRole === "MANAGER" && filters.departmentId) {
      const department = departments.find(
        (d) => d.id.toString() === filters.departmentId,
      );
      if (department) {
        const filtered = users.filter(
          (user) => user.department === department.name,
        );
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers([]);
      }
    } else {
      setFilteredUsers(users);
    }
  }, [users, userRole, filters.departmentId, departments]);

  const handleSearchApply = () => {
    console.log("Applying search:", tempSearch);
    onFilterChange("search", tempSearch);
    onApplyFilters();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchApply();
    }
  };

  const handleSearchClear = () => {
    console.log("Clearing search");
    setTempSearch("");
    onFilterChange("search", "");
    onApplyFilters();
  };

  // Sync tempSearch with filters.search when filters change externally
  useEffect(() => {
    setTempSearch(filters.search);
  }, [filters.search]);

  // Debug log for search
  useEffect(() => {
    console.log("Search state:", {
      tempSearch,
      filtersSearch: filters.search,
      shouldApply: tempSearch !== filters.search,
    });
  }, [tempSearch, filters.search]);

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

      {/* Main filters - 3 columns layout with full width */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Search with Apply Button - Takes full width of its column */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Employees
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by name, employee code, designation..."
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
            Search by: name, employee code, or designation
          </div>
          {tempSearch && tempSearch !== filters.search && (
            <div className="text-xs text-yellow-600 mt-1">
              Press Enter or click Search to apply
            </div>
          )}
        </div>

        {/* Status */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => {
              console.log("Status changed to:", e.target.value);
              onFilterChange("status", e.target.value);
              onApplyFilters();
            }}
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
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type
          </label>
          <select
            value={filters.leaveType}
            onChange={(e) => {
              console.log("Leave type changed to:", e.target.value);
              onFilterChange("leaveType", e.target.value);
              onApplyFilters();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {leaveTypeOptions.map((option) => (
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
                onChange={(e) => {
                  onFilterChange("departmentId", e.target.value);
                  onApplyFilters();
                }}
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
              onChange={(e) => {
                onFilterChange("zoneId", e.target.value);
                onApplyFilters();
              }}
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
              onChange={(e) => {
                onFilterChange("userId", e.target.value);
                onApplyFilters();
              }}
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
                onChange={(e) => {
                  onFilterChange("startDate", e.target.value);
                  onApplyFilters();
                }}
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
                onChange={(e) => {
                  onFilterChange("endDate", e.target.value);
                  onApplyFilters();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Actions */}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onApplyFilters}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Apply All Filters
        </button>
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
