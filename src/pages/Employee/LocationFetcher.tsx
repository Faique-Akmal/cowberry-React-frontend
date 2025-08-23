import React, { useEffect, useRef, useState } from "react";

export default function LiveTrackingMap({ userId }) {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const [path, setPath] = useState([]);
  const [tripEnded, setTripEnded] = useState(false);

  // Initialize Map
  useEffect(() => {
    googleMap.current = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: { lat: 21.1702, lng: 72.8311 }, // default Surat center
    });
    loadInitialData();
  }, []);

  // Load initial start + in-between coords
  async function loadInitialData() {
    try {
      const startData = await fetch(`/attendance-start?user=${userId}`).then(r => r.json());
      const locationData = await fetch(`/locations?user=${userId}`).then(r => r.json());

      const initialPath = [
        { lat: parseFloat(startData.latitude), lng: parseFloat(startData.longitude) },
        ...locationData.map(loc => ({
          lat: parseFloat(loc.latitude),
          lng: parseFloat(loc.longitude),
        }))
      ];

      setPath(initialPath);
      drawPolyline(initialPath);
      placeStartMarker(initialPath[0]);

      // Check if trip ended
      const endCheck = await fetch(`/attendance-end?user=${userId}`).then(r => r.json());
      if (endCheck && endCheck.latitude) {
        setTripEnded(true);
        const finalPath = [...initialPath, {
          lat: parseFloat(endCheck.latitude),
          lng: parseFloat(endCheck.longitude),
        }];
        setPath(finalPath);
        placeEndMarker(finalPath[finalPath.length - 1]);
        drawPolyline(finalPath);
      } else {
        startPolling();
      }

    } catch (err) {
      console.error("Error loading trip data", err);
    }
  }

  // Polling for live updates
  function startPolling() {
    const interval = setInterval(async () => {
      const locationData = await fetch(`/locations?user=${userId}`).then(r => r.json());
      if (!locationData.length) return;

      setPath(prevPath => {
        const newCoords = locationData.map(loc => ({
          lat: parseFloat(loc.latitude),
          lng: parseFloat(loc.longitude),
        }));
        const updatedPath = [...prevPath, ...newCoords.filter(c => !prevPath.some(p => p.lat === c.lat && p.lng === c.lng))];
        drawPolyline(updatedPath);
        placeCurrentMarker(updatedPath[updatedPath.length - 1]);
        return updatedPath;
      });

      // Check trip end
      const endData = await fetch(`/attendance-end?user=${userId}`).then(r => r.json());
      if (endData && endData.latitude) {
        setTripEnded(true);
        placeEndMarker({
          lat: parseFloat(endData.latitude),
          lng: parseFloat(endData.longitude),
        });
        clearInterval(interval);
      }
    }, 10000); // every 10 seconds
  }

  // Draw polyline
  function drawPolyline(coords) {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    polylineRef.current = new window.google.maps.Polyline({
      path: coords,
      geodesic: true,
      strokeColor: "#4285F4",
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });
    polylineRef.current.setMap(googleMap.current);
    googleMap.current.setCenter(coords[coords.length - 1]);
  }

  // Markers
  function placeStartMarker(position) {
    new window.google.maps.Marker({
      position,
      map: googleMap.current,
      icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" },
      title: "Start Point",
    });
  }

  function placeEndMarker(position) {
    new window.google.maps.Marker({
      position,
      map: googleMap.current,
      icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" },
      title: "End Point",
    });
  }

  function placeCurrentMarker(position) {
    if (!currentMarkerRef.current) {
      currentMarkerRef.current = new window.google.maps.Marker({
        position,
        map: googleMap.current,
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
        title: "Current Location",
      });
    } else {
      currentMarkerRef.current.setPosition(position);
    }
  }

  return (
    <div>
      <h2>User {userId} Live Tracking</h2>
      <div ref={mapRef} style={{ width: "100%", height: "500px" }}></div>
      {tripEnded && <p>Trip Ended</p>}
    </div>
  );
}
