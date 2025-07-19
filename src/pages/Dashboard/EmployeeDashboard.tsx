
import PageMeta from "../../components/common/PageMeta";
// import DueTasksList from "../../components/employees/DueTaskList";
import DashboardStats from "../../components/employees/UserStats";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";


function EmployeeDashboard() {


  

  return (
    <>
    <PageMeta title="DASHBOARD" description="xgde"/>
        <div className="grid gap-12 md:gap-4">
            <div className="col-span-3 sapce-x-4 xl:col-span-12">
                    <h1 className="text-2xl font-semibold mb-4">WELCOME    </h1>
                    <p className="text-gray-600 mb-6">Welcome to your dashboard! Here you can find your tasks, attendance, and other important information.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Add more components or cards here as needed */}
                    </div>
                 
                    </div>  
                <div className="col-span-3 sapce-x-4 xl:col-span-12">
                     <UserMetaCard/>       
                      </div>

                
                <div className="col-span-3 sapce-x-4 xl:col-span-12">
                        <DashboardStats />
                </div>


                <div className="col-span-3 sapce-x-4 xl:col-span-12">
                    <h2 className="text-xl font-semibold mb-4">My Task Calendar</h2>
                    <p className="text-gray-600 mb-6">View and manage your tasks in the calendar below.</p>
                    {/* <DueTasksList/> */}
                  </div>

                       
            </div>
            </>
  )
}

export default EmployeeDashboard
