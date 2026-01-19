import EmployeeStatus from "../../components/hr/EmployeeStatus";
import PageMeta from "../../components/common/PageMeta";
import EmployeeChart from "../../components/hr/EmployeeChart";
import BirthdaysToday from "../../components/hr/BirthdayCard";
import Metrics from "../../components/hr/Metrics";
import { useMemo } from 'react';
// import MonthlySalesChart from "../../components/admin/AttendanceChart";
// import DemographicCard from "../../components/ecommerce/DemographicCard";
// import MapComponent from "../../components/Maps/MapComponent";
// import Customers from "../../components/admin/Customers";
// import JobApplicationCard from "../../components/admin/JobApplicationCard";
// import JobRejectionCard from "../../components/admin/JobRejectionCard";

export default function Home() {
  const getGreetingWithYourTiming = (): string => {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 6 && currentHour < 12) {
    return 'Good Morning';
  } else if (currentHour >= 12 && currentHour < 17) {
    return 'Good Afternoon';
  } else if (currentHour >= 17 && currentHour < 21) {
    return 'Good Evening';
  } else {
    return 'Good Night';
  }
};


  const greeting = useMemo(() => getGreetingWithYourTiming(), []);

  return (
    <>
      <PageMeta title="DASHBOARD" description="" />
           

     <div className="animate-pulse text-center mb-8 p-6 rounded-lg shadow-md 
                backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 
                border border-white/20 dark:border-gray-700/30">
  <h1 className="text-3xl font-bold text-black dark:text-white">
    {greeting},{localStorage.getItem('username')}!
  </h1>
  <p className="text-gray-900 dark:text-gray-300 mt-1">
    Welcome to your Dashboard
  </p>
</div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
        {/* Metrics */}
        <div className="col-span-1 md:col-span-2 xl:col-span-12">
          <Metrics />
        </div>

        {/* Chart */}
        <div className="col-span-1 md:col-span-2 xl:col-span-12">
          <EmployeeChart />
          {/* <div className="col-span-1 md:col-span-1 xl:col-span-4">
      <BirthdaysToday />
    </div> */}
        </div>

        {/* Customers */}
        {/* <div className="col-span-1 md:col-span-1 xl:col-span-4">
      <Customers />
    </div> */}

        {/* Birthdays */}
        <div className="col-span-1 md:col-span-1 xl:col-span-12 ">
          <BirthdaysToday />
        </div>

        {/* Job Applications + Rejections */} 
        {/* {/* <div className="col-span-1 md:col-span-2 xl:col-span-4 flex flex-col gap-4">
      <JobApplicationCard />
      <JobRejectionCard />
    </div> */}

        {/* Employee Status */}
        <div className="col-span-1 md:col-span-2 xl:col-span-12">
          <EmployeeStatus />
        </div>

        {/* Map */}
        {/* <div className="col-span-1 md:col-span-2 xl:col-span-12">
      <MapComponent />
    </div> */}
      </div>
    </>
  );
}
