import {Routes, Route } from "react-router";

import 'leaflet/dist/leaflet.css';

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import OtpModal from "./pages/AuthPages/LoginWithOtp";
import TaskPage from "./pages/Employee/TaskPage";
import ChatBox from "./components/chat/ChatBox";
import TaskShowPage from "./pages/Employee/TaskShowPage";
import RegistrationPage from "./pages/Employee/RegistrationPage";
import AttendanceForm from "./pages/Employee/AttandanceStart";
import LiveCoordinates from "./pages/Employee/LocationFetcher";
import AttendanceEndForm from "./pages/Employee/AttandanceEnd";
import ProtectedRoute from "./components/ProtectedRoutes";
import TaskCalendar from "./pages/Employee/TaskCalendar";
import EmployeeDashboard from "./pages/Dashboard/EmployeeDashboard";
import LiveUserLocation from "./pages/Employee/LiveUserLocation";
import LiveTracking from "./pages/Employee/LiveTracking";
// import SignInForm from "./components/auth/SignInForm";
// import LoginWithOtp from "./pages/AuthPages/LoginWithOtp";

export default function App() {
  return (
    <>
      
        <ScrollToTop />
        <Routes>
       
      
          {/* OTP VERIFIFCATION MODAL ROUTE */}
           <Route path="/loginwithotp" element={<OtpModal isOpen={true} onClose={() => {}} onVerificationSuccess={()=>{}} />} />
            
              <Route  path="/" element={<SignIn />} />
              
          {/* Dashboard Layout */}
          <Route  element={<AppLayout />}>

                
                  
           {/* Home Page */}

            <Route  path="/home" element={   <Home />  }  />

            {/* User Registration Page */}
            <Route path="/user-register" element={ <RegistrationPage />
             
            } />


           
            
            {/* Dashboard Pages */}
            {/* <Route path="/dashboard" element={
           /> */}

        
            {/* Employee Pages */}
            {/* <Route path="/attandanceStart-page" element={<AttendanceForm/>}/> */}
            <Route path="/attandanceStart-page" element={    <AttendanceForm />}/>

            <Route path="/attandanceEnd-page" element={<AttendanceEndForm />} />

      
           <Route path="/task-show-page" element={
          <TaskShowPage />} />
           <Route path="/task-calendar" element={  <TaskCalendar />} />
           {/* <Route path="/employee-dashboard" element={<ProtectedRoute allowedRoles={['employee']}></ProtectedRoute>} /> */}
           <Route path="/employee-dashboard" element={<EmployeeDashboard/> } />


          

{/*          
            <Route path="/user-location" element={<LiveCoordinates/>} /> */}

            <Route path="/live-tracking" element={<LiveTracking/>} />


            
      
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/chat" element={<ChatBox />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables /> } />
            <Route path="/assign-task-page" element={ <TaskPage />} />
            {/* <Route path="/task-show-page" element={<TaskShowPage />} /> */}

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
  );
}