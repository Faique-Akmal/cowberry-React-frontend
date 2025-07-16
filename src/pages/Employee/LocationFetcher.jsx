import React, { useState } from 'react';

const LocationFetcher = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(`Error: ${err.message}`);
        setLoading(false);
      }
    );
  };

  return (
    <div className="p-4 max-w-sm mx-auto bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-semibold mb-3">Get Your Current Coordinates</h2>
      <button
        onClick={handleGetLocation}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
      >
        Get Location
      </button>

      <div className="bg-gray-100 p-3 rounded">
        {loading ? (
          <p>Fetching location...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : location.latitude && location.longitude ? (
          <div>
            <p><strong>Latitude:</strong> {location.latitude}</p>
            <p><strong>Longitude:</strong> {location.longitude}</p>
          </div>
        ) : (
          <p>No location data yet.</p>
        )}
      </div>
    </div>
  );
};

export default LocationFetcher;
