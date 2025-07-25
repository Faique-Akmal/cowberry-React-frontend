import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../api/axios';

const AttendanceGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const role = localStorage.getItem('userRole');

  useEffect(() => {
    const checkAttendance = async () => {
      try {
        if (role === 'employee') {
          const res = await API.get('/attendance-start/', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });

         
          const today = new Date().toISOString().split('T')[0];

          // Check if any record in the response matches today's date
          const hasTodayEntry = res.data?.results?.some((entry: any) => entry.date === today);

          setHasSubmitted(hasTodayEntry);
        } else {
          // For non-employees, allow access
          setHasSubmitted(true);
        }
      } catch (err) {
        console.error('Attendance check failed:', err);
        setHasSubmitted(false);
      } finally {
        setLoading(false);
      }
    };

    checkAttendance();
  }, [role]);

  if (loading) return <p className="p-4">🔄 Checking attendance...</p>;

  // Block access to all pages except attendance page until attendance is submitted
  if (role === 'employee' && !hasSubmitted) {
    return <Navigate to="/attandanceStart-page" replace />;
  }

  return <>{children}</>;
};

export default AttendanceGuard;
