// src/components/admin/TravelSessionsDetails.tsx
import {
  FaTimes,
  FaCar,
  FaRoute,
  FaClock,
  FaRoad,
  FaUser,
  FaMapPin,
  FaInfoCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import ImageZoom from "../../components/ImageZoom";

interface FarmerData {
  id: number;
  farmerName: string;
  farmerDescription: string;
  farmerImage?: string;
  createdAt: string;
}

interface FarmerTravelData {
  sessionId: number;
  userId: number;
  startTime: string;
  endTime: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  startDescription: string;
  endDescription: string;
  status: string;
  isActive: boolean;
  totalDistance: number;
  date: string;
  durationMinutes: number;
  startOdometerImage: string;
  endOdometerImage: string;
  locationLogs?: {
    count: number;
    data: any[];
  };
  farmerData?: {
    count: number;
    data: FarmerData[];
  };
}

interface TravelSessionsDetailsProps {
  showFarmerDataModal: boolean;
  isLoadingFarmerData: boolean;
  farmerDataError: string | null;
  farmerTravelData: FarmerTravelData[];
  selectedUserForFarmerData: string;
  selectedSessionDate: string;
  users: { userId: number; username: string; fullName: string }[];
  onClose: () => void;
  formatDateOnly: (dateStr: string) => string;
  formatTimeOnly: (dateStr: string) => string;
  formatDateTime: (dateStr: string) => string;
  calculateDuration: (
    startTime: string,
    endTime: string,
  ) => { hours: number; minutes: number };
}

export default function TravelSessionsDetails({
  showFarmerDataModal,
  isLoadingFarmerData,
  farmerDataError,
  farmerTravelData,
  selectedUserForFarmerData,
  selectedSessionDate,
  users,
  onClose,
  formatDateOnly,
  formatTimeOnly,
  formatDateTime,
  calculateDuration,
}: TravelSessionsDetailsProps) {
  const glassmorphismClasses = {
    card: "backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/50 shadow-xl",
    modal:
      "backdrop-blur-xl bg-white/20 dark:bg-gray-900/30 border border-white/30 dark:border-gray-700/50 shadow-2xl",
  };

  const renderOdometerImage = (imageData: string) => {
    if (!imageData || imageData.trim() === "") {
      return (
        <div className="bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10 dark:border-gray-700/50">
          <FaCar className="text-gray-400 dark:text-gray-600 text-3xl mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No odometer image
          </p>
        </div>
      );
    }

    if (
      imageData.startsWith("data:image") ||
      imageData.startsWith("/9j/") ||
      imageData.length > 1000
    ) {
      return (
        <ImageZoom
          src={
            imageData.startsWith("data:image")
              ? imageData
              : `data:image/jpeg;base64,${imageData}`
          }
          alt="Odometer Image"
          className="rounded-xl"
        />
      );
    }

    return (
      <ImageZoom src={imageData} alt="Odometer Image" className="rounded-xl" />
    );
  };

  if (!showFarmerDataModal) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div
        className={`${glassmorphismClasses.modal} w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Modal Header */}
        <div className="bg-lantern-blue-600 backdrop-blur-sm p-2 text-white flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex-shrink-0">
                <FaCar className="text-lg" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate">
                  Travel Session Details
                </h2>
                <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                  <span className="truncate backdrop-blur-sm bg-white/10 px-2 py-1 rounded">
                    User ID: {selectedUserForFarmerData}
                  </span>
                  {users.find(
                    (u) => u.userId.toString() === selectedUserForFarmerData,
                  )?.username && (
                    <>
                      <span className="text-white/50">•</span>
                      <span className="truncate">
                        User:{" "}
                        {
                          users.find(
                            (u) =>
                              u.userId.toString() === selectedUserForFarmerData,
                          )?.username
                        }
                      </span>
                    </>
                  )}
                  {selectedSessionDate && (
                    <>
                      <span className="text-white/50">•</span>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                        <FaCalendarAlt className="text-xs" />
                        <span className="truncate">
                          {new Date(selectedSessionDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <div className="text-center backdrop-blur-sm bg-white/10 px-3 py-2 rounded-lg">
                <p className="text-xs opacity-80">Sessions</p>
                <p className="font-bold">{farmerTravelData.length}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-all flex-shrink-0"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingFarmerData ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">
                  Loading travel session data...
                </p>
              </div>
            </div>
          ) : farmerDataError ? (
            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl p-8 text-center">
              <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                Error Loading Data
              </h3>
              <p className="text-red-600 dark:text-red-300">
                {farmerDataError}
              </p>
            </div>
          ) : farmerTravelData.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-sm rounded-xl p-12 text-center border border-white/10 dark:border-gray-700/50">
              <FaCar className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Travel Data Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No travel sessions recorded for this user.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-white dark:text-gray-300">
                      Total Sessions
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {farmerTravelData.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white dark:text-gray-300">
                      Active Sessions
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {farmerTravelData.filter((s) => s.isActive).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white dark:text-gray-300">
                      Total Distance
                    </p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {(
                        farmerTravelData.reduce(
                          (sum, s) => sum + (s.totalDistance || 0),
                          0,
                        ) / 1000
                      ).toFixed(1)}{" "}
                      km
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white dark:text-gray-300">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold text-orange-500">
                      {farmerTravelData.reduce(
                        (sum, s) => sum + (s.farmerData?.count || 0),
                        0,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              {farmerTravelData.map((session, index) => {
                const duration = calculateDuration(
                  session.startTime,
                  session.endTime,
                );
                const farmerCount = session.farmerData?.count || 0;

                return (
                  <div
                    key={session.sessionId}
                    className={`${glassmorphismClasses.card} rounded-2xl overflow-hidden backdrop-blur-lg mb-6`}
                  >
                    <div className="bg-gradient-to-r from-gray-500/10 via-gray-600/10 to-gray-700/10 px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="backdrop-blur-sm p-2 rounded-xl">
                            <FaRoute className="text-lantern-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                              Session #{session.sessionId}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span
                                className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${session.isActive ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400" : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400"}`}
                              >
                                {session.status}
                              </span>
                              <span className="px-2 py-1 backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                {formatDateOnly(session.startTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 md:mt-0">
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {formatTimeOnly(session.startTime)} -{" "}
                              {session.endTime
                                ? formatTimeOnly(session.endTime)
                                : "Active"}
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              Duration: {duration.hours}h {duration.minutes}m
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Session Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaClock />
                            <span className="text-sm font-medium">
                              Duration
                            </span>
                          </div>
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            {duration.hours}h {duration.minutes}m
                          </p>
                        </div>

                        <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaRoad />
                            <span className="text-sm font-medium">
                              Distance
                            </span>
                          </div>
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            {(session.totalDistance / 1000).toFixed(2)} km
                          </p>
                        </div>

                        <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaUser className="text-lantern-blue-600" />
                            <span className="text-sm font-medium">Events</span>
                          </div>
                          <p className="text-lg font-bold text-lantern-blue-600">
                            {farmerCount}
                          </p>
                        </div>

                        <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaMapPin />
                            <span className="text-sm font-medium">
                              Location Logs
                            </span>
                          </div>
                          <p className="text-lg font-bold text-blue-500">
                            {session.locationLogs?.count || 0}
                          </p>
                        </div>
                      </div>

                      {/* Odometer Images Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            Start Odometer
                          </h4>
                          {renderOdometerImage(session.startOdometerImage)}
                          <div className="mt-2 border border-white/10 dark:border-gray-700/50 rounded-lg p-2">
                            <p>{session.startDescription}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            End Odometer
                          </h4>
                          {renderOdometerImage(session.endOdometerImage)}
                          <div className="mt-2 border border-white/10 dark:border-gray-700/50 rounded-lg p-2">
                            <p>{session.endDescription}</p>
                          </div>
                        </div>
                      </div>

                      {/* Farmer Data Section */}
                      {farmerCount > 0 && session.farmerData?.data && (
                        <div className="mb-6">
                          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <div className="p-2 backdrop-blur-sm rounded-lg">
                              <FaUser className="text-lantern-blue-600" />
                            </div>
                            Events in this session ({farmerCount})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {session.farmerData.data.map(
                              (farmer, farmerIndex) => (
                                <div
                                  key={farmer.id || farmerIndex}
                                  className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h5 className="font-bold text-gray-800 dark:text-white">
                                        {farmer.farmerName ||
                                          `Farmer #${farmerIndex + 1}`}
                                      </h5>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Recorded:{" "}
                                        {formatDateTime(farmer.createdAt)}
                                      </p>
                                    </div>
                                    <span className="px-2 py-1 backdrop-blur-sm border border-purple-400/30 text-lantern-blue-600 dark:text-purple-400 text-xs font-semibold rounded-full">
                                      ID: {farmer.id}
                                    </span>
                                  </div>

                                  {farmer.farmerDescription && (
                                    <div className="mb-3">
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {farmer.farmerDescription}
                                      </p>
                                    </div>
                                  )}

                                  {farmer.farmerImage &&
                                    farmer.farmerImage.trim() !== "" && (
                                      <div className="mt-3">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                          Farmer Image:
                                        </p>
                                        <div className="rounded-xl overflow-hidden max-w-xs">
                                          {renderOdometerImage(
                                            farmer.farmerImage,
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
