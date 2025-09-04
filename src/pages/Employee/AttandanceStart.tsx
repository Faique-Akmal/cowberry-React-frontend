import React, { useState } from "react";
import { useNavigate } from "react-router";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocationTracker } from "../../hooks/LocationTrackerProvider.tsx";
import { useTheme } from '../../context/ThemeContext.tsx';

interface FormDataState {
  user: string;
  username: string;
  start_lat: string;
  start_lng: string;
  description: string;
  odometer_image: File | null;
  selfie_image: File | null;
}

export default function AttendanceStart() {
     const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tracker = useLocationTracker();

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
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

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
    if (file.size > 15 * 1024 * 1024) {
      toast.error(`${field} exceeds 15MB.`);
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: file }));
    setMessage("");
    const previewUrl = URL.createObjectURL(file);
    if (field === "odometer_image") setOdometerPreview(previewUrl);
    else setSelfiePreview(previewUrl);
  };

  const fetchUserAndLocation = async () => {
    setLoading(true);
    setMessage("");

    try {
      const user = JSON.parse(localStorage.getItem("meUser")!);

      if (user.is_attendance_started) {
        await tracker.stop();

        toast.error("You have already submitted attendance.");
        navigate("/employee-dashboard");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);

          setFormData((prev) => ({
            ...prev,
            user: String(user.id || user.user_id || user.pk),
            username: user.name || user.username || "",
            start_lat: lat,
            start_lng: lng,
          }));

          setLocationFetched(true);
          toast.success("✅ Location fetched successfully! You can now fill the form.");
        },
        () => {
          toast.error(t("toast.Failed to fetch location. Please allow GPS access."));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } catch {
      toast.error(t("toast.Failed to fetch user info. Please check your connection."));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadySubmitted || loading) return;

    if (!formData.user || !formData.start_lat || !formData.start_lng) {
      toast.error("Please fetch your location first.");
      return;
    }

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

        // Mark local “submitted today”
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem(`attendance_${formData.user}_${today}`, "submitted");
        setAlreadySubmitted(true);

        // 🔥 Start background location logging for this user
        const userId = Number(formData.user);
        await tracker.start(userId);

        // Smooth exit
        setTimeout(() => navigate("/employee-dashboard"), 1200);
      }
    } catch (err: any) {
      setMessage(`❌ ${err?.response?.data?.message || "Submission failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }}
    className="rounded-2xl border p-8 border-gray-200 bg-white dark:border-gray-800 dark:bg-black dark:text-white">
      <h2 className="text-xl font-bold mb-4 text-center">{t("attendence.📍 Check In")}</h2>

      <button
        onClick={fetchUserAndLocation}
        disabled={locationFetched || loading || alreadySubmitted}
        className="w-full mb-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading
          ? "🔄 Fetching Location..."
          : alreadySubmitted
            ? "✅ Already Submitted"
            : locationFetched
              ? t("attendence.✅ Ready to Submit")
              : t("attendence.📍Click to Start Attendance")}
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
            placeholder={t("attendence.Describe your work for today...")}
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
            <img src={odometerPreview} alt="Odometer preview" className="mt-2 w-32 h-32 object-cover rounded border" />
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
            <img src={selfiePreview} alt="Selfie preview" className="mt-2 w-32 h-32 object-cover rounded border" />
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !locationFetched || alreadySubmitted}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? t("attendence.submitting") : t("attendence.submit")}
        </button>

        {tracker.status === "running" && (
          <p className="text-xs text-gray-500 mt-2">
            Location tracking active. {tracker.intervalMs ? `Every ${Math.round(tracker.intervalMs / 1000)}s.` : ""}
            {tracker.lastSentAt ? ` Last sent: ${new Date(tracker.lastSentAt).toLocaleTimeString()}` : ""}
          </p>
        )}
        {message && <p className="text-sm text-red-600 mt-2">{message}</p>}
      </form>
    </div>
  );
}