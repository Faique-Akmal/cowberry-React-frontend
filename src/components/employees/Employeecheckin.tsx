import React, { useEffect, useState, useCallback } from 'react';
import API from '../../api/axios';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Hash, 
  Clock,
  LogIn,
  LogOut,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CheckLog {
  userId: number;
  username: string;
  employee_code: string;
  logType: 'check_in' | 'check_out';
  timestamp: string;
}

interface CheckLogsResponse {
  success: boolean;
  total: number;
  data: CheckLog[];
}

interface GroupedLog {
  userId: number;
  username: string;
  employee_code: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInTimestamp: string | null;
  checkOutTimestamp: string | null;
}

const EmployeeCheckin = () => {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<CheckLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'employee_code'>('username');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [filteredLogs, setFilteredLogs] = useState<GroupedLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch check logs
  const fetchCheckLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await API.get<CheckLogsResponse>('/admin/check-logs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const logsData = response.data.data;
        const sortedLogs = logsData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sortedLogs);
        
        // Group logs by user and date
        const grouped = groupLogsByUserAndDate(sortedLogs);
        setFilteredLogs(grouped);
      }
    } catch (error) {
      console.error('Error fetching check logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Group logs by user and date
  const groupLogsByUserAndDate = (logs: CheckLog[]): GroupedLog[] => {
    const grouped = new Map<string, GroupedLog>();

    logs.forEach(log => {
      const date = new Date(log.timestamp).toDateString();
      const key = `${log.userId}-${date}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          userId: log.userId,
          username: log.username,
          employee_code: log.employee_code,
          date: date,
          checkInTime: null,
          checkOutTime: null,
          checkInTimestamp: null,
          checkOutTimestamp: null,
        });
      }

      const entry = grouped.get(key)!;
      if (log.logType === 'check_in') {
        entry.checkInTime = formatTime(log.timestamp);
        entry.checkInTimestamp = log.timestamp;
      } else {
        entry.checkOutTime = formatTime(log.timestamp);
        entry.checkOutTimestamp = log.timestamp;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = new Date(a.checkInTimestamp || a.checkOutTimestamp || 0);
      const dateB = new Date(b.checkInTimestamp || b.checkOutTimestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  useEffect(() => {
    fetchCheckLogs();
  }, [fetchCheckLogs]);

  // Apply filters
  useEffect(() => {
    let result = groupLogsByUserAndDate(logs);

    if (searchQuery.trim()) {
      result = result.filter(log => {
        if (searchType === 'username') {
          return log.username.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          return log.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
        }
      });
    }

    if (startDate && endDate) {
      result = result.filter(log => {
        const logDate = new Date(log.checkInTimestamp || log.checkOutTimestamp || '');
        return logDate >= startDate && logDate <= endDate;
      });
    } else if (startDate) {
      result = result.filter(log => {
        const logDate = new Date(log.checkInTimestamp || log.checkOutTimestamp || '');
        return logDate >= startDate;
      });
    } else if (endDate) {
      result = result.filter(log => {
        const logDate = new Date(log.checkInTimestamp || log.checkOutTimestamp || '');
        return logDate <= endDate;
      });
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [logs, searchQuery, searchType, startDate, endDate]);

  // Get unique users count
  const uniqueUsersCount = new Set(logs.map(log => log.userId)).size;

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange([null, null]);
    setSearchType('username');
  };

  const exportToCSV = () => {
    const headers = ['Username', 'Employee Code', 'Date', 'Check-in Time', 'Check-out Time'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${log.username}"`,
        `"${log.employee_code}"`,
        `"${log.date}"`,
        `"${log.checkInTime || 'N/A'}"`,
        `"${log.checkOutTime || 'N/A'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `check_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div 
      style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }} 
      className="min-h-screen p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                Employee Check Logs
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Monitor employee check-in and check-out activities
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm md:text-base"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={fetchCheckLogs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
                  <p className="text-2xl font-bold mt-1">{logs.length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unique Employees</p>
                  <p className="text-2xl font-bold mt-1">{uniqueUsersCount}</p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-ins</p>
                  <p className="text-2xl font-bold mt-1">
                    {logs.filter(log => log.logType === 'check_in').length}
                  </p>
                </div>
                <LogIn className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-outs</p>
                  <p className="text-2xl font-bold mt-1">
                    {logs.filter(log => log.logType === 'check_out').length}
                  </p>
                </div>
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search by ${searchType === 'username' ? 'username' : 'employee code'}`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'username' | 'employee_code')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="username">Username</option>
                  <option value="employee_code">Employee Code</option>
                </select>
              </div>
            </div>

            {/* Date Range Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => {
                    setDateRange(update);
                  }}
                  isClearable={true}
                  placeholderText="Select date range"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || startDate || endDate) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  {searchType === 'username' ? 'Username' : 'Employee Code'}: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    ×
                  </button>
                </span>
              )}
              {startDate && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                  From: {startDate.toLocaleDateString()}
                  <button
                    onClick={() => setDateRange([null, endDate])}
                    className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                  >
                    ×
                  </button>
                </span>
              )}
              {endDate && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                  To: {endDate.toLocaleDateString()}
                  <button
                    onClick={() => setDateRange([startDate, null])}
                    className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Employee Logs</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredLogs.length} of {logs.length} total logs
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages || 1}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading check logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Eye className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No logs found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-750">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Employee Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Check-out Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {log.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{log.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Hash className="w-4 h-4" />
                            {log.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(log.checkInTimestamp || log.checkOutTimestamp || '')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.checkInTime ? (
                            <div className="flex items-center gap-2">
                              <LogIn className="w-4 h-4 text-green-500" />
                              <span className="font-medium text-green-700 dark:text-green-400">{log.checkInTime}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.checkOutTime ? (
                            <div className="flex items-center gap-2">
                              <LogOut className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-red-700 dark:text-red-400">{log.checkOutTime}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.checkInTime && log.checkOutTime
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : log.checkInTime
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          }`}>
                            {log.checkInTime && log.checkOutTime
                              ? 'Complete'
                              : log.checkInTime
                              ? 'Checked In'
                              : 'Checked Out Only'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} logs
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeCheckin;