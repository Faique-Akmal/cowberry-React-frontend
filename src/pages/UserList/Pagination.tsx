import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  handleGoToPage: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  handleGoToPage,
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={`page-${i}`}
        onClick={() => handleGoToPage(i)}
        className={`min-w-8 h-8 px-2 mx-1 rounded-lg sm:rounded-xl text-xs font-medium transition-all duration-300 ${
          currentPage === i
            ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md"
            : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80"
        } backdrop-blur-sm border border-white/60 dark:border-gray-600/60`}
      >
        {i}
      </button>,
    );
  }

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-4">
      <button
        onClick={() => handleGoToPage(1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium backdrop-blur-sm border transition-all duration-300 ${
          currentPage === 1
            ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
            : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
        }`}
      >
        « First
      </button>

      <button
        onClick={() => handleGoToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium backdrop-blur-sm border transition-all duration-300 ${
          currentPage === 1
            ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
            : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
        }`}
      >
        ‹ Prev
      </button>

      {startPage > 1 && (
        <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
      )}

      {pages}

      {endPage < totalPages && (
        <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
      )}

      <button
        onClick={() => handleGoToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium backdrop-blur-sm border transition-all duration-300 ${
          currentPage === totalPages
            ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
            : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
        }`}
      >
        Next ›
      </button>

      <button
        onClick={() => handleGoToPage(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium backdrop-blur-sm border transition-all duration-300 ${
          currentPage === totalPages
            ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
            : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
        }`}
      >
        Last »
      </button>
    </div>
  );
};

export default Pagination;
