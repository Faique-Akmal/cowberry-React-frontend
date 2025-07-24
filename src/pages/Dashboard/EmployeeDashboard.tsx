import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import DashboardStats from "../../components/employees/UserStats";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
import API from "../../api/axios"; // Axios instance with baseURL + token setup
import TaskCalendar from "../Employee/TaskCalendar";
import { Link } from "react-router";
// import { IoFlowerSharp } from "react-icons/io5";

interface User {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  role: string;
}

function EmployeeDashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/me"); // make sure token is handled in your axios instance
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 17) return "Good Afternoon";
    else return "Good Evening";
  };

  return (
    <>
      <PageMeta title="Employee Dashboard" description="Employee dashboard" />
      <div className="grid gap-12 md:gap-4">
        <div className="col-span-3 space-x-4 xl:col-span-12">
      <h1 className="text-3xl font-bold mb-4 text-cowberry-green-500 animate-pulse">
        {getGreeting()}
        <span className="mx-3">
          {user?.full_name || user?.username || ""}
        </span>
      </h1>
      <p className="text-gray-600 mb-6">
        Welcome to your dashboard! let's make progress on your goals today! ✅💪
      </p>
    </div>
  

           <div className="col-span-3 space-x-4 xl:col-span-12">
         <UserMetaCard/>
        </div>

        <div className="col-span-3 space-x-4 xl:col-span-12">
         <DashboardStats />
        </div>

        <div className="col-span-3 mt-10 space-x-4 xl:col-span-6">
         
            <Link to="/attandanceStart-page ">   <b className="animate-pulse text-cowberry-green-500"> Go to Attandance Page </b>  </Link>
        </div>

        {/* <div className="col-span-3 space-x-4 xl:col-span-12">
          <h2 className="text-xl font-semibold mb-4">My Task Calendar</h2>
          <p className="text-gray-600 mb-6">
            View and manage your tasks in the calendar below.
          </p>
          {/* <DueTasksList/> */}
       
        {/* </div> */} 
      </div>
    </>
  );
}

export default EmployeeDashboard;
