// FilterSection.tsx
import React, { useState } from "react";
import { Role, Zone, FilterState } from "../../types/user.types"; // ADD FilterState import

interface FilterSectionProps {
  filterState: FilterState; // ✅ Add this
  uniqueDepartments: string[];
  uniqueZones: string[];
  roles: Role[];
  loadingRoles: boolean;
  filteredUsersLength: number;
  paginatedUsersLength: number;
  currentPage: number;
  totalPages: number;
  exporting: boolean;
  onFilterChange: (key: keyof FilterState, value: any) => void; // ✅ Add this
  onClearFilters: () => void; // ✅ This should be a function
  onExport: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filterState, // ✅ Get the whole filter state
  uniqueDepartments = [],
  uniqueZones = [],
  roles = [],
  loadingRoles,
  filteredUsersLength,
  paginatedUsersLength,
  currentPage,
  totalPages,
  exporting,
  onFilterChange,
  onClearFilters,
  onExport,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Use the passed values
  const filteredCount = filteredUsersLength || 0;
  const paginatedCount = paginatedUsersLength || 0;

  // Create handler functions that call onFilterChange
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange("searchTerm", e.target.value);
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange("roleFilter", e.target.value);
  };

  const handleDepartmentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange("departmentFilter", e.target.value);
  };

  const handleZoneFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange("zoneFilter", e.target.value);
  };

  // Clear search input
  const clearSearch = () => {
    onFilterChange("searchTerm", "");
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="sm:hidden mb-3">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="w-full px-4 py-2 bg-linear-to-r from-white/40 to-white/20 dark:from-gray-700/40 dark:to-gray-800/20 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-lg text-gray-700 dark:text-gray-300 hover:from-white/60 hover:to-white/40 dark:hover:from-gray-600/60 dark:hover:to-gray-700/40 transition-all duration-300 flex items-center justify-center shadow-sm"
        >
          <svg
            className={`w-4 h-4 mr-2 transition-transform duration-300 ${isVisible ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {isVisible ? "Hide Filters" : "Show Filters"}
          <span className="ml-2 px-2 py-0.5 text-xs bg-lantern-blue-100 dark:bg-lantern-blue-900 text-lantern-blue-800 dark:text-lantern-blue-200 rounded-full">
            {filteredCount}
          </span>
        </button>
      </div>

      {/* Filter Section Container */}
      <div
        className={`${isVisible ? "block" : "hidden sm:block"} bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-3 sm:mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] shrink-0`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-2">
          {/* Search Input */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Users
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 rounded bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                <svg
                  className="h-3 w-3 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, code, email, zone..."
                value={filterState.searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-8 pr-2 py-1.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 text-sm transition-all duration-300"
              />
              {filterState.searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Role
            </label>
            <select
              value={filterState.roleFilter}
              onChange={handleRoleFilterChange}
              disabled={loadingRoles}
              className="w-full py-1.5 px-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none text-sm transition-all duration-300 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "0.75em",
              }}
            >
              <option value="">All Roles</option>
              {loadingRoles ? (
                <option value="" disabled>
                  Loading roles...
                </option>
              ) : (
                roles.map((r) => (
                  <option key={`role-${r.id}`} value={r.name}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Department
            </label>
            <select
              value={filterState.departmentFilter}
              onChange={handleDepartmentFilterChange}
              className="w-full py-1.5 px-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none text-sm transition-all duration-300 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "0.75em",
              }}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={`dept-${dept}`} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Zone
            </label>
            <select
              value={filterState.zoneFilter}
              onChange={handleZoneFilterChange}
              className="w-full py-1.5 px-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none text-sm transition-all duration-300 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "0.75em",
              }}
            >
              <option value="">All Zones</option>
              {uniqueZones.map((zoneId) => (
                <option key={`zone-${zoneId}`} value={zoneId}>
                  {zoneId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions: Clear & Export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm whitespace-nowrap">
            Showing {paginatedCount} of {filteredCount} filtered users • Page{" "}
            {currentPage} of {totalPages}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                console.log("Clear filters button clicked");
                onClearFilters();
              }}
              className="px-3 py-1.5 bg-linear-to-r from-white/40 to-white/20 dark:from-gray-700/40 dark:to-gray-800/20 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 rounded-lg hover:from-white/60 hover:to-white/40 dark:hover:from-gray-600/60 dark:hover:to-gray-700/40 transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow text-xs flex items-center justify-center"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filters
            </button>

            <button
              onClick={onExport}
              disabled={exporting}
              className="px-3 py-1.5 bg-lantern-blue-600 text-white rounded-lg transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow text-xs flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export to Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSection;