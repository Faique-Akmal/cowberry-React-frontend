import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom"; // ✅ FIXED
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import LangToggleButton from "../components/common/LangToggleButton";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // ✅ for search functionality

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
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

  return (
    <header className="sticky top-0 flex w-full bg-dashboard-bg-200 border-gray-200 z-40 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Sidebar Toggle Button */}
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {/* Icon logic stays the same */}
            {isMobileOpen ? (
              <>&#x2715;</> // ❌ Close Icon
            ) : (
              <>&#9776;</> // ☰ Hamburger
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="lg:hidden">
            <img src="/images/logo/cowberry-logo.svg" alt="Logo" />
          </Link>

          {/* App Menu Toggle on Small Screen */}
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

          {/* Search */}
          <div className="hidden lg:block w-full max-w-md">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                  🔍
                </span>
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
              </div>
            </form>
          </div>
        </div>

        {/* Right Side Buttons */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0`}
        >
          <div className="flex items-center gap-2">
            <LangToggleButton />
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
