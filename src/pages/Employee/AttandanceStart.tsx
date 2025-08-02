import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import API from "../../api/axios";

interface FormDataState {
  user: string;
  username: string;
  start_lat: string;
  start_lng: string;
  description: string;
  odometer_image: File | null;
  selfie_image: File | null;
}

interface LocationPayload {
  user: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function AttendanceStart() {
  const [formData, setFormData] = useState<FormDataState>({
    user: "",
    username: "",
    start_lat: "",
    start_lng: "",
    description: "",
    odometer_image: null,
    selfie_image: null,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [odometerPreview, setOdometerPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });
  const [trackingActive, setTrackingActive] = useState(false);
  const [useDummyData, setUseDummyData] = useState(false); // Toggle for dummy data
  const [dummyCounter, setDummyCounter] = useState(0); // Counter for dummy location variations

  const navigate = useNavigate();

  // Dummy location data for testing - simulates movement around a base location
  const generateDummyLocation = useCallback(() => {
    // Base location (you can change these coordinates to your preferred test location)
    const baseLat = 21.1702; // Surat, Gujarat base latitude
    const baseLng = 72.8311; // Surat, Gujarat base longitude
    
    // Add small random variations to simulate movement (within ~100 meters)
    const latVariation = (Math.random() - 0.5) * 0.001; // ~50m variation
    const lngVariation = (Math.random() - 0.5) * 0.001; // ~50m variation
    
    // Add a slight progressive movement based on counter
    const progressiveLat = baseLat + (dummyCounter * 0.0001); // Gradual movement north
    const progressiveLng = baseLng + (dummyCounter * 0.0001); // Gradual movement east
    
   return {
  lat: (progressiveLat + latVariation).toFixed(6),
  lng: (progressiveLng + lngVariation).toFixed(6)
};

  }, [dummyCounter]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "odometer_image" | "selfie_image"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setMessage(`❌ Unsupported file format for ${field}.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(`❌ ${field} exceeds 5MB.`);
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    setMessage("");

    const previewUrl = URL.createObjectURL(file);
    if (field === "odometer_image") setOdometerPreview(previewUrl);
    else setSelfiePreview(previewUrl);
  };

  const cacheOfflineLocation = useCallback((payload: LocationPayload) => {
    try {
      const cached = JSON.parse(localStorage.getItem("pendingLocationUpdates") || "[]");
      cached.push(payload);
      localStorage.setItem("pendingLocationUpdates", JSON.stringify(cached));
      console.log("Location cached for offline sync:", payload);
    } catch (error) {
      console.error("Error caching location:", error);
    }
  }, []);

  const sendLocationUpdate = useCallback((lat: string, lng: string, user: string) => {
    if (!lat || !lng || !user || user === "0") {
      console.warn("Invalid data for location update:", { lat, lng, user });
      return;
    }

    const payload: LocationPayload = {
      user: parseInt(user),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      timestamp: new Date().toISOString(),
    };

    console.log(`📍 Sending location update: ${useDummyData ? 'DUMMY' : 'REAL'} - Lat: ${lat}, Lng: ${lng}`);

    if (navigator.onLine) {
      API.post("/locations/", payload)
        .then(() => {
          console.log("✅ Location update sent successfully");
        })
        .catch((err) => {
          console.error("❌ Online post failed, storing offline:", err);
          cacheOfflineLocation(payload);
        });
    } else {
      console.log("📴 Offline - caching location update");
      cacheOfflineLocation(payload);
    }
  }, [cacheOfflineLocation, useDummyData]);

  const syncOfflineData = useCallback(() => {
    try {
      const cachedUpdates = JSON.parse(localStorage.getItem("pendingLocationUpdates") || "[]");

      if (cachedUpdates.length > 0) {
        console.log(`🔄 Syncing ${cachedUpdates.length} cached location updates`);
        
        Promise.all(
          cachedUpdates.map((loc: LocationPayload) =>
            API.post("/locations/", loc)
              .then(() => console.log("✅ Synced location:", loc))
              .catch((err) => {
                console.error("❌ Sync failed for location:", loc, err);
                throw err;
              })
          )
        )
        .then(() => {
          localStorage.removeItem("pendingLocationUpdates");
          console.log("✅ All cached locations synced successfully");
        })
        .catch(() => {
          console.log("⚠️ Some locations failed to sync, keeping in cache");
        });
      }
    } catch (error) {
      console.error("❌ Error syncing offline data:", error);
    }
  }, []);

  const fetchUserAndLocation = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const userRes = await API.get("/me/");
      const user = userRes.data;

      if (useDummyData) {
        // Use dummy location data
        const dummyLoc = generateDummyLocation();
        setFormData((prev) => ({
          ...prev,
          user: String(user.id || user.user_id || user.pk),
          username: user.name || user.username || "",
          start_lat: dummyLoc.lat,
          start_lng: dummyLoc.lng,
        }));

        setLiveLocation(dummyLoc);
        setLocationFetched(true);
        setMessage("✅ Dummy location set! Ready for testing.");
      } else {
        // Use real GPS location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude.toString();
            const lng = position.coords.longitude.toString();

            setFormData((prev) => ({
              ...prev,
              user: String(user.id || user.user_id || user.pk),
              username: user.name || user.username || "",
              start_lat: lat,
              start_lng: lng,
            }));

            setLiveLocation({ lat, lng });
            setLocationFetched(true);
            setMessage("✅ Real location fetched successfully! You can now fill the form.");
          },
          (err) => {
            console.error("Geolocation error:", err);
            setMessage("❌ Failed to fetch location. Please allow GPS access and try again.");
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
      }
    } catch (error) {
      console.error("User fetch error:", error);
      setMessage("❌ Failed to fetch user info. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Location tracking effect
  useEffect(() => {
    if (!locationFetched || !formData.user || trackingActive) return;

    let watchId: number;
    let intervalId: NodeJS.Timeout;

    const startTracking = () => {
      setTrackingActive(true);
      
      if (useDummyData) {
        // Use dummy data tracking
        intervalId = setInterval(() => {
          const newDummyLoc = generateDummyLocation();
          setLiveLocation(newDummyLoc);
          setDummyCounter(prev => prev + 1);
          
          if (formData.user) {
            sendLocationUpdate(newDummyLoc.lat, newDummyLoc.lng, formData.user);
          }
        }, 10000); // Update every 10 seconds

        // Send initial dummy location update
        const initialDummyLoc = generateDummyLocation();
        setLiveLocation(initialDummyLoc);
        if (formData.user) {
          sendLocationUpdate(initialDummyLoc.lat, initialDummyLoc.lng, formData.user);
        }
      } else {
        // Use real GPS tracking
        watchId = navigator.geolocation.watchPosition(
          (position) => {
         const lat = position.coords.latitude.toFixed(6);
const lng = position.coords.longitude.toFixed(6);

            setLiveLocation({ lat, lng });
          },
          (error) => {
            console.error("Error watching location:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          }
        );

        // Send real location updates every 10 seconds
        intervalId = setInterval(() => {
          if (liveLocation.lat && liveLocation.lng && formData.user) {
            sendLocationUpdate(liveLocation.lat, liveLocation.lng, formData.user);
          }
        }, 10000);

        // Send initial real location update
        if (liveLocation.lat && liveLocation.lng) {
          sendLocationUpdate(liveLocation.lat, liveLocation.lng, formData.user);
        }
      }
    };

    startTracking();

    // Sync offline data when coming online
    window.addEventListener("online", syncOfflineData);

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener("online", syncOfflineData);
      setTrackingActive(false);
    };
  }, [locationFetched, formData.user, sendLocationUpdate, syncOfflineData, useDummyData, generateDummyLocation]);

  // Separate effect for updating location when liveLocation changes (real GPS only)
  useEffect(() => {
    if (!useDummyData && trackingActive && liveLocation.lat && liveLocation.lng && formData.user) {
      sendLocationUpdate(liveLocation.lat, liveLocation.lng, formData.user);
    }
  }, [liveLocation.lat, liveLocation.lng, trackingActive, formData.user, sendLocationUpdate, useDummyData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!formData.start_lat || !formData.start_lng) {
      setMessage("❌ Please fetch your location first before submitting.");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("user", formData.user);
    data.append("start_lat", parseFloat(formData.start_lat).toFixed(6));
data.append("start_lng", parseFloat(formData.start_lng).toFixed(6));

      data.append("description", formData.description);

      if (formData.odometer_image) {
        data.append("odometer_image", formData.odometer_image, formData.odometer_image.name);
      }
      if (formData.selfie_image) {
        data.append("selfie_image", formData.selfie_image, formData.selfie_image.name);
      }

      const res = await API.post("/attendance-start/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        setMessage(`✅ Attendance submitted successfully! ${useDummyData ? 'Dummy' : 'Real'} location tracking will continue.`);
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem(`attendance_${formData.user}_${today}`, "submitted");

        // Reset form but keep location tracking active
        setFormData({
          user: formData.user, // Keep user data
          username: formData.username, // Keep username
          start_lat: formData.start_lat, // Keep start location
          start_lng: formData.start_lng, // Keep start location
          description: "",
          odometer_image: null,
          selfie_image: null,
        });

        setOdometerPreview(null);
        setSelfiePreview(null);
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate("/employee-dashboard");
        }, 2000);
      } else {
        setMessage("❌ Something went wrong, please try again.");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.detail || 
                          "Network or server error occurred.";
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-8 border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-xl font-bold mb-4 text-center">📍 Check In</h2>

      {/* Testing Mode Toggle */}
      <div className="mb-4 p-3 border border-orange-200 bg-orange-50 rounded-lg">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={useDummyData}
            onChange={(e) => setUseDummyData(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-orange-700 font-medium">
            🧪 Use Dummy Location Data (Testing Mode)
          </span>
        </label>
        {useDummyData && (
          <p className="text-xs text-orange-600 mt-1">
            Will generate fake GPS coordinates around Surat, Gujarat for testing
          </p>
        )}
      </div>

      <button
        onClick={fetchUserAndLocation}
        disabled={locationFetched || loading}
        className="w-full mb-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "🔄 Fetching Location..." : locationFetched ? "✅ Ready to Submit" : `📍 Click to Start Attendance ${useDummyData ? '(Dummy Mode)' : ''}`}
      </button>

      {locationFetched && (
        <div className={`mb-4 p-3 border rounded-lg ${useDummyData ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-sm ${useDummyData ? 'text-orange-700' : 'text-green-700'}`}>
            📍 {useDummyData ? 'Dummy' : 'Real'} location tracking active • Updates every 10 seconds • Works offline
          </p>
          <p className={`text-xs mt-1 ${useDummyData ? 'text-orange-600' : 'text-green-600'}`}>
            Current: {liveLocation.lat.substring(0, 8)}, {liveLocation.lng.substring(0, 8)}
            {useDummyData && ` (Update #${dummyCounter})`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Description:
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full border px-3 py-2 rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Describe your work for today..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Odometer Image:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "odometer_image")}
            required
            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          {odometerPreview && (
            <img 
              src={odometerPreview} 
              alt="Odometer preview"
              className="mt-2 w-32 h-32 object-cover rounded border" 
            />
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Selfie Image:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "selfie_image")}
            required
            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          {selfiePreview && (
            <img 
              src={selfiePreview} 
              alt="Selfie preview"
              className="mt-2 w-32 h-32 object-cover rounded border" 
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !locationFetched}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "⏳ Submitting..." : "✅ Submit Attendance"}
        </button>

        {message && (
          <div className={`text-sm mt-2 p-2 rounded ${
            message.includes('✅') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}