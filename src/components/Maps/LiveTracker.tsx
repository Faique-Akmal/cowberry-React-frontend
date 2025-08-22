import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L, { LatLngExpression, Marker as LeafletMarker } from 'leaflet';

// Current Location Pin
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Starting Location Pin
const redCustomIcon = new L.Icon({
   iconRetinaUrl:
    'https://images.ctfassets.net/3prze68gbwl1/assetglossary-17su9wok1ui0z7w/c4c4bdcdf0d0f86447d3efc450d1d081/map-marker.png',
  iconUrl:
    'https://images.ctfassets.net/3prze68gbwl1/assetglossary-17su9wok1ui0z7w/c4c4bdcdf0d0f86447d3efc450d1d081/map-marker.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [32, 32], // Icon size
  iconAnchor: [16, 32], // Where the icon is anchored on the map
  popupAnchor: [0, -32],
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

const dummyPath: LatLngExpression[] = [
  [21.184707006555634, 72.92959613568755],
  [21.1847870368079, 72.93075484995232],
  [21.181585792926086, 72.93135566475628],
  [21.18022524328763, 72.93573302975649],
  [21.179144797892107, 72.9392950032371],
  [21.178184395357732, 72.94272823068826],
  [21.175303150286688, 72.95268459053835],
  [21.173782470560774, 72.95680446347976],
  [21.17298210653081, 72.95955104544069],
  [21.172021663978608, 72.96221179671532],
  [21.171901607968362, 72.96272141668864],
  [21.17262194105173, 72.96286089155385],
  [21.17325222964913, 72.96289844250136],
  [21.1737874725964, 72.96297890876976],
  [21.17423267323564, 72.96300573086305],
  [21.175663308795595, 72.96315593456403],
  [21.176643736424833, 72.96326322293152],
  [21.179234835172814, 72.96357435918685],
  [21.181305680651526, 72.96408934330452],
  [21.183146407879896, 72.96451849674439],
  [21.184616972443184, 72.96482963299562],
  [21.18479704055949, 72.96416444517693]
];

const LiveTracker: React.FC = () => {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [path, setPath] = useState<LatLngExpression[]>([]);
  const markerRef = useRef<LeafletMarker>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextPoint = dummyPath[indexRef.current];
      if (nextPoint) {
        setPosition(nextPoint);
        setPath((prev) => [...prev, nextPoint]);
        indexRef.current += 1;
      } else {
        clearInterval(interval); // stop when path ends
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!position) return <p
        className="relative flex capitalize items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
  >Loading dummy data...</p>;

  return (
    <MapContainer center={position} zoom={14} style={{ height: '60vh', width: '100%' ,borderRadius:"12px"}}>
      <TileLayer
            attribution="Google Maps"
            url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
      />
      {/* <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      /> */}
      <Marker position={dummyPath[0]} icon={redCustomIcon} />
      <Marker position={position} icon={icon} ref={markerRef} />
      <LocationUpdater position={position} markerRef={markerRef} />
      <Polyline positions={path} color="blue" />
    </MapContainer>
  );
};

export default LiveTracker;
