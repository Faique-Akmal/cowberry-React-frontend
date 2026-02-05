import React from "react";
import { User, Zone } from "../../types/user.types";
import { getZoneName, getAllocatedArea } from "../../utils/user.helpers";

interface UserDetailsModalProps {
  user: User;
  zones: Zone[];
  canEditUser: boolean;
  canDeleteUser: boolean;
  onClose: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  zones,
  canEditUser,
  canDeleteUser,
  onClose,
  onEditClick,
  onDeleteClick,
}) => {
  const zoneName = getZoneName(user.zoneId || "", zones);
  const allocatedArea = getAllocatedArea(user, zones);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {user.id || user.userId || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                {user.profileImageUrl || user.profile_image ? (
                  <img
                    src={user.profileImageUrl || user.profile_image}
                    alt={user.full_name || user.name || "N/A"}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {(
                      user.name?.charAt(0) ||
                      user.full_name?.charAt(0) ||
                      "?"
                    ).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.full_name || user.name || "N/A"}
                  </h3>
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                    {user.employee_code || "No employee code"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.full_name || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.email || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.mobileNo || "Not specified"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Birth Date
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.birthDate
                        ? new Date(user.birthDate).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {user.address && (
              <div className="mb-8">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-line text-base">
                      {user.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Department & Role Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Role & Department
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.department || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.role || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting Information Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Reporting Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    HR Manager
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {user.hrManager ? (
                      <div>
                        <p className="text-gray-900 dark:text-white text-base font-medium">
                          {user.hrManager.name || "N/A"}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {user.hrManager.email || ""}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            ID: {user.hrManager.id}
                          </span>
                          {user.hrManager.employeeCode && (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                              Code: {user.hrManager.employeeCode}
                            </span>
                          )}
                        </div>
                        {user.hrManagerId && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                            HR Manager ID: {user.hrManagerId}
                          </p>
                        )}
                      </div>
                    ) : user.hrManagerId ? (
                      <p className="text-gray-900 dark:text-white text-base">
                        ID: {user.hrManagerId}
                      </p>
                    ) : (
                      <p className="text-gray-900 dark:text-white text-base">
                        Not Assigned
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reportee
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {user.reportee ? (
                      <div>
                        <p className="text-gray-900 dark:text-white text-base font-medium">
                          {user.reportee.name || "N/A"}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {user.reportee.email || ""}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            ID: {user.reportee.id}
                          </span>
                          {user.reportee.employeeCode && (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                              Code: {user.reportee.employeeCode}
                            </span>
                          )}
                        </div>
                        {user.reporteeId && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                            Reportee ID: {user.reporteeId}
                          </p>
                        )}
                      </div>
                    ) : user.reporteeId ? (
                      <p className="text-gray-900 dark:text-white text-base">
                        ID: {user.reporteeId}
                      </p>
                    ) : (
                      <p className="text-gray-900 dark:text-white text-base">
                        Not Assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Information Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Zone & Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zone ID
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.zoneId || "Not Assigned"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zone Name
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {zoneName}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allocated Area
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {allocatedArea}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Status & Employment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <span
                        className={`w-3 h-3 rounded-full mr-3 ${
                          user.is_checkin ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <p
                        className={`font-medium text-base ${
                          user.is_checkin
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {user.is_checkin ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Joined
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-base">
                      {user.date
                        ? new Date(user.date).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-base"
            >
              Close
            </button>
            {canEditUser && (
              <button
                type="button"
                onClick={onEditClick}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center min-w-[140px] text-base"
              >
                Edit User
              </button>
            )}
            {canDeleteUser && (
              <button
                type="button"
                onClick={onDeleteClick}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center justify-center min-w-[140px] text-base"
              >
                Delete User
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
