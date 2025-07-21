import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios'; // Custom Axios instance

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  profile_img: string;
}

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

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/users/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (Array.isArray(res.data)) {
        setEmployees(res.data);
      } else {
        console.warn('Expected array, received:', res.data);
        setEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading) return <p className="p-4 text-center">Loading...</p>;
  if (employees.length === 0) return <p className="p-4 text-center">No employees found.</p>;

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
          <Link to={`/employee/${user.id}`} className="no-underline text-inherit" key={user.id}>
            <div className="grid grid-cols-4 py-4 border-b last:border-none items-center">
              {/* Name & Role */}
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

              {/* Email */}
              <div className="text-sm text-gray-800">{user.email}</div>

              {/* Home Office */}
              <div>
                <HomeOfficePill active={user.is_active} />
              </div>

              {/* Online / Offline */}
              <div>
                <StatusPill status={user.is_active ? 'Online' : 'Offline'} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmployeeStatus;
  