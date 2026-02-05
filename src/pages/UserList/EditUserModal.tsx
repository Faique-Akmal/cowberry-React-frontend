import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Zone,
  Department,
  Role,
  EditUserForm,
} from "../../types/user.types";
import { getZoneArea } from "../../utils/user.helpers";
import API from "../../api/axios";

interface EditUserModalProps {
  user: User;
  editForm: EditUserForm;
  zones: Zone[];
  departments: Department[];
  roles: Role[];
  loadingDepartments: boolean;
  loadingRoles: boolean;
  loadingZones: boolean;
  isEditing: boolean;
  onFormChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

interface Manager {
  id: number;
  full_name: string;
  name?: string;
  email: string;
  employee_code?: string;
  employeeCode?: string;
  username?: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  editForm,
  zones,
  departments,
  roles,
  loadingDepartments,
  loadingRoles,
  loadingZones,
  isEditing,
  onFormChange,
  onSubmit,
  onClose,
}) => {
  const [hrManagers, setHrManagers] = useState<Manager[]>([]);
  const [reportingManagers, setReportingManagers] = useState<Manager[]>([]);
  const [loadingHrManagers, setLoadingHrManagers] = useState(false);
  const [loadingReportingManagers, setLoadingReportingManagers] =
    useState(false);
  const [showHrManagerDropdown, setShowHrManagerDropdown] = useState(false);
  const [showReportingManagerDropdown, setShowReportingManagerDropdown] =
    useState(false);
  const [hrManagerSearch, setHrManagerSearch] = useState("");
  const [reportingManagerSearch, setReportingManagerSearch] = useState("");

  const hrManagerRef = useRef<HTMLDivElement>(null);
  const reportingManagerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  useEffect(() => {
    const fetchHrManagers = async () => {
      setLoadingHrManagers(true);
      try {
        const response = await API.get("/leaves/dropdown/hr-managers");
        const data = response.data;
        if (data.success && Array.isArray(data.data)) {
          setHrManagers(data.data);
        } else if (Array.isArray(data)) {
          setHrManagers(data);
        }
      } catch (error) {
        console.error("Error fetching HR managers:", error);
      } finally {
        setLoadingHrManagers(false);
      }
    };
    fetchHrManagers();
  }, []);

  useEffect(() => {
    const fetchReportingManagers = async () => {
      setLoadingReportingManagers(true);
      try {
        const response = await API.get("/leaves/dropdown/reportees");
        const data = response.data;
        if (data.success && Array.isArray(data.data)) {
          setReportingManagers(data.data);
        } else if (Array.isArray(data)) {
          setReportingManagers(data);
        }
      } catch (error) {
        console.error("Error fetching reporting managers:", error);
      } finally {
        setLoadingReportingManagers(false);
      }
    };
    fetchReportingManagers();
  }, []);

  useEffect(() => {
    if (user.hr_manager) {
      setHrManagerSearch(user.hr_manager.fullName || "");
    } else if (editForm.hrManagerId) {
      const hrManager = hrManagers.find((m) => m.id === editForm.hrManagerId);
      if (hrManager) {
        setHrManagerSearch(hrManager.full_name || hrManager.name || "");
      }
    } else {
      setHrManagerSearch("");
    }

    if (user.reportee) {
      setReportingManagerSearch(user.reportee.fullName || "");
    } else if (editForm.reporteeId) {
      const reportee = reportingManagers.find(
        (m) => m.id === editForm.reporteeId,
      );
      if (reportee) {
        setReportingManagerSearch(reportee.full_name || reportee.name || "");
      }
    } else {
      setReportingManagerSearch("");
    }
  }, [
    user,
    editForm.hrManagerId,
    editForm.reporteeId,
    hrManagers,
    reportingManagers,
  ]);

  const filteredHrManagers = hrManagers.filter(
    (manager) =>
      (manager.full_name || manager.name || "")
        .toLowerCase()
        .includes(hrManagerSearch.toLowerCase()) ||
      manager.email?.toLowerCase().includes(hrManagerSearch.toLowerCase()) ||
      (manager.employee_code || manager.employeeCode || "")
        .toLowerCase()
        .includes(hrManagerSearch.toLowerCase()),
  );

  const filteredReportingManagers = reportingManagers.filter(
    (manager) =>
      (manager.full_name || manager.name || "")
        .toLowerCase()
        .includes(reportingManagerSearch.toLowerCase()) ||
      manager.email
        ?.toLowerCase()
        .includes(reportingManagerSearch.toLowerCase()) ||
      (manager.employee_code || manager.employeeCode || "")
        .toLowerCase()
        .includes(reportingManagerSearch.toLowerCase()),
  );

  const getSelectedHrManagerName = () => {
    if (user.hr_manager) {
      return user.hr_manager.fullName || "";
    }
    if (editForm.hrManagerId) {
      const hrManager = hrManagers.find((m) => m.id === editForm.hrManagerId);
      return hrManager ? hrManager.full_name || hrManager.name || "" : "";
    }
    return hrManagerSearch;
  };

  const getSelectedReportingManagerName = () => {
    if (user.reportee) {
      return user.reportee.fullName || "";
    }
    if (editForm.reporteeId) {
      const reportee = reportingManagers.find(
        (m) => m.id === editForm.reporteeId,
      );
      return reportee ? reportee.full_name || reportee.name || "" : "";
    }
    return reportingManagerSearch;
  };

  const handleHrManagerSelect = (manager: Manager) => {
    const event = {
      target: {
        name: "hrManagerId",
        value: manager.id,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(event);
    setShowHrManagerDropdown(false);
    setHrManagerSearch(manager.full_name || manager.name || "");
  };

  const handleReportingManagerSelect = (manager: Manager) => {
    const event = {
      target: {
        name: "reporteeId",
        value: manager.id,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(event);
    setShowReportingManagerDropdown(false);
    setReportingManagerSearch(manager.full_name || manager.name || "");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hrManagerRef.current &&
        !hrManagerRef.current.contains(event.target as Node)
      ) {
        setShowHrManagerDropdown(false);
      }
      if (
        reportingManagerRef.current &&
        !reportingManagerRef.current.contains(event.target as Node)
      ) {
        setShowReportingManagerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit User
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.full_name || user.name || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isEditing}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={onFormChange}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={onFormChange}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={onFormChange}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={editForm.mobileNo}
                    onChange={onFormChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={editForm.birthDate}
                    onChange={onFormChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="relative" ref={hrManagerRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    HR Manager
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={getSelectedHrManagerName()}
                      onChange={(e) => {
                        setHrManagerSearch(e.target.value);
                        setShowHrManagerDropdown(true);
                      }}
                      onFocus={() => setShowHrManagerDropdown(true)}
                      placeholder="Search HR Manager..."
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                    />
                    {loadingHrManagers && (
                      <div className="absolute right-3 top-3">
                        <svg
                          className="animate-spin h-5 w-5 text-gray-400"
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
                      </div>
                    )}
                  </div>
                  {showHrManagerDropdown && !loadingHrManagers && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredHrManagers.length > 0 ? (
                        filteredHrManagers.map((manager) => (
                          <div
                            key={`hr-${manager.id}`}
                            onClick={() => handleHrManagerSelect(manager)}
                            className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                              editForm.hrManagerId === manager.id ||
                              user.hr_manager?.id === manager.id
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : ""
                            }`}
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {manager.full_name || manager.name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {manager.email} •{" "}
                              {manager.employee_code ||
                                manager.employeeCode ||
                                "No code"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                          {hrManagerSearch
                            ? "No HR managers found"
                            : "Start typing to search..."}
                        </div>
                      )}
                    </div>
                  )}
                  {(editForm.hrManagerId || user.hr_manager) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected HR Manager ID:{" "}
                      {editForm.hrManagerId || user.hr_manager?.id}
                    </p>
                  )}
                </div>
                <div className="relative" ref={reportingManagerRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reporting Manager
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={getSelectedReportingManagerName()}
                      onChange={(e) => {
                        setReportingManagerSearch(e.target.value);
                        setShowReportingManagerDropdown(true);
                      }}
                      onFocus={() => setShowReportingManagerDropdown(true)}
                      placeholder="Search Reporting Manager..."
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                    />
                    {loadingReportingManagers && (
                      <div className="absolute right-3 top-3">
                        <svg
                          className="animate-spin h-5 w-5 text-gray-400"
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
                      </div>
                    )}
                  </div>
                  {showReportingManagerDropdown &&
                    !loadingReportingManagers && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredReportingManagers.length > 0 ? (
                          filteredReportingManagers.map((manager) => (
                            <div
                              key={`reporting-${manager.id}`}
                              onClick={() =>
                                handleReportingManagerSelect(manager)
                              }
                              className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                                editForm.reporteeId === manager.id ||
                                user.reportee?.id === manager.id
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : ""
                              }`}
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {manager.full_name || manager.name || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {manager.email} •{" "}
                                {manager.employee_code ||
                                  manager.employeeCode ||
                                  "No code"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                            {reportingManagerSearch
                              ? "No reporting managers found"
                              : "Start typing to search..."}
                          </div>
                        )}
                      </div>
                    )}
                  {(editForm.reporteeId || user.reportee) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected Reporting Manager ID:{" "}
                      {editForm.reporteeId || user.reportee?.id}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={editForm.address}
                  onChange={onFormChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Department & Role
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department *
                  </label>
                  {loadingDepartments ? (
                    <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        Loading departments...
                      </p>
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-red-600 dark:text-red-400">
                        Failed to load departments. Please refresh.
                      </p>
                    </div>
                  ) : (
                    <select
                      name="departmentId"
                      value={editForm.departmentId}
                      onChange={onFormChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value={0}>Select Department</option>
                      {departments.map((dept) => (
                        <option
                          key={`dept-${dept.departmentId}`}
                          value={dept.departmentId}
                        >
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  {loadingRoles ? (
                    <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        Loading roles...
                      </p>
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-red-600 dark:text-red-400">
                        Failed to load roles. Please refresh.
                      </p>
                    </div>
                  ) : (
                    <select
                      name="roleId"
                      value={editForm.roleId}
                      onChange={onFormChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value={0}>Select Role</option>
                      {roles.map((role) => (
                        <option key={`role-${role.id}`} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Zone Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zone *
                  </label>
                  {loadingZones ? (
                    <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        Loading zones...
                      </p>
                    </div>
                  ) : zones.length === 0 ? (
                    <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-red-600 dark:text-red-400">
                        Failed to load zones. Please refresh.
                      </p>
                    </div>
                  ) : (
                    <select
                      name="zoneId"
                      value={editForm.zoneId}
                      onChange={onFormChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value="">Select Zone</option>
                      {zones.map((zone: Zone) => (
                        <option key={`zone-${zone.id}`} value={zone.zoneId}>
                          {zone.zoneId} - {zone.name} ({zone.area}, {zone.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allocated Area
                  </label>
                  <input
                    type="text"
                    name="allocatedArea"
                    value={editForm.allocatedArea}
                    onChange={onFormChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter allocated area (optional)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editForm.zoneId && zones.length > 0
                      ? `Zone area: ${getZoneArea(editForm.zoneId, zones)}`
                      : "Leave empty to use zone area"}
                  </p>
                </div>
              </div>
              {editForm.zoneId && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Selected Zone: <strong>{editForm.zoneName}</strong> (
                    {editForm.zoneId})
                    <br />
                    Zone Area:{" "}
                    <strong>{getZoneArea(editForm.zoneId, zones)}</strong>
                  </p>
                </div>
              )}
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Profile & Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    name="profileImageUrl"
                    value={editForm.profileImageUrl}
                    onChange={onFormChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isEditing}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isEditing ||
                  loadingDepartments ||
                  loadingRoles ||
                  loadingZones ||
                  departments.length === 0 ||
                  roles.length === 0 ||
                  zones.length === 0
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isEditing ? (
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
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
