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
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.employeeCode.toLowerCase().includes(term) ||
          user.designation.toLowerCase().includes(term) ||
          user.department.toLowerCase().includes(term),
      );
    }

    // Apply filters
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Employee Leave Balance
          </h1>
          <p className="text-gray-600 mt-2">
            Track and manage employee leave balances
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.isActiveEmployee).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">L</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg. Leave Utilization</p>
                <p className="text-2xl font-bold">
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, employee code, or department..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${selectedFilters.activeOnly ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                onClick={() =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    activeOnly: !prev.activeOnly,
                  }))
                }
              >
                <Filter className="h-4 w-4" />
                {selectedFilters.activeOnly ? "Active Only" : "All Employees"}
              </button>

              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
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
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            Showing {filteredUsers.length} of {users.length} employees
          </p>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department/Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Casual Leave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sick Leave
                  </th>
                  <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const utilization = calculateLeaveUtilization(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-bold">
                                {user.fullName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.employeeCode}
                              </div>
                            </div>
                          </div>
                          {user.zone && (
                            <div className="mt-2 text-xs text-gray-500">
                              {user.zone} • {user.city}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.department}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.designation}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.role}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Applied:
                            </span>
                            <span className="font-medium">
                              {user.leaves.casual.totalAllocated}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Used:</span>
                            <span className="font-medium">
                              {user.leaves.casual.used}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Available:
                            </span>
                            <span
                              className={`font-medium ${user.leaves.casual.available < 5 ? "text-yellow-600" : "text-green-600"}`}
                            >
                              {user.leaves.casual.available}
                            </span>
                          </div>
                          {user.leaves.casual.pending > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-yellow-600">
                                Pending:
                              </span>
                              <span className="font-medium text-yellow-600">
                                {user.leaves.casual.pending}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Applied:
                            </span>
                            <span className="font-medium">
                              {user.leaves.sick.totalAllocated}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Used:</span>
                            <span className="font-medium">
                              {user.leaves.sick.used}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Available:
                            </span>
                            <span
                              className={`font-medium ${user.leaves.sick.available < 3 ? "text-yellow-600" : "text-green-600"}`}
                            >
                              {user.leaves.sick.available}
                            </span>
                          </div>
                          {user.leaves.sick.pending > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-yellow-600">
                                Pending:
                              </span>
                              <span className="font-medium text-yellow-600">
                                {user.leaves.sick.pending}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                            <span className="ml-2 text-sm font-medium">
                              {Math.round(utilization.utilizationRate)}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {utilization.used} of {utilization.total} days used
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isActiveEmployee)}`}
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
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-500">
                No employees found matching your search criteria
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Low utilization (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Moderate utilization (50-75%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>High utilization (&gt;75%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalancePage;
