import { useEffect, useRef, useState } from "react";
// import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";

import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import LangToggleButton from "../components/common/LangToggleButton";
// import AnnouncementNotification from "../pages/AnnouncementNotification";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import { useTheme } from "../context/ThemeContext";


// import { useTranslation } from "react-i18next";

const AppHeader: React.FC = () => {
  const { themeConfig } = useTheme();
  // const { t } = useTranslation();
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // // Dummy list of routes/pages to search from
  // const searchableItems = [
  //   { label: "home", path: "/home" },
  //   { label: "Users", path: "/users-list" },
  //   { label: "User-registeration", path: "/user-register" },
  //   { label: "Users-profile", path: "/users-profile" },
  //   { label: "Attendance-start", path: "/attandanceStart-page" },
  //   { label: "Attendance-end", path: "/attandanceEnd-page" },
  //   { label: "Inventory", path: "/inventory" },
  //   { label: "Announcement", path: "/announcement" },
  //   { label: "Task", path: "/assign-task-page" },
  //   { label: "Task-calendar", path: "/task-calendar" },
  //   { label: "Task-admin", path: "/admin-task-manager" },
  //   { label: "Dashboard", path: "/employee-dashboard" },
  //   { label: "my-task", path: "/task-show-page" },
  //   { label: "Farmers", path: "/farmers" },
  //   { label: "Purchases", path: "/purchase" },
  //   { label: "User Profile", path: "/profile" },
  //   { label: "chat", path: "/chat" },
  //   { label: "All Users", path: "/all-users" },
  //   { label: "LogOut", path: "/logout" },
  // ];

  // const filteredResults = searchableItems.filter((item) =>
  //   item.label.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  return (
    <header
  style={{
    backgroundColor: themeConfig.header.background 
      ? `${themeConfig.header.background}40`
      : 'rgba(255, 255, 255, 0.2)',
    color: themeConfig.header.text,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }}
  className="sticky top-0 flex w-full z-40 
    dark:bg-gray-900/30
    shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]"
>
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Sidebar Toggle */}
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? <>&#x2715;</> : <>&#9776;</>}
          </button>

          {/* Logo */}
          {/* <Link to="/" className="lg:hidden"> */}
            <div >
              <img src="cowberry_organics_2.png" alt="Logo" className="flex justify-center items-center " width={170} height={0}/>
            </div>
          {/* </Link> */}

         

          {/* Search Bar */}
     {/* <div className="relative w-auto max-w-sm mx-auto sm:w-full px-2 sm:px-0">
  <form onSubmit={(e) => e.preventDefault()}>
    {/* Desktop Search Input */}
    {/* <div className="hidden sm:flex relative w-full">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search or type command..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-11 pl-10 pr-14 rounded-lg border bg-white text-sm text-gray-800 shadow focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
      >
        ⌘ K
      </button>
    </div> */}

    {/* Mobile Search Icon */}
    {/* <div className="sm:hidden relative w-auto">
      <button
        type="button"
        onClick={() => setShowMobileSearch(!showMobileSearch)}
        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full float-right"
      >
        🔍
      </button> */}

      {/* Mobile Dropdown Input */}
      {/* {showMobileSearch && (
        <div className="absolute top-12 right-0 z-10 bg-white border rounded-lg shadow-lg w-72 p-2 dark:bg-gray-800">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search or type command..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-3 pr-10 rounded-lg border bg-white text-sm text-gray-800 shadow focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
            >
              ⌘ K
            </button>
          </div> */}

          {/* Dropdown Results */}
          {/* {searchQuery && (
            <div className="mt-2 max-h-60 overflow-y-auto">
              {filteredResults.length > 0 ? (
                filteredResults.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSearchQuery("")}
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">{t("header.No results found.")}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </form>
</div> */} 

           {/* App Menu Button */}
          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>

        {/* Right Side Header Actions */}
        <div
          className={`${isApplicationMenuOpen ? "flex" : "hidden"
            } items-center justify-between w-full gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0`}
        >
          <div className="flex items-center gap-2">
            <LangToggleButton />
            <ThemeToggleButton />
            {/* <AnnouncementNotification /> */}
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
