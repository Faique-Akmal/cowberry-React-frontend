import React from 'react';
import { ArrowDownIcon } from '../../icons';
import { Link } from 'react-router';
const employees = [
  {
    name: "Alex George",
    role: "HR Manager",
    email: "alex@gmail.com",
    homeOffice: "Active",
    status: "Online",
     image: "/profile.webp",
  },
  {
    name: "Ebin Sunny",
    role: "UI Designer",
    email: "ebin@gmail.com",
    homeOffice: "In-Active",
    status: "Offline",
    image: "/profile.webp",
  },
  {
    name: "Suzi Kott",
    role: "Software Developer",
    email: "suzi@gmail.com",
    homeOffice: "Active",
    status: "Online",
     image: "/profile.webp",
  },
  {
    name: "Jasmine Walter",
    role: "Data Scientist",
    email: "jasmine@gmail.com",
    homeOffice: "Active",
    status: "Online",
      image: "/profile.webp",
  },
  {
    name: "Kevin Robi",
    role: "Marketing Manager",
    email: "kevin@gmail.com",
    homeOffice: "In-Active",
    status: "Offline",
     image: "/profile.webp",
  },
];

const StatusPill = ({ status }) => {
  const color = status === "Online" ? "green" : "red";
  return (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full bg-${color}-500`} />
      <span className="text-sm text-gray-800">{status}</span>
    </div>
  );
};

const HomeOfficePill = ({ active }) => {
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full border ${
        active === "Active"
          ? "text-green-600 border-green-500"
          : "text-gray-500 border-gray-300"
      }`}
    >
      {active}
    </span>
  );
};

const handleClick = () => {

} 
const EmployeeStatus = () => {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Employee Status</h2>
        <button className="border px-3 py-1 text-sm rounded-md">All <ArrowDownIcon/> </button>
      </div>

      <div className="min-w-full"  >
        <div className="grid grid-cols-4 text-sm font-semibold text-gray-700 border-b pb-2">
          <span>EMPLOYEE NAME</span>
          <span>EMAIL ADDRESS</span>
          <span>HOME OFFICE</span>
          <span>STATUS</span>
        </div>

        {employees.map((emp, index) => (
          <Link to={`/employee/${emp.name}`} className="no-underline text-inherit" key={index}>
          <div
            key={index}
            className="grid grid-cols-4 py-4 border-b last:border-none items-center"
            onClick={handleClick}
          >
            {/* Employee Name & Role */}
            <div className="flex items-center gap-3">
              <img
                src={emp.image}
                alt={emp.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-sm">{emp.name}</p>
                <p className="text-xs text-gray-500">{emp.role}</p>
              </div>
            </div>

            {/* Email */}
            <div className="text-sm text-gray-800">{emp.email}</div>

            {/* Home Office Status */}
            <div>
              <HomeOfficePill active={emp.homeOffice} />
            </div>

            {/* Online/Offline */}
            <div>
              <StatusPill status={emp.status} />
            </div>
          </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmployeeStatus;
