import React from "react";
import { User } from "../../types/user.types";

interface UserTableProps {
  users: User[];
  currentPage: number;
  limit: number;
  sortOrder: "asc" | "desc";
  getZoneName?: (zoneId: string) => string; // Make optional
  getAllocatedArea?: (user: User) => string; // Make optional
  canViewUser?: (user: User) => boolean; // Make optional
  handleRowClick?: (user: User) => void; // Make optional
  toggleSortOrder?: () => void; // Make optional
  getUserKey?: (user: User, index: number) => string; // Make optional
}

const UserTable: React.FC<UserTableProps> = ({
  users = [],
  currentPage = 1,
  limit = 20,
  sortOrder = "asc",
  getZoneName,
  getAllocatedArea,
  canViewUser,
  handleRowClick,
  toggleSortOrder,
  getUserKey,
}) => {
  // Create default functions if not provided
  const defaultGetZoneName = (zoneId: string): string => {
    if (!zoneId) return "Not Assigned";
    return "Zone Not Found";
  };

  const defaultGetAllocatedArea = (user: User): string => {
    return user.allocatedArea || "Not Assigned";
  };

  const defaultCanViewUser = (user: User): boolean => {
    return true; // Default to viewing all users
  };

  const defaultHandleRowClick = (user: User): void => {};

  const defaultToggleSortOrder = (): void => {};

  const defaultGetUserKey = (user: User, index: number): string => {
    const userId = user.id || user.userId;
    const baseKey = userId || `user-${index}`;
    const pageIndex = (currentPage - 1) * limit + index;
    return `${baseKey}-${pageIndex}`;
  };

  // Use provided functions or defaults
  const getZoneNameFunc = getZoneName || defaultGetZoneName;
  const getAllocatedAreaFunc = getAllocatedArea || defaultGetAllocatedArea;
  const canViewUserFunc = canViewUser || defaultCanViewUser;
  const handleRowClickFunc = handleRowClick || defaultHandleRowClick;
  const toggleSortOrderFunc = toggleSortOrder || defaultToggleSortOrder;
  const getUserKeyFunc = getUserKey || defaultGetUserKey;

  if (!users || users.length === 0) {
    return null;
  }

  return (
    <div className="min-w-full h-full">
      <div className="h-full flex flex-col">
        {/* Table Header - 9 columns */}
        <div className="shrink-0 sticky top-0 z-10">
          <div className="grid grid-cols-9 px-2 md:px-4 py-3 bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-900/40 backdrop-blur-lg border-b border-white/30 dark:border-gray-700/30 gap-1 md:gap-2">
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap flex justify-center items-center">
              Sr.no
            </div>
            <div
              className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/30 dark:hover:bg-gray-800/30 transition-colors duration-300 whitespace-nowrap"
              onClick={toggleSortOrderFunc}
            >
              <div className="flex items-center space-x-1">
                <span>Name</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-100/50 dark:bg-blue-900/30 rounded-full p-0.5">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              </div>
            </div>
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
              Emp Code
            </div>
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
              Email
            </div>
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
              Role
            </div>
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
              Department
            </div>
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
              Zone ID
            </div>
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
              Zone Name
            </div>
            <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
              Allocated Area
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-white/20 dark:divide-gray-700/20">
            {users.map((user, index) => {
              const userKey = getUserKeyFunc(user, index);
              const zoneId = user.zoneId || "";
              const zoneName = getZoneNameFunc(zoneId);
              const allocatedArea = getAllocatedAreaFunc(user);

              if (!canViewUserFunc(user)) return null;

              return (
                <div
                  key={userKey}
                  className="grid grid-cols-1 sm:grid-cols-9 gap-1 md:gap-2 px-2 md:px-4 py-3 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-300 backdrop-blur-sm items-center"
                  onClick={() => handleRowClickFunc(user)}
                >
                  <div className="px-1 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 cursor-pointer flex justify-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                      {(currentPage - 1) * limit + index + 1}
                    </span>
                  </div>

                  <div className="px-1 py-1 cursor-pointer">
                    <div className="flex items-center">
                      <div className="shrink-0">
                        <div className="h-8 w-8 rounded-lg bg-lantern-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {user.full_name?.charAt(0).toUpperCase() ||
                            user.name?.charAt(0).toUpperCase() ||
                            "?"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 ml-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user.full_name || user.name || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-1 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 cursor-pointer">
                    <div className="bg-white/40 dark:bg-gray-800/40 rounded px-2 md:px-3 py-1.5 backdrop-blur-sm truncate text-center">
                      {user.employee_code || "N/A"}
                    </div>
                  </div>

                  <div className="px-1 py-1 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    <div className="truncate bg-white/40 dark:bg-gray-800/40 rounded px-2 md:px-3 py-1.5 backdrop-blur-sm">
                      {user.email || "N/A"}
                    </div>
                  </div>

                  <div className="px-1 py-1 whitespace-nowrap cursor-pointer">
                    <span className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 backdrop-blur-sm truncate w-full">
                      {user.role || "N/A"}
                    </span>
                  </div>

                  <div className="px-1 py-1 whitespace-nowrap cursor-pointer">
                    <span className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 backdrop-blur-sm truncate w-full">
                      {user.department || "N/A"}
                    </span>
                  </div>

                  <div className="px-1 py-1 whitespace-nowrap cursor-pointer">
                    <span
                      className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-purple-100/50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 backdrop-blur-sm truncate w-full"
                      title={zoneId}
                    >
                      {zoneId || "Not Assigned"}
                    </span>
                  </div>

                  <div className="px-1 py-1 whitespace-nowrap cursor-pointer">
                    <span
                      className="inline-flex items-center truncate justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-green-100/50 dark:bg-green-900/30 text-green-800 dark:text-green-300 backdrop-blur-sm truncate w-full"
                      title={zoneName}
                    >
                      {zoneName}
                    </span>
                  </div>

                  <div className="px-1 py-1 whitespace-nowrap cursor-pointer">
                    <span
                      className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 backdrop-blur-sm truncate w-full"
                      title={allocatedArea}
                    >
                      {allocatedArea}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
