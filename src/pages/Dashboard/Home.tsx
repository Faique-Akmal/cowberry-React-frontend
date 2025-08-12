
import MonthlySalesChart from "../../components/admin/AttendanceChart";

import EmployeeStatus from "../../components/admin/EmployeeStatus";
// import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import MapComponent from "../../components/Maps/MapComponent";
import EmployeeChart from "../../components/admin/EmployeeChart";
import BirthdaysToday from "../../components/admin/BirthdayCard";
import Customers from "../../components/admin/Customers";
import JobApplicationCard from "../../components/admin/JobApplicationCard";
import JobRejectionCard from "../../components/admin/JobRejectionCard";
import Metrics from "../../components/admin/Metrics";




export default function Home() {
  return (
    <>
      <PageMeta
        title="DASHBOARD"
        description=""
      />
      <div className="grid gap-12 md:gap-4">
        <div className="col-span-12">
          <Metrics />        
        </div>
        <div className="col-span-12 xl:col-span-12 w-full">
           <EmployeeChart/> 
        </div>
          
        {/* <div className="col-span-12  xl:col-span-12">
           <MonthlySalesChart />
        </div> */}


        <div className="grid col-span-12 xl:col-span-4">
            <Customers/>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <BirthdaysToday/>
        </div>
          <div className="col-span-12 flex flex-col gap-4 xl:col-span-4">
          <div className="col-span-12 h-full xl:col-span-4">
            <JobApplicationCard/>
          </div>
          <div className="col-span-12 h-full xl:col-span-4">
              <JobRejectionCard />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-12">
          <EmployeeStatus />
        </div>
           
      
        <div className="col-span-12">
          <MapComponent />
        </div>
        
      </div>
    </>
  );
}
