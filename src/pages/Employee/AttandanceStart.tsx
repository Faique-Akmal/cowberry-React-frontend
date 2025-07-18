import React, { useState } from 'react';
import axios from 'axios';
import API from '../../api/axios';

interface FormDataState {
  user: string;
  username: string;
  start_lat: string;
  start_lng: string;
  description: string;
  odometer_image: File | null;
  selfie_image: File | null;
}

export default function AttendanceForm() {
  const [formData, setFormData] = useState<FormDataState>({
    user: '',
    username: '',
    start_lat: '',
    start_lng: '',
    description: '',
    odometer_image: null,
    selfie_image: null,
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'odometer_image' | 'selfie_image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setMessage(`Unsupported file format for ${field}.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(` ${field} exceeds 5MB.`);
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    setMessage('');
  };

  const fetchUserAndLocation = async () => {
    try {
      const userRes = await API.get('/me/');
      const user = userRes.data;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            user: user.id || user.user_id || user.pk,
            username: user.name || user.username || '',
            start_lat: position.coords.latitude.toString(),
            start_lng: position.coords.longitude.toString(),
          }));
          setMessage(' User and location fetched successfully');
          setLocationFetched(true);
        },
        (err) => {
          console.error(err);
          setMessage(' Failed to fetch location. Please allow GPS access.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      console.error(error);
      setMessage(' Failed to fetch user info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('user', formData.user);
      data.append('start_lat', formData.start_lat);
      data.append('start_lng', formData.start_lng);
      data.append('description', formData.description);

      if (formData.odometer_image) {
        const odoBlob = new Blob([formData.odometer_image], { type: formData.odometer_image.type });
        data.append('odometer_image', odoBlob, formData.odometer_image.name);
      }

      if (formData.selfie_image) {
        const selfieBlob = new Blob([formData.selfie_image], { type: formData.selfie_image.type });
        data.append('selfie_image', selfieBlob, formData.selfie_image.name);
      }

      const res = await axios.post('http://192.168.0.144:8000/api/attendance-start/', data
        , {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (res.status === 200 || res.status === 201) {
        setMessage(' Attendance submitted successfully');
        setFormData({
          user: '',
          username: '',
          start_lat: '',
          start_lng: '',
          description: '',
          odometer_image: null,
          selfie_image: null,
        });
        setLocationFetched(false);
      } else {
        setMessage('Something went wrong, try again');
      }
    } catch (err: any) {
      console.error('Error:', err);
      if (err.response?.data) {
        setMessage(` ${JSON.stringify(err.response.data)}`);
      } else {
        setMessage('Network or server error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-transparent rounded shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center"> Start Attendance</h2>

      {message && <div className="mb-4 p-2 text-center text-sm bg-gray-100 border">{message}</div>}

      <button
        onClick={fetchUserAndLocation}
        disabled={locationFetched}
        className="w-full mb-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {locationFetched ? '✅ Location Fetched' : 'Get User Info & Location'}
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* {formData.username && (
          <div>
            <label className="text-sm font-medium">Username:</label>
            <p className="text-gray-700">{formData.username}</p>
          </div>
        )}

        {formData.start_lat && formData.start_lng && (
          <div>
            <label className="text-sm font-medium">Coordinates:</label>
            <p className="text-gray-700">
              {formData.start_lat}, {formData.start_lng}
            </p>
          </div>
        )} */}

        <div>
          <label className="block text-sm font-medium">Description:</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Odometer Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'odometer_image')}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Selfie Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'selfie_image')}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </form>
    </div>
  );
}
