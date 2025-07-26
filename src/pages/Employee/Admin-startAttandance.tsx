import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../api/axios"; // your pre-configured axios instance

interface Attendance {
  id: number;
  date: string;
  start_time: string;
  odometer_image: string;
  selfie_image: string;
  start_lat: string;
  start_lng: string;
  description: string;
  user: {
    id: number;
    user: string;
    department: string;
    email: string;
  };
}

export default function AllAttendanceByDepartment() {
    const allowedDepartments = ["admin", "department_head", "hr", "it", "accountant"];
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const res = await API.get("/attendance-start/");       setAttendances(res.data.results || []);
      const uniqueDepts = [
        ...new Set(res.data.results.map((item: Attendance) => item.user.department)),
      ];
      setDepartments(allowedDepartments);
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    }
  };

 

const filteredData = selectedDept
  ? attendances.filter((att) =>
      att.user.department.toLowerCase() === selectedDept.toLowerCase()
    )
  : attendances;

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">All Attendance Logs</h2>

      {/* Department Filter */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">Filter by Department:</label>
        <select
          className="border border-gray-300 p-2 rounded-md w-full sm:w-64"
          onChange={(e) => setSelectedDept(e.target.value)}
          value={selectedDept}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto max-h-[550px] border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Sr.no</th>
              {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ID</th> */}
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Start Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">User</th>
              {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Department</th> */}
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Lat/Lng</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Odometer</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Selfie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{}</td>
                {/* <td className="px-4 py-2">{item.id}</td> */}
                <td className="px-4 py-2">{item.date}</td>
                <td className="px-4 py-2">{item.start_time}</td>
                <td className="px-4 py-2">{item.user.user}</td>
                {/* <td className="px-4 py-2">{item.user.department}</td> */}
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2">{item.start_lat}, {item.start_lng}</td>
                <td className="px-4 py-2">
                  <img src={item.odometer_image} alt="Odometer" className="h-12 w-12 object-cover rounded" />
                </td>
                <td className="px-4 py-2">
                  <img src={item.selfie_image} alt="Selfie" className="h-12 w-12 object-cover rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
