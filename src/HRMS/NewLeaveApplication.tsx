import React, { useState, useEffect } from "react";
import axios from "axios";
import API from "../api/axios";

// Define types
type LeaveType =
  | "SICK"
  | "CASUAL"
  | "COMPENSATORY"
  | "LEAVEWITHOUTPAY"
  | "HALFDAY";

type HalfDayShift = "FIRST_HALF" | "SECOND_HALF";

interface LeaveApplicationForm {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  halfDayShift?: HalfDayShift;
}

interface LeaveTypeInfo {
  type: LeaveType;
  description: string;
  maxDuration?: number;
  requiresApproval?: boolean;
}

interface HalfDayShiftInfo {
  value: HalfDayShift;
  label: string;
  description: string;
  timeRange: string;
}

const LeaveApplicationPage: React.FC = () => {
  // State for form data
  const [formData, setFormData] = useState<LeaveApplicationForm>({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
    halfDayShift: undefined,
  });

  // State for UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Leave types information
  const leaveTypes: LeaveTypeInfo[] = [
    { type: "SICK", description: "Medical leave for illness or health issues" },
    { type: "CASUAL", description: "Personal or casual leave" },
    { type: "COMPENSATORY", description: "Leave earned from overtime work" },
    {
      type: "LEAVEWITHOUTPAY",
      description: "Unpaid leave for personal reasons",
    },
    { type: "HALFDAY", description: "Leave for half a day only" },
  ];

  // Half day shift options
  const halfDayShifts: HalfDayShiftInfo[] = [
    {
      value: "FIRST_HALF",
      label: "First Half",
      description: "Morning Shift",
      timeRange: "10:00 AM to 2:30 PM",
    },
    {
      value: "SECOND_HALF",
      label: "Second Half",
      description: "Afternoon Shift",
      timeRange: "2:30 PM to 7:00 PM",
    },
  ];

  // Get token from localStorage (adjust based on your auth implementation)
  const getAuthToken = (): string => {
    return localStorage.getItem("token") || "";
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Special handling for leave type
    if (name === "leaveType") {
      const selectedType = value as LeaveType;
      const isNowHalfDay = selectedType === "HALFDAY";
      setIsHalfDay(isNowHalfDay);

      // If half day, set end date same as start date and reset halfDayShift
      if (isNowHalfDay) {
        setFormData((prev) => ({
          ...prev,
          endDate: formData.startDate,
          halfDayShift: undefined,
        }));
      } else {
        // Clear halfDayShift when not HALFDAY
        setFormData((prev) => ({
          ...prev,
          halfDayShift: undefined,
        }));
      }
    }
  };

  // Handle half day shift selection
  const handleHalfDayShiftChange = (shift: HalfDayShift) => {
    setFormData((prev) => ({
      ...prev,
      halfDayShift: shift,
    }));

    // Clear validation error for halfDayShift
    if (validationErrors.halfDayShift) {
      setValidationErrors((prev) => ({
        ...prev,
        halfDayShift: "",
      }));
    }
  };

  // Handle date changes with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "startDate") {
      setFormData((prev) => ({
        ...prev,
        startDate: value,
        ...(isHalfDay ? { endDate: value } : {}),
      }));

      // Validate sick leave can't be backdated
      if (formData.leaveType === "SICK") {
        const today = new Date().toISOString().split("T")[0];
        if (value < today) {
          setValidationErrors((prev) => ({
            ...prev,
            startDate: "Sick leave cannot be backdated",
          }));
        }
      }
    } else if (name === "endDate") {
      setFormData((prev) => ({
        ...prev,
        endDate: value,
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const today = new Date().toISOString().split("T")[0];

    // Check required fields
    if (!formData.leaveType) errors.leaveType = "Leave type is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate && !isHalfDay)
      errors.endDate = "End date is required";
    if (!formData.reason.trim()) errors.reason = "Reason is required";

    // Date validations
    if (formData.startDate && formData.endDate) {
      if (formData.endDate < formData.startDate) {
        errors.endDate = "End date cannot be before start date";
      }

      // Sick leave backdate validation
      if (formData.leaveType === "SICK" && formData.startDate < today) {
        errors.startDate = "Sick leave cannot be backdated";
      }
    }

    // Half day shift validation
    if (formData.leaveType === "HALFDAY" && !formData.halfDayShift) {
      errors.halfDayShift = "Please select a shift for half day leave";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Prepare payload based on leave type
      const payload = {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate:
          formData.leaveType === "HALFDAY"
            ? formData.startDate
            : formData.endDate,
        reason: formData.reason,
        ...(formData.leaveType === "HALFDAY" && {
          halfDayShift: formData.halfDayShift,
        }),
      };

      const response = await API.post("/leaves/create", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Leave application submitted successfully!");

      // Reset form
      handleReset();
    } catch (err: any) {
      console.error("Error submitting leave application:", err);

      if (err.response) {
        // Server responded with error
        setError(
          err.response.data?.message || "Failed to submit leave application",
        );
      } else if (err.request) {
        // Request made but no response
        setError("Network error. Please check your connection.");
      } else {
        // Other errors
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total days
  const calculateTotalDays = (): number => {
    if (!formData.startDate || !formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // Inclusive of both dates
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      leaveType: "CASUAL",
      startDate: "",
      endDate: "",
      reason: "",
      halfDayShift: undefined,
    });
    setError("");
    setSuccess("");
    setValidationErrors({});
    setIsHalfDay(false);
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get min date for sick leave (today)
  const getMinDateForSickLeave = () => {
    if (formData.leaveType === "SICK") {
      return getTodayDate();
    }
    return "";
  };

  // Get leave type description
  const getSelectedLeaveTypeDescription = () => {
    const selectedType = leaveTypes.find(
      (type) => type.type === formData.leaveType,
    );
    return selectedType ? selectedType.description : "";
  };

  // Get selected half day shift info
  const getSelectedHalfDayShiftInfo = () => {
    if (!formData.halfDayShift) return null;
    return halfDayShifts.find((shift) => shift.value === formData.halfDayShift);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-lantern-blue-600 text-white">
            <h1 className="text-2xl font-bold">Apply for Leave</h1>
            <p className="text-blue-100">Submit your leave application</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 font-medium">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Leave Type Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                    validationErrors.leaveType
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                >
                  {leaveTypes.map((leaveType) => (
                    <option key={leaveType.type} value={leaveType.type}>
                      {leaveType.type}
                    </option>
                  ))}
                </select>

                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Leave type description */}
              {formData.leaveType && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">{formData.leaveType}:</span>{" "}
                    {getSelectedLeaveTypeDescription()}
                  </p>
                </div>
              )}

              {validationErrors.leaveType && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.leaveType}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleDateChange}
                  min={getMinDateForSickLeave()}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.startDate
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  required
                />
                {validationErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isHalfDay ? "Date" : "End Date"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleDateChange}
                  min={formData.startDate}
                  disabled={isHalfDay}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.endDate
                      ? "border-red-300"
                      : "border-gray-300"
                  } ${isHalfDay ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  required={!isHalfDay}
                />
                {validationErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.endDate}
                  </p>
                )}
                {isHalfDay && (
                  <p className="mt-1 text-sm text-gray-500">
                    Half day leave is for single day only
                  </p>
                )}
              </div>
            </div>

            {/* Half Day Shift Selection (only show for HALFDAY) */}
            {isHalfDay && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Shift <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {halfDayShifts.map((shift) => (
                    <div
                      key={shift.value}
                      onClick={() => handleHalfDayShiftChange(shift.value)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.halfDayShift === shift.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start">
                        <div
                          className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                            formData.halfDayShift === shift.value
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.halfDayShift === shift.value && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">
                            {shift.label}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {shift.description}
                          </p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {shift.timeRange}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {validationErrors.halfDayShift && (
                  <p className="mt-2 text-sm text-red-600">
                    {validationErrors.halfDayShift}
                  </p>
                )}

                {/* Selected shift info */}
                {formData.halfDayShift && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm text-green-800">
                        Selected:{" "}
                        <span className="font-semibold">
                          {getSelectedHalfDayShiftInfo()?.label}
                        </span>{" "}
                        ({getSelectedHalfDayShiftInfo()?.timeRange})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Duration Display */}
            {formData.startDate && formData.endDate && !isHalfDay && (
              <div className="mb-6 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Total Duration:</span>{" "}
                  {calculateTotalDays()} day
                  {calculateTotalDays() !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={4}
                placeholder="Please provide a detailed reason for your leave application..."
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.reason ? "border-red-300" : "border-gray-300"
                }`}
                required
              />
              {validationErrors.reason && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.reason}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.reason.length}/500 characters
              </p>
            </div>

            {/* Important Notes */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Important Notes:
              </h3>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Sick leave cannot be backdated</li>
                <li>
                  Half day leave is applicable for single day only - select
                  either First Half or Second Half
                </li>
                <li>All applications are subject to approval</li>
                <li>
                  Submit your application at least 2 days in advance when
                  possible
                </li>
              </ul>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
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
                    Submitting...
                  </span>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationPage;
