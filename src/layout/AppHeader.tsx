import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isMobile, isMobileOpen, toggleSidebar, toggleMobileSidebar } =
    useSidebar();

  const inputRef = useRef<HTMLInputElement>(null);

  // Improved device detection that works with iPad Mini
  const isTouchDevice = () => {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - for older browsers
      navigator.msMaxTouchPoints > 0
    );
  };

  const isTablet = () => {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPad =
      /ipad/.test(userAgent) ||
      (isTouchDevice() && /macintosh/.test(userAgent) && width >= 768);
    const isAndroidTablet =
      /android/.test(userAgent) && !/mobile/.test(userAgent) && width >= 600;

    return (isIPad || isAndroidTablet) && width >= 768 && width <= 1024;
  };

  const handleToggle = () => {
    const width = window.innerWidth;
    const isTabletDevice = isTablet();
    const isMobileDevice = width < 768;

    // For tablet devices (including iPad Mini), use mobile sidebar behavior
    if (isMobileDevice || isTabletDevice) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  // Scroll-aware shadow
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⌘K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle window resize to update sidebar state for iPad rotation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isTabletDevice = isTablet();

      // If device is tablet or mobile, ensure sidebar is in mobile mode
      if (width < 768 || isTabletDevice) {
        // You might want to auto-close the sidebar on orientation change
        if (isMobileOpen && !isMobile) {
          toggleMobileSidebar();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileOpen, isMobile, toggleMobileSidebar]);

  return (
    <header
      className={`
        sticky top-0 z-40 w-full
        h-16
        flex items-center
        bg-white dark:bg-gray-900
        border-b border-gray-200/60 dark:border-gray-800/60
        transition-shadow duration-200
        ${isScrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]" : ""}
      `}
    >
      <div className="flex items-center justify-between w-full px-4 lg:px-6">
        {/* Left — Sidebar toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="
              flex items-center justify-center
              w-10 h-10 rounded-lg
              border border-gray-200 dark:border-gray-700
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              hover:text-gray-900 dark:hover:text-gray-100
              active:scale-95
              transition-all duration-150
            "
          >
            {isMobile && isMobileOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Center — Logo */}
        <Link
          to="/home"
          className="flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          <img
            src="lantern-banner.png"
            alt="Logo"
            width={200}
            height={32}
            className="object-contain max-w-[150px] lg:max-w-[200px]"
          />
        </Link>

        {/* Right — Actions (always visible on desktop, hidden on mobile when menu is closed) */}
        <div className="hidden lg:flex items-center gap-2">
          <NotificationDropdown />
          <UserDropdown />
        </div>

        {/* Mobile menu button - only show on mobile */}
        <button
          onClick={() => setApplicationMenuOpen(!isApplicationMenuOpen)}
          className="
            lg:hidden flex items-center justify-center
            w-10 h-10 rounded-lg
            text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800
            active:scale-95 transition-all duration-150
          "
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Mobile menu dropdown - only contains mobile-specific actions */}
      {isApplicationMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg z-50">
          <div className="flex flex-col p-4 gap-3">
            <div className="flex items-center justify-end gap-2 pt-2">
              <NotificationDropdown />
              <UserDropdown />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
