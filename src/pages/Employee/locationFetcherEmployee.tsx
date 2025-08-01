// src/components/admin/AttendanceList.tsx
import React, { useEffect, useState, useRef } from "react";
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
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}

interface LocationLog {
  latitude:  number;
  longitude:  number;
  timestamp: string;
  battery_level?: number | null;
  id?: number;
  is_paused?: boolean;
  user?: number;
}

export default function AttendanceList() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [mapView, setMapView] = useState<Attendance | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (mapView) {
      fetchLocations(mapView.user.id);

if (!mapView.end_lat || !mapView.end_lng) {
  locationIntervalRef.current = setInterval(() => {
    fetchLocations(mapView.user.id);
  }, 12000);
}

      
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [mapView]);

  const fetchData = async () => {
    try {
      const [startRes, endRes] = await Promise.all([
        API.get("/attendance-start/"),
        API.get("/attendance-end/"),
      ]);

      const startData = startRes.data.results || [];
      const endData = endRes.data.results || [];

   const merged = startData.map((start: any) => {
  const startUserId = typeof start.user === 'object' ? start.user.id : start.user;

  const match = endData.find((end: any) => {
    const endUserId = typeof end.user === 'object' ? end.user.id : end.user;
    return endUserId === startUserId && end.date === start.date;
  });

  return {
    ...start,
    end_time: match?.end_time || "",
    end_lat: match?.end_lat || "",
    end_lng: match?.end_lng || "",
  };
});




      setAttendances(merged);
      const uniqueDepts = Array.from(
        new Set(merged.map((a) => a.department?.trim()).filter(Boolean))
      );
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    }
  };

    const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };



const fetchLocations = async (userId: number) => {
  try {
    const res = await API.get(`/locations/${userId}`);
    let logs: LocationLog[] = [];

    if (Array.isArray(res.data)) {
      logs = res.data;
    } else if (res.data?.results) {
      logs = res.data.results;
    } else if (res.data?.data) {
      logs = res.data.data;
    } else if (res.data) {
      logs = [res.data];
    }

    // Optional: sort by timestamp
    logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

   setLocations((prevLogs) => {
  const seen = new Set(prevLogs.map((log) => log.timestamp));
  const combined = [...prevLogs];

  logs.forEach((log) => {
    if (!seen.has(log.timestamp)) {
      combined.push(log);
    }
  });

  combined.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return combined;
});

  } catch (err) {
    console.error("Failed to fetch user location:", err);
  }
};



  

  const pauseMarkers = () => {
    const pauses = [];
    for (let i = 1; i < locations.length; i++) {
      const prev = new Date(locations[i - 1].timestamp).getTime();
      const curr = new Date(locations[i].timestamp).getTime();
      const diff = (curr - prev) / 60000;
      if (diff > 2) pauses.push(locations[i]);
    }
    return pauses;
  };

  const openMap = (record: Attendance) => {
    setMapView(record);
    setLocations([]);
  };

  const closeMap = () => {
    setMapView(null);
    setLocations([]);
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
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
               <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Sr.no</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Employee Code</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Department</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Start Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">End Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Address</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Location</th>

            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={item.user.id + "-" + item.date}>
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">
                  {item.user.first_name} {item.user.last_name}
                </td>
                <td className="px-4 py-2">{item.user.employee_code}</td>
                <td className="px-4 py-2">{item.date}</td>
                <td className="px-4 py-2">{item.department}</td>
                <td className="px-4 py-2">{formatTime(item.start_time)}</td>
                <td className="px-4 py-2">{formatTime(item.end_time) || "-"}</td>
                 <td className="px-4 py-2 text-xs ">{item.address}</td>
                <td className="px-4 py-2">
                  <button
                    className="text-blue-600"
                    onClick={() => openMap(item)}
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mapView && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-transparent w-full h-full relative">
            <button
              onClick={closeMap}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded z-[999]"
            >
              Close Map
            </button>

            <MapContainer
              center={[
                parseFloat(mapView.start_lat),
                parseFloat(mapView.start_lng),
              ]}
              zoom={13}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
              key={`map-${mapView.user.id}-${mapView.date}`}
            >
               <TileLayer
                          attribution="Google Maps"
                          url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
                    />

              {/* Start */}
              <Marker
                position={[
                  parseFloat(mapView.start_lat),
                  parseFloat(mapView.start_lng),
                ]}
                icon={L.icon({
                  iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
                  shadowUrl,
                  iconSize: [25, 41],
                })}
              >
                <Popup>
                  <div>
                    <strong>Start Location</strong><br />
                    Employee: {mapView.user.first_name} {mapView.user.last_name}<br />
                    Time: {formatTime(mapView.start_time)}<br />
                    Address: {mapView.address}
                  </div>
                </Popup>
              </Marker>

              {/* End */}
              {mapView.end_lat && mapView.end_lng && (
                <Marker
                  position={[
                    parseFloat(mapView.end_lat),
                    parseFloat(mapView.end_lng),
                  ]}
                  icon={L.icon({
                    iconUrl:
                      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                    shadowUrl,
                    iconSize: [25, 41],
                  })}
                >
                  <Popup>

                      

                  <div>
                      <strong>End Location</strong><br />
                      Employee: {mapView.user.first_name} {mapView.user.last_name}<br />
                      Time: {formatTime(mapView.end_time)}<br/>
                      location:{mapView.end_lat} {mapView.end_lng}<br/>
                    </div>


                  </Popup>
                </Marker>
              )}

              {/* Polyline from start to latest location */}
             {/* Dynamic Polyline logic */}
{/* Full route Polyline including start, logs, and end */}
                  {(() => {
                    const path: [number, number][] = [];

                    // Start
                    if (mapView?.start_lat && mapView?.start_lng) {
                      path.push([
                        parseFloat(mapView.start_lat),
                        parseFloat(mapView.start_lng),
                      ]);
                    }

                    // Location logs
                    locations.forEach((log) => {
                      const lat = typeof log.latitude === "string" ? parseFloat(log.latitude) : log.latitude;
                      const lng = typeof log.longitude === "string" ? parseFloat(log.longitude) : log.longitude;

                      if (!isNaN(lat) && !isNaN(lng)) {
                        path.push([lat, lng]);
                      }
                    });

                    // End
                    if (mapView?.end_lat && mapView?.end_lng) {
                      path.push([
                        parseFloat(mapView.end_lat),
                        parseFloat(mapView.end_lng),
                      ]);
                    }

                    // Only draw if path has 2 or more points
                    if (path.length >= 2) {
                      return (
                        <Polyline
                          positions={path}
                          pathOptions={{ color: "blue", weight: 4 }}
                        />
                      );
                    }

                    return null;
                  })()}

              {/* Location logs */}
             {locations.map((log, i) => {
  // coerce to number (in case it's still a string)
  const lat =
    typeof log.latitude === "string"
      ? parseFloat(log.latitude)
      : log.latitude;
  const lng =
    typeof log.longitude === "string"
      ? parseFloat(log.longitude)
      : log.longitude;

  // if for whatever reason parsing failed, skip rendering this point
  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <Marker
      key={i}
      position={[lat, lng]}
      icon={L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
        shadowUrl,
        iconSize: [12, 20],
      })}
    >
      <Popup>
        {new Date(log.timestamp).toLocaleTimeString()}
        <br />
        Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
      </Popup>
    </Marker>
  );
})}


              {/* Pause markers */}
              {pauseMarkers().map((log, i) => (
                <Marker
                  key={`pause-${i}`}
                  position={[log.latitude, log.longitude]}
                  icon={L.icon({
                    iconUrl:
                      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
                    shadowUrl,
                    iconSize: [20, 32],
                  })}
                >
                  <Popup>Paused at {new Date(log.timestamp).toLocaleTimeString()}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
