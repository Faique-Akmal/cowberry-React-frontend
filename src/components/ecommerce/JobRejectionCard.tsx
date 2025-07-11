import React from "react";


const JobRejectionCard = () => {
  const totalApplications = 80;
  const acceptedApplications = 46;
  const acceptedThisMonth = 30;

  const progressPercentage = (acceptedThisMonth / totalApplications) * 100;

  return (
    <div className="bg-green-600 text-white p-8 ml-2 rounded-xl w-82 shadow-lg relative overflow-hidden">
      <h2 className="text-lg font-semibold mb-2">Rejected Job Applications</h2>
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold">
          {acceptedApplications}
          <span className="text-white/70 text-xl">/{totalApplications}</span>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-blue-400"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-white-400"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${progressPercentage}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">
            {acceptedThisMonth}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-white/80">Rejected this month</p>
    </div>
  );
};

export default JobRejectionCard;
