import React, { useState, useEffect } from "react";
import axios from "axios";

// Define types
type HalfDayShift = "FIRST_HALF" | "SECOND_HALF";

interface LeaveApplicationForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  halfDayShift?: HalfDayShift;
  halfDay: boolean;
  halfDayDate?: string | null;
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

const LeaveApplicationPage: React.FC = () => {
  // State for form data
  const [formData, setFormData] = useState<LeaveApplicationForm>({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
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

  // ERP Configuration from env
  const ERP_API_KEY = import.meta.env.VITE_ERP_API_KEY || "";
  const ERP_API_SECRET = import.meta.env.VITE_ERP_API_SECRET || "";
  const ERP_X_API_KEY = import.meta.env.VITE_ERP_X_API_KEY || "";

  // Use the X-API-Key header value (this is what Frappe expects)
  const API_KEY_HEADER_VALUE = ERP_X_API_KEY || ERP_API_KEY;

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

  // Fetch leave balances from ERP using proxy
  const fetchLeaveBalances = async (employee_code: string) => {
    setLoadingBalances(true);
    setError("");

    try {
      if (!API_KEY_HEADER_VALUE) {
        throw new Error(
          "API key not found. Please check your environment configuration. Make sure VITE_ERP_X_API_KEY is set in your .env file",
        );
      }

      // Using relative URL - will be proxied to the actual ERP server
      const url = `/api/method/lantern360_integration.lantern360_integration.api.v1.get_leave_balance?employee_code=${employee_code}`;
      console.log("Fetching from proxy URL:", url);

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY_HEADER_VALUE,
        },
      });

      // Handle response - the data might be directly in response.data or wrapped in message
      const responseData = response.data.message || response.data;

      if (responseData.success) {
        setLeaveBalances(responseData.leave_balances || []);
        setEmployeeName(responseData.employee_name || "");
        setFiscalYear(responseData.fiscal_year || "");

        // Set default leave type to first available
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
      const isNowHalfDay = value === "Half Day";
      setIsHalfDay(isNowHalfDay);

      // If half day, set end date same as start date and reset halfDayShift
      if (isNowHalfDay) {
        setFormData((prev) => ({
          ...prev,
          endDate: formData.startDate,
          halfDayShift: undefined,
          halfDay: true,
          halfDayDate: formData.startDate || null,
        }));
      } else {
        // Clear halfDayShift when not HALFDAY
        setFormData((prev) => ({
          ...prev,
          halfDayShift: undefined,
          halfDay: false,
          halfDayDate: null,
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
        ...(isHalfDay
          ? {
              endDate: value,
              halfDayDate: value,
            }
          : {}),
      }));

      // Validate sick leave can't be backdated
      if (formData.leaveType === "Sick Leave") {
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
      if (formData.leaveType === "Sick Leave" && formData.startDate < today) {
        errors.startDate = "Sick leave cannot be backdated";
      }
    }

    // Half day shift validation
    if (formData.leaveType === "Half Day" && !formData.halfDayShift) {
      errors.halfDayShift = "Please select a shift for half day leave";
    }

    // Validate leave balance
    const remainingBalance = getRemainingBalance();
    if (
      remainingBalance !== null &&
      remainingBalance <= 0 &&
      formData.leaveType !== "Leave Without Pay"
    ) {
      errors.leaveType = `Insufficient leave balance. Only ${remainingBalance} days remaining.`;
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
      if (!API_KEY_HEADER_VALUE) {
        throw new Error(
          "API key not found. Please check your environment configuration.",
        );
      }

      const employee_code = getEmployeeCode();
      if (!employee_code) {
        throw new Error("Employee code not found. Please login again.");
      }

      // Prepare payload based on ERP API requirements
      const payload = {
        employeeCode: employee_code,
        leaveType: formData.leaveType,
        fromDate: formData.startDate,
        toDate: isHalfDay ? formData.startDate : formData.endDate,
        halfDay: isHalfDay,
        halfDayDate: isHalfDay ? formData.startDate : null,
        reason: formData.reason,
        lantern360LeaveId: generateLeaveId(),
      };

      // Using relative URL - will be proxied to the actual ERP server
      const url = `/api/method/lantern360_integration.lantern360_integration.api.v1.receive_leave_application`;

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY_HEADER_VALUE,
        },
      });

      // Handle response
      const responseData = response.data.message || response.data;

      if (responseData.success) {
        setSuccess(
          `Leave application submitted successfully! Application ID: ${responseData.leave_application}`,
        );

        // Refresh leave balances
        await fetchLeaveBalances(employee_code);

        // Reset form
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

  // Calculate total days
  const calculateTotalDays = (): number => {
    if (!formData.startDate || !formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1;
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      leaveType:
        leaveBalances.length > 0 ? leaveBalances[0].leave_type : "Casual Leave",
      startDate: "",
      endDate: "",
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
    return new Date().toISOString().split("T")[0];
  };

  // Get min date for sick leave
  const getMinDateForSickLeave = () => {
    if (formData.leaveType === "Sick Leave") {
      return getTodayDate();
    }
    return "";
  };

  const balanceDetails = getLeaveBalanceDetails();

  return (
    <div className="min-h-screen bg-gray-50  px-4 sm:px-6 lg:px-8">
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
                          <span className="text-sm font-semibold text-green-600">
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
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

              {/* {balanceDetails && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800 font-semibold mb-1">
                    Leave Balance Details:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      Total Allocated:{" "}
                      <span className="font-semibold">
                        {balanceDetails.total_allocated}
                      </span>
                    </p>
                    <p>
                      Used:{" "}
                      <span className="font-semibold">
                        {balanceDetails.used}
                      </span>
                    </p>
                    <p>
                      Pending Approval:{" "}
                      <span className="font-semibold">
                        {balanceDetails.pending_approval}
                      </span>
                    </p>
                    <p>
                      Remaining:{" "}
                      <span className="font-semibold text-green-600">
                        {balanceDetails.remaining}
                      </span>
                    </p>
                  </div>
                </div>
              )} */}

              {validationErrors.leaveType && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.leaveType}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </div>

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
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lantern-blue-600 hover:bg-blue-700 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
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
