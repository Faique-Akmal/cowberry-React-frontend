import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import DashboardStats from "../../components/employees/UserStats";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
import API from "../../api/axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import Confetti from "react-confetti";

interface User {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  role: string;
}

function EmployeeDashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greetings.morning");
    else if (hour < 17) return t("greetings.afternoon");
    else return t("greetings.evening");
  };
 

  return (
   <>
  <PageMeta title="Employee Dashboard" description="Employee dashboard" />
  
  <div className="grid gap-6 md:gap-4 bg-white  dark:bg-black rounded-2xl p-4 sm:p-6 border dark:border-cowberry-green-600 md:grid-cols-12">
    
    {/* Greeting Section */}
    <div className="col-span-12 border rounded-2xl p-4 sm:p-5">
      <h1 className="text-2xl sm:text-3xl mb-4 font-extrabold animate-pulse font-serif text-black dark:text-white">
      {t("greetings.withName", {
        greet: getGreeting(),
        name: user?.full_name || user?.username || ""
      })}</h1>
      <p className="text-gray-600 mb-4 sm:mb-6 font-serif text-sm sm:text-base">
      {t("home.Welcome to your dashboard! Let's make progress on your goals today!")}
      </p>
    </div>

    {/* User Meta Card
    <div className="col-span-12">
      <UserMetaCard />
    </div> */}

    {/* Dashboard Stats */}
    <div className="col-span-12">
      <DashboardStats />
    </div>

    {/* Task Page Link */}
    <div className="col-span-12 md:col-span-6 mt-6">
      <Link
        to="/task-show-page"
        className="flex items-center justify-center p-3 sm:p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full"
      >
        <b className="animate-pulse font-extrabold text-black dark:text-white text-sm sm:text-base">
          {t("home.Go to Task Page")}
        </b>
      </Link>
    </div>
  </div>
</>

  );
}

export default EmployeeDashboard;
