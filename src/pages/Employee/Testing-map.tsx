import React, { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TravelSession {
  sessionId: number;
  startTime: string;
  endTime?: string;
  start_lat: number;
  start_lng: number;
  end_lat?: number;
  end_lng?: number;
  userId: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
  };
  totalDistanceKm?: number;
}

interface LocationLog {
  id: number;
  latitude: number | string;
  longitude: number | string;
  battery?: number;
  speed?: number;
  pause?: boolean;
  timestamp: string;
}

export default function Testingmap() {
  const [sessions, setSessions] = useState<TravelSession[]>([]);
  const [locationsMap, setLocationsMap] = useState<Record<string, LocationLog[]>>({});
  const [mapView, setMapView] = useState<TravelSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await API.get("/tracking/locationlog/get_sessions");
      setSessions(res.data);
    } catch (err) {
      console.log("Failed to fetch sessions", err);
    }
  };

  const fetchLocations = async (sessionId: number, userId: number) => {
    setIsLoading(true);
    try {
      const res = await API.get(`/tracking/locationlog/get_location_logs?sessionId=${sessionId}`);
      const logs: LocationLog[] = res.data.data || [];

      const sorted = logs.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setLocationsMap(prev => ({ ...prev, [sessionId]: sorted }));
    } catch (err) {
      console.log("Error fetching logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openMap = (row: TravelSession) => {
    setMapView(row);
    fetchLocations(row.sessionId, row.userId);
  };

  const buildPath = (session: TravelSession) => {
    const logs = locationsMap[session.sessionId] || [];
    const path: [number, number][] = [];

    path.push([session.start_lat, session.start_lng]);

    logs.forEach(log => {
      path.push([parseFloat(log.latitude as any), parseFloat(log.longitude as any)]);
    });

    if (session.end_lat && session.end_lng) {
      path.push([session.end_lat, session.end_lng]);
    }

    return path;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Travel Sessions</h2>

      <table className="w-full border rounded">
        <thead className="bg-gray-200">
          <tr>
            <th>Session ID</th>
            <th>User</th>
            <th>Start</th>
            <th>End</th>
            <th>Distance</th>
            <th>Map</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.sessionId} className="border-b">
              <td>{s.sessionId}</td>
              <td>{s.user.first_name} {s.user.last_name}</td>
              <td>{new Date(s.startTime).toLocaleTimeString()}</td>
              <td>{s.endTime ? new Date(s.endTime).toLocaleTimeString() : "Active"}</td>
              <td>{s.totalDistanceKm || "0"} km</td>
              <td>
                <button className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => openMap(s)}>
                  View Map
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mapView && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="relative w-full h-full">
            <button
              onClick={() => setMapView(null)}
              className="absolute top-4 right-4 bg-red-500 px-4 py-1 text-white rounded"
            >
              Close
            </button>

            <MapContainer
              center={[mapView.start_lat, mapView.start_lng]}
              zoom={14}
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}" />

              <Polyline positions={buildPath(mapView)} pathOptions={{ color: "blue", weight: 6 }} />

              <Marker position={[mapView.start_lat, mapView.start_lng]}>
                <Popup>Start</Popup>
              </Marker>

              {mapView.end_lat && (
                <Marker position={[mapView.end_lat, mapView.end_lng]}>
                  <Popup>End</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
