import React, { useEffect, useState, useRef, useCallback } from 'react';
import API from '../../api/axios';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { 
  Users, 
  Mail, 
  Activity, 
  CheckCircle, 
  XCircle,
  Filter,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  is_checkin: boolean;
  employee_code: string;
  address: string;
  department: string | null;
  date?: string;
}

interface ApiResponse {
  results?: User[];
  data?: User[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

const StatusPill = ({ status }: { status: string }) => {
  const isActive = status === 'Active';
  const colorClass = isActive ? 'bg-green-500' : 'bg-red-500';
  const Icon = isActive ? CheckCircle : XCircle;
  
  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2">
      <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${colorClass} flex-shrink-0`} />
      <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="text-xs sm:text-sm text-gray-800 truncate">{status}</span>
    </div>
  );
};

const HomeOfficePill = ({ active }: { active: boolean }) => (
  <span
    className={`text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border flex items-center justify-center ${
      active 
        ? 'text-green-600 border-green-500 bg-green-50 dark:bg-green-900/20' 
        : 'text-gray-500 border-gray-300 bg-gray-50 dark:bg-gray-800'
    }`}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
);

const EmployeeStatus = () => {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const limit = 10;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await API.get<ApiResponse>(`/admin/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit,
          offset,
        },
      });

      let fetchedUsers: User[] = [];
      
      if (Array.isArray(response.data)) {
        fetchedUsers = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        fetchedUsers = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        fetchedUsers = response.data.data;
      } else if (Array.isArray(response.data)) {
        fetchedUsers = response.data;
      }

      if (fetchedUsers.length < limit) setHasMore(false);

      setUsers((prev) => {
        if (offset === 0) {
          return fetchedUsers;
        }
        const merged = [...prev, ...fetchedUsers];
        const unique = merged.filter(
          (user, index, self) => index === self.findIndex((u) => u.userId === user.userId)
        );
        return unique;
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      setHasMore(false);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setOffset((prev) => prev + limit);
    }
  };

  const toggleActiveFilter = () => {
    setShowActiveOnly(!showActiveOnly);
  };

  const usersArray = Array.isArray(users) ? users : [];
  const filteredUsers = showActiveOnly 
    ? usersArray.filter(user => user.is_checkin === true)
    : usersArray;
  const activeUsersCount = usersArray.filter(user => user.is_checkin === true).length;
  const totalUsersCount = usersArray.length;

  return (
    <div 
      style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }} 
      className="bg-white shadow-md rounded-xl p-4 sm:p-6 h-full dark:bg-gray-900 dark:text-white"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            <h2 className="text-lg sm:text-xl font-semibold">Employee Status</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-green-600 dark:text-green-400">{activeUsersCount}</span> active • 
            <span className="font-medium text-gray-700 dark:text-gray-300 ml-1">{totalUsersCount}</span> total
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-gray-500 sm:hidden">
            <Smartphone className="w-3 h-3" />
            <Tablet className="w-3 h-3" />
            <Monitor className="w-3 h-3" />
          </div>
          
          <button 
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
              showActiveOnly 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
            }`}
            onClick={toggleActiveFilter}
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">
              {showActiveOnly ? 'Show All' : 'Active Only'}
            </span>
            <span className="xs:hidden">
              {showActiveOnly ? 'All' : 'Active'}
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Headers - Hidden on mobile */}
      <div className="hidden md:grid md:grid-cols-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-gray-700">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {t("location.Employee Name")}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="w-4 h-4" />
          {t("profile.Email")}
        </span>
        <span className="flex items-center gap-1">
          <Activity className="w-4 h-4" />
          CHECK-IN STATUS
        </span>
        <span>{t("attendence.Status")}</span>
      </div>

      {/* Mobile Headers - Visible only on mobile */}
      <div className="md:hidden text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
        <div className="flex justify-between items-center px-2">
          <span>Employees ({filteredUsers.length})</span>
          <span className="text-green-600 dark:text-green-400">{activeUsersCount} active</span>
        </div>
      </div>

      {/* Users List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-y-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] custom-scrollbar"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-sm text-gray-500">Loading employees...</p>
          </div>
        )}
        
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {showActiveOnly ? 'No active employees found' : 'No employees found'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && filteredUsers.map((user) => (
          <div 
            key={user.userId} 
            className="md:grid md:grid-cols-4 py-3 md:py-4 border-b last:border-none dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {/* Mobile Layout */}
            <div className="md:hidden p-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm capitalize truncate">{user.name}</p>
                      <HomeOfficePill active={user.is_checkin} />
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 capitalize bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {user.role || 'Field Employee'}
                      </span>
                      <span className="text-xs text-gray-400">{user.employee_code}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-2">
                  <StatusPill status={user.is_checkin ? 'Active' : 'Inactive'} />
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center flex-shrink-0">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm capitalize truncate">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{user.role || 'Field Employee'}</p>
                <p className="text-xs text-gray-400 truncate">{user.employee_code}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center">
              <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{user.email}</p>
            </div>

            <div className="hidden md:flex items-center">
              <HomeOfficePill active={user.is_checkin} />
            </div>

            <div className="hidden md:flex items-center">
              <StatusPill status={user.is_checkin ? 'Active' : 'Inactive'} />
            </div>
          </div>
        ))}
        
        {!hasMore && filteredUsers.length > 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Showing {filteredUsers.length} of {totalUsersCount} employees
            </p>
          </div>
        )}
      </div>

      {/* Stats Footer - Mobile Only */}
      <div className="md:hidden mt-4 pt-4 border-t dark:border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="text-center">
            <div className="text-green-600 dark:text-green-400 font-semibold">{activeUsersCount}</div>
            <div>Active</div>
          </div>
          <div className="text-center">
            <div className="text-gray-700 dark:text-gray-300 font-semibold">{totalUsersCount}</div>
            <div>Total</div>
          </div>
          <div className="text-center">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">
              {Math.round((activeUsersCount / (totalUsersCount || 1)) * 100)}%
            </div>
            <div>Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatus;