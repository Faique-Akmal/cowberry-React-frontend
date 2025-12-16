import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Monitor,
  Radio
} from 'lucide-react';
import { useData } from '../../context/DataProvider';

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

const StatusPill = ({ status }: { status: string }) => {
  const isActive = status === 'Active';
  const colorClass = isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500';
  const Icon = isActive ? CheckCircle : XCircle;
  
  return (
    <div className="flex items-center space-x-2 backdrop-blur-sm rounded-full px-3 py-1.5"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${colorClass} flex-shrink-0`} />
      <Icon className="w-4 h-4 flex-shrink-0 text-white" />
      <span className="text-sm font-medium text-white truncate">{status}</span>
    </div>
  );
};

const HomeOfficePill = ({ active }: { active: boolean }) => (
  <div
    className="text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center justify-center gap-1.5 transition-all duration-300"
    style={{
      background: active 
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))'
        : 'rgba(255, 255, 255, 0.1)',
      border: active 
        ? '1px solid rgba(34, 197, 94, 0.3)'
        : '1px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
    <span className={`font-medium ${active ? 'text-green-100' : 'text-gray-300'}`}>
      {active ? 'Online Now' : 'Offline'}
    </span>
  </div>
);

const EmployeeStatus = () => {
  const { themeConfig, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { fetchUsers, users: dataProviderUsers, loading: usersLoading } = useData();
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const limit = 10;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Glassmorphism styles
  const glassStyles = {
    light: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
    },
    dark: {
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }
  };

  const currentGlassStyle = isDarkMode ? glassStyles.dark : glassStyles.light;

  // Load users from data provider
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const result = await fetchUsers();
        
        if (result.success && result.data) {
          const users = Array.isArray(result.data) ? result.data : [];
          setLocalUsers(users);
          
          const activeUsers = users.filter(user => user.is_checkin === true);
          setActiveUsersCount(activeUsers.length);
          setTotalUsers(users.length);
          setHasMore(result.hasMore || false);
        } else {
          setLocalUsers([]);
        }
      } catch (error) {
        setLocalUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (dataProviderUsers && dataProviderUsers.length > 0) {
      const users = Array.isArray(dataProviderUsers) ? dataProviderUsers : [];
      setLocalUsers(users);
      
      const activeUsers = users.filter(user => user.is_checkin === true);
      setActiveUsersCount(activeUsers.length);
      setTotalUsers(users.length);
      setLoading(usersLoading);
    }
  }, [dataProviderUsers, usersLoading]);

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

  const filteredUsers = localUsers.filter(user => user.is_checkin === true);

  return (
    <div 
      className="relative rounded-2xl p-6 h-full overflow-hidden group transition-all duration-500 hover:shadow-2xl"
      style={{
        ...currentGlassStyle,
        background: isDarkMode 
          ? 'rgba(15, 23, 42, 0.7)' 
          : 'rgba(255, 255, 255, 0.7)',
      }}
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Pulsing activity indicator */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
          <div className="absolute top-0 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-2xl backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Live Status
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 font-bold">{activeUsersCount}</span> online
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    of <span className="font-semibold">{totalUsers}</span> total
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Active users badge */}
            <div className="px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 group/online"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <div className="relative">
                <Radio className="w-4 h-4 text-green-400 animate-pulse" />
              </div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Live View
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative rounded-xl p-4 backdrop-blur-sm group/card transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Online Now</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeUsersCount}</p>
              </div>
              <div className="p-2 rounded-lg backdrop-blur-sm"
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 h-1 bg-blue-200/50 dark:bg-blue-800/30 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                style={{ 
                  width: `${(activeUsersCount / (totalUsers || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="relative rounded-xl p-4 backdrop-blur-sm group/card transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Availability</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((activeUsersCount / (totalUsers || 1)) * 100)}%
                </p>
              </div>
              <div className="p-2 rounded-lg backdrop-blur-sm"
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                }}
              >
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="relative rounded-xl p-4 backdrop-blur-sm group/card transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Online Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {((activeUsersCount / (totalUsers || 1)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-lg backdrop-blur-sm"
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                }}
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Headers */}
        <div className="hidden md:grid md:grid-cols-4 text-sm font-semibold text-gray-700 dark:text-gray-300 pb-3 mb-3"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span className="flex items-center gap-2 pl-3">
            <Users className="w-4 h-4" />
            Employee
          </span>
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Contact
          </span>
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Status
          </span>
          <span className="pr-3">Activity</span>
        </div>

        {/* Users List */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] custom-scrollbar pr-2"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full backdrop-blur-sm animate-spin border-4 border-transparent border-t-blue-500 border-r-indigo-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading active users...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Fetching live status data</p>
            </div>
          )}
          
          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-2xl backdrop-blur-sm flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Users className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white text-sm shadow-lg">
                  !
                </div>
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-3">
                All Quiet Zone
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto backdrop-blur-sm p-3 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                No employees are currently online. Check back later for updates.
              </p>
            </div>
          )}

          {!loading && filteredUsers.length > 0 && filteredUsers.map((user, index) => (
            <div 
              key={user.userId} 
              className="relative rounded-xl p-4 mb-3 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg group/user overflow-hidden"
              style={{
                background: isDarkMode 
                  ? `rgba(30, 41, 59, ${0.5 + (index * 0.01)})` 
                  : `rgba(255, 255, 255, ${0.7 - (index * 0.02)})`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover/user:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1), transparent 50%)',
                }}
              ></div>
              
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl backdrop-blur-sm flex items-center justify-center group-hover/user:scale-110 transition-transform duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <span className="font-bold text-white text-lg">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm capitalize truncate text-gray-800 dark:text-white">
                          {user.name}
                        </p>
                        <HomeOfficePill active={user.is_checkin} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate mb-2">{user.email}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full backdrop-blur-sm truncate max-w-[100px]"
                          style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                          }}
                        >
                          {user.role || 'Field Employee'}
                        </span>
                        <span className="text-xs text-gray-500 px-2 py-1 rounded-full backdrop-blur-sm"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {user.employee_code}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2">
                    <StatusPill status="Active" />
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-4 items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl backdrop-blur-sm flex items-center justify-center group-hover/user:scale-110 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <span className="font-bold text-white text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm capitalize truncate text-gray-800 dark:text-white">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full backdrop-blur-sm truncate max-w-[120px]"
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                        }}
                      >
                        {user.role || 'Field Employee'}
                      </span>
                      <span className="text-xs text-gray-500">{user.employee_code}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.email}</p>
                </div>

                <div className="flex items-center">
                  <HomeOfficePill active={user.is_checkin} />
                </div>

                <div className="flex items-center">
                  <StatusPill status="Active" />
                </div>
              </div>
            </div>
          ))}
          
          {!hasMore && filteredUsers.length > 0 && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing all {filteredUsers.length} online users
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Stats Footer */}
        <div className="md:hidden mt-6 pt-4"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex justify-between items-center">
            <div className="text-center p-3 rounded-xl backdrop-blur-sm flex-1 mx-1"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div className="text-green-600 dark:text-green-400 font-bold text-lg">{activeUsersCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Online</div>
            </div>
            <div className="text-center p-3 rounded-xl backdrop-blur-sm flex-1 mx-1"
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <div className="text-gray-700 dark:text-gray-300 font-bold text-lg">{totalUsers}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center p-3 rounded-xl backdrop-blur-sm flex-1 mx-1"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {Math.round((activeUsersCount / (totalUsers || 1)) * 100)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatus;