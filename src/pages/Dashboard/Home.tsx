import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";

import EmployeeStatus from "../../components/ecommerce/EmployeeStatus";
// import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import MapComponent from "../../components/Maps/MapComponent";
import EmployeeChart from "../../components/ecommerce/EmployeeChart";
import BirthdaysToday from "../../components/ecommerce/BirthdayCard";
import Customers from "../../components/ecommerce/Customers";
import JobApplicationCard from "../../components/ecommerce/JobApplicationCard";
import JobRejectionCard from "../../components/ecommerce/JobRejectionCard";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Field Employee Location Tracker & Task Management System"
        description="To build a mobile-based location tracker app for field employees and a web-based dashboard for HR/Admin and reporting managers to monitor attendance, task completion, and real-time location tracking."
      />
      <div className="grid gap-12 md:gap-2">
        <div className="col-span-3 sapce-x-4 xl:col-span-12">
          <EcommerceMetrics />
          
             <MonthlySalesChart />
        
        </div>
        
          
        <div className="grid col-span-12 xl:col-span-4">
          <Customers/>
         
        
        </div>
         
        <div className="col-span-12  xl:col-span-4">
             <EmployeeChart/>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <BirthdaysToday/>
        </div>

        <div className="col-span-12 xl:col-span-8 ">
          <EmployeeStatus />
        </div>
           
        <div className="col-span-12 xl:col-span-4 m-5">
        <div className="col-span-12 xl:col-span-4 m-4">
          <JobApplicationCard/>
       </div>
       <div className="col-span-12 xl:col-span-4 m-4">
           <JobRejectionCard />
       </div>
        </div>


        <div className="col-span-12">
          <MapComponent />
        </div>
      </div>
    </>
  );
}
