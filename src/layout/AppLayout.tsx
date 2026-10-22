import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";

const LayoutContent: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col">
      <div>
        <AppSidebar />
        <MobileBottomNav />
        <Backdrop />
      </div>
      <div
        className={`flex-1 flex flex-col min-w-0 w-full max-w-full transition-all duration-300 ease-in-out ${
          isExpanded
            ? "lg:ml-[240px] lg:w-[calc(100%-240px)] lg:max-w-[calc(100%-240px)]"
            : "lg:ml-[80px] lg:w-[calc(100%-80px)] lg:max-w-[calc(100%-80px)]"
        } ${isMobileOpen ? "ml-0 w-full max-w-full" : ""}`}
      >
        <AppHeader />
        <main className="flex-1 w-full max-w-full min-w-0 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
