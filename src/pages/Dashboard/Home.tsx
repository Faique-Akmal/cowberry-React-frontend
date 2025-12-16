
// import MonthlySalesChart from "../../components/admin/AttendanceChart";

import EmployeeStatus from "../../components/hr/EmployeeStatus";
// import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import MapComponent from "../../components/Maps/MapComponent";
import EmployeeChart from "../../components/hr/EmployeeChart";
import BirthdaysToday from "../../components/hr/BirthdayCard";
// import Customers from "../../components/admin/Customers";
// import JobApplicationCard from "../../components/admin/JobApplicationCard";
// import JobRejectionCard from "../../components/admin/JobRejectionCard";
import Metrics from "../../components/hr/Metrics";




export default function Home() {
  return (
  <>
  <PageMeta title="DASHBOARD" description="" />

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
    {/* <div className="col-span-1 md:col-span-2 xl:col-span-4 flex flex-col gap-4">
      <JobApplicationCard />
      <JobRejectionCard />
    </div> */}

    {/* Employee Status */}
    <div className="col-span-1 md:col-span-2 xl:col-span-12">
      <EmployeeStatus />
    </div>

    {/* Map */}
    <div className="col-span-1 md:col-span-2 xl:col-span-12">
      <MapComponent />
    </div>

  </div>
</>

  );
}
