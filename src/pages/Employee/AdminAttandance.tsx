import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { FaEye } from "react-icons/fa";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Attendance {

  date: string;
  start_time: string;
  end_time: string;
  address:string;
  start_lat: string;
  start_lng: string;
  end_lat: string;
  end_lng: string;
  odometer_image: string;
  selfie_image: string;
  description: string;
  username: string;
 
  department: string;
  user:{
      id:number;
      name:string;
      username:string,
      first_name:string,
      last_name:string,
      employee_code: string;
  }

}

export default function AttendanceList() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [mapView, setMapView] = useState<Attendance | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [startRes, endRes] = await Promise.all([
        API.get("/attendance-start/"),
        API.get("/attendance-end/"),
      ]);

      const startData = startRes.data.results || [];
      const endData = endRes.data.results || [];

      const mergedData = startData.map((startItem: any) => {
        const match = endData.find(
          (endItem: any) =>
            endItem.username === startItem.username &&
            endItem.date === startItem.date
        );

        return {
          ...startItem,
          end_time: match?.end_time || "",
          end_lat: match?.end_lat || "",
          end_lng: match?.end_lng || "",
        };
      });

      setAttendances(mergedData);

      // // Extract unique departments (keeping original case for display)
      const uniqueDepartments = Array.from(
        new Set(
          mergedData
            .map((a) => a.department?.trim())
            .filter(Boolean)
        )
      );
      setDepartments(uniqueDepartments);
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  // Filter attendance data based on selected department
  const filteredData = selectedDept
    ? attendances.filter(
        (att) =>
          att.department?.trim().toLowerCase() === selectedDept.toLowerCase()
      )
    : attendances;

  const openMap = (record: Attendance) => {
    // Check if we have valid coordinates
    if (!record.start_lat || !record.start_lng) {
      alert("Start location coordinates are missing");
      return;
    }
    setMapView(record);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Employee Attendance Records</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">
          Filter by Department:
        </label>
        <select
          className="border border-gray-300 p-2 rounded-md w-full sm:w-64"
          onChange={(e) => setSelectedDept(e.target.value)}
          value={selectedDept}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Display filtered results count */}
      <div className="mb-2 text-sm text-gray-600">
        Showing {filteredData.length} of {attendances.length} records
        {selectedDept && ` for ${selectedDept} department`}
      </div>

      {/* Scrollable Attendance Table */}
      <div className="overflow-auto max-h-[500px] border border-gray-300 rounded-md shadow-inner">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                Sr.no
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                Employee Code
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                Department
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                Start Time
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                End Time
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
               Address
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                Location
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr key={item.user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">
                    {item.user.first_name} {item.user.last_name}
                  </td>
                  <td className="px-4 py-2">{item.user.employee_code}</td>
                  <td className="px-4 py-2">{item.date}</td>
                  <td className="px-4 py-2">{item.department}</td>
                  <td className="px-4 py-2">{formatTime(item.start_time)}</td>
                  <td className="px-4 py-2">{formatTime(item.end_time)}</td>
                  {/* <td className="px-4 py-2 text-xs">
                    Start: ({item.start_lat}, {item.start_lng})
                    <br />
                    End: ({item.end_lat || "N/A"}, {item.end_lng || "N/A"})
                  </td> */}
                   <td className="px-4 py-2 text-xs">{item.address}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => openMap(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="View on Map"
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No attendance records found
                  {selectedDept && ` for ${selectedDept} department`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Map Modal */}
      {mapView && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-transparent w-full h-full relative">
            <button
              onClick={() => setMapView(null)}
              className="absolute top-8 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded z-[999]"
            >
              Close Map
            </button>

            <MapContainer
              center={[
                parseFloat(mapView.start_lat),
                parseFloat(mapView.start_lng),
              ]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Start Location Marker */}
              <Marker
                position={[
                  parseFloat(mapView.start_lat),
                  parseFloat(mapView.start_lng),
                ]}
                icon={L.icon({
                  iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                  shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>
                  <div>
                    <strong>Start Location</strong><br/>
                    Time: {formatTime(mapView.start_time)}<br/>
                    start_co-ordinates: {mapView.start_lat} {mapView.start_lng}<br/>
                    Employee: {mapView.user.first_name} {mapView.user.last_name}
                  </div>
                </Popup>
              </Marker>

              {/* End Location Marker (only if end coordinates exist) */}
              {mapView.end_lat && mapView.end_lng && (
                <>
                  <Marker
                    position={[
                      parseFloat(mapView.end_lat),
                      parseFloat(mapView.end_lng),
                    ]}
                    icon={L.icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                      shadowUrl:
                        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })}
                  >
                    <Popup>
                      <div>
                        <strong>End Location</strong><br/>
                        Time: {formatTime(mapView.end_time)}<br/>
                        End_co-ordinates: {mapView.end_lat} {mapView.end_lng}<br/>
                          Employee: {mapView.user.first_name} {mapView.user.last_name}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Polyline connecting start and end */}
                  <Polyline
                    positions={[
                      [
                        parseFloat(mapView.start_lat),
                        parseFloat(mapView.start_lng),
                      ],
                      [parseFloat(mapView.end_lat), parseFloat(mapView.end_lng)],
                    ]}
                    pathOptions={{ color: "green", weight: 4 }}
                  />
                </>
              )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}