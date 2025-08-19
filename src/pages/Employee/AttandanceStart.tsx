import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const navigate = useNavigate();

  // ✅ Check attendance once on mount
  useEffect(() => {
    const checkAttendance = async () => {
      try {
        const userRes = await API.get("/me/");
        const user = userRes.data;
        const today = new Date().toISOString().split("T")[0];
        const attendanceKey = `attendance_${user.id || user.user_id || user.pk}_${today}`;
        if (localStorage.getItem(attendanceKey)) {
          setAlreadySubmitted(true);
        }
      } catch (error) {
        console.error("Attendance check failed:", error);
      }
    };
    checkAttendance();
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "odometer_image" | "selfie_image"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Unsupported file format for ${field}.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${field} exceeds 5MB.`);
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
    } catch (error) {
      console.error("Error caching location:", error);
    }
  }, []);

  const sendLocationUpdate = useCallback(
    (lat: string, lng: string, user: string) => {
      if (!lat || !lng || !user || user === "0") return;

      const payload: LocationPayload = {
        user: parseInt(user),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        timestamp: new Date().toISOString(),
      };

      if (navigator.onLine) {
        API.post("/locations/", payload).catch(() => {
          cacheOfflineLocation(payload);
        });
      } else {
        cacheOfflineLocation(payload);
      }
    },
    [cacheOfflineLocation]
  );

  const syncOfflineData = useCallback(() => {
    try {
      const cachedUpdates = JSON.parse(localStorage.getItem("pendingLocationUpdates") || "[]");

      if (cachedUpdates.length > 0) {
        Promise.all(
          cachedUpdates.map((loc: LocationPayload) =>
            API.post("/locations/", loc).catch((err) => {
              console.error("Sync failed for location:", loc, err);
              throw err;
            })
          )
        )
          .then(() => {
            localStorage.removeItem("pendingLocationUpdates");
          })
          .catch(() => {
            console.log("Some locations failed to sync, keeping in cache");
          });
      }
    } catch (error) {
      console.error("Error syncing offline data:", error);
    }
  }, []);

  const fetchUserAndLocation = async () => {
    setLoading(true);
    setMessage("");

    try {
      const userRes = await API.get("/me/");
      const user = userRes.data;

      const today = new Date().toISOString().split("T")[0];
      const attendanceKey = `attendance_${user.id || user.user_id || user.pk}_${today}`;
      if (localStorage.getItem(attendanceKey)) {
        setAlreadySubmitted(true);
        toast.error("You have already submitted attendance for today.");
        setLoading(false);
        return;
      }

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
          toast.success("✅ Location fetched successfully! You can now fill the form.");
        },
        () => {
          toast.error("Failed to fetch location. Please allow GPS access.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } catch {
      toast.error("Failed to fetch user info. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locationFetched || !formData.user || trackingActive) return;

    let watchId: number;
    let intervalId: NodeJS.Timeout;

    const startTracking = () => {
      setTrackingActive(true);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude.toString();
          const lng = position.coords.longitude.toString();
          setLiveLocation({ lat, lng });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );

      intervalId = setInterval(() => {
        if (liveLocation.lat && liveLocation.lng && formData.user) {
          sendLocationUpdate(liveLocation.lat, liveLocation.lng, formData.user);
        }
      }, 10000);
    };

    startTracking();
    window.addEventListener("online", syncOfflineData);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("online", syncOfflineData);
      setTrackingActive(false);
    };
  }, [locationFetched, formData.user, sendLocationUpdate, syncOfflineData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadySubmitted) return;

    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("user", formData.user);
      data.append("start_lat", formData.start_lat);
      data.append("start_lng", formData.start_lng);
      data.append("description", formData.description);
      if (formData.odometer_image)
        data.append("odometer_image", formData.odometer_image, formData.odometer_image.name);
      if (formData.selfie_image)
        data.append("selfie_image", formData.selfie_image, formData.selfie_image.name);

      const res = await API.post("/attendance-start/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        toast.success("Attendance submitted successfully!");
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem(`attendance_${formData.user}_${today}`, "submitted");
        setAlreadySubmitted(true);

        setTimeout(() => navigate("/employee-dashboard"), 2000);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.message || "Submission failed"}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="rounded-2xl border p-8 border-gray-200 bg-white dark:border-gray-800 dark:bg-black dark:text-white">
      <h2 className="text-xl font-bold mb-4 text-center">{t("attendence.📍 Check In")}</h2>

      <button
        onClick={fetchUserAndLocation}
        disabled={locationFetched || loading || alreadySubmitted}
        className="w-full mb-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "🔄 Fetching Location..." : alreadySubmitted ? "✅ Already Submitted" : locationFetched ? "✅ Ready to Submit" : "📍 Click to Start Attendance"}
      </button>

      {alreadySubmitted && (
        <div className="p-3 bg-yellow-100 text-yellow-700 rounded text-center mb-4">
       {t("attendence.You have already submitted attendance for today.")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
           {t("attendence.Description")}
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            disabled={alreadySubmitted}
            className="w-full border px-3 py-2 rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Describe your work for today..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
           {t("attendence.Odometer Image")}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment" 
            onChange={(e) => handleFileChange(e, "odometer_image")}
            required
            disabled={alreadySubmitted}
            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 disabled:bg-gray-100"
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
          {t("attendence.Selfie Image")}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => handleFileChange(e, "selfie_image")}
            required
            disabled={alreadySubmitted}
            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 disabled:bg-gray-100"
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
          disabled={loading || !locationFetched || alreadySubmitted}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
         {loading ? t("attendence.submitting") : t("attendence.submit")}
        </button>
      </form>
    </div>
  );
}
