import React from "react";
import LoadingAnimation from "../UiElements/loadingAnimation";

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading users...",
}) => {
  return (
    <div
      className="
        flex flex-col justify-center items-center py-8 sm:py-12
        bg-linear-to-br from-white/30 to-white/10
        dark:from-gray-800/30 dark:to-gray-900/10
        backdrop-blur-lg
        rounded-xl sm:rounded-2xl border border-white/40 dark:border-gray-700/40
        text-center
        flex-1
      "
    >
      <LoadingAnimation />
      <span className="text-gray-600 dark:text-gray-300 text-sm mt-4">
        {message}
      </span>
    </div>
  );
};

export default LoadingState;
