import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { role } from "../../store/store";
import { useTranslation } from 'react-i18next';


interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_online: boolean;
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

const HomeOfficePill = ({ active }: { active: boolean }) => (
  <span
    className={`text-xs px-3 py-1 rounded-full border ${
      active ? 'text-green-600 border-green-500' : 'text-gray-500 border-gray-300'
    }`}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
);

//  const getRoleName = (roleId: number): string => {
//     const roleObj = role.find((r) => r.id === roleId);
//     return roleObj ? roleObj.name : "Unknown";
//   };

const  EmployeeStatus = () => {
  const { t } = useTranslation();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchOnlineEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await API.get(`/users/?limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedUsers: User[] = response.data.results || [];

      // Filter only online users
      const newOnlineUsers = fetchedUsers.filter((user) => user.is_online);

      if (fetchedUsers.length < limit) setHasMore(false);

      setOnlineUsers((prev) => {
        const merged = [...prev, ...newOnlineUsers];
        const unique = merged.filter(
          (user, index, self) => index === self.findIndex((u) => u.id === user.id)
        );
        return unique;
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchOnlineEmployees();
  }, [fetchOnlineEmployees]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setOffset((prev) => prev + limit);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6 h-full dark:bg-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Online Employees</h2>
        <button className="border px-3 py-1 text-sm rounded-md">Online Only</button>
      </div>

      <div className="grid grid-cols-4 text-sm font-semibold text-gray-700 border-b pb-2 dark:text-white">
        <span>{t("location.Employee Name")}</span>
        <span>{t("profile.Email")}</span>
        <span>HOME OFFICE</span>
        <span>{t("attendence.Status")}</span>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-y-auto max-h-[400px] custom-scrollbar"
      >
        {onlineUsers.map((user) => (
          // <Link to={`/employee/${user.id}`} key={user.id} className="no-underline text-inherit">
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
              <div className="text-sm text-gray-800 dark:text-white">{user.email}</div>
              <div className=''><HomeOfficePill active={user.is_online} /></div>
              <div ><StatusPill status="Online"  /></div>
            </div>
          // </Link>
        ))}

        {loading && <p className="text-center py-4">Loading...</p>}
        {!hasMore && !loading && !onlineUsers.length && (
          <p className="text-center py-4 text-gray-500">No online users found.</p>
        )}
        {!hasMore && onlineUsers.length > 0 && (
          <p className="text-center py-4 text-gray-400">No more online users.</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeStatus;
