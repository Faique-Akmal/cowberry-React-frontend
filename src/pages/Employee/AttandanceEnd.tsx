import React, { useState } from 'react';
import API from '../../api/axios';

const AttendanceEndForm = () => {
  const [formData, setFormData] = useState({
    id: '',
    date: '',
    start_time: '',
    odometer_image: null,
    selfie_image: null,
    end_lat: '',
    end_lng: '',
    description: '',
    user: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [locationFetched, setLocationFetched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

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
        const { latitude, longitude } = position.coords;

        setFormData(prev => ({
          ...prev,
          end_lat: latitude.toString(),
          end_lng: longitude.toString(),
        }));

        setLocationFetched(true);
        setLoading(false);
      },
      (err) => {
        setError(`Error: ${err.message}`);
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const data = new FormData();
    for (const key in formData) {
      // @ts-ignore
      data.append(key, formData[key]);
    }

    try {
      const response = await API.post('/attendance-start/', data);
      setMessage('✅ Attendance submitted successfully!');
      setFormData({
        id: '',
        date: '',
        start_time: '',
        odometer_image: null,
        selfie_image: null,
        end_lat: '',
        end_lng: '',
        description: '',
        user: '',
      });
      setLocationFetched(false);
    } catch (error: any) {
      setMessage(` Error: ${error?.response?.data?.message || 'Submission failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto px-6 py-8 bg-white rounded-lg shadow-md space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Employee Attendance End</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label htmlFor="id" className="mb-1 font-medium">ID</label>
          <input
            name="id"
            id="id"
            value={formData.id}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            placeholder="Employee ID"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="date" className="mb-1 font-medium">Date</label>
          <input
            name="date"
            id="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="start_time" className="mb-1 font-medium">Start Time</label>
          <input
            name="start_time"
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="odometer_image" className="mb-1 font-medium">Odometer Image</label>
          <input
            name="odometer_image"
            id="odometer_image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="selfie_image" className="mb-1 font-medium">Selfie Image</label>
          <input
            name="selfie_image"
            id="selfie_image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label htmlFor="description" className="mb-1 font-medium">Description</label>
          <textarea
            name="description"
            id="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            placeholder="Work summary or remarks"
            required
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleGetLocation}
            className="bg-cowberry-green-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-2"
          >
            Get Location
          </button>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex flex-col">
          <label htmlFor="end_lat" className="mb-1 font-medium">Start Latitude</label>
          <input
            name="end_lat"
            id="end_lat"
            value={formData.end_lat}
            readOnly
            className="border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            placeholder="Latitude"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="end_lng" className="mb-1 font-medium">Start Longitude</label>
          <input
            name="end_lng"
            id="end_lng"
            value={formData.end_lng}
            readOnly
            className="border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            placeholder="Longitude"
            required
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label htmlFor="user" className="mb-1 font-medium">User ID / Username</label>
          <input
            name="user"
            id="user"
            value={formData.user}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            placeholder="User ID or Username"
            required
          />
        </div>
      </div>

      <div className="text-center">
        <button
          type="submit"
          disabled={loading || !locationFetched}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </div>

      {message && <p className="text-center text-sm text-red-600 mt-2">{message}</p>}
    </form>
  );
};

export default AttendanceEndForm;
