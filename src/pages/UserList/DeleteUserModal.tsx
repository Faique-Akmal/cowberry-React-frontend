import React from "react";
import { User, Zone } from "../../types/user.types";
import { getZoneName, getAllocatedArea } from "../../utils/user.helpers";

interface DeleteUserModalProps {
  user: User;
  zones: Zone[];
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  zones,
  deleting,
  onClose,
  onConfirm,
}) => {
  const zoneName = getZoneName(user.zoneId || "", zones);
  const allocatedArea = getAllocatedArea(user, zones);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
              Delete User
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              • Confirm deletion of user account
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={deleting}
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Warning Banner */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-300 text-lg mb-1">
                    Permanent Action Required
                  </h3>
                  <p className="text-red-700 dark:text-red-400">
                    This will permanently delete the user account and all
                    associated data including access logs, permissions, and
                    activity history. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* User Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                User Information
              </h3>

              {/* User Profile Card */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-16 w-16 rounded-lg bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {(
                      user.full_name?.charAt(0) ||
                      user.name?.charAt(0) ||
                      "?"
                    ).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {user.full_name || user.name || "N/A"}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {user.employee_code || "No employee code"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                        {user.role || "N/A"}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                        {user.department || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Email Address
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Zone Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                      Zone Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Zone ID
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.zoneId || "Not Assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Zone Name
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {zoneName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Allocated Area
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {allocatedArea}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User ID Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      User ID
                    </p>
                    <p className="font-mono text-gray-900 dark:text-white font-medium">
                      {user.id || user.userId || "N/A"}
                    </p>
                  </div>
                  {user.date && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Account Created
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(user.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Impact Warning Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Impact of Deletion
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <ul className="text-yellow-700 dark:text-yellow-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                          •
                        </span>
                        <span>
                          All user data will be permanently removed from the
                          system
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                          •
                        </span>
                        <span>
                          Access permissions and credentials will be revoked
                          immediately
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                          •
                        </span>
                        <span>
                          Any ongoing sessions and tasks will be terminated
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                          •
                        </span>
                        <span>
                          This action is irreversible and cannot be recovered
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-blue-700 dark:text-blue-300">
                    <strong>Please review all information carefully</strong>{" "}
                    before proceeding with deletion. Make sure this is the
                    correct user account and you understand the consequences of
                    this action.
                  </p>
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
              disabled={deleting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
              {deleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
