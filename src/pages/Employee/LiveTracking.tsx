import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import React, { useEffect, useState } from "react";
import API from "../../api/axios";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface EmployeeLocation {
  user: number;
  username: string;
  latitude: string;
  longitude: string;
  battery_level: number;
  is_paused: boolean;
}

const LiveTracking = () => {
  const [locations, setLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const res = await API.get("/locations/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error("Error fetching location logs:", error);
    } finally {
      setLoading(false);
    }
  };


  const sendCurrentLocation = async (lat: number, lng: number) => {
  try {
    const payload = {
      latitude: lat,
      longitude: lng,
      user: 12, // employee ID
      battery_level: 75,
      is_paused: false,
    };
    await API.post("/locations/", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
  } catch (err) {
    console.error("Error posting location", err);
  }
};


  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000); // Refresh every 30 sec
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  if (loading) return <div>Loading Live Locations...</div>;

  return (
    <div className="h-screen w-full p-4">
      <h2 className="text-xl font-semibold mb-4">Live Employee Locations</h2>
      <MapContainer center={[26.75, 83.92]} zoom={5} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker
            key={loc.user}
            position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{loc.username}</strong> <br />
              Battery: {loc.battery_level}% <br />
              Status: {loc.is_paused ? "Paused" : "Active"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LiveTracking;
