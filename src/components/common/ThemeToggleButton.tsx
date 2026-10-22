import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleButtonProps {
  className?: string;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  className = "",
}) => {
  const { toggleTheme, isDarkMode } = useTheme();

  const titleText = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={(e) => toggleTheme(e)}
      aria-label={titleText}
      title={titleText}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-lg
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-[#141414]
        text-gray-600 dark:text-amber-400
        hover:bg-gray-100 dark:hover:bg-gray-800
        hover:text-gray-900 dark:hover:text-amber-300
        active:scale-95
        transition-all duration-200
        shadow-xs
        focus:outline-hidden focus-visible:ring-2 focus-visible:ring-lantern-blue-600 dark:focus-visible:ring-blue-400
        ${className}
      `}
    >
      <span className="relative flex items-center justify-center w-5 h-5">
        {/* 🌙 Moon Icon (Visible in Light Mode -> Prompts switch to Dark Mode) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`
            absolute inset-0 w-5 h-5 text-gray-700
            transition-all duration-300 ease-out transform
            ${isDarkMode ? "opacity-0 -rotate-90 scale-0 pointer-events-none" : "opacity-100 rotate-0 scale-100"}
          `}
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>

        {/* ☀️ Sun Icon (Visible in Dark Mode -> Prompts switch to Light Mode) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`
            absolute inset-0 w-5 h-5 text-amber-400
            transition-all duration-300 ease-out transform
            ${isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0 pointer-events-none"}
          `}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </span>
    </button>
  );
};

export default ThemeToggleButton;
