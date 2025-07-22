import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  profile_img: string;
}

const API_BASE_URL = 'http://192.168.0.144:8000/api/'; // ✅ Replace with your real backend API

const StatusPill = ({ status }: { status: string }) => {
  const colorClass = status === 'Online' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full ${colorClass}`} />
      <span className="text-sm text-gray-800">{status}</span>
    </div>
  );
};

const HomeOfficePill = ({ active }: { active: boolean }) => {
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full border ${
        active ? 'text-green-600 border-green-500' : 'text-gray-500 border-gray-300'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
};

const EmployeeStatus = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          console.error('Access token not found in localStorage');
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/users/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (Array.isArray(res.data)) {
          setEmployees(res.data);
        } else {
          console.warn('Expected array from /users/, got:', res.data);
        }
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) return <p className="p-4 text-center">Loading employee data...</p>;
  if (!employees.length) return <p className="p-4 text-center">No employee data found.</p>;

  return (
    <div className="bg-white shadow-md rounded-xl p-6 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Employee Status</h2>
        <button className="border px-3 py-1 text-sm rounded-md">All</button>
      </div>

      <div className="min-w-full">
        <div className="grid grid-cols-4 text-sm font-semibold text-gray-700 border-b pb-2">
          <span>EMPLOYEE NAME</span>
          <span>EMAIL ADDRESS</span>
          <span>HOME OFFICE</span>
          <span>STATUS</span>
        </div>

        {employees.map((user) => (
          <Link to={`/employee/${user.id}`} key={user.id} className="no-underline text-inherit">
            <div className="grid grid-cols-4 py-4 border-b last:border-none items-center">
              <div className="flex items-center gap-3">
                <img
                  src={user.profile_img || '/profile.webp'}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-sm capitalize">{user.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
              <div className="text-sm text-gray-800">{user.email}</div>
              <div><HomeOfficePill active={user.is_active} /></div>
              <div><StatusPill status={user.is_active ? 'Online' : 'Offline'} /></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmployeeStatus;
