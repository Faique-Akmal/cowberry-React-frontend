import React from "react";

interface Zone {
  id: number;
  zoneId: string;
  name: string;
  area: string;
  city: string;
  state: string;
  isActive: boolean;
}

interface ReportingPerson {
  id?: number;
  name?: string;
  email?: string;
  employee_code?: string;
}

interface User {
  userId: number;
  name: string;
  full_name: string;
  employee_code: string;
  email: string;
  mobileNo: string;
  role: string;
  is_checkin: boolean;
  date: string;
  department: string;
  address: string | null;
  birthDate: string;
  allocatedArea: string;
  reporteeEmployeeCode: string | null;
  hrManagerEmployeeCode: string | null;
  reportee: ReportingPerson | null;
  hrManager: ReportingPerson | null;
  zone: Zone | null;
  branch: null;
}

interface UserDetailsModalProps {
  user: User;
  zones?: Zone[];
  canEditUser: boolean;
  canDeleteUser: boolean;
  onClose: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  canEditUser,
  canDeleteUser,
  onClose,
  onEditClick,
  onDeleteClick,
}) => {
  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to get status color
  const getStatusColor = (isCheckin: boolean) => {
    return isCheckin
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      Ceo: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      Manager:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      Employee:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      Admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      roleColors[role] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    );
  };

  // Helper function to get reporting person display name
  const getReportingPersonName = (
    person: ReportingPerson | null,
    employeeCode: string | null,
  ) => {
    if (person && person.name) {
      return person.name;
    }
    if (employeeCode) {
      return `Employee Code: ${employeeCode}`;
    }
    return "Not assigned";
  };

  // Helper function to get reporting person details
  const getReportingPersonDetails = (
    person: ReportingPerson | null,
    employeeCode: string | null,
  ) => {
    if (person) {
      return {
        name: person.name || "N/A",
        code: person.employee_code || employeeCode,
        email: person.email,
      };
    }
    if (employeeCode) {
      return {
        name: null,
        code: employeeCode,
        email: null,
      };
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center ">
      <div className="bg-white dark:bg-gray-900 w-full max-w-full max-h-[85vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        {/* <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-2 shrink-0 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              User ID: {user.userId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ml-4"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
        </div> */}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 ">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b border-blue-800 dark:border-gray-700 ">
            <div className="w-18 h-18 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {(
                user.name?.charAt(0) ||
                user.full_name?.charAt(0) ||
                "?"
              ).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.full_name}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}
                >
                  {user.role}
                </span>

                <p className="text-gray-600 dark:text-gray-400 text-sm rounded-full bg-gray-100 dark:bg-gray-800/50 px-2 py-1">
                  Employee Code: {user.employee_code}
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.is_checkin)}`}
                >
                  {user.is_checkin ? "● Online" : "● Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Full Name" value={user.full_name} />
              <InfoCard label="Email Address" value={user.email} />
              <InfoCard
                label="Mobile Number"
                value={
                  user.mobileNo !== "0000000000"
                    ? user.mobileNo
                    : "Not provided"
                }
              />
              <InfoCard label="Birth Date" value={formatDate(user.birthDate)} />
              <InfoCard
                label="Address"
                value={user.address || "Not provided"}
              />
              <InfoCard label="Date Joined" value={formatDate(user.date)} />
            </div>
          </div>

          {/* Work Information */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Work Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Department" value={user.department} />
              <InfoCard label="Role" value={user.role} />
              <InfoCard label="Employee Code" value={user.employee_code} />
              <InfoCard
                label="Status"
                value={
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(user.is_checkin)}`}
                    >
                      {user.is_checkin ? "Active" : "Inactive"}
                    </span>
                  </div>
                }
              />
            </div>
          </div>

          {/* Zone & Location Information */}
          {user.zone && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Zone & Location
              </h4>
              <div className=" dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoCard label="Zone Name" value={user.zone.name} />
                  <InfoCard label="Zone ID" value={user.zone.zoneId} />
                  <InfoCard label="City" value={user.zone.city} />
                  <InfoCard label="State" value={user.zone.state} />
                  <InfoCard label="Area" value={user.zone.area} />
                  <InfoCard
                    label="Zone Status"
                    value={
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          user.zone.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {user.zone.isActive ? "Active" : "Inactive"}
                      </span>
                    }
                  />
                </div>
              </div>
              <InfoCard label="Allocated Area" value={user.allocatedArea} />
            </div>
          )}

          {/* Reporting Structure */}
          {(user.reporteeEmployeeCode ||
            user.hrManagerEmployeeCode ||
            user.reportee ||
            user.hrManager) && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Reporting Structure
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* HR Manager Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    HR Manager
                  </label>
                  {user.hrManager || user.hrManagerEmployeeCode ? (
                    <div>
                      {user.hrManager && (
                        <>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {user.hrManager.name || "N/A"}
                          </p>
                          {user.hrManager.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {user.hrManager.email}
                            </p>
                          )}
                          {user.hrManager.employee_code && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Code: {user.hrManager.employee_code}
                            </p>
                          )}
                        </>
                      )}
                      {!user.hrManager && user.hrManagerEmployeeCode && (
                        <p className="text-gray-900 dark:text-white font-medium">
                          Employee Code: {user.hrManagerEmployeeCode}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      Not assigned
                    </p>
                  )}
                </div>

                {/* Reportee Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Reportee
                  </label>
                  {user.reportee || user.reporteeEmployeeCode ? (
                    <div>
                      {user.reportee && (
                        <>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {user.reportee.name || "N/A"}
                          </p>
                          {user.reportee.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {user.reportee.email}
                            </p>
                          )}
                          {user.reportee.employee_code && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Code: {user.reportee.employee_code}
                            </p>
                          )}
                        </>
                      )}
                      {!user.reportee && user.reporteeEmployeeCode && (
                        <p className="text-gray-900 dark:text-white font-medium">
                          Employee Code: {user.reporteeEmployeeCode}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">None</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium order-2 sm:order-1"
            >
              Close
            </button>
            {canDeleteUser && (
              <button
                type="button"
                onClick={onDeleteClick}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium order-1 sm:order-2"
              >
                Delete User
              </button>
            )}
            {canEditUser && (
              <button
                type="button"
                onClick={onEditClick}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium order-3"
              >
                Edit User
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for consistent info cards
const InfoCard: React.FC<{
  label: string;
  value: string | React.ReactNode;
}> = ({ label, value }) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
      {label}
    </label>
    <div className="text-gray-900 dark:text-white font-medium">
      {value || "N/A"}
    </div>
  </div>
);

export default UserDetailsModal;
