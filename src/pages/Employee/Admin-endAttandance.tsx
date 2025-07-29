import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});


// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;

interface Attendance {
  id: number;
  first_name: string;
  last_name: string;
  date: string;
  end_time: string;
  odometer_image: string;
  selfie_image: string;
  end_lat: string;
  end_lng: string;
  description: string;
  username: string;
  employee_code: string;
  department_name: string;
}

export default function AllAttendanceByDepartment() {
  const allowedDepartments = ["admin", "department_head", "hr", "it", "accountant", "order"];
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const res = await API.get("/attendance-end/");
      setAttendances(res.data.results || []);
      setDepartments(allowedDepartments);
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const filteredData = selectedDept
    ? attendances.filter((att) => att.department.toLowerCase() === selectedDept.toLowerCase())
    : attendances;

  return (
    <div className="p-4 bg-white rounded-xl shadow-md bg-[url('/old-paper-texture.jpg')] bg-cover">
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
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto max-h-[550px] border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Sr.no</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Full Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Employee Code</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Start Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Department</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Location</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Odometer</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Selfie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredData.map((item, index) => {
              const lat = parseFloat(item.end_lat);
              const lng = parseFloat(item.end_lng);
              const validCoords = !isNaN(lat) && !isNaN(lng);
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{item.first_name} {item.last_name} </td>
                  <td className="px-4 py-2">{item.employee_code}</td>
                  <td className="px-4 py-2">{formatDate(item.date)}</td>
                  <td className="px-4 py-2">{formatTime(item.end_time)}</td>
                  <td className="px-4 py-2">{item.department_name}</td>
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2">
                    {validCoords ? (
                      <MapContainer
                        center={[lat, lng]}
                        zoom={13}
                        scrollWheelZoom={false}
                        style={{ height: "100px", width: "200px", borderRadius: "10px" }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                        />
                        <Marker position={[lat, lng]}>
                          <Popup>
                            {item.first_name} {item.last_name}<br />
                            ({lat.toFixed(4)}, {lng.toFixed(4)})
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <span className="text-sm text-gray-500">No location</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <img
                      src={item.odometer_image}
                      alt="Odometer"
                      className="h-12 w-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <img
                      src={item.selfie_image}
                      alt="Selfie"
                      className="h-12 w-12 object-cover rounded-full"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
