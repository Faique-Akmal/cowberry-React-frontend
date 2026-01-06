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
  Eye,
  Tag
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
//   <div 
//   style={{
//     backgroundColor: themeConfig.content.background,
//     color: themeConfig.content.text,
//   }} 
//   className="
//     min-h-screen p-4 md:p-6
//     bg-white/10 dark:bg-black/20
//     backdrop-blur-2xl
//     relative
//   "
// >

<div className="
  w-full
  max-w-[100vw] // Prevents horizontal overflow
  overflow-x-hidden // Ensures no horizontal scroll
  bg-gradient-to-br from-white/10 via-white/5 to-white/2
  dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-900/5
  backdrop-blur-2xl
  border border-white/30 dark:border-white/10
  shadow-[0_8px_32px_rgba(31,38,135,0.15)]
  dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]
  rounded-3xl 
  p-3 sm:p-4 lg:p-6
  relative
">
  {/* Optional background gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
  
  {/* Header */}
 <div className="mb-4 relative z-10">
  {/* Header with actions */}
  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <h1 className="text-base sm:text-lg font-bold truncate">
          Employee Check Logs
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 truncate">
        Monitor employee check-in and check-out activities
      </p>
    </div>
    <div className="flex gap-1.5 flex-shrink-0">
      <button
        onClick={exportToCSV}
        className="
          flex items-center gap-1 px-2.5 py-1.5
          bg-gradient-to-r from-green-500 to-emerald-600 
          text-white rounded-lg hover:from-green-600 hover:to-emerald-700 
          transition-all shadow hover:shadow-md text-xs
          whitespace-nowrap
        "
      >
        <Download className="w-3 h-3" />
        <span>Export CSV</span>
      </button>
      <button
        onClick={fetchCheckLogs}
        className="
          flex items-center gap-1 px-2.5 py-1.5
          bg-gradient-to-r from-blue-500 to-cyan-600 
          text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 
          transition-all shadow hover:shadow-md text-xs
          whitespace-nowrap
        "
      >
        <RefreshCw className="w-3 h-3" />
        <span>Refresh</span>
      </button>
    </div>
  </div>

  {/* Compact Stats Cards */}
  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-4">
   <div className="
  flex items-center gap-2
  bg-white/30 dark:bg-gray-800/30
  backdrop-blur-lg
  border border-white/40 dark:border-gray-700/40
  rounded-xl p-2.5
  shadow-sm
  hover:shadow-md
  transition-all duration-300
  min-w-0
">
  {/* Check-ins card */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs text-gray-600 dark:text-gray-300 truncate mb-0.5">Check-ins</p>
        <p className="text-lg font-bold truncate">
          {logs.filter(log => log.logType === 'check_in').length}
        </p>
      </div>
      <div className="
        p-1.5 rounded-lg flex-shrink-0 ml-2
        bg-gradient-to-br from-purple-500/10 to-pink-500/10
        border border-purple-500/20
      ">
        <LogIn className="w-5 h-5 text-purple-500" />
      </div>
    </div>
  </div>
  
  {/* Separator */}
  <div className="h-8 w-px bg-gray-300/50 dark:bg-gray-600/50 mx-1"></div>
  
  {/* Check-outs card */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs text-gray-600 dark:text-gray-300 truncate mb-0.5">Check-outs</p>
        <p className="text-lg font-bold truncate">
          {logs.filter(log => log.logType === 'check_out').length}
        </p>
      </div>
      <div className="
        p-1.5 rounded-lg flex-shrink-0 ml-2
        bg-gradient-to-br from-red-500/10 to-orange-500/10
        border border-red-500/20
      ">
        <LogOut className="w-5 h-5 text-red-500" />
      </div>
    </div>
  </div>
</div>
  </div>
</div>

  {/* Filters Section with Glassmorphism - Improved responsiveness */}
<div className="
  bg-gradient-to-br from-white/40 to-white/20
  dark:from-gray-800/40 dark:to-gray-900/20
  backdrop-blur-xl
  border border-white/40 dark:border-gray-700/40
  rounded-xl sm:rounded-2xl p-3 sm:p-4
  shadow-[0_8px_32px_rgba(31,38,135,0.1)]
  dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
  mb-6
  // REMOVED: overflow-hidden
">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="
        p-1.5 rounded-lg flex-shrink-0
        bg-gradient-to-br from-blue-500/10 to-cyan-500/10
        border border-blue-500/20
      ">
        <Filter className="w-4 h-4 text-blue-500" />
      </div>
      <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
        Filters
      </h2>
    </div>
    
    {/* Clear button moved to top right */}
    <button
      onClick={clearFilters}
      className="
        px-3 py-1.5
        bg-gradient-to-r from-gray-200/50 to-gray-300/30
        dark:from-gray-700/50 dark:to-gray-800/30
        backdrop-blur-sm
        border border-gray-300/60 dark:border-gray-600/60
        text-gray-700 dark:text-gray-300
        rounded-lg
        hover:from-gray-300/60 hover:to-gray-400/40
        dark:hover:from-gray-600/60 dark:hover:to-gray-700/40
        transition-all duration-300
        shadow-sm hover:shadow
        text-xs sm:text-sm
      "
    >
      Clear
    </button>
  </div>

  {/* Filters in single line */}
  <div className="flex flex-col sm:flex-row gap-2">
    {/* Search input with dropdown */}
    <div className="flex-1 min-w-0">
      <div className="relative">
        <div className="
          absolute left-2.5 top-1/2 transform -translate-y-1/2
          p-1 rounded-md
          bg-white/50 dark:bg-gray-700/50
          backdrop-blur-sm
          z-10
        ">
          <Search className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search by ${searchType === 'username' ? 'username' : 'employee code'}`}
          className="
            w-full pl-9 pr-24 py-2
            bg-white/50 dark:bg-gray-700/50
            backdrop-blur-sm
            border border-white/60 dark:border-gray-600/60
            rounded-lg
            focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
            focus:outline-none
            transition-all duration-300
            text-sm
          "
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as 'username' | 'employee_code')}
          className="
            absolute right-1 top-1/2 transform -translate-y-1/2
            px-2 py-1
            bg-white/50 dark:bg-gray-700/50
            backdrop-blur-sm
            border border-white/60 dark:border-gray-600/60
            rounded-lg
            focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
            focus:outline-none
            transition-all duration-300
            text-xs
            w-20
          "
        >
          <option value="username">User</option>
          <option value="employee_code">Emp ID</option>
        </select>
      </div>
    </div>

    {/* Date Range Picker - FIXED VERSION */}
    <div className="flex-1 min-w-0 relative">
      <div className="relative">
        <div className="
          absolute left-2.5 top-1/2 transform -translate-y-1/2
          p-1 rounded-md
          bg-white/50 dark:bg-gray-700/50
          backdrop-blur-sm
          z-30
          pointer-events-none
        ">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <DatePicker
          selectsRange={true}
          startDate={startDate}
          endDate={endDate}
          onChange={(update) => {
            setDateRange(update);
          }}
          isClearable={true}
          placeholderText="Date range"
          className="
            w-full pl-9 pr-3 py-2
            bg-white/50 dark:bg-gray-700/50
            backdrop-blur-sm
            border border-white/60 dark:border-gray-600/60
            rounded-lg
            focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
            focus:outline-none
            transition-all duration-300
            text-sm
            relative
            z-20
          "
          // Use portal to render outside the container
          withPortal
          portalId="datepicker-portal"
          popperClassName="z-[9999]"
          calendarClassName="z-[9999]"
          // Adjust calendar position
          popperPlacement="bottom-start"
          popperModifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                padding: 10,
              },
            },
          ]}
        />
      </div>
    </div>
  </div>

  {/* Active Filters - Only shown when filters are active */}
  {(searchQuery || startDate || endDate) && (
    <div className="mt-3 p-2 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/40 dark:border-gray-700/40">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Tag className="w-3 h-3 text-blue-500 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Active Filters
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {searchQuery && (
          <span className="
            inline-flex items-center gap-1 px-1.5 py-0.5
            bg-gradient-to-r from-blue-100/80 to-cyan-100/60
            dark:from-blue-900/40 dark:to-cyan-900/30
            backdrop-blur-sm
            border border-blue-200/60 dark:border-blue-700/40
            text-blue-800 dark:text-blue-300
            rounded text-xs
            truncate max-w-[150px]
          ">
            <span className="truncate">
              {searchType === 'username' ? '👤' : '🔢'}: {searchQuery}
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="
                ml-0.5 p-0.5 rounded flex-shrink-0
                hover:bg-blue-200/50 dark:hover:bg-blue-700/50
                transition-colors text-[10px]
              "
            >
              ×
            </button>
          </span>
        )}
        {startDate && (
          <span className="
            inline-flex items-center gap-1 px-1.5 py-0.5
            bg-gradient-to-r from-green-100/80 to-emerald-100/60
            dark:from-green-900/40 dark:to-emerald-900/30
            backdrop-blur-sm
            border border-green-200/60 dark:border-green-700/40
            text-green-800 dark:text-green-300
            rounded text-xs
            truncate max-w-[120px]
          ">
            <span className="truncate">📅 {formatDate(startDate.toISOString())}</span>
            <button
              onClick={() => setDateRange([null, endDate])}
              className="
                ml-0.5 p-0.5 rounded flex-shrink-0
                hover:bg-green-200/50 dark:hover:bg-green-700/50
                transition-colors text-[10px]
              "
            >
              ×
            </button>
          </span>
        )}
        {endDate && (
          <span className="
            inline-flex items-center gap-1 px-1.5 py-0.5
            bg-gradient-to-r from-purple-100/80 to-pink-100/60
            dark:from-purple-900/40 dark:to-pink-900/30
            backdrop-blur-sm
            border border-purple-200/60 dark:border-purple-700/40
            text-purple-800 dark:text-purple-300
            rounded text-xs
            truncate max-w-[100px]
          ">
            <span className="truncate">→ {formatDate(endDate.toISOString())}</span>
            <button
              onClick={() => setDateRange([startDate, null])}
              className="
                ml-0.5 p-0.5 rounded flex-shrink-0
                hover:bg-purple-200/50 dark:hover:bg-purple-700/50
                transition-colors text-[10px]
              "
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  )}
</div>

  {/* Table Section with Glassmorphism - Improved responsiveness */}
  <div className="
    bg-gradient-to-br from-white/40 to-white/20
    dark:from-gray-800/40 dark:to-gray-900/20
    backdrop-blur-xl
    border border-white/40 dark:border-gray-700/40
    rounded-xl sm:rounded-2xl
    shadow-[0_8px_32px_rgba(31,38,135,0.1)]
    dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
    overflow-hidden
  ">
    <div className="
      p-3 sm:p-4
      border-b border-white/30 dark:border-gray-700/30
      bg-gradient-to-r from-white/50 to-transparent
      dark:from-gray-800/50 dark:to-transparent
    ">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent truncate">
            Employee Logs
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            Showing {filteredLogs.length} of {logs.length} total logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="
            px-2 py-1
            bg-white/50 dark:bg-gray-700/50
            backdrop-blur-sm
            border border-white/60 dark:border-gray-600/60
            rounded-md
            text-xs text-gray-700 dark:text-gray-300
            whitespace-nowrap
          ">
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>
      </div>
    </div>

    {loading ? (
      <div className="p-6 text-center">
        <div className="
          animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2
          backdrop-blur-sm
        "></div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading check logs...</p>
      </div>
    ) : filteredLogs.length === 0 ? (
      <div className="p-6 text-center">
        <div className="
          w-12 h-12 mx-auto mb-2
          bg-gradient-to-br from-gray-200/50 to-gray-300/30
          dark:from-gray-700/50 dark:to-gray-800/30
          backdrop-blur-sm
          border border-gray-300/60 dark:border-gray-600/60
          rounded-xl flex items-center justify-center
        ">
          <Eye className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">No logs found</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Try adjusting your filters or check back later
        </p>
      </div>
    ) : (
      <>
        {/* Table - Improved for mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px] sm:min-w-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="
                  bg-gradient-to-r from-white/60 to-white/40
                  dark:from-gray-800/60 dark:to-gray-900/40
                  backdrop-blur-md
                ">
                  <tr>
                    {[
                      { key: 'username', label: 'Username', className: 'w-[180px] sm:w-auto' },
                      { key: 'employee_code', label: 'Employee Code', className: 'w-[120px] sm:w-auto' },
                      { key: 'date', label: 'Date', className: 'w-[100px] sm:w-auto' },
                      { key: 'check_in', label: 'Check-in', className: 'w-[80px] sm:w-auto' },
                      { key: 'check_out', label: 'Check-out', className: 'w-[80px] sm:w-auto' },
                      { key: 'status', label: 'Status', className: 'w-[100px] sm:w-auto' }
                    ].map((header, idx) => (
                      <th
                        key={`${header.key}-${idx}`}
                        className={`
                          px-2 sm:px-3 py-2 text-left text-xs font-semibold
                          text-gray-600 dark:text-gray-300
                          uppercase tracking-wider
                          border-b border-white/30 dark:border-gray-700/30
                          backdrop-blur-sm
                          whitespace-nowrap
                          ${header.className}
                        `}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20 dark:divide-gray-700/20">
                  {paginatedLogs.map((log, index) => (
                    <tr
                      key={index}
                      className="
                        hover:bg-white/30 dark:hover:bg-gray-800/30
                        transition-all duration-300
                        backdrop-blur-sm
                      "
                    >
                      {/* Username */}
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="
                            w-6 h-6 sm:w-8 sm:h-8 rounded-lg
                            bg-gradient-to-br from-blue-500/20 to-cyan-500/20
                            border border-blue-500/30
                            flex items-center justify-center
                            backdrop-blur-sm
                            flex-shrink-0
                          ">
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                              {log.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {log.username}
                          </span>
                        </div>
                      </td>
                      
                      {/* Employee Code */}
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <div className="
                            p-1 rounded-md
                            bg-gradient-to-br from-gray-100/50 to-gray-200/30
                            dark:from-gray-700/50 dark:to-gray-800/30
                            backdrop-blur-sm
                          ">
                            <Hash className="w-3 h-3" />
                          </div>
                          <span className="text-xs sm:text-sm truncate">{log.employee_code}</span>
                        </div>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <div className="
                            p-1 rounded-md
                            bg-gradient-to-br from-yellow-100/50 to-orange-100/30
                            dark:from-yellow-900/30 dark:to-orange-900/20
                            backdrop-blur-sm
                          ">
                            <Calendar className="w-3 h-3" />
                          </div>
                          <span className="text-xs truncate">
                            {formatDate(log.checkInTimestamp || log.checkOutTimestamp || '')}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        {log.checkInTime ? (
                          <div className="flex items-center gap-1.5">
                            <div className="
                              p-1 rounded-md
                              bg-gradient-to-br from-green-100/50 to-emerald-100/30
                              dark:from-green-900/30 dark:to-emerald-900/20
                              backdrop-blur-sm
                            ">
                              <LogIn className="w-3 h-3 text-green-500" />
                            </div>
                            <span className="text-xs font-medium text-green-700 dark:text-green-400 truncate">
                              {log.checkInTime}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">N/A</span>
                        )}
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        {log.checkOutTime ? (
                          <div className="flex items-center gap-1.5">
                            <div className="
                              p-1 rounded-md
                              bg-gradient-to-br from-red-100/50 to-pink-100/30
                              dark:from-red-900/30 dark:to-pink-900/20
                              backdrop-blur-sm
                            ">
                              <LogOut className="w-3 h-3 text-red-500" />
                            </div>
                            <span className="text-xs font-medium text-red-700 dark:text-red-400 truncate">
                              {log.checkOutTime}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">N/A</span>
                        )}
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <span className={`
                          px-2 py-1 rounded-lg text-xs font-medium
                          backdrop-blur-sm border inline-block truncate
                          ${log.checkInTime && log.checkOutTime
                            ? 'bg-gradient-to-r from-blue-100/60 to-cyan-100/40 border-blue-200/60 text-blue-800 dark:from-blue-900/40 dark:to-cyan-900/30 dark:border-blue-700/40 dark:text-blue-300'
                            : log.checkInTime
                            ? 'bg-gradient-to-r from-green-100/60 to-emerald-100/40 border-green-200/60 text-green-800 dark:from-green-900/40 dark:to-emerald-900/30 dark:border-green-700/40 dark:text-green-300'
                            : 'bg-gradient-to-r from-yellow-100/60 to-amber-100/40 border-yellow-200/60 text-yellow-800 dark:from-yellow-900/40 dark:to-amber-900/30 dark:border-yellow-700/40 dark:text-yellow-300'
                          }
                        `}>
                          {log.checkInTime && log.checkOutTime
                            ? 'Complete'
                            : log.checkInTime
                            ? 'Checked In'
                            : 'Checked Out'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination with Glassmorphism - Improved for mobile */}
        {totalPages > 1 && (
          <div className="
            border-t border-white/30 dark:border-gray-700/30
            p-3 sm:p-4
            bg-gradient-to-r from-white/40 to-transparent
            dark:from-gray-800/40 dark:to-transparent
            backdrop-blur-lg
          ">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="
                    px-2 sm:px-3 py-1.5
                    bg-white/40 dark:bg-gray-700/40
                    backdrop-blur-sm
                    border border-white/60 dark:border-gray-600/60
                    rounded-lg
                    text-gray-700 dark:text-gray-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-white/60 dark:hover:bg-gray-600/60
                    transition-all duration-300
                    shadow-sm hover:shadow
                    text-xs
                  "
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(totalPages, 3))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`
                          px-2 sm:px-3 py-1.5 rounded-lg 
                          transition-all duration-300 text-xs
                          backdrop-blur-sm border shadow-sm hover:shadow
                          ${currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-blue-500/60'
                            : 'bg-white/40 dark:bg-gray-700/40 border-white/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
                          }
                        `}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 3 && currentPage < totalPages - 1 && (
                    <span className="px-1 text-gray-500">...</span>
                  )}
                  {totalPages > 3 && currentPage < totalPages - 1 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`
                        px-2 sm:px-3 py-1.5 rounded-lg 
                        transition-all duration-300 text-xs
                        backdrop-blur-sm border shadow-sm hover:shadow
                        ${currentPage === totalPages
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-blue-500/60'
                          : 'bg-white/40 dark:bg-gray-700/40 border-white/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
                        }
                      `}
                    >
                      {totalPages}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="
                    px-2 sm:px-3 py-1.5
                    bg-white/40 dark:bg-gray-700/40
                    backdrop-blur-sm
                    border border-white/60 dark:border-gray-600/60
                    rounded-lg
                    text-gray-700 dark:text-gray-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-white/60 dark:hover:bg-gray-600/60
                    transition-all duration-300
                    shadow-sm hover:shadow
                    text-xs
                  "
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
  );
};

export default EmployeeCheckin;