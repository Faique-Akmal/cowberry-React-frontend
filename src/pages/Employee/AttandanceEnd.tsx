import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface FormDataState {
  user: string;
  username: string;
  end_lat: string;
  end_lng: string;
  description: string;
  odometer_image: File | null;
  selfie_image: File | null;
}

export default function AttendanceForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormDataState>({
    user: '',
    username: '',
    end_lat: '',
    end_lng: '',
    description: '',
    odometer_image: null,
    selfie_image: null,
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [odometerPreview, setOdometerPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const navigate = useNavigate();

  // ✅ Check if today's attendance already submitted
useEffect(() => {
  const checkSubmitted = async () => {
    try {
      const userRes = await API.get('/me/');
      const user = userRes.data;
      const today = new Date().toISOString().split('T')[0];

      // ✅ Ask backend if end attendance exists for today
      const res = await API.get(`/attendance-end/?user=${user.id}&date=${today}`);
      
      if (res.data && res.data.length > 0) {
        // if backend says attendance end exists
        setAlreadySubmitted(true);
        setMessage('✅ Attendance already submitted for today.');
        
        // also update localStorage (optional)
        localStorage.setItem(`attendance_${user.id}_${today}`, 'submitted');
      } else {
        // no record → allow submission
        setAlreadySubmitted(false);
        localStorage.removeItem(`attendance_${user.id}_${today}`);
      }
    } catch (error) {
      console.error('Check attendance failed:', error);
    }
  };

  checkSubmitted();
}, []);


  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'odometer_image' | 'selfie_image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Unsupported file format for ${field}.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${field} exceeds 5MB.`);
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    setMessage('');

    const previewUrl = URL.createObjectURL(file);
    if (field === 'odometer_image') {
      setOdometerPreview(previewUrl);
    } else {
      setSelfiePreview(previewUrl);
    }
  };

  const fetchUserAndLocation = async () => {
    try {
  const userRes = await API.get("/me/");
  const user = userRes.data;

  // Check if attendance has already been started (from API)
  if (user.is_attendance_ended) {
    toast.error("You have already submitted attendance.");
    navigate("/employee-dashboard");
    return;
  }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            user: String(user.id || user.user_id || user.pk),
            username: user.name || user.username || '',
            end_lat: position.coords.latitude.toFixed(6),
            end_lng: position.coords.longitude.toFixed(6),
          }));
          toast.success('User and location fetched successfully.');
          setLocationFetched(true);
        },
        (err) => {
          console.error(err);
          toast.error('Failed to fetch location. Please allow GPS access.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch user info.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadySubmitted) {
      toast.error('Attendance already submitted today.');
      return;
    }

    setMessage('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('user', formData.user);
      data.append('end_lat', formData.end_lat);
      data.append('end_lng', formData.end_lng);
      data.append('description', formData.description);

      if (formData.odometer_image) {
        data.append('odometer_image', formData.odometer_image, formData.odometer_image.name);
      }

      if (formData.selfie_image) {
        data.append('selfie_image', formData.selfie_image, formData.selfie_image.name);
      }

      const res = await API.post('/attendance-end/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        toast.success('Attendance submitted successfully.');

        // Save today's flag
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`attendance_${formData.user}_${today}`, 'submitted');
        setAlreadySubmitted(true);

        // Reset form
        setFormData({
          user: '',
          username: '',
          end_lat: '',
          end_lng: '',
          description: '',
          odometer_image: null,
          selfie_image: null,
        });
        setLocationFetched(false);
        setOdometerPreview(null);
        setSelfiePreview(null);

        navigate('/employee-dashboard');
      } else {
        toast.error('Something went wrong, try again.');
      }
    } catch (err: any) {
      console.error('Error:', err);
      if (err.response?.data) {
        setMessage(JSON.stringify(err.response.data));
      } else {
        toast.error('Network or server error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-8 border-gray-200 bg-white dark:border-gray-800 dark:bg-black dark:text-white">
      <h2 className="text-xl font-bold mb-4 text-center">{t("attendence.📍 Check Out")}</h2>

      {message && (
        <div className="mb-4 p-2 text-center text-sm bg-gray-100 border rounded">
          {message}
        </div>
      )}

      <button
        onClick={fetchUserAndLocation}
        disabled={locationFetched || alreadySubmitted}
        className="w-full mb-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {locationFetched ?  t("attendence.✅ Ready to Submit") : t("attendence.📍Click to End Attendance")}
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t("attendence.Description")}</label>
          <textarea
            required
            disabled={alreadySubmitted}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder={t("attendence.Describe your work for today...")}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Odometer */}
        <div>
          <label className="block text-sm font-medium">{t("attendence.Odometer Image")}</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileChange(e, 'odometer_image')}
            required
            disabled={alreadySubmitted}
            className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm"
          />
          {odometerPreview && (
            <img src={odometerPreview} alt="Odometer Preview" className="mt-2 w-32 h-32 object-cover rounded border" />
          )}
        </div>

        {/* Selfie */}
        <div>
          <label className="block text-sm font-medium">{t("attendence.Selfie Image")}</label>
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => handleFileChange(e, 'selfie_image')}
            required
            disabled={alreadySubmitted}
            className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm"
          />
          {selfiePreview && (
            <img src={selfiePreview} alt="Selfie Preview" className="mt-2 w-32 h-32 object-cover rounded border" />
          )}
        </div>

        <button
          type="submit"
          disabled={loading || alreadySubmitted}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {alreadySubmitted ? t('attendence.Already Submitted') : loading ? t('attendence.Submitting...') : t('attendence.✅ Submit Attendance')}
        </button>
      </form>
    </div>
  );
}
