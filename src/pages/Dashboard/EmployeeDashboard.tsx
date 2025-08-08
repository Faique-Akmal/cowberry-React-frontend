import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import DashboardStats from "../../components/employees/UserStats";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
import API from "../../api/axios";
import { Link } from "react-router-dom";
// import Confetti from "react-confetti";

interface User {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  role: string;
}

function EmployeeDashboard() {
  const [user, setUser] = useState<User | null>(null);
  // const [windowSize, setWindowSize] = useState({
  //   width: window.innerWidth,
  //   height: window.innerHeight,
  // });

  // ✅ Fetch user
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

  // // ✅ Handle confetti window resize
  // useEffect(() => {
  //   const handleResize = () => {
  //     setWindowSize({
  //       width: window.innerWidth,
  //       height: window.innerHeight,
  //     });
  //   };

  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING";
    else if (hour < 17) return "GOOD AFTERNOON";
    else return "GOOD EVENING";
  };

 

  return (
    <>
      <PageMeta title="Employee Dashboard" description="Employee dashboard" />
      <div className="grid gap-12 md:gap-4 bg-white  rounded-2xl p-6">
        <div className="col-span-3 space-x-4 xl:col-span-12 container border rounded-2xl p-5 ">
          <h1 className="text-3xl mb-4 font-extrabold animate-pulse font-serif text-black dark:text-white">
            {getGreeting()}
            <span className="mx-3 capitalize">
            {user?.full_name || user?.username || ""}
            </span>
            {/* 🎉 Confetti Animation
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              numberOfPieces={400}
              recycle={false}
            /> */}
          </h1>
          <p className="text-gray-600 mb-6 font-serif">
            Welcome to your dashboard! Let's make progress on your goals today!
          </p>
        </div>

        <div className="col-span-3 space-x-4 xl:col-span-12">
          <UserMetaCard />
        </div>

        <div className="col-span-3 space-x-4 xl:col-span-12">
          <DashboardStats />
        </div>

        <div className="col-span-3 mt-10 space-x-4 xl:col-span-6">
          <Link to="/task-show-page" className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <b className="animate-pulse font-extrabold text-dashboard-royalblue-200">
              Go to Task Page
            </b>
          </Link>
        </div>
      </div>
    </>
  );
}

export default EmployeeDashboard;
