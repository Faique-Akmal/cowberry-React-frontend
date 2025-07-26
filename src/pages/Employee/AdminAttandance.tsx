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

delete (L.Icon.Default.prototype as any)._getIconUrl;

interface Attendance {
  id: number;
  first_name: string;
  last_name: string;
  date: string;
  start_time: string;
  end_time: string;
  start_lat: string;
  start_lng: string;
  end_lat: string;
  end_lng: string;
  odometer_image: string;
  selfie_image: string;
  description: string;
  username: string;
  employee_code: string;
  department_name: string;
}

export default function AttendanceList() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
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

      // Merge start and end data based on username and date
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
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const filtered = selectedDept
    ? attendances.filter(
        (att) =>
          att.department_name?.toLowerCase() === selectedDept.toLowerCase()
      )
    : attendances;

  const openMap = (record: Attendance) => {
    setMapView(record);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Employee Attendance Records</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">Filter by Department:</label>
        <select
          className="border border-gray-300 p-2 rounded-md"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {[...new Set(attendances.map((a) => a.department_name))].map(
            (dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            )
          )}
        </select>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Sr.no</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Employee Code</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Department</th>
            <th className="px-4 py-2">Start Time</th>
            <th className="px-4 py-2">End Time</th>
            <th className="px-4 py-2">Location Co-ordinates</th>
            <th className="px-4 py-2">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{index + 1}</td>
              <td className="px-4 py-2">{item.first_name} {item.last_name}</td>
              <td className="px-4 py-2">{item.employee_code}</td>
              <td className="px-4 py-2">{item.date}</td>
              <td className="px-4 py-2">{item.department_name}</td>
              <td className="px-4 py-2">{formatTime(item.start_time)}</td>
              <td className="px-4 py-2">{item.end_time ? formatTime(item.end_time) : "-"}</td>
              <td className="px-4 py-2 text-xs">
                Start: ({item.start_lat}, {item.start_lng})<br />
                End: ({item.end_lat}, {item.end_lng})
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => openMap(item)}
                  className="text-blue-600 underline text-sm"
                >
               <FaEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Full Screen Map Modal */}
      {mapView && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-transparent w-full h-full relative">
            <button
              onClick={() => setMapView(null)}
              className="absolute top-8 right-4 bg-red-500 text-white px-3 py-1 rounded  z-999"
            >
              Close Map
            </button>

           <MapContainer
  center={[parseFloat(mapView.start_lat), parseFloat(mapView.start_lng)]}
  zoom={13}
  scrollWheelZoom={true}
  style={{ height: "100%", width: "100%" }}
>
 <TileLayer
 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
 
/>






  {/* Start Marker (Blue) */}
  <Marker
    position={[parseFloat(mapView.start_lat), parseFloat(mapView.start_lng)]}
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
    <Popup>Start Location</Popup>
  </Marker>

  {/* End Marker (Red) */}
  <Marker
    position={[parseFloat(mapView.end_lat), parseFloat(mapView.end_lng)]}
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
    <Popup>End Location</Popup>
  </Marker>

  {/* Line Between Start and End */}
  <Polyline
    positions={[
      [parseFloat(mapView.start_lat), parseFloat(mapView.start_lng)],
      [parseFloat(mapView.end_lat), parseFloat(mapView.end_lng)],
    ]}
    pathOptions={{ color: "green", weight: 4 }}
  />
</MapContainer>

          </div>
        </div>
      )}
    </div>
  );
}
