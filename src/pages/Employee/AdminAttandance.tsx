// src/components/admin/AttendanceList.tsx
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

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface Attendance {
  date: string;
  start_time: string;
  end_time: string;
  address: string;
  start_lat: string;
  start_lng: string;
  end_lat: string;
  end_lng: string;
  odometer_image: string;
  selfie_image: string;
  description: string;
  username: string;
  department: string;
  user: {
    id: number;
    name: string;
    username: string;
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}

interface LocationLog {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function AttendanceList() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [mapView, setMapView] = useState<Attendance | null>(null);
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);

  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {
  if (mapView) {
    fetchLocationLogs(mapView.user.id, mapView.date);
  }
}, [mapView]);

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

      const uniqueDepartments = Array.from(
        new Set(mergedData.map((a) => a.department?.trim()).filter(Boolean))
      );
      setDepartments(uniqueDepartments);
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    }
  };

  const fetchLocationLogs = async (userId: number, date: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await API.get(`/locations/${userId}/?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const logs: LocationLog[] = res.data.results || [];

      const sortedLogs = logs.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setLocationLogs(sortedLogs);
    } catch (error) {
      console.error("Failed to fetch location logs", error);
      setLocationLogs([]);
    }
  };

  const pauseMarkers = () => {
    const markers = [];
    for (let i = 1; i < locationLogs.length; i++) {
      const prevTime = new Date(locationLogs[i - 1].timestamp).getTime();
      const currTime = new Date(locationLogs[i].timestamp).getTime();
      const diff = (currTime - prevTime) / 60000;
      if (diff > 2) {
        markers.push(locationLogs[i]);
      }
    }
    return markers;
  };

 const openMap = async (record: Attendance) => {
  if (!record.start_lat || !record.start_lng) {
    alert("Start location coordinates are missing");
    return;
  }

  await fetchLocationLogs(record.user.id, record.date);

  // Delay state update slightly to allow locationLogs to populate
  setTimeout(() => {
    setMapView(record);
  }, 100); // Short delay to allow state update (React batching behavior)
};

{console.log("Location Logs", locationLogs)}


  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const filteredData = selectedDept
    ? attendances.filter(
        (att) =>
          att.department?.trim().toLowerCase() === selectedDept.toLowerCase()
      )
    : attendances;

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
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-auto max-h-[500px] border border-gray-300 rounded-md shadow-inner">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2">Sr.no</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Employee Code</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Start Time</th>
              <th className="px-4 py-2">End Time</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr key={item.user.id}>
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">
                    {item.user.first_name} {item.user.last_name}
                  </td>
                  <td className="px-4 py-2">{item.user.employee_code}</td>
                  <td className="px-4 py-2">{item.date}</td>
                  <td className="px-4 py-2">{item.department}</td>
                  <td className="px-4 py-2">{formatTime(item.start_time)}</td>
                  <td className="px-4 py-2">{formatTime(item.end_time)}</td>
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
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  No attendance records found
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
                  <strong>Start Location</strong>
                  <br />
                  Time: {formatTime(mapView.start_time)}
                </Popup>
              </Marker>

              {/* Pause markers */}
              {pauseMarkers().map((pause, idx) => (
                <Marker
                  key={`pause-${idx}`}
                  position={[pause.latitude, pause.longitude]}
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
                    <strong>Pause</strong>
                    <br />
                    Time: {new Date(pause.timestamp).toLocaleTimeString()}
                  </Popup>
                </Marker>
              ))}

              {/* End location */}
              {mapView.end_lat && mapView.end_lng && (
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
                    <strong>End Location</strong>
                    <br />
                    Time: {formatTime(mapView.end_time)}
                  </Popup>
                </Marker>
              )}

              {/* User movement path using locationLogs */}
               {locationLogs.length > 1 && (
                  <Polyline
                    positions={locationLogs.map((log) => [
                      log.latitude,
                      log.longitude,
                    ])}
                    pathOptions={{ color: "blue", weight: 3 }}
                  />
                )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
