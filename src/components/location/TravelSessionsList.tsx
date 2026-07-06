// src/components/admin/TravelSessionsList.tsx
import { useState, RefObject } from "react";
import {
  FaRoute,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaRoad,
  FaMapPin,
  FaEye,
  FaInfoCircle,
  FaListAlt,
  FaChevronDown,
  FaSpinner,
  FaLayerGroup,
  FaUser as FaUserIcon,
  FaCar,
  FaTimes,
  FaPauseCircle,
} from "react-icons/fa";
import LoadingAnimation from "../../pages/UiElements/loadingAnimation";

interface TravelSession {
  sessionId: number;
  fullName: string;
  userId: number;
  username: string;
  employeeCode: string;
  startTime: string;
  startLatitude: string;
  startLongitude: string;
  endTime: string;
  endLatitude: string;
  endLongitude: string;
  startOdometer: string;
  endOdometer: string;
  totalDistance: number;
  department?: string;
  allocatedArea?: string;
  totalSessions?: number;
}

interface GroupedSession {
  userId: number;
  username: string;
  fullName?: string;
  employeeCode: string;
  date: string;
  sessions: TravelSession[];
  totalSessions: number;
  totalDistance: number;
  firstSessionDistance: number;
  originalTotalDistance: number;
  activeSessions: number;
  startTime: string;
  endTime: string;
  totalPoints: number;
  isLoading?: boolean;
  hasMoreSessions?: boolean;
  allSessionsLoaded?: boolean;
  userRole?: string;
  isFieldEmployee?: boolean;
}

interface TravelSessionsListProps {
  viewMode: "grouped" | "individual";
  groupedView: GroupedSession[];
  filteredSessions: TravelSession[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  isDateFilterActive: boolean;
  sessionLogs: Record<number, any[]>;
  observerTarget?: RefObject<HTMLDivElement>;
  onOpenMap: (session: TravelSession) => void;
  onOpenMultiMap: (group: GroupedSession) => void;
  onLoadMoreSessions: () => void;
  onLoadMoreSessionsForUser: (userId: number, date: string) => void;
  onClearDateFilter: () => void;
  onFetchTravelData: (userId: string, sessionDate?: string) => void;
  formatDateOnly: (dateStr: string) => string;
  formatTimeOnly: (dateStr: string) => string;
  formatDateTime: (dateStr: string) => string;
  calculateDuration: (
    startTime: string,
    endTime: string,
  ) => { hours: number; minutes: number };
  getSessionColor: (index: number) => string;
  filterAndMapLogsToSession: (logs: any[], session: TravelSession) => any[];
}

export default function TravelSessionsList({
  viewMode,
  groupedView,
  filteredSessions,
  isLoading,
  isLoadingMore,
  hasMore,
  currentPage,
  isDateFilterActive,
  sessionLogs,
  observerTarget,
  onOpenMap,
  onOpenMultiMap,
  onLoadMoreSessions,
  onLoadMoreSessionsForUser,
  onClearDateFilter,
  onFetchTravelData,
  formatDateOnly,
  formatTimeOnly,
  formatDateTime,
  calculateDuration,
  getSessionColor,
  filterAndMapLogsToSession,
}: TravelSessionsListProps) {
  const glassmorphismClasses = {
    card: "backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/50 shadow-xl",
    cardHover:
      "hover:bg-white/15 dark:hover:bg-gray-800/40 hover:border-white/30 dark:hover:border-gray-600/50 transition-all duration-300",
    button: {
      primary:
        "backdrop-blur-sm bg-lantern-blue-600 hover:from-blue-600 hover:to-indigo-700 border border-blue-400/20 dark:border-blue-500/30 text-white shadow-lg hover:shadow-xl transition-all duration-300",
      outline:
        "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/20 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/30 transition-all duration-300",
    },
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center mt-9 p-10">
          <LoadingAnimation />
          <p className="text-gray-600 dark:text-gray-300">
            Loading travel sessions...
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "grouped") {
    if (groupedView.length === 0) {
      return (
        <div
          className={`${glassmorphismClasses.card} rounded-2xl p-12 text-center backdrop-blur-lg`}
        >
          <FaRoute className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            No Travel Sessions Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {isDateFilterActive
              ? "Try adjusting your filters to see more results."
              : "No travel sessions recorded yet."}
          </p>
          {isDateFilterActive && (
            <button
              onClick={onClearDateFilter}
              className={`px-4 py-2 ${glassmorphismClasses.button.outline} rounded-xl`}
            >
              Clear Date Filter
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="space-y-6">
          {groupedView.map((group) => {
            const groupDuration = calculateDuration(
              group.startTime,
              group.endTime,
            );
            const formattedDate = new Date(group.date).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            );

            const hasMoreSessions =
              group.sessions.length > 0 && !group.allSessionsLoaded;

            // Field employees: their first session of the day is excluded
            // from the visible list and from all counts. Every other role
            // sees every session starting from the first one.
            // NOTE: group.sessions is sorted ascending by startTime, so
            // index 0 is always the earliest session of the day.
            const displaySessions = group.isFieldEmployee
              ? group.sessions.slice(1)
              : group.sessions;

            if (displaySessions.length === 0) {
              return null;
            }

            const displayActiveSessions = displaySessions.filter(
              (s) => !s.endTime,
            ).length;

            return (
              <div
                key={`${group.userId}-${group.date}`}
                className={`${glassmorphismClasses.card} ${glassmorphismClasses.cardHover} rounded-2xl overflow-hidden backdrop-blur-lg`}
              >
                {/* Group Header */}
                <div className="bg-white px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-lantern-blue-600 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {group.fullName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                          {group.fullName}
                          <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-300">
                            ({group.employeeCode})
                          </span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <FaCalendarAlt className="text-sm" />
                            <span className="text-sm">{formattedDate}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${
                                displayActiveSessions > 0
                                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400"
                                  : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400"
                              }`}
                            >
                              {displayActiveSessions > 0
                                ? `${displayActiveSessions} Active`
                                : "All Completed"}
                            </span>
                            {hasMoreSessions && (
                              <span className="px-2 py-1 backdrop-blur-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                                More sessions available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              Sessions
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                              {displaySessions.length}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              Distance
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                              {(group.totalDistance / 1000).toFixed(1)} km
                            </p>
                            {group.isFieldEmployee &&
                              group.firstSessionDistance > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  (Excluding first session:{" "}
                                  {(group.firstSessionDistance / 1000).toFixed(
                                    1,
                                  )}{" "}
                                  km)
                                </p>
                              )}
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              Reimbursement
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                              ₹{" "}
                              {((group.totalDistance / 1000) * 3.5).toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                <div className="p-6">
                  {/* Group Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaClock className="text-sm" />
                        <span className="text-xs font-medium">
                          First Session
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {formatTimeOnly(displaySessions[0].startTime)}
                      </p>
                    </div>

                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaClock className="text-sm" />
                        <span className="text-xs font-medium">
                          Last Session
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {formatTimeOnly(
                          displaySessions[displaySessions.length - 1].endTime ||
                            displaySessions[displaySessions.length - 1]
                              .startTime,
                        )}
                      </p>
                    </div>

                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaRoad className="text-sm" />
                        <span className="text-xs font-medium">
                          Total Distance
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {(group.totalDistance / 1000).toFixed(2)} km
                      </p>
                      {group.isFieldEmployee &&
                        group.firstSessionDistance > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Original:{" "}
                            {(group.originalTotalDistance / 1000).toFixed(2)} km
                          </p>
                        )}
                    </div>

                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaMapPin className="text-sm" />
                        <span className="text-xs font-medium">
                          Total Points
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {group.totalPoints}
                      </p>
                    </div>
                  </div>

                  {/* Session List */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-lg">
                          <FaListAlt className="text-blue-500" />
                        </div>
                        Sessions ({displaySessions.length})
                      </h4>

                      {hasMoreSessions && (
                        <button
                          onClick={() =>
                            onLoadMoreSessionsForUser(group.userId, group.date)
                          }
                          disabled={group.isLoading}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                            group.isLoading
                              ? "bg-gray-400"
                              : "bg-gradient-to-r from-amber-500/90 to-orange-600/90 hover:from-amber-600 hover:to-orange-700"
                          } text-white transition-all`}
                        >
                          {group.isLoading ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <FaChevronDown />
                              Load All Sessions
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {displaySessions.map((session, sessionIndex) => {
                        const sessionDuration = calculateDuration(
                          session.startTime,
                          session.endTime,
                        );
                        const isActive = !session.endTime;

                        const logs = sessionLogs[session.sessionId] || [];
                        const filteredLogs = filterAndMapLogsToSession(
                          logs,
                          session,
                        );
                        const filteredLogCount =
                          logs.length - filteredLogs.length;

                        return (
                          <div
                            key={session.sessionId}
                            className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold backdrop-blur-sm"
                                  style={{
                                    backgroundColor:
                                      getSessionColor(sessionIndex),
                                  }}
                                >
                                  {sessionIndex + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-gray-800 dark:text-white">
                                      Session #{session.sessionId}
                                    </span>
                                    {isActive && (
                                      <span className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                                        LIVE - Updating
                                      </span>
                                    )}
                                    {filteredLogCount > 0 && (
                                      <span className="px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <FaInfoCircle className="text-xs" />
                                        {filteredLogCount} offline logs filtered
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span>
                                      {formatTimeOnly(session.startTime)} -{" "}
                                      {session.endTime
                                        ? formatTimeOnly(session.endTime)
                                        : "Active"}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {(session.totalDistance / 1000).toFixed(
                                        2,
                                      )}{" "}
                                      km
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {Math.floor(sessionDuration.hours)}h{" "}
                                      {sessionDuration.minutes}m
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    onFetchTravelData(
                                      session.userId.toString(),
                                      group.date,
                                    )
                                  }
                                  className="px-3 py-2 bg-lantern-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"
                                >
                                  <FaInfoCircle />
                                  Details
                                </button>
                                <button
                                  onClick={() => onOpenMap(session)}
                                  className="px-3 py-2 bg-lantern-blue-600 border border-blue-400/20 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  <FaEye />
                                  Single Map
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => onOpenMultiMap(group)}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-lantern-blue-600 rounded-xl text-white font-semibold"
                    >
                      <FaLayerGroup className="text-xl" />
                      View All Sessions on Map
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                        {displaySessions.length} session
                        {displaySessions.length > 1 ? "s" : ""}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite scroll loader for main pagination */}
        <div className="py-8">
          {isLoadingMore && (
            <div className="flex items-center justify-center">
              <FaSpinner className="animate-spin text-2xl text-blue-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">
                Loading more sessions...
              </span>
            </div>
          )}
          {!hasMore && currentPage > 1 && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>All sessions loaded</p>
              <p className="text-sm mt-1">
                Showing {groupedView.length} grouped sessions
              </p>
            </div>
          )}
          {/* Sentinel element watched by the IntersectionObserver in the
              parent to trigger loading the next page on scroll */}
          {hasMore && <div ref={observerTarget} className="h-1 w-full" />}
        </div>
      </>
    );
  }

  // Individual Sessions View
  if (filteredSessions.length === 0) {
    return (
      <div
        className={`${glassmorphismClasses.card} rounded-2xl p-12 text-center backdrop-blur-lg`}
      >
        <FaRoute className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
          No Travel Sessions Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {isDateFilterActive
            ? "Try adjusting your filters to see more results."
            : "No travel sessions recorded yet."}
        </p>
        {isDateFilterActive && (
          <button
            onClick={onClearDateFilter}
            className={`px-4 py-2 ${glassmorphismClasses.button.outline} rounded-xl`}
          >
            Clear Date Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filteredSessions.map((session) => {
          const sessionDuration = calculateDuration(
            session.startTime,
            session.endTime,
          );
          const isActive = !session.endTime;

          const logs = sessionLogs[session.sessionId] || [];
          const filteredLogs = filterAndMapLogsToSession(logs, session);
          const filteredLogCount = logs.length - filteredLogs.length;

          return (
            <div
              key={session.sessionId}
              className={`${glassmorphismClasses.card} ${glassmorphismClasses.cardHover} rounded-2xl p-4 backdrop-blur-lg`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lantern-blue-600 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
                    {session.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      {session.fullName}
                      <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-300">
                        ({session.employeeCode})
                      </span>
                      {session.department && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          • {session.department}
                        </span>
                      )}
                      {session.allocatedArea && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          [{session.allocatedArea}]
                        </span>
                      )}
                      {filteredLogCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                          <FaInfoCircle className="text-xs" />
                          {filteredLogCount} offline logs filtered
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <FaCalendarAlt className="text-xs" />
                        <span>{formatDateTime(session.startTime)}</span>
                      </div>
                      {session.endTime && (
                        <>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                            <FaClock className="text-xs" />
                            <span>{formatTimeOnly(session.endTime)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Distance
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {(session.totalDistance / 1000).toFixed(2)} km
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Duration
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {sessionDuration.hours}h {sessionDuration.minutes}m
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Status
                    </p>
                    <span
                      className={`px-3 py-1 backdrop-blur-sm rounded-full text-sm font-semibold ${
                        isActive
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400"
                          : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {isActive ? "Active" : "Completed"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      onFetchTravelData(
                        session.userId.toString(),
                        formatDateOnly(session.startTime),
                      )
                    }
                    className="px-3 py-2 bg-lantern-blue-600 rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    <FaInfoCircle />
                    Details
                  </button>
                  <button
                    onClick={() => onOpenMap(session)}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 border border-blue-400/20 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FaEye />
                    View Map
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite scroll loader for individual view */}
      <div className="py-8">
        {isLoadingMore && (
          <div className="flex items-center justify-center">
            <FaSpinner className="animate-spin text-2xl text-blue-500 mr-2" />
            <span className="text-gray-600 dark:text-gray-300">
              Loading more sessions...
            </span>
          </div>
        )}
        {!hasMore && currentPage > 1 && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>All {filteredSessions.length} sessions loaded</p>
          </div>
        )}
        {hasMore && <div ref={observerTarget} className="h-1 w-full" />}
      </div>
    </>
  );
}
