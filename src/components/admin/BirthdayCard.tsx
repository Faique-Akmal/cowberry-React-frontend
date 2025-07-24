import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';

interface User {
  id: number;
  name: string;
  role: string;
  birth_date: string;
  profile_img: string;
}

const BirthdayCardList: React.FC = () => {
  const [birthdayUsers, setBirthdayUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const isBirthdayToday = (birthDate: string): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);
    return birth.getUTCDate() === today.getDate() && birth.getUTCMonth() === today.getMonth();
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getUTCFullYear();
    const m = today.getMonth() - birth.getUTCMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getUTCDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (birthDate: string): string => {
    const date = new Date(birthDate);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://your-api-url.com/api/users/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        const results = res.data.results || [];
        const todayBirthdays = results.filter((user: User) =>
          user.birth_date && isBirthdayToday(user.birth_date)
        );

        setBirthdayUsers(todayBirthdays);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full relative overflow-hidden">
      {birthdayUsers.length > 0 && (
        <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={200} />
      )}

      <h2 className="text-xl font-bold mb-4">🎉 Today’s Birthdays</h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : birthdayUsers.length === 0 ? (
        <p className="text-gray-500">No birthdays today.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {birthdayUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow hover:shadow-md"
            >
              <img
                src={user.profile_img}
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
              />
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.role}</p>
                <p className="text-sm text-blue-600">
                  🎂 {formatDate(user.birth_date)} ({calculateAge(user.birth_date)} years)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BirthdayCardList;
