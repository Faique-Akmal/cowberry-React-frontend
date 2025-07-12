import React from 'react';

const BirthdayCard = (
    { name, role, imgUrl }
) => {
    
  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition">
      <div className="relative w-12 h-12">
        <img
          src={imgUrl}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      </div>
      <div>
        <h4 className="font-semibold text-sm">{name}</h4>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  );
};

const BirthdaysToday = () => {
  const birthdayList = [
    {
      name: 'Devendra Pandey',
      role: 'IT Manager',
      imgUrl: '/profile.webp',
    },
    {
      name: 'James Bond',
      role: 'IT Manager',
      imgUrl: '/profile.webp',
    },
    {
      name: 'Tom Cruise',
      role: 'Production Team',
     imgUrl: '/profile.webp',
    },
    {
      name: 'Thor',
      role: 'HR',
      imgUrl: '/profile.webp',
    },
  ];

  return (
    <div className="w-full bg-white shadow-md rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">Today’s Birthday ({birthdayList.length})</h2>
      <div className="space-y-3">
        {birthdayList.map((person, index) => (
          <BirthdayCard
            key={index}
            name={person.name}
            role={person.role}
            imgUrl={person.imgUrl}
          />
        ))}
      </div>
    </div>
  );
};

export default BirthdaysToday;
