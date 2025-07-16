import React, { useState } from 'react';
import axios from 'axios';
import API from '../../api/axios';

const AttendanceForm = () => {
  const [formData, setFormData] = useState({
    id: '',
    date: '',
    start_time: '',
    odometer_image: null,
    selfie_image: null,
    start_lat: '',
    start_lng: '',
    description: '',
    user: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      const response = await API.post('/attendance-start/', data, {
        // headers: {
        //   'Content-Type': 'multipart/form-data',
        // },
      });
      setMessage('Attendance submitted successfully!');
      setFormData({
        id: '',
        date: '',
        start_time: '',
        odometer_image: null,
        selfie_image: null,
        start_lat: '',
        start_lng: '',
        description: '',
        user: '',
      });
    } catch (error: any) {
      setMessage(`Error: ${error?.response?.data?.message || 'Submission failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-transparent text-center shadow-md rounded-lg space-y-4">
      <h2 className="text-2xl font-bold mb-5">Employee Attendance</h2>
       <div className='flex items-end justify-start space-x-4'>
         <label htmlFor="">ID</label>
      <input name="id" placeholder="ID" value={formData.id} onChange={handleChange} className="input border ml-4 rounded text-center" />
       </div>

      <div  className='flex items-end justify-start space-x-6'>
        <label htmlFor="">Date</label>
        <input name="date" type="date" value={formData.date} onChange={handleChange} className="input border ml-4 rounded text-center" required />
      </div>

        <div className='flex items-end justify-start space-x-6'>
        <label htmlFor="">Start Time</label>
              <input name="start_time" type="time" value={formData.start_time} onChange={handleChange} className="input border ml-4 rounded text-center" required />

        </div>

       <div className='flex items-end justify-start space-x-4'>
          <label htmlFor="">Odometer Image</label>
          <input name="odometer_image" type="file" accept="image/*" onChange={handleFileChange} className="input border  rounded text-center" />
       </div>
     
     <div   className='flex items-end justify-start space-x-4'>
        <label htmlFor="">Selfie Image</label>
        <input name="selfie_image" type="file" accept="image/*" onChange={handleFileChange} className="input border ml-4 rounded text-center" />
     </div>

     <div   className='flex items-end justify-start space-x-4'  >
        <label htmlFor="">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className="input border ml-4 rounded text-center" rows={3} required />
     </div>

     <div   className='flex items-end justify-start space-x-4'>
        <label htmlFor="">Start Latitude</label>
        <input name="start_lat" placeholder="Start Latitude" value={formData.start_lat} onChange={handleChange} className="input border ml-4 rounded text-center" required />
     </div>
        
           <div     className='flex items-end justify-start space-x-4'>
        <label htmlFor="">Start Longitude</label>
        <input name="start_lng" placeholder="Start Longitude" value={formData.start_lng} onChange={handleChange} className="input border ml-4 rounded text-center" required />
           </div>
{/* 
      <div className='flex items-end justify-start space-x-8'>
        <label htmlFor="">User ID</label>
      <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="input border ml-4 rounded text-center" required />
      </div> */}

      <div  className='flex items-end justify-start space-x-4'>
        <label htmlFor="">User ID or Username</label>
        <input name="user" placeholder="User ID or Username" value={formData.user} onChange={handleChange} className="input border ml-4 rounded text-center" required />
      </div>

      <div className="flex justify-center items-center mt-4">
        <button type="submit" disabled={loading} className="bg-cowberry-green-600 text-white  px-4 py-2 rounded hover:bg-blue-700">
        {loading ? 'Submitting...' : 'Submit Attendance'}
      </button>

      </div>
      {message && <p className="text-sm text-red-600 mt-2">{message}</p>}
    </form>
  );
};

export default AttendanceForm;
