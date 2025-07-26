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
import AttendanceEndForm from "./pages/Employee/AttandanceEnd";
import Logout from "./pages/AuthPages/Logout";
import { Toaster } from "react-hot-toast";
import CompTest from "./pages/CompTest";
// import { SocketChatWindow } from "./components/chat/SocketChatWindow";
// import LoginWithOtp from "./pages/AuthPages/LoginWithOtp";

export default function App() {
  return (
    <>
      
        <ScrollToTop />
        <Routes>
      
          {/* OTP VERIFIFCATION MODAL ROUTE */}
           <Route path="/loginwithotp" element={<OtpModal isOpen={true} onClose={() => {}} onVerificationSuccess={()=>{}} />} />
            

              
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>

            {/* User Registration Page */}
            <Route path="/user-register" element={<RegistrationPage />} />


            {/* Home Page */}
            <Route index path="/" element={<Home />} />
            
            {/* Dashboard Pages */}
            <Route path="/dashboard" element={<Home />} />

        
            {/* Employee Pages */}
            <Route path="/attandanceStart-page" element={<AttendanceForm />} />
            <Route path="/attandanceEnd-page" element={<AttendanceEndForm />} />
          
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/chat" element={<ChatBox />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/task-page" element={<TaskPage />} />
            <Route path="/task-show-page" element={<TaskShowPage />} />

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

            {/* Test Route */}
            <Route path="/test" element={<CompTest />} />
            {/* <Route path="/socket-test" element={<SocketChatWindow />} /> */}
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/logout" element={<Logout />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster
          position="bottom-right"
          reverseOrder={true}
          toastOptions={{
            style: {
              border: '1px solid #377355',
              padding: '16px',
              color: '#377355',
            },
            iconTheme: {
              primary: '#377355',
              secondary: '#FFFAEE',
            },
          }}
        />
      </>
  );
}
