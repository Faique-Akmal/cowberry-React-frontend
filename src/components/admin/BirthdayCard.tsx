import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import API from '../../api/axios';
import { role } from "../../store/store";

interface User {
  id: number;
  username: string;
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

   const getRoleName = (roleId: number): string => {
      const roleObj = role.find((r) => r.id === roleId);
      return roleObj ? roleObj.name : "Unknown";
    };
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get('/users/', {
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
    <div className="p-6 bg-white rounded-2xl shadow-xl w-full h-full relative">
      {birthdayUsers.length > 0 && (
        <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={400}
        //  recycle={false} 
         />
      )}

      <h2 className="text-2xl font-bold text-center text-purple-700 mb-6">🎉 Today’s Birthdays</h2>

      {loading ? (
        <p className="text-gray-500 text-center">Loading birthdays...</p>
      ) : birthdayUsers.length === 0 ? (
        <p className="text-gray-500 text-center">No birthdays today.</p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
          {birthdayUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200 shadow hover:shadow-lg transition"
            >
              <img
                src={user.profile_img || '/cowbrry-img.png'}
               
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow"
              />
              <div>
                <h3 className="text-lg font-semibold text-purple-800">{user.username}</h3>
                <p className="text-sm text-gray-600 capitalize">{getRoleName(user.role)}</p>
                <p className="text-sm text-purple-600">
                  🎂 {formatDate(user.birth_date)} &bull; {calculateAge(user.birth_date)} years
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
