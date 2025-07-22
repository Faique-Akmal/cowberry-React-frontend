import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix default icon issue
import 'leaflet/dist/leaflet.css';
import API from '../../api/axios';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface UserLocation {
  user: number;
  username: string;
  latitude: number;
  longitude: number;
  battery_level?: number;
  is_paused: boolean;
}

const LiveUserTracker = () => {
  const [locations, setLocations] = useState<UserLocation[]>([]);

  const fetchLocations = async () => {
    try {
      const res = await API.get('/locations/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (err) {
      console.error('Error fetching live locations:', err);
    }
  };

  useEffect(() => {
    fetchLocations(); // Initial load
    const interval = setInterval(fetchLocations, 30000); // Update every 30 seconds
    return () => clearInterval(interval); // Cleanup
  }, []);

  return (
    <div className="h-[90vh] w-full">
      <h2 className="text-xl font-bold mb-4">Live User Location Tracker</h2>
      <MapContainer center={[26.8467, 80.9462]} zoom={6} className="h-full w-full rounded-lg">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {locations.map((loc) => (
          <Marker key={loc.user} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <div>
                <p><strong>User:</strong> {loc.username}</p>
                <p><strong>Lat:</strong> {loc.latitude.toFixed(5)}</p>
                <p><strong>Lng:</strong> {loc.longitude.toFixed(5)}</p>
                <p><strong>Battery:</strong> {loc.battery_level ?? 'N/A'}%</p>
                <p><strong>Status:</strong> {loc.is_paused ? 'Paused' : 'Active'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LiveUserTracker;
