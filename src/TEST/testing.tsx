// const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!formData.odometer_image || !formData.selfie_image) {
//       setMessage('Both images are required.');
//       return;
//     }

//     const data = new FormData();
//     data.append('odometer_image', formData.odometer_image);
//     data.append('selfie_image', formData.selfie_image);
//     data.append('start_lat', formData.start_lat);
//     data.append('start_lng', formData.start_lng);
//     data.append('description', formData.description);
//     data.append('user', formData.user || '');

//     setLoading(true);
//     try {
//       const res = await API.post('/attendance-start/', data, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (res.status === 201 || res.status === 200) {
//         setMessage('✅ Attendance submitted successfully.');
//         setFormData({
//           odometer_image: null,
//           selfie_image: null,
//           start_lat: '',
//           start_lng: '',
//           description: '',
//           user: localStorage.getItem('userId'),
//         });
//         setOdometerPreview(null);
//         setSelfiePreview(null);
//         localStorage.setItem(`attendance_${formData.user}_${new Date().toISOString().split('T')[0]}`, 'submitted');
//       } else {
//         setMessage('Something went wrong. Try again.');
//       }
//     } catch (error: any) {
//       console.error('Submit error:', error);
//       setMessage('❌ Submission failed. ' + (error.response?.data?.message || ''));
//     } finally {
//       setLoading(false);
//     }
//   };



//  const [odometerPreview, setOdometerPreview] = useState<string | null>(null);
//   const [selfiePreview, setSelfiePreview] = useState<string | null>(null);



//     const previewUrl = URL.createObjectURL(file);
//     if (field === 'odometer_image') {
//       setOdometerPreview(previewUrl);
//     } else {
//       setSelfiePreview(previewUrl);
//     }
//   };

//  {odometerPreview && (
//             <img
//               src={odometerPreview}
//               alt="Odometer Preview"
//               className="mt-2 w-32 h-32 object-cover rounded border"
//             />
//           )}

 {selfiePreview && (
            <img
              src={selfiePreview}
              alt="Selfie Preview"
              className="mt-2 w-32 h-32 object-cover rounded border"
            />
          )}