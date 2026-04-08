import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { isMobile, isMobileOpen, toggleSidebar, toggleMobileSidebar } =
    useSidebar();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
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
        {/* Left — Sidebar toggle + Search */}
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

          {/* Search bar — hidden on mobile */}
          {/* <div
            onClick={() => inputRef.current?.focus()}
            className={`
              hidden lg:flex items-center gap-2
              h-9 px-3 min-w-[200px]
              rounded-lg cursor-text
              border transition-all duration-150
              ${
                isSearchFocused
                  ? "border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              }
            `}
          >
            <svg
              className="text-gray-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="
                bg-transparent outline-none w-full
                text-sm text-gray-700 dark:text-gray-200
                placeholder-gray-400 dark:placeholder-gray-500
              "
            />
            <kbd
              className="
              hidden lg:inline-flex items-center
              text-[11px] text-gray-400
              bg-white dark:bg-gray-700
              border border-gray-200 dark:border-gray-600
              rounded px-1.5 py-0.5
            "
            >
              ⌘K
            </kbd>
          </div> */}
        </div>

        {/* Center — Logo (absolutely centered) */}
        <Link
          to="/home"
          className="absolute left-1/2 -translate-x-1/2 flex items-center"
        >
          <img
            src="lantern-banner.png"
            alt="Logo"
            width={200}
            height={32}
            className="object-contain"
          />
        </Link>

        {/* Right — Actions */}
        <div
          className={`
            ${isApplicationMenuOpen ? "flex" : "hidden"}
            lg:flex items-center gap-2
          `}
        >
          {/* Mobile search icon */}
          <button
            className="
              lg:hidden flex items-center justify-center
              w-10 h-10 rounded-lg
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              active:scale-95 transition-all duration-150
            "
            aria-label="Search"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <NotificationDropdown />
          <UserDropdown />
        </div>

        {/* Mobile overflow menu button */}
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
    </header>
  );
};

export default AppHeader;
