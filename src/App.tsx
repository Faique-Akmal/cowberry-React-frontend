import { Routes, Route } from "react-router";

import "leaflet/dist/leaflet.css";

import SignIn from "./pages/AuthPages/SignIn";

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
// import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import OtpModal from "./pages/AuthPages/LoginWithOtp";
import TaskPage from "./pages/Employee/TaskPage";
import Logout from "./pages/AuthPages/Logout";
// import CompTestHistorySocket from "./pages/CompTestHistorySocket";
import SocketChatBox from "./components/chat/SocketChatBox";
import { Toaster } from "react-hot-toast";

import TaskShowPage from "./pages/Employee/EmployeeTask";
import RegistrationPage from "./pages/Employee/RegistrationPage";
// import AttendanceForm from "./pages/Employee/AttandanceStart";
// import LocationFetcher from "./pages/Employee/LocationFetcher";
import AttendanceEndForm from "./pages/Employee/AttandanceEnd";
// import ProtectedRoute from "./components/ProtectedRoutes";
import TaskCalendar from "./pages/Employee/TaskCalendar";
import EmployeeDashboard from "./pages/Dashboard/EmployeeDashboard";

import AdminTaskManager from "./pages/Employee/TaskManager";

import AttendanceGuard from "./guards/AttandanceGuard";
import AttendanceList from "./pages/Employee/locationFetcherEmployee";
// import NotificationListener from "./NotificationListener";
import AnnouncementForm from "./pages/Announcement";

// import LocationFetcher from "./pages/Employee/LocationFetcher";
import AttendanceStart from "./pages/Employee/AttandanceStart";
import AllUsers from "./pages/Tables/BasicTables";
import ProtectedRoute from "./components/ProtectedRoutes";
import ThemeCustomizer from "./themes/themecutomizer";
import ChatToggle from "./context/ChatToggle";
// import Testingmap from "./pages/Employee/Testing-map";
import EmployeeCheckin from "./components/employees/Employeecheckin";
import AnnouncementModal from "./components/header/NotificationDropdown";
import CreateAnnouncement from "./components/hr/Announcement";
export default function App() {
  return (
    <>
      {/* <Toaster position="bottom-right" reverseOrder={false} /> */}

      <ScrollToTop />

      {/* <NotificationListener/> */}
      <Routes>
        <Route
          path="/loginwithotp"
          element={
            <OtpModal
              isOpen={true}
              onClose={() => {}}
              onVerificationSuccess={() => {}}
            />
          }
        />

        <Route path="/" element={<SignIn />} />

        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>
          {/* Home Page */}

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/theme-customizer" element={<ThemeCustomizer />} />

          {/* Employee Pages */}

          <Route path="/attandanceStart-page" element={<AttendanceStart />} />
          {/* <Route path="/attandanceStart-page" element={<AttendanceGuard> <AttendanceForm /> </AttendanceGuard>}></Route> */}
          <Route
            path="/attandanceEnd-page"
            element={
              <AttendanceGuard>
                {" "}
                <AttendanceEndForm />{" "}
              </AttendanceGuard>
            }
          ></Route>
          <Route
            path="/task-show-page"
            element={
              <AttendanceGuard>
                {" "}
                <TaskShowPage />{" "}
              </AttendanceGuard>
            }
          ></Route>
          <Route
            path="/task-calendar"
            element={
              <AttendanceGuard>
                <TaskCalendar />
              </AttendanceGuard>
            }
          ></Route>
          <Route
            path="/employee-dashboard"
            element={
              <AttendanceGuard>
                {" "}
                <EmployeeDashboard />{" "}
              </AttendanceGuard>
            }
          ></Route>
          <Route
            path="/user-register"
            element={
              <AttendanceGuard>
                {" "}
                <RegistrationPage />{" "}
              </AttendanceGuard>
            }
          ></Route>
          <Route
            path="/employeecheckin"
            element={
              <AttendanceGuard>
                {" "}
                <EmployeeCheckin />{" "}
              </AttendanceGuard>
            }
          ></Route>

          {/* Others Page */}
          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/chat" element={<SocketChatBox />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />

          {/* Forms */}
          <Route path="/form-elements" element={<FormElements />} />

          {/* Tables */}
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/assign-task-page" element={<TaskPage />} />
          <Route path="/admin-task-manager" element={<AdminTaskManager />} />
          <Route path="/attandance-start-admin" element={<AttendanceList />} />
          <Route path="/announcement" element={<AnnouncementModal/>} />
          <Route path="/announcementList" element={<CreateAnnouncement/>} />
          {/* <Route path="/live-tracking" element={ <LocationFetcher />} /> */}

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
        <Route path="/logout" element={<Logout />} />
        {/* <Route path="/signup" element={<SignUp />} /> */}

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatToggle />
      {/* <Toaster
        position="bottom-right"
        reverseOrder={true}
        toastOptions={{
          style: {
            border: "1px solid #377355",
            padding: "16px",
            color: "#377355",
          },
          iconTheme: {
            primary: "#377355",
            secondary: "#FFFAEE",
          },
        }}
      /> */}
    </>
  );
}
