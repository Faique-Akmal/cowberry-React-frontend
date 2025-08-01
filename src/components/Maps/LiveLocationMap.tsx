import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L, { LatLngExpression, Marker as LeafletMarker } from 'leaflet';
// import { ref, push } from 'firebase/database';
// import { db } from '../firebase';

// [latitude, longitude]
const dummyPath: LatLngExpression[] = [
  [28.6139, 77.2090],
  [28.6145, 77.2100],
  [28.6150, 77.2110],
  [28.6155, 77.2120],
  [28.6160, 77.2130],
  [28.6165, 77.2140],
  [28.6170, 77.2150],
];


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

const LiveLocationMap: React.FC = () => {
  const [position, setPosition] = useState< LatLngExpression | null>(null);
  const [path, setPath] = useState<LatLngExpression[]>([]);
  const markerRef = useRef<LeafletMarker>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords: LatLngExpression = [latitude, longitude];

        setPosition(coords);
        setPath((prev) => [...prev, coords]);

        // 🔥 Save to Firebase
        // push(ref(db, 'locations'), {
        //   lat: latitude,
        //   lng: longitude,
        //   timestamp: Date.now(),
        // });
      },
      (err) => console.error('Geo error', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!position) return <p 
        className="relative flex capitalize items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
  >Fetching location...</p>;

  return (
    <MapContainer center={position} zoom={14} style={{ height: '80vh' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={icon} ref={markerRef} />
      <LocationUpdater position={dummyPath} markerRef={markerRef} />
      <Polyline positions={path} color="blue" />
    </MapContainer>
  );
};

export default LiveLocationMap;
