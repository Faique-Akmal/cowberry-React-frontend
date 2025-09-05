import { useTheme } from "../../context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { toggleTheme, isDarkMode } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center text-gray-500 transition-colors bg-black border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {isDarkMode ? (
        // 🌙 Moon (dark mode)
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path d="M21.752 15.002A9 9 0 1112 3a7 7 0 009.752 12.002z" />
        </svg>
      ) : (
        // ☀️ Sun (light/custom mode)
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 18a6 6 0 100-12 6 6 0 000 12zm0-14a1 1 0 011-1h0a1 1 0 110 2h0a1 1 0 01-1-1zm0 16a1 1 0 011-1h0a1 1 0 110 2h0a1 1 0 01-1-1zm8-7a1 1 0 01-1-1h0a1 1 0 112 0h0a1 1 0 01-1 1zm-14 0a1 1 0 01-1-1h0a1 1 0 112 0h0a1 1 0 01-1 1zm11.657-6.657a1 1 0 010 1.414h0a1 1 0 01-1.414-1.414h0a1 1 0 011.414 0zm-9.9 9.9a1 1 0 010 1.414h0a1 1 0 01-1.414-1.414h0a1 1 0 011.414 0zm9.9 0a1 1 0 00-1.414-1.414h0a1 1 0 101.414 1.414h0zm-9.9-9.9a1 1 0 00-1.414-1.414h0a1 1 0 101.414 1.414h0z"
          />
        </svg>
      )}
    </button>
  );
};
