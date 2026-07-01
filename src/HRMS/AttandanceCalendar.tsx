// AttendanceCalendar.tsx - Fixed version
import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../api/axios";

// Types
interface CheckLog {
  userId: number;
  fullName: string;
  employee_code: string;
  logType: "check_in" | "check_out";
  timestamp: string;
}

interface CheckLogsResponse {
  success: boolean;
  total: number;
  data: CheckLog[];
}

interface AttendanceRecord {
  date: string;
  checkIn?: string;
  checkOut?: string;
  status:
    | "present"
    | "absent"
    | "half-day"
    | "sunday"
    | "future"
    | "today-checked-in";
  workingHours?: number;
}

interface EmployeeAttendance {
  userId: number;
  employeeCode: string;
  fullName: string;
  username: string;
  attendance: Record<string, AttendanceRecord>;
}

interface Employee {
  userId: number;
  fullName: string;
  employee_code: string;
  username: string;
}

const AttendanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeAttendance, setEmployeeAttendance] = useState<
    EmployeeAttendance[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all employees first
  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const response = await API.get<CheckLogsResponse>("/admin/check-logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 1000,
          page: 1,
        },
      });

      if (response.data.success) {
        const employeeMap = new Map<number, Employee>();
        response.data.data.forEach((log) => {
          if (!employeeMap.has(log.userId)) {
            employeeMap.set(log.userId, {
              userId: log.userId,
              fullName: log.fullName,
              employee_code: log.employee_code,
              username: log.username || `emp_${log.userId}`,
            });
          }
        });

        const uniqueEmployees = Array.from(employeeMap.values());
        setEmployees(uniqueEmployees);

        if (uniqueEmployees.length > 0) {
          setSelectedEmployee(uniqueEmployees[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  // Fetch all check logs (helper function)
  const fetchAllCheckLogs = useCallback(async (token: string) => {
    const response = await API.get<CheckLogsResponse>("/admin/check-logs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        limit: 1000,
        page: 1,
      },
    });

    if (response.data.success) {
      return response.data.data;
    }
    return [];
  }, []);

  // Process attendance data with the current month
  const processAttendanceData = useCallback(
    (employee: Employee, logs: CheckLog[], targetDate: Date) => {
      const attendanceMap: Record<string, AttendanceRecord> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all dates in the target month
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // First, process all logs to get actual attendance data
      const logsByDate: Record<string, CheckLog[]> = {};

      logs.forEach((log) => {
        const dateObj = new Date(log.timestamp);
        const dateKey = dateObj.toDateString();
        const dayOfWeek = dateObj.getDay();

        // Skip Sundays
        if (dayOfWeek === 0) return;

        if (!logsByDate[dateKey]) {
          logsByDate[dateKey] = [];
        }
        logsByDate[dateKey].push(log);
      });

      // Now initialize all days in the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateKey = dateObj.toDateString();
        const dayOfWeek = dateObj.getDay();

        // Check if date is in the future
        const isFutureDate = dateObj > today;

        // Skip Sundays (day 0 is Sunday)
        if (dayOfWeek === 0) {
          attendanceMap[dateKey] = {
            date: dateKey,
            status: "sunday",
          };
        } else if (isFutureDate) {
          // Future dates - no status
          attendanceMap[dateKey] = {
            date: dateKey,
            status: "future",
          };
        } else {
          // Check if we have logs for this date
          if (logsByDate[dateKey]) {
            // We'll process this later
            attendanceMap[dateKey] = {
              date: dateKey,
              status: "absent", // Temporary, will be updated
            };
          } else {
            // No logs - absent
            attendanceMap[dateKey] = {
              date: dateKey,
              status: "absent",
            };
          }
        }
      }

      // Process actual logs for each date
      Object.keys(logsByDate).forEach((dateKey) => {
        const dateLogs = logsByDate[dateKey];
        const record = attendanceMap[dateKey];

        if (!record) return;

        let hasCheckIn = false;
        let hasCheckOut = false;
        let checkInTime = "";
        let checkOutTime = "";

        dateLogs.forEach((log) => {
          if (log.logType === "check_in") {
            hasCheckIn = true;
            checkInTime = log.timestamp;
          } else if (log.logType === "check_out") {
            hasCheckOut = true;
            checkOutTime = log.timestamp;
          }
        });

        // Determine status based on logs
        const dateObj = new Date(dateKey);
        const isToday = dateObj.toDateString() === today.toDateString();

        if (hasCheckIn && hasCheckOut) {
          // Both check-in and check-out present
          const checkIn = new Date(checkInTime);
          const checkOut = new Date(checkOutTime);
          const hoursWorked =
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          record.workingHours = hoursWorked;
          record.checkIn = checkInTime;
          record.checkOut = checkOutTime;

          if (hoursWorked < 6) {
            record.status = "half-day";
          } else {
            record.status = "present";
          }
        } else if (hasCheckIn && !hasCheckOut) {
          // Only check-in present
          record.checkIn = checkInTime;

          if (isToday) {
            // Today with only check-in - mark as "Checked In"
            record.status = "today-checked-in";
          } else {
            // Past date with only check-in - half day
            record.status = "half-day";
          }
        }
      });

      setEmployeeAttendance([
        {
          userId: employee.userId,
          employeeCode: employee.employee_code,
          fullName: employee.fullName,
          username: employee.username,
          attendance: attendanceMap,
        },
      ]);
    },
    [],
  );

  // Fetch attendance for selected employee
  const fetchEmployeeAttendance = useCallback(async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const allLogs = await fetchAllCheckLogs(token);
      const employeeLogs = allLogs.filter(
        (log) => log.userId === selectedEmployee.userId,
      );

      // Pass the current date to process attendance for the correct month
      processAttendanceData(selectedEmployee, employeeLogs, currentDate);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, currentDate, fetchAllCheckLogs, processAttendanceData]);

  // Initial fetch of employees
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Fetch attendance whenever selected employee OR current month changes
  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeAttendance();
    }
  }, [selectedEmployee, currentDate, fetchEmployeeAttendance]); // Added currentDate as dependency

  // Navigate month handler - this will trigger the useEffect above
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    const today = new Date();

    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      days.push({
        date: dateObj,
        isCurrentMonth: true,
        isToday: dateObj.toDateString() === today.toDateString(),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  const getStatusForDate = (date: Date): AttendanceRecord | null => {
    if (employeeAttendance.length === 0) return null;
    const dateString = date.toDateString();
    return employeeAttendance[0].attendance[dateString] || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      case "half-day":
        return "bg-yellow-500";
      case "sunday":
        return "bg-purple-200";
      case "future":
        return "bg-gray-100";
      case "today-checked-in":
        return "bg-blue-500";
      default:
        return "bg-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "✓";
      case "absent":
        return "✗";
      case "half-day":
        return "½";
      case "sunday":
        return "S";
      case "today-checked-in":
        return "⏳";
      default:
        return "";
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getAttendanceSummary = () => {
    if (employeeAttendance.length === 0) return null;

    const attendance = employeeAttendance[0].attendance;
    const totalDays = Object.keys(attendance).filter(
      (key) =>
        attendance[key].status !== "sunday" &&
        attendance[key].status !== "future",
    ).length;
    const presentDays = Object.values(attendance).filter(
      (a) => a.status === "present",
    ).length;
    const halfDays = Object.values(attendance).filter(
      (a) => a.status === "half-day",
    ).length;
    const absentDays = Object.values(attendance).filter(
      (a) => a.status === "absent",
    ).length;
    const sundayDays = Object.values(attendance).filter(
      (a) => a.status === "sunday",
    ).length;
    const futureDays = Object.values(attendance).filter(
      (a) => a.status === "future",
    ).length;
    const checkedInToday = Object.values(attendance).filter(
      (a) => a.status === "today-checked-in",
    ).length;

    return {
      totalDays,
      presentDays,
      halfDays,
      absentDays,
      sundayDays,
      futureDays,
      checkedInToday,
    };
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error && employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchEmployees}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header with Employee Selector */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Attendance Calendar</h2>
            <p className="text-sm text-gray-600">
              View employee attendance by month
            </p>
          </div>

          {/* Employee Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span className="font-medium">
                  {selectedEmployee?.fullName || "Select Employee"}
                </span>
              </div>
              {showEmployeeDropdown ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showEmployeeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No employees found
                    </div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <button
                        key={employee.userId}
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowEmployeeDropdown(false);
                          setSearchTerm("");
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                          selectedEmployee?.userId === employee.userId
                            ? "bg-blue-50 text-blue-600"
                            : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                          {employee.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {employee.fullName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {employee.employee_code}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs">Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs">Half Day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs">Absent</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-200" />
            <span className="text-xs">Sunday</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-gray-500">Loading attendance data...</p>
            </div>
          </div>
        ) : employeeAttendance.length === 0 || !selectedEmployee ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {selectedEmployee
                ? "No attendance data available"
                : "Please select an employee"}
            </p>
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const record = getStatusForDate(day.date);
                const isCurrentMonth = day.isCurrentMonth;
                const isSunday = day.date.getDay() === 0;
                const isFuture = record?.status === "future";
                const isTodayCheckedIn = record?.status === "today-checked-in";

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded-lg ${
                      isCurrentMonth ? "bg-white" : "bg-gray-50"
                    } ${day.isToday ? "border-blue-500 border-2" : "border-gray-200"}
                    ${isSunday && isCurrentMonth ? "bg-purple-50" : ""}
                    ${isFuture && isCurrentMonth ? "bg-gray-50" : ""}
                    ${isTodayCheckedIn && isCurrentMonth ? "bg-blue-50" : ""}`}
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      {day.date.getDate()}
                    </div>
                    {record && isCurrentMonth && record.status !== "future" && (
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-10 h-10 rounded-full ${getStatusColor(
                            record.status,
                          )} flex items-center justify-center transition-all duration-200 hover:scale-110`}
                        >
                          <span className="text-white text-xs font-bold">
                            {getStatusIcon(record.status)}
                          </span>
                        </div>
                        {record.status === "today-checked-in" && (
                          <span className="text-[8px] text-blue-600 font-medium">
                            Checked In
                          </span>
                        )}
                        {record.workingHours &&
                          record.status !== "sunday" &&
                          record.status !== "today-checked-in" && (
                            <span className="text-[10px] text-gray-500">
                              {record.workingHours.toFixed(1)}h
                            </span>
                          )}
                        {record.checkIn &&
                          record.checkOut &&
                          record.status !== "sunday" &&
                          record.status !== "today-checked-in" && (
                            <span className="text-[8px] text-gray-400">
                              {new Date(record.checkIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(record.checkOut).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          )}
                      </div>
                    )}
                    {record && isCurrentMonth && record.status === "future" && (
                      <div className="flex flex-col items-center justify-center h-16">
                        <span className="text-xs text-gray-400">-</span>
                      </div>
                    )}
                    {!record && isCurrentMonth && (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {getAttendanceSummary() && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3">Attendance Summary</h4>

                {/* Summary Cards with Image */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                  {/* 4 Cards - each takes 1 column on small screens, 1 column on large */}
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600">Present</div>
                    <div className="text-2xl font-bold text-green-600">
                      {getAttendanceSummary()?.presentDays || 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600">Half Day</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {getAttendanceSummary()?.halfDays || 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600">Absent</div>
                    <div className="text-2xl font-bold text-red-600">
                      {getAttendanceSummary()?.absentDays || 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600">Total Days</div>
                    <div className="text-2xl font-bold text-gray-600">
                      {getAttendanceSummary()?.totalDays || 0}
                    </div>
                  </div>

                  {/* Image - spans 2 columns on small screens, 2 columns on large (grid-cols-6 means it takes 2/6 = 1/3 of the space) */}
                  <div className="col-span-2 sm:col-span-2 rounded-lg overflow-hidden shadow-sm">
                    <img
                      src="lantern-banner.png"
                      className="w-full h-full object-cover min-h-[80px]"
                      alt="Banner"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
