import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../../api/axios';

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

  return (
    <div className="p-4 bg-white shadow-md rounded-lg space-y-4">
      <h2 className="text-lg font-bold">📍 Location Tracker</h2>

      {startLocation ? (
        <div className="text-sm text-gray-700">
          <strong>Start Location:</strong> Lat: {startLocation.latitude}, Lng: {startLocation.longitude}
        </div>
      ) : (
        <p className="text-sm text-red-500">Start location not available</p>
      )}

      {currentLocation ? (
        <div className="text-sm text-gray-700">
          <strong>Current Location:</strong> Lat: {currentLocation.latitude}, Lng: {currentLocation.longitude}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Getting current location...</p>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default LocationFetcher;
