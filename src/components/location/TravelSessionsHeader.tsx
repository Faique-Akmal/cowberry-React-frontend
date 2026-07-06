// src/components/admin/TravelSessionsHeader.tsx
import {
  FaSync,
  FaRoute,
  FaClock,
  FaListAlt,
  FaPlayCircle,
  FaRoad,
  FaUser,
  FaSearch,
  FaCalendarAlt,
  FaFileCsv,
  FaChartLine,
  FaChevronDown,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import PageMeta from "../../components/common/PageMeta";

interface TravelSessionsHeaderProps {
  lastUpdateTime: Date | null;
  isExporting: boolean;
  autoRefresh: boolean;
  isDateFilterActive: boolean;
  totalSessions: number;
  totalSessionsCount: number;
  activeSessions: number;
  totalDistance: number;
  usersCount: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  selectedUser: string;
  viewMode: "grouped" | "individual";
  isSearching: boolean;
  onExport: () => void;
  onAutoRefreshToggle: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearDateFilter: () => void;
  onViewModeChange: (mode: "grouped" | "individual") => void;
  onRefresh: () => void;
}

export default function TravelSessionsHeader({
  lastUpdateTime,
  isExporting,
  autoRefresh,
  isDateFilterActive,
  totalSessions,
  totalSessionsCount,
  activeSessions,
  totalDistance,
  usersCount,
  searchQuery,
  startDate,
  endDate,
  selectedUser,
  viewMode,
  isSearching,
  onExport,
  onAutoRefreshToggle,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onStartDateChange,
  onEndDateChange,
  onClearDateFilter,
  onViewModeChange,
  onRefresh,
}: TravelSessionsHeaderProps) {
  const glassmorphismClasses = {
    card: "backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/50 shadow-xl",
    statCard:
      "backdrop-blur-lg bg-gradient-to-br from-white/15 to-white/5 dark:from-gray-800/30 dark:to-gray-900/20 border border-white/20 dark:border-gray-700/50 shadow-lg",
    input:
      "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/30 focus:border-white/30 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30",
  };

  return (
    <>
      <PageMeta
        title="Employee location tracker"
        description="Track Fieldemployee here"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-xl">
                  <FaRoute className="text-blue-500" />
                </div>
                Travel Sessions
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Track employee travel activities and paths
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {lastUpdateTime && (
                <span className="flex items-center gap-1 backdrop-blur-sm bg-white/20 dark:bg-gray-800/30 px-3 py-1 rounded-lg">
                  <FaClock className="text-xs" />
                  Updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            <button
              onClick={onExport}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isExporting ? "bg-gray-400" : "bg-lantern-blue-600 hover:bg-lantern-yellow-400"} text-white transition-all`}
              title="Export grouped sessions with detailed farmer data (using cached data)"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <FaSync className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FaFileCsv />
                  Export To CSV
                </>
              )}
            </button>

            <button
              onClick={onAutoRefreshToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                autoRefresh
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              } transition-all`}
              title={autoRefresh ? "Auto-refresh is ON" : "Auto-refresh is OFF"}
            >
              {autoRefresh ? (
                <>
                  <FaSync className="animate-spin" />
                  Auto Refresh (ON)
                </>
              ) : (
                <>
                  <FaSync />
                  Auto Refresh (OFF)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {isDateFilterActive || selectedUser || searchQuery
                    ? totalSessions
                    : totalSessionsCount}
                </p>
                {(isDateFilterActive || selectedUser || searchQuery) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Filtered results (of {totalSessionsCount} total)
                  </p>
                )}
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl">
                <FaListAlt className="text-blue-500 text-xl" />
              </div>
            </div>
          </div>

          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Active Sessions
                </p>
                <p className="text-2xl font-bold mt-1 text-green-500">
                  {activeSessions}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl">
                <FaPlayCircle className="text-green-500 text-xl" />
              </div>
            </div>
          </div>

          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Distance
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {(totalDistance / 1000).toFixed(1)} km
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-xl">
                <FaRoad className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>

          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Users
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {usersCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl">
                <FaUser className="text-orange-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`${glassmorphismClasses.card} rounded-2xl p-4 mb-6 backdrop-blur-lg`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search Employee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaSearch className="inline mr-2" />
                Search Employee
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or employee code..."
                  className={`w-full px-4 py-2 pl-10 pr-24 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      onSearchSubmit();
                    }
                  }}
                />

                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <FaSearch className="text-sm" />
                </div>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      onClick={onClearSearch}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      title="Clear search"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  )}
                  <button
                    onClick={onSearchSubmit}
                    className="px-3 py-1.5 bg-lantern-blue-600 hover:bg-lantern-blue-700 text-white rounded-lg transition-all flex items-center gap-1 text-sm"
                  >
                    <FaSearch className="text-xs" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>
              {isSearching && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Searching for "{searchQuery}"...
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="lg:col-span-1">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FaCalendarAlt className="inline mr-2" />
                  Date Range
                </label>
                {isDateFilterActive && (
                  <button
                    onClick={onClearDateFilter}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Select date range"
                  className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30 cursor-pointer`}
                  value={
                    startDate && endDate
                      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                      : startDate
                        ? `From ${new Date(startDate).toLocaleDateString()}`
                        : endDate
                          ? `Until ${new Date(endDate).toLocaleDateString()}`
                          : "Select date range"
                  }
                  readOnly
                  onClick={() => {
                    const picker = document.getElementById("dateRangePicker");
                    if (picker) {
                      picker.classList.toggle("hidden");
                    }
                  }}
                />

                {/* Date Range Picker Dropdown */}
                <div
                  id="dateRangePicker"
                  className="relative top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 hidden"
                  style={{ minWidth: "300px" }}
                >
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className={`w-full px-3 py-2 ${glassmorphismClasses.input} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                        value={startDate}
                        onChange={(e) => {
                          onStartDateChange(e.target.value);
                          if (e.target.value && endDate) {
                            document
                              .getElementById("dateRangePicker")
                              ?.classList.add("hidden");
                          }
                        }}
                        max={endDate || new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className={`w-full px-3 py-2 ${glassmorphismClasses.input} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                        value={endDate}
                        onChange={(e) => {
                          onEndDateChange(e.target.value);
                          if (startDate && e.target.value) {
                            document
                              .getElementById("dateRangePicker")
                              ?.classList.add("hidden");
                          }
                        }}
                        min={startDate}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const today = new Date();
                        const sevenDaysAgo = new Date(today);
                        sevenDaysAgo.setDate(today.getDate() - 7);
                        onStartDateChange(
                          sevenDaysAgo.toISOString().split("T")[0],
                        );
                        onEndDateChange(today.toISOString().split("T")[0]);
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(today.getDate() - 30);
                        onStartDateChange(
                          thirtyDaysAgo.toISOString().split("T")[0],
                        );
                        onEndDateChange(today.toISOString().split("T")[0]);
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const firstDayOfMonth = new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          1,
                        );
                        onStartDateChange(
                          firstDayOfMonth.toISOString().split("T")[0],
                        );
                        onEndDateChange(today.toISOString().split("T")[0]);
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => {
                        onStartDateChange("");
                        onEndDateChange("");
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                        onRefresh();
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {isDateFilterActive && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FaCalendarAlt className="text-xs flex-shrink-0" />
                  <span className="truncate">
                    {startDate && endDate
                      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                      : startDate
                        ? `From ${new Date(startDate).toLocaleDateString()}`
                        : endDate
                          ? `Until ${new Date(endDate).toLocaleDateString()}`
                          : ""}
                  </span>
                </div>
              )}
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaChartLine className="inline mr-2" />
                View Mode
              </label>
              <select
                className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                onChange={(e) =>
                  onViewModeChange(e.target.value as "grouped" | "individual")
                }
                value={viewMode}
              >
                <option value="grouped">Group Session</option>
                <option value="individual">Individual Sessions</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
