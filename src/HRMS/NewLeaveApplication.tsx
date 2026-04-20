import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import API from "../api/axios";

// Define types
type HalfDayShift = "FIRST_HALF" | "SECOND_HALF";

interface LeaveApplicationForm {
  leaveType: string;
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
  halfDayShift?: HalfDayShift;
  halfDay: boolean;
  halfDayDate?: Date | null;
}

interface HalfDayShiftInfo {
  value: HalfDayShift;
  label: string;
  description: string;
  timeRange: string;
}

interface LeaveBalance {
  leave_type: string;
  total_allocated: number;
  used: number;
  pending_approval: number;
  remaining: number;
}

interface LeaveBalanceResponse {
  success: boolean;
  employee_code: string;
  employee_name: string;
  fiscal_year: string;
  leave_balances: LeaveBalance[];
}

const LeaveApplicationPage: React.FC = () => {
  // State for form data
  const [formData, setFormData] = useState<LeaveApplicationForm>({
    leaveType: "Casual Leave",
    startDate: null,
    endDate: null,
    reason: "",
    halfDayShift: undefined,
    halfDay: false,
    halfDayDate: null,
  });

  // State for UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // State for leave balances
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>("");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [fiscalYear, setFiscalYear] = useState<string>("");

  // Function to get leave type color for badges
  const getLeaveTypeColor = (leaveType: string) => {
    const type = leaveType.toLowerCase();
    if (type.includes("casual")) {
      return "bg-blue-100 text-blue-800";
    } else if (type.includes("sick")) {
      return "bg-purple-100 text-purple-800";
    } else if (type.includes("compensatory")) {
      return "bg-pink-100 text-pink-800";
    } else if (type.includes("without pay") || type.includes("unpaid")) {
      return "bg-teal-100 text-teal-800";
    } else if (type.includes("half")) {
      return "bg-indigo-100 text-indigo-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

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

  // Get employee code from localStorage
  const getEmployeeCode = (): string => {
    return localStorage.getItem("employee_code") || "";
  };

  // Fetch leave balances when component mounts
  useEffect(() => {
    const employee_code = getEmployeeCode();
    if (employee_code) {
      setSelectedEmployeeCode(employee_code);
      fetchLeaveBalances(employee_code);
    } else {
      setError("Employee code not found. Please login again.");
    }
  }, []);

  // Fetch leave balances using the API instance
  const fetchLeaveBalances = async (employee_code: string) => {
    setLoadingBalances(true);
    setError("");

    try {
      const response = await API.get<{ message: LeaveBalanceResponse }>(
        `/leaves/get-erp-leave-balance?employee_code=${employee_code}`,
      );

      const responseData = response.data.message;

      if (responseData.success) {
        setLeaveBalances(responseData.leave_balances || []);
        setEmployeeName(responseData.employee_name || "");
        setFiscalYear(responseData.fiscal_year || "");

        if (
          responseData.leave_balances &&
          responseData.leave_balances.length > 0
        ) {
          setFormData((prev) => ({
            ...prev,
            leaveType: responseData.leave_balances[0].leave_type,
          }));
        }
      } else {
        setError(responseData.message || "Failed to fetch leave balances");
      }
    } catch (err: any) {
      console.error("Error fetching leave balances:", err);
      if (err.response) {
        const errorMessage =
          err.response.data?.message ||
          err.response.data?.error ||
          "Failed to fetch leave balances";
        setError(errorMessage);
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoadingBalances(false);
    }
  };

  // Get remaining balance for selected leave type
  const getRemainingBalance = (): number | null => {
    const balance = leaveBalances.find(
      (b) => b.leave_type === formData.leaveType,
    );
    return balance ? balance.remaining : null;
  };

  // Get leave balance details
  const getLeaveBalanceDetails = () => {
    const balance = leaveBalances.find(
      (b) => b.leave_type === formData.leaveType,
    );
    return balance;
  };

  // Calculate total days requested
  const calculateTotalDays = (): number => {
    if (!formData.startDate) return 0;

    if (isHalfDay) {
      return 0.5; // Half day counts as 0.5 days
    }

    if (!formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1;
  };

  // Validate if requested days exceed available balance
  const validateLeaveBalance = (requestedDays: number): boolean => {
    const remainingBalance = getRemainingBalance();

    if (remainingBalance === null) {
      return true; // No balance info available
    }

    // Allow Leave Without Pay regardless of balance
    if (formData.leaveType === "Leave Without Pay") {
      return true;
    }

    // For half day leaves
    if (isHalfDay) {
      if (remainingBalance < 0.5) {
        setValidationErrors((prev) => ({
          ...prev,
          leaveType: `Insufficient leave balance. You have only ${remainingBalance} days remaining. Cannot apply for half day leave.`,
        }));
        return false;
      }
      return true;
    }

    // For full day leaves
    if (requestedDays > remainingBalance) {
      setValidationErrors((prev) => ({
        ...prev,
        leaveType: `Insufficient leave balance. You have ${remainingBalance} days remaining but requested ${requestedDays} days.`,
      }));
      return false;
    }

    return true;
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

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (name === "leaveType") {
      const isNowHalfDay = value === "Half Day";
      setIsHalfDay(isNowHalfDay);

      if (isNowHalfDay) {
        setFormData((prev) => ({
          ...prev,
          endDate: prev.startDate,
          halfDayShift: undefined,
          halfDay: true,
          halfDayDate: prev.startDate || null,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          halfDayShift: undefined,
          halfDay: false,
          halfDayDate: null,
        }));
      }

      // Clear leave type validation error when changing leave type
      setValidationErrors((prev) => ({
        ...prev,
        leaveType: "",
      }));
    }
  };

  // Handle half day shift selection
  const handleHalfDayShiftChange = (shift: HalfDayShift) => {
    setFormData((prev) => ({
      ...prev,
      halfDayShift: shift,
    }));

    if (validationErrors.halfDayShift) {
      setValidationErrors((prev) => ({
        ...prev,
        halfDayShift: "",
      }));
    }
  };

  // Handle date changes with validation
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        startDate: date,
        ...(isHalfDay
          ? {
              endDate: date,
              halfDayDate: date,
            }
          : {}),
      }));

      if (formData.leaveType === "Sick Leave") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          setValidationErrors((prev) => ({
            ...prev,
            startDate: "Sick leave cannot be backdated",
          }));
        } else {
          setValidationErrors((prev) => ({
            ...prev,
            startDate: "",
          }));
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        startDate: null,
      }));
    }

    if (validationErrors.startDate) {
      setValidationErrors((prev) => ({
        ...prev,
        startDate: "",
      }));
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      endDate: date,
    }));

    if (validationErrors.endDate) {
      setValidationErrors((prev) => ({
        ...prev,
        endDate: "",
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check required fields
    if (!formData.leaveType) errors.leaveType = "Leave type is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate && !isHalfDay)
      errors.endDate = "End date is required";
    if (!formData.reason.trim()) errors.reason = "Reason is required";

    // Date validations
    if (formData.startDate && formData.endDate && !isHalfDay) {
      if (formData.endDate < formData.startDate) {
        errors.endDate = "End date cannot be before start date";
      }

      if (formData.leaveType === "Sick Leave" && formData.startDate < today) {
        errors.startDate = "Sick leave cannot be backdated";
      }
    }

    // Half day shift validation
    if (isHalfDay && !formData.halfDayShift) {
      errors.halfDayShift = "Please select a shift for half day leave";
    }

    // Calculate requested days and validate against balance
    const requestedDays = calculateTotalDays();

    if (!isHalfDay && formData.startDate && formData.endDate) {
      // Validate that requested days don't exceed remaining balance
      const remainingBalance = getRemainingBalance();
      if (remainingBalance !== null && remainingBalance > 0) {
        if (
          requestedDays > remainingBalance &&
          formData.leaveType !== "Leave Without Pay"
        ) {
          errors.leaveType = `Insufficient leave balance! You have only ${remainingBalance.toFixed(2)} days of ${formData.leaveType} remaining, but you are requesting ${requestedDays} days.`;
        }
      } else if (
        remainingBalance !== null &&
        remainingBalance <= 0 &&
        formData.leaveType !== "Leave Without Pay"
      ) {
        errors.leaveType = `No leave balance available for ${formData.leaveType}. You have ${remainingBalance} days remaining.`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate a unique ID for leave application
  const generateLeaveId = (): string => {
    const prefix = "LV";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}-${timestamp}-${random}`;
  };

  // Handle form submission using the API instance
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Re-validate balance before submission
    const requestedDays = calculateTotalDays();
    const remainingBalance = getRemainingBalance();

    if (
      remainingBalance !== null &&
      requestedDays > remainingBalance &&
      formData.leaveType !== "Leave Without Pay"
    ) {
      setError(
        `Cannot submit: You have only ${remainingBalance.toFixed(2)} days of ${formData.leaveType} remaining, but you are requesting ${requestedDays} days.`,
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const employee_code = getEmployeeCode();
      if (!employee_code) {
        throw new Error("Employee code not found. Please login again.");
      }

      const formatDate = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split("T")[0];
      };

      const payload = {
        employeeCode: employee_code,
        leaveType: formData.leaveType,
        fromDate: formatDate(formData.startDate),
        toDate: isHalfDay
          ? formatDate(formData.startDate)
          : formatDate(formData.endDate),
        reason: formData.reason,
        totalDays: requestedDays,
        ...(isHalfDay &&
          formData.halfDayShift && {
            halfDay: true,
            halfDayShift: formData.halfDayShift,
            halfDayDate: formatDate(formData.startDate),
          }),
        lantern360LeaveId: generateLeaveId(),
      };

      const response = await API.post("/leaves/apply-erp-leave", payload);
      const responseData = response.data;

      if (responseData.success) {
        setSuccess(
          `Leave application submitted successfully! Reference ID: ${responseData.your_reference_id || responseData.data?.leave_application || "N/A"}`,
        );

        await fetchLeaveBalances(employee_code);
        handleReset();
      } else {
        throw new Error(
          responseData.message || "Failed to submit leave application",
        );
      }
    } catch (err: any) {
      console.error("Error submitting leave application:", err);

      if (err.response) {
        const errorMessage =
          err.response.data?.message ||
          err.response.data?.error ||
          "Failed to submit leave application";
        setError(errorMessage);
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      leaveType:
        leaveBalances.length > 0 ? leaveBalances[0].leave_type : "Casual Leave",
      startDate: null,
      endDate: null,
      reason: "",
      halfDayShift: undefined,
      halfDay: false,
      halfDayDate: null,
    });
    setError("");
    setSuccess("");
    setValidationErrors({});
    setIsHalfDay(false);
  };

  // Get today's date
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const balanceDetails = getLeaveBalanceDetails();
  const requestedDays = calculateTotalDays();
  const remainingBalance = getRemainingBalance();

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-lantern-blue-600 text-white">
            <h1 className="text-2xl font-bold">Apply for Leave</h1>
            <p className="text-blue-100">Submit your leave application</p>
          </div>

          {/* Employee Information Card */}
          {selectedEmployeeCode && (
            <div className="m-6 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Employee Information
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Employee Code</p>
                    <p className="font-medium">{selectedEmployeeCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employee Name</p>
                    <p className="font-medium">
                      {employeeName || "Loading..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fiscal Year</p>
                    <p className="font-medium">{fiscalYear || "Loading..."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Balance Summary Table */}
          {leaveBalances.length > 0 && (
            <div className="mx-6 mb-6 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Leave Balance Summary
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leave Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Allocated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending Approval
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveBalances.map((balance, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLeaveTypeColor(balance.leave_type)}`}
                          >
                            {balance.leave_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {balance.total_allocated.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {balance.used}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                          {balance.pending_approval}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-semibold ${balance.remaining <= 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {balance.remaining.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leave Application Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 font-medium">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {loadingBalances && (
              <div className="mb-4 p-3 bg-blue-50 border border-lantern-blue-600 rounded-md">
                <p className="text-blue-600">Loading leave balances...</p>
              </div>
            )}

            {/* Leave Type Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>

              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lantern-blue-600 ${
                  validationErrors.leaveType
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              >
                {leaveBalances.map((balance) => (
                  <option key={balance.leave_type} value={balance.leave_type}>
                    {balance.leave_type}
                  </option>
                ))}
              </select>

              {validationErrors.leaveType && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.leaveType}
                </p>
              )}
            </div>

            {/* Date Selection with DatePicker */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={handleStartDateChange}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lantern-blue-600 ${
                    validationErrors.startDate
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  minDate={
                    formData.leaveType === "Sick Leave"
                      ? getTodayDate()
                      : undefined
                  }
                  placeholderText="Select start date"
                  required
                />
                {validationErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isHalfDay ? "Date" : "End Date"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={handleEndDateChange}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lantern-blue-600 ${
                    validationErrors.endDate
                      ? "border-red-300"
                      : "border-gray-300"
                  } ${isHalfDay ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  minDate={formData.startDate || undefined}
                  disabled={isHalfDay}
                  placeholderText={
                    isHalfDay ? "Same as start date" : "Select end date"
                  }
                  required={!isHalfDay}
                />
                {validationErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.endDate}
                  </p>
                )}
              </div>
            </div>

            {/* Leave Balance Warning */}
            {!isHalfDay &&
              formData.startDate &&
              formData.endDate &&
              remainingBalance !== null && (
                <div
                  className={`mb-4 p-3 rounded-md ${requestedDays > remainingBalance ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}
                >
                  <p
                    className={`text-sm ${requestedDays > remainingBalance ? "text-red-800" : "text-yellow-800"}`}
                  >
                    <span className="font-semibold">Leave Summary:</span> You
                    are requesting {requestedDays} day(s). Available balance:{" "}
                    {remainingBalance.toFixed(2)} days.
                    {requestedDays > remainingBalance && (
                      <span className="block mt-1 font-semibold text-red-600">
                        ⚠️ Warning: Requested days exceed available balance!
                      </span>
                    )}
                  </p>
                </div>
              )}

            {/* Half Day Shift Selection */}
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
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {shift.label}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {shift.timeRange}
                          </p>
                        </div>
                        {formData.halfDayShift === shift.value && (
                          <div className="text-blue-500">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {validationErrors.halfDayShift && (
                  <p className="mt-2 text-sm text-red-600">
                    {validationErrors.halfDayShift}
                  </p>
                )}
              </div>
            )}

            {/* Duration Display */}
            {formData.startDate && formData.endDate && !isHalfDay && (
              <div className="mb-6 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Total Duration:</span>{" "}
                  {calculateTotalDays()} day(s)
                </p>
              </div>
            )}

            {isHalfDay && formData.startDate && (
              <div className="mb-6 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Total Duration:</span> 0.5 day
                  (Half Day)
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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lantern-blue-600 ${
                  validationErrors.reason ? "border-red-300" : "border-gray-300"
                }`}
                required
              />
              {validationErrors.reason && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.reason}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (remainingBalance !== null &&
                    requestedDays > remainingBalance &&
                    formData.leaveType !== "Leave Without Pay")
                }
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lantern-blue-600 hover:bg-blue-700 ${
                  isSubmitting ||
                  (remainingBalance !== null &&
                    requestedDays > remainingBalance &&
                    formData.leaveType !== "Leave Without Pay")
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationPage;
