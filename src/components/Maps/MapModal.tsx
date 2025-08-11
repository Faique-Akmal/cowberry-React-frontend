import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L, { LatLngExpression, Marker as LeafletMarker } from 'leaflet';
import API from '../../api/axios'; // Adjust path based on your project

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LocationUpdater = ({ position, markerRef }: any) => {
  const map = useMap();

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return null;
};

interface Props {
  userId: string;
  showMap: boolean;
  onClose: () => void;
}

const LiveLocationMap: React.FC<Props> = ({ userId, showMap, onClose }) => {
  const [path, setPath] = useState<LatLngExpression[]>([]);
  const [startPos, setStartPos] = useState<LatLngExpression | null>(null);
  const [endPos, setEndPos] = useState<LatLngExpression | null>(null);
  const markerRef = useRef<LeafletMarker>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [startRes, endRes, locationRes] = await Promise.all([
          API.get(`/attendance-start/?user_id=${userId}`),
          API.get(`/attendance-end/?user_id=${userId}`),
          API.get(`/locations/?user_id=${userId}`),
        ]);

        const pathData = locationRes.data.map((log: any) => [log.lat, log.lng]);

        setPath(pathData);
        setStartPos([
          startRes.data.location.lat,
          startRes.data.location.lng,
        ]);

        if (endRes.data?.location) {
          setEndPos([endRes.data.location.lat, endRes.data.location.lng]);
        }
      } catch (err) {
        console.error('Failed to fetch location data', err);
      }
    };

    if (showMap) fetchData();
  }, [userId, showMap]);

  if (!showMap) return null;

  if (!startPos) return <div className="p-4">Fetching location...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-[90%] h-[90%] relative">
        <button
          className="absolute top-2 right-2 text-gray-700 font-bold bg-gray-200 rounded-full px-3 py-1 hover:bg-gray-300"
          onClick={onClose}
        >
          ✕
        </button>

        <MapContainer center={startPos} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {startPos && <Marker position={startPos} icon={icon} ref={markerRef} />}
          {endPos && <Marker position={endPos} icon={icon} />}
          {path.length > 0 && <Polyline positions={path} color="blue" />}
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveLocationMap;
