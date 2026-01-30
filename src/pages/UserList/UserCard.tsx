import React from "react";
import { User } from "../../types/user.types";

interface UserCardProps {
  user: User;
  getZoneName?: (zoneId: string) => string;
  getAllocatedArea?: (user: User) => string;
  canViewUser?: (user: User) => boolean;
  canEditUser?: (user: User) => boolean;
  canDeleteUser?: (user: User) => boolean;
  handleRowClick?: (user: User) => void;
  handleEditClick?: (user: User) => void;
  handleDeleteClick?: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  getZoneName,
  getAllocatedArea,
  canViewUser,
  canEditUser,
  canDeleteUser,
  handleRowClick,
  handleEditClick,
  handleDeleteClick,
}) => {
  // Create default functions
  const defaultGetZoneName = (zoneId: string): string => {
    if (!zoneId) return "Not Assigned";
    return "Zone Not Found";
  };

  const defaultGetAllocatedArea = (user: User): string => {
    return user.allocatedArea || "Not Assigned";
  };

  const defaultCanViewUser = (user: User): boolean => true;
  const defaultCanEditUser = (user: User): boolean => false;
  const defaultCanDeleteUser = (user: User): boolean => false;
  const defaultHandleRowClick = (user: User): void =>
    console.log("Row clicked:", user);
  const defaultHandleEditClick = (user: User): void =>
    console.log("Edit clicked:", user);
  const defaultHandleDeleteClick = (user: User): void =>
    console.log("Delete clicked:", user);

  // Use provided functions or defaults
  const getZoneNameFunc = getZoneName || defaultGetZoneName;
  const getAllocatedAreaFunc = getAllocatedArea || defaultGetAllocatedArea;
  const canViewUserFunc = canViewUser || defaultCanViewUser;
  const canEditUserFunc = canEditUser || defaultCanEditUser;
  const canDeleteUserFunc = canDeleteUser || defaultCanDeleteUser;
  const handleRowClickFunc = handleRowClick || defaultHandleRowClick;
  const handleEditClickFunc = handleEditClick || defaultHandleEditClick;
  const handleDeleteClickFunc = handleDeleteClick || defaultHandleDeleteClick;

  // Add null check
  if (!user) return null;

  const zoneId = user.zoneId || "";
  const zoneName = getZoneNameFunc(zoneId);
  const allocatedArea = getAllocatedAreaFunc(user);

  if (!canViewUserFunc(user)) return null;

  return (
    <div className="bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-xl p-4 shadow-[0_4px_16px_rgba(31,38,135,0.1)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
      {/* Card Header */}
      <div
        className="flex items-start justify-between mb-3 cursor-pointer"
        onClick={() => handleRowClickFunc(user)}
      >
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-lantern-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {user.full_name?.charAt(0).toUpperCase() ||
              user.name?.charAt(0).toUpperCase() ||
              "?"}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {user.full_name || user.name || "N/A"}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {user.employee_code || "N/A"}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          {user.role || "N/A"}
        </span>
      </div>

      {/* Card Body */}
      <div
        className="space-y-2 cursor-pointer"
        onClick={() => handleRowClickFunc(user)}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {user.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Department
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {user.department || "N/A"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Zone ID</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {zoneId || "Not Assigned"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Zone Name
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {zoneName}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Allocated Area
          </p>
          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
            {allocatedArea}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/30 dark:border-gray-700/30">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${user.is_checkin ? "bg-green-500" : "bg-red-500"}`}
          ></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {user.is_checkin ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex space-x-2">
          {canEditUserFunc(user) && (
            <button
              onClick={() => handleEditClickFunc(user)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/80 hover:bg-blue-600/80 text-white transition-all duration-300"
            >
              Edit
            </button>
          )}
          {canDeleteUserFunc(user) && (
            <button
              onClick={() => handleDeleteClickFunc(user)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/80 hover:bg-red-600/80 text-white transition-all duration-300"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;
