import React, { useEffect, useState } from "react";
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

export default function AttendanceFormWithTracking() {
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

  const navigate = useNavigate();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "odometer_image" | "selfie_image"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setMessage(` Unsupported file format for ${field}.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(` ${field} exceeds 5MB.`);
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    setMessage("");

    const previewUrl = URL.createObjectURL(file);
    if (field === "odometer_image") setOdometerPreview(previewUrl);
    else setSelfiePreview(previewUrl);
  };

  const fetchUserAndLocation = async () => {
    try {
      const userRes = await API.get("/me/");
      const user = userRes.data;

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
        },
        (err) => {
          console.error(err);
          setMessage("Failed to fetch location. Please allow GPS access.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      console.error(error);
      setMessage("Failed to fetch user info.");
    }
  };

  const cacheOfflineLocation = (payload: LocationPayload) => {
  const cached = JSON.parse(localStorage.getItem("pendingLocationUpdates") || "[]");
  cached.push(payload);
  localStorage.setItem("pendingLocationUpdates", JSON.stringify(cached));
};

  const sendLocationUpdate = (lat: string, lng: string, user: string) => {
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

  if (navigator.onLine) {
    API.post("/locations/", payload).catch((err) => {
      console.error("Online post failed, storing offline:", err);
      cacheOfflineLocation(payload);
    });
  } else {
    cacheOfflineLocation(payload);
  }
};
  const syncOfflineData = () => {
    const cachedUpdates = JSON.parse(localStorage.getItem("pendingLocationUpdates") || "[]");

    if (cachedUpdates.length > 0) {
      Promise.all(
        cachedUpdates.map((loc: LocationPayload) =>
          API.post("/locations/", loc).catch((err) => console.error("Sync failed", err))
        )
      ).then(() => {
        localStorage.removeItem("pendingLocationUpdates");
      });
    }
  };

  useEffect(() => {
    if (!locationFetched) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        setLiveLocation({ lat, lng });
        sendLocationUpdate(lat, lng, formData.user);
      },
      (error) => {
        console.error("Error getting location", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    const interval = setInterval(() => {
      if (liveLocation.lat && liveLocation.lng) {
        sendLocationUpdate(liveLocation.lat, liveLocation.lng, formData.user);
      }
    }, 20000);

    window.addEventListener("online", syncOfflineData);

    return () => {
      clearInterval(interval);
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("online", syncOfflineData);
    };
  }, [locationFetched, liveLocation.lat, liveLocation.lng]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = new FormData();
      data.append("user", formData.user);
      data.append("start_lat", formData.start_lat);
      data.append("start_lng", formData.start_lng);
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
        setMessage("Attendance submitted successfully.");
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem(`attendance_${formData.user}_${today}`, "submitted");

        setFormData({
          user: "",
          username: "",
          start_lat: "",
          start_lng: "",
          description: "",
          odometer_image: null,
          selfie_image: null,
        });

        setLocationFetched(false);
        setOdometerPreview(null);
        setSelfiePreview(null);
        navigate("/employee-dashboard");
      } else {
        setMessage(" Something went wrong, try again.");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setMessage(err.response?.data ? JSON.stringify(err.response.data) : " Network or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="rounded-2xl border p-8  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-xl font-bold mb-4 text-center"> Check In</h2>

      <button
        onClick={fetchUserAndLocation}
        disabled={locationFetched}
        className="w-full mb-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {locationFetched ? " Ready to go " : " Click to Start Attendance"}
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
           <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Description:</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
         <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Odometer Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "odometer_image")}
            required
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
          {odometerPreview && <img src={odometerPreview} className="mt-2 w-32 h-32 object-cover rounded border" />}
        </div>

        <div>
           <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Selfie Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "selfie_image")}
            required
            className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  
          />
          {selfiePreview && <img src={selfiePreview} className="mt-2 w-32 h-32 object-cover rounded border" />}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Submitting..." : "✅ Submit Attendence"}
        </button>

        {message && <div className="text-sm text-red-600 mt-2">{message}</div>}
      </form>

      {/* {locationFetched && (
        <div className="mt-6 p-4 bg-white shadow rounded">
          <p><strong>Live Latitude:</strong> {liveLocation.lat}</p>
          <p><strong>Live Longitude:</strong> {liveLocation.lng}</p>
          <p className="text-sm text-gray-500 mt-2">Location updates every 10 seconds. Works offline.</p>
        </div>
      )} */}
    </div>
  );
} 