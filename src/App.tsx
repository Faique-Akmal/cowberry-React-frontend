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

import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import OtpModal from "./pages/AuthPages/LoginWithOtp";
import TaskPage from "./pages/Employee/TaskPage";
import Logout from "./pages/AuthPages/Logout";
import { Toaster } from "react-hot-toast";
import RegistrationPage from "./pages/Employee/RegistrationPage";

import AttendanceGuard from "./guards/AttandanceGuard";
import AttendanceList from "./pages/Employee/locationFetcherEmployee";
import AllUsers from "./pages/Tables/BasicTables";
import ProtectedRoute from "./components/ProtectedRoutes";
import ThemeCustomizer from "./themes/themecutomizer";
import EmployeeCheckin from "./components/employees/Employeecheckin";
import AnnouncementModal from "./components/header/NotificationDropdown";
import CreateAnnouncement from "./components/hr/Announcement";
import { ChatInterface } from "./components/chat/ChatInterface";
import PrivacyPolicy from "./Privacy-policy/PrivacyPolicy";
import AddRoleForm from "./admin/pages/AddRoles";
import DepartmentManagement from "./admin/pages/AddDepartment";
import CreateZonePage from "./components/hr/CreateZone";
import LeavesPage from "./HRMS/LeavesPage";

export default function App() {
  return (
    <>
      <ScrollToTop />

      {/* <NotificationListener/> */}
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

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
        {/* new chat  */}
        <Route path="/chat" element={<ChatInterface />} />
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

          <Route
            path="/add-zones"
            element={
              <ProtectedRoute>
                <CreateZonePage />
              </ProtectedRoute>
            }
          />
          <Route path="/theme-customizer" element={<ThemeCustomizer />} />
          <Route path="/add-role" element={<AddRoleForm />} />
          <Route path="/add-department" element={<DepartmentManagement />} />

          <Route path="/user-register" element={<RegistrationPage />} />
          <Route path="/get-leaves" element={<LeavesPage />} />
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

          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />

          {/* Forms */}
          <Route path="/form-elements" element={<FormElements />} />

          {/* Tables */}
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/assign-task-page" element={<TaskPage />} />

          <Route path="/tracking-admin" element={<AttendanceList />} />
          <Route path="/announcement" element={<AnnouncementModal />} />
          <Route path="/announcementList" element={<CreateAnnouncement />} />
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
      {/* <ChatToggle /> */}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          // Global styling (Optional)
          style: {
            borderRadius: "10px",
            background: "green",
            color: "white",
            fontSize: "14px",
          },
          // Success specific style
          success: {
            style: {
              background: "var(--color-lantern-blue-600)",
            },
          },
          // Error specific style
          error: {
            style: {
              background: "red",
            },
          },
        }}
      />
    </>
  );
}
