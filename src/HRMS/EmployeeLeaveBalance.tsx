import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { APIResponse, UserLeaveDetails } from "../types/leaves";
import API from "../api/axios";

const LeaveBalancePage: React.FC = () => {
  const [users, setUsers] = useState<UserLeaveDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserLeaveDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    department: "",
    role: "",
    activeOnly: true,
  });

  useEffect(() => {
    fetchLeaveData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedFilters, users]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/leaves/users/leave-details");

      if (!response.data) {
        throw new Error("Failed to fetch leave data");
      }

      const data: APIResponse = await response.data;

      if (data.success) {
        setUsers(data.data.users);
        setFilteredUsers(data.data.users);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((user) => {
        // Safe check for each property
        const fullName = user.fullName ? user.fullName.toLowerCase() : "";
        const email = user.email ? user.email.toLowerCase() : "";
        const employeeCode = user.employeeCode
          ? user.employeeCode.toLowerCase()
          : "";
        const designation = user.designation
          ? user.designation.toLowerCase()
          : "";
        const department = user.department ? user.department.toLowerCase() : "";

        return (
          fullName.includes(term) ||
          email.includes(term) ||
          employeeCode.includes(term) ||
          designation.includes(term) ||
          department.includes(term)
        );
      });
    }

    // Apply filters - add null checks here too
    if (selectedFilters.department) {
      filtered = filtered.filter(
        (user) => user.department === selectedFilters.department,
      );
    }

    if (selectedFilters.role) {
      filtered = filtered.filter((user) => user.role === selectedFilters.role);
    }

    if (selectedFilters.activeOnly) {
      filtered = filtered.filter((user) => user.isActiveEmployee);
    }

    setFilteredUsers(filtered);
  };

  const getDepartments = () => {
    return Array.from(new Set(users.map((user) => user.department))).sort();
  };

  const getRoles = () => {
    return Array.from(new Set(users.map((user) => user.role))).sort();
  };

  const calculateLeaveUtilization = (user: UserLeaveDetails) => {
    const totalLeaves =
      user.leaves.casual.totalAllocated + user.leaves.sick.totalAllocated;
    const usedLeaves = user.leaves.casual.used + user.leaves.sick.used;
    const availableLeaves =
      user.leaves.casual.available + user.leaves.sick.available;

    return {
      total: totalLeaves,
      used: usedLeaves,
      available: availableLeaves,
      utilizationRate: totalLeaves > 0 ? (usedLeaves / totalLeaves) * 100 : 0,
    };
  };

  const getStatusColor = (status: boolean) => {
    return status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getUtilizationColor = (rate: number) => {
    if (rate < 50) return "bg-green-500";
    if (rate < 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Error: {error}</p>
          <button
            onClick={fetchLeaveData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-full overflow-hidden">
        {/* Header */}
        <div className="mb-6 md:mb-8 px-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Employee Leave Balance
          </h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
            Track and manage employee leave balances
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm text-gray-600">
                  Total Employees
                </p>
                <p className="text-xl md:text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm text-gray-600">
                  Active Employees
                </p>
                <p className="text-xl md:text-2xl font-bold">
                  {users.filter((u) => u.isActiveEmployee).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="h-6 w-6 md:h-8 md:w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm md:text-base">
                  L
                </span>
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm text-gray-600">
                  Avg. Leave Utilization
                </p>
                <p className="text-xl md:text-2xl font-bold">
                  {Math.round(
                    users.reduce(
                      (acc, user) =>
                        acc + calculateLeaveUtilization(user).utilizationRate,
                      0,
                    ) / users.length || 0,
                  )}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Simplified */}
        <div className="bg-white rounded-lg shadow mb-4 md:mb-6 p-3 md:p-4">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                className="flex-1 min-w-[calc(50%-4px)] md:min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={selectedFilters.department}
                onChange={(e) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
              >
                <option value="">All Departments</option>
                {getDepartments().map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                className="flex-1 min-w-[calc(50%-4px)] md:min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={selectedFilters.role}
                onChange={(e) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                <option value="">All Roles</option>
                {getRoles().map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <button
                className={`flex-1 min-w-[140px] px-3 py-2 text-sm rounded-lg flex items-center justify-center gap-1 ${selectedFilters.activeOnly ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                onClick={() =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    activeOnly: !prev.activeOnly,
                  }))
                }
              >
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                {selectedFilters.activeOnly ? "Active Only" : "All"}
              </button>

              <button
                className="flex-1 min-w-[140px] px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => {
                  setSelectedFilters({
                    department: "",
                    role: "",
                    activeOnly: true,
                  });
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-3">
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} employees
          </p>
        </div>

        {/* Employee Table - Fixed width issue */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                    Department/Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Casual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Sick
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Utilization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const utilization = calculateLeaveUtilization(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      {/* Employee Column */}
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <div className="flex items-center">
                            <div className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {user.fullName?.charAt(0) || "?"}
                              </span>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <div className="font-medium text-gray-900 text-sm md:text-base truncate">
                                {user.fullName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.email}
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.employeeCode}
                              </div>
                            </div>
                          </div>
                          {(user.zone || user.city) && (
                            <div className="mt-1 text-xs text-gray-500 truncate">
                              {user.zone && <>{user.zone} • </>}
                              {user.city}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Department/Role Column */}
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {user.department}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.designation}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {user.role}
                          </div>
                        </div>
                      </td>

                      {/* Casual Leave Column */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">
                              {user.leaves.casual.totalAllocated}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Used:</span>
                            <span className="font-medium">
                              {user.leaves.casual.used}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Avail:</span>
                            <span
                              className={`font-medium ${user.leaves.casual.available < 5 ? "text-yellow-600" : "text-green-600"}`}
                            >
                              {user.leaves.casual.available}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sick Leave Column */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">
                              {user.leaves.sick.totalAllocated}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Used:</span>
                            <span className="font-medium">
                              {user.leaves.sick.used}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Avail:</span>
                            <span
                              className={`font-medium ${user.leaves.sick.available < 3 ? "text-yellow-600" : "text-green-600"}`}
                            >
                              {user.leaves.sick.available}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Utilization Column */}
                      <td className="px-4 py-4">
                        <div>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUtilizationColor(utilization.utilizationRate)}`}
                                style={{
                                  width: `${Math.min(utilization.utilizationRate, 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs font-medium">
                              {Math.round(utilization.utilizationRate)}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {utilization.used}/{utilization.total} days
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActiveEmployee)}`}
                        >
                          {user.isActiveEmployee ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-10 w-10 text-gray-400 mx-auto" />
              <p className="mt-3 text-gray-500">
                No employees found matching your search criteria
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 md:mt-6 text-xs md:text-sm text-gray-600">
          <div className="flex flex-wrap gap-2 md:gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded"></div>
              <span>Low (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded"></div>
              <span>Moderate (50-75%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded"></div>
              <span>High (&gt;75%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalancePage;
