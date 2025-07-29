// src/components/admin/LocationMap.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationData {
  latitude: number;
  longitude: number;
}

const LocationFetcher = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [startLocation, setStartLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch attendance start location once
  const fetchStartLocation = async () => {
    try {
      const res = await API.get('/attendance-start/', {
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        // },
      });
      if (res.data.start_lat && res.data.start_lng) {
        setStartLocation({
          latitude: parseFloat(res.data.start_lat),
          longitude: parseFloat(res.data.start_lng),
        });
      }
    } catch (err) {
      console.error('Error fetching start location:', err);
    }
  };

  // Post location to backend
  // const postLocation = async (coords: LocationData) => {
  //   try {
  //     await API.post(
  //       '/locations/${id}',
  //       {
  //         lat: coords.latitude,
  //         lng: coords.longitude,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  //         },
  //       }
  //     );
  //   } catch (err) {
  //     console.error('Error posting location:', err);
  //   }
  // };

  // Get current location every 20 sec
  useEffect(() => {
    fetchStartLocation();

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setCurrentLocation(coords);
            // postLocation(coords);
          },
          (err) => {
            console.error('Geolocation error:', err);
            setError('Failed to get location');
          }
        );
      } else {
        setError('Geolocation is not supported by your browser');
      }
    };

    updateLocation(); // first call
    const interval = setInterval(updateLocation, 20000); // every 20 sec

    return () => clearInterval(interval);
  }, []);


  return location ? (
    <MapContainer
      center={ [location.start_lat, startLocation.longitude]}
      zoom={15}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Marker position={[location.start_lat, location.start_lng]} icon={customIcon}>
        <Popup>
          User ID: {id}
          <br />
          Lat: {location.start_lat.toFixed(4)}, Lng: {location.start_lng.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  ) : (
    <p>Loading user location...</p>
  );
};

export default LocationMap;
