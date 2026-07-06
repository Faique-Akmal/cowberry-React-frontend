// src/components/admin/TravelSessionsMap.tsx
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import {
  FaUser,
  FaMapPin,
  FaPauseCircle,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

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

interface LocationLog {
  id: number;
  timestamp: string;
  latitude: string;
  longitude: string;
  battery: number;
  speed: number;
  pause: boolean;
}

interface PauseInterval {
  start: LocationLog;
  end: LocationLog;
  durationMinutes: number;
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
}

interface MultiSessionMapView {
  userId: number;
  username: string;
  fullName: string;
  employeeCode: string;
  date: string;
  sessions: TravelSession[];
  center: [number, number];
  zoom: number;
}

interface TravelSessionsMapProps {
  mapView: TravelSession | null;
  multiSessionMapView: MultiSessionMapView | null;
  sessionLogs: Record<number, LocationLog[]>;
  loadingLogs: Record<number, boolean>;
  showLogMarkers: boolean;
  showLogMarkersMulti: boolean;
  showPauseMarkers: boolean;
  lastUpdateTime: Date | null;
  onCloseMap: () => void;
  onCloseMultiMap: () => void;
  onToggleLogMarkers: () => void;
  onToggleLogMarkersMulti: () => void;
  onTogglePauseMarkers: () => void;
  getMapCenter: (session: TravelSession) => [number, number];
  getMapZoom: (session: TravelSession) => number;
  buildPolylinePath: (session: TravelSession) => [number, number][];
  buildSessionPolylinePath: (session: TravelSession) => [number, number][];
  isValidCoordinate: (lat: string | number, lng: string | number) => boolean;
  parseCoordinate: (coord: string | number) => number;
  formatDateTime: (dateStr: string) => string;
  detectPauses: (sessionId: number) => PauseInterval[];
  getSessionColor: (index: number) => string;
  filterAndMapLogsToSession: (
    logs: LocationLog[],
    session: TravelSession,
  ) => LocationLog[];
}

const customIcons = {
  startIcon: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  endIcon: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  activeIcon: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  pauseIcon: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [19, 31],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [21, 21],
  }),
};

export default function TravelSessionsMap({
  mapView,
  multiSessionMapView,
  sessionLogs,
  loadingLogs,
  showLogMarkers,
  showLogMarkersMulti,
  showPauseMarkers,
  lastUpdateTime,
  onCloseMap,
  onCloseMultiMap,
  onToggleLogMarkers,
  onToggleLogMarkersMulti,
  onTogglePauseMarkers,
  getMapCenter,
  getMapZoom,
  buildPolylinePath,
  buildSessionPolylinePath,
  isValidCoordinate,
  parseCoordinate,
  formatDateTime,
  detectPauses,
  getSessionColor,
  filterAndMapLogsToSession,
}: TravelSessionsMapProps) {
  const glassmorphismClasses = {
    modal:
      "backdrop-blur-xl bg-white/20 dark:bg-gray-900/30 border border-white/30 dark:border-gray-700/50 shadow-2xl",
  };

  // Single Session Map Modal
  if (mapView) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
        <div
          className={`${glassmorphismClasses.modal} w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <div className="bg-gradient-to-r from-blue-500/90 to-indigo-600/90 backdrop-blur-sm p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FaUser className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{mapView.fullName}</h2>
                  <p className="text-blue-100">
                    Employee Code: {mapView.employeeCode} • Session ID: #
                    {mapView.sessionId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleLogMarkers}
                  className={`px-4 py-2 backdrop-blur-sm rounded-lg flex items-center gap-2 ${showLogMarkers ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
                >
                  <FaMapPin />
                  {showLogMarkers ? "Hide Log Points" : "Show Log Points"}
                </button>
                <button
                  onClick={onTogglePauseMarkers}
                  className={`px-4 py-2 backdrop-blur-sm rounded-lg flex items-center gap-2 ${showPauseMarkers ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
                >
                  <FaPauseCircle />
                  {showPauseMarkers ? "Hide Pause Points" : "Show Pause Points"}
                </button>
                <button
                  onClick={onCloseMap}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            {loadingLogs[mapView.sessionId] && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-white text-center">
                  <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                  <p>Loading session logs...</p>
                </div>
              </div>
            )}
            <MapContainer
              center={getMapCenter(mapView)}
              zoom={getMapZoom(mapView)}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
              key={`map-${mapView.sessionId}-${lastUpdateTime?.getTime()}`}
            >
              <TileLayer
                attribution="Google Maps"
                url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
              />

              {/* Polyline for the travel path */}
              {(() => {
                const path = buildPolylinePath(mapView);
                if (path.length >= 2) {
                  const isActive = !mapView.endTime;
                  return (
                    <Polyline
                      positions={path}
                      pathOptions={{
                        color: isActive ? "#10B981" : "#3B82F6",
                        weight: 6,
                        opacity: 0.8,
                        lineCap: "round",
                        lineJoin: "round",
                        dashArray: isActive ? "10, 5" : undefined,
                      }}
                    />
                  );
                }
                return null;
              })()}

              {/* Start marker */}
              {isValidCoordinate(
                mapView.startLatitude,
                mapView.startLongitude,
              ) && (
                <Marker
                  position={[
                    parseCoordinate(mapView.startLatitude),
                    parseCoordinate(mapView.startLongitude),
                  ]}
                  icon={customIcons.startIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>🟢 Start Point</strong>
                      <br />
                      <strong>User:</strong> {mapView.fullName}
                      <br />
                      <strong>Time:</strong> {formatDateTime(mapView.startTime)}
                      <br />
                      <strong>Coordinates:</strong>{" "}
                      {parseCoordinate(mapView.startLatitude).toFixed(6)},{" "}
                      {parseCoordinate(mapView.startLongitude).toFixed(6)}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* End marker */}
              {isValidCoordinate(mapView.endLatitude, mapView.endLongitude) && (
                <Marker
                  position={[
                    parseCoordinate(mapView.endLatitude),
                    parseCoordinate(mapView.endLongitude),
                  ]}
                  icon={
                    !mapView.endTime
                      ? customIcons.activeIcon
                      : customIcons.endIcon
                  }
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>
                        {!mapView.endTime ? "🟡 Active Point" : "🔴 End Point"}
                      </strong>
                      <br />
                      <strong>User:</strong> {mapView.fullName}
                      <br />
                      <strong>Time:</strong>{" "}
                      {!mapView.endTime
                        ? "Active"
                        : formatDateTime(mapView.endTime)}
                      <br />
                      <strong>Coordinates:</strong>{" "}
                      {parseCoordinate(mapView.endLatitude).toFixed(6)},{" "}
                      {parseCoordinate(mapView.endLongitude).toFixed(6)}
                      <br />
                      <strong>Total Distance:</strong>{" "}
                      {(mapView.totalDistance / 1000).toFixed(2)} km
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Pause markers */}
              {showPauseMarkers &&
                (() => {
                  const pauses = detectPauses(mapView.sessionId);
                  return pauses.map((pause, pauseIndex) => {
                    const pauseLog = pause.start;
                    if (
                      isValidCoordinate(pauseLog.latitude, pauseLog.longitude)
                    ) {
                      return (
                        <Marker
                          key={`pause-${pauseIndex}`}
                          position={[
                            parseCoordinate(pauseLog.latitude),
                            parseCoordinate(pauseLog.longitude),
                          ]}
                          icon={customIcons.pauseIcon}
                        >
                          <Popup>
                            <div className="text-sm min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <div>
                                  <strong className="text-lg text-lantern-blue-700 dark:text-lantern-blue-400">
                                    ⏸️ Pause Point
                                  </strong>
                                </div>
                              </div>

                              <div className="">
                                <div className="grid grid-cols-2 gap-1">
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Pause Start
                                    </p>
                                    <p className="font-medium">
                                      {formatDateTime(pause.start.timestamp)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Pause End
                                    </p>
                                    <p className="font-medium">
                                      {formatDateTime(pause.end.timestamp)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center">
                                  <div>
                                    <p className="text-lg font-bold px-3 rounded-full bg-red-300 text-black dark:text-gray-400">
                                      Pause Duration -{" "}
                                      <span className="text-sm">
                                        {" "}
                                        {Math.round(pause.durationMinutes)}{" "}
                                        minutes
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>
                                      <strong>Coordinates:</strong>{" "}
                                      {parseCoordinate(
                                        pauseLog.latitude,
                                      ).toFixed(6)}
                                      ,{" "}
                                      {parseCoordinate(
                                        pauseLog.longitude,
                                      ).toFixed(6)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>
                                      <strong>Battery:</strong>{" "}
                                      {pauseLog.battery
                                        ? `${pauseLog.battery}%`
                                        : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  });
                })()}

              {/* Log points markers */}
              {showLogMarkers &&
                (() => {
                  const logs = sessionLogs[mapView.sessionId] || [];
                  const filteredLogs = filterAndMapLogsToSession(logs, mapView);
                  return filteredLogs.map((log, logIndex) => {
                    if (isValidCoordinate(log.latitude, log.longitude)) {
                      const isPausePoint = log.pause === true;

                      return (
                        <Marker
                          key={`log-${log.id || logIndex}`}
                          position={[
                            parseCoordinate(log.latitude),
                            parseCoordinate(log.longitude),
                          ]}
                          icon={L.divIcon({
                            className: "custom-marker",
                            html: `
                              <div style="
                                width: 12px;
                                height: 12px;
                                background-color: ${isPausePoint ? "#FFA500" : "#6366F1"};
                                border: 2px solid white;
                                border-radius: 50%;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                cursor: pointer;
                              "></div>
                            `,
                            iconSize: [12, 12],
                            iconAnchor: [6, 6],
                          })}
                        >
                          <Popup>
                            <div className="text-sm min-w-[200px]">
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: isPausePoint
                                      ? "#FFA500"
                                      : "#6366F1",
                                  }}
                                ></div>
                                <strong>
                                  {isPausePoint
                                    ? "⏸️ Pause Point"
                                    : "📍 Log Point"}
                                </strong>
                              </div>
                              <div className="space-y-1">
                                <div>
                                  <strong>Time:</strong>{" "}
                                  {formatDateTime(log.timestamp)}
                                </div>
                                <div>
                                  <strong>Coordinates:</strong>{" "}
                                  {parseCoordinate(log.latitude).toFixed(6)},{" "}
                                  {parseCoordinate(log.longitude).toFixed(6)}
                                </div>
                                <div>
                                  <strong>Speed:</strong>{" "}
                                  {log.speed ? `${log.speed} km/h` : "N/A"}
                                </div>
                                <div>
                                  <strong>Battery:</strong>{" "}
                                  {log.battery ? `${log.battery}%` : "N/A"}
                                </div>
                                <div>
                                  <strong>Point #:</strong> {logIndex + 1} of{" "}
                                  {filteredLogs.length}
                                </div>
                                {log.pause && (
                                  <div className="text-amber-600 font-medium">
                                    ⏸️ Pause detected
                                  </div>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  });
                })()}
            </MapContainer>
          </div>
        </div>
      </div>
    );
  }

  // Multi-Session Map Modal
  if (multiSessionMapView) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
        <div
          className={`${glassmorphismClasses.modal} w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col`}
        >
          {/* Map Header */}
          <div className="bg-gradient-to-r from-blue-500/90 to-indigo-600/90 backdrop-blur-sm p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FaUser className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {multiSessionMapView.fullName}
                  </h2>
                  <p className="text-blue-100">
                    {multiSessionMapView.employeeCode} •
                    {new Date(multiSessionMapView.date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}{" "}
                    •{multiSessionMapView.sessions.length} Session
                    {multiSessionMapView.sessions.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleLogMarkersMulti}
                  className={`px-4 py-2 backdrop-blur-sm rounded-lg flex items-center gap-2 ${showLogMarkersMulti ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
                >
                  <FaMapPin />
                  {showLogMarkersMulti ? "Hide Log Points" : "Show Log Points"}
                </button>
                <button
                  onClick={onTogglePauseMarkers}
                  className={`px-4 py-2 backdrop-blur-sm rounded-lg flex items-center gap-2 ${showPauseMarkers ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
                >
                  <FaPauseCircle />
                  {showPauseMarkers ? "Hide Pause Points" : "Show Pause Points"}
                </button>
                <button
                  onClick={onCloseMultiMap}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            {multiSessionMapView.sessions.some(
              (session) => loadingLogs[session.sessionId],
            ) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-white text-center">
                  <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                  <p>Loading session logs...</p>
                </div>
              </div>
            )}
            <MapContainer
              center={multiSessionMapView.center}
              zoom={multiSessionMapView.zoom}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
              key={`multi-map-${multiSessionMapView.userId}-${multiSessionMapView.date}`}
            >
              <TileLayer
                attribution="Google Maps"
                url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
              />

              {/* Render all session polylines with different colors */}
              {multiSessionMapView.sessions.map((session, index) => {
                const path = buildSessionPolylinePath(session);
                if (path.length >= 2) {
                  const isActive = !session.endTime;
                  return (
                    <Polyline
                      key={`session-${session.sessionId}`}
                      positions={path}
                      pathOptions={{
                        color: getSessionColor(index),
                        weight: 5,
                        opacity: 0.8,
                        lineCap: "round",
                        lineJoin: "round",
                        dashArray: isActive ? "10, 5" : undefined,
                      }}
                    />
                  );
                }
                return null;
              })}

              {/* Start markers for each session */}
              {multiSessionMapView.sessions.map((session, index) => {
                if (
                  isValidCoordinate(
                    session.startLatitude,
                    session.startLongitude,
                  )
                ) {
                  return (
                    <Marker
                      key={`start-${session.sessionId}`}
                      position={[
                        parseCoordinate(session.startLatitude),
                        parseCoordinate(session.startLongitude),
                      ]}
                      icon={customIcons.startIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>
                            🟢 Start (Session #{session.sessionId})
                          </strong>
                          <br />
                          <strong>Time:</strong>{" "}
                          {formatDateTime(session.startTime)}
                          <br />
                          <strong>Coordinates:</strong>{" "}
                          {parseCoordinate(session.startLatitude).toFixed(6)},{" "}
                          {parseCoordinate(session.startLongitude).toFixed(6)}
                          <br />
                          <div
                            className="inline-block w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: getSessionColor(index) }}
                          ></div>
                          <span>Session Color</span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

              {/* End markers for each session */}
              {multiSessionMapView.sessions.map((session, index) => {
                if (
                  isValidCoordinate(session.endLatitude, session.endLongitude)
                ) {
                  const isActive = !session.endTime;
                  return (
                    <Marker
                      key={`end-${session.sessionId}`}
                      position={[
                        parseCoordinate(session.endLatitude),
                        parseCoordinate(session.endLongitude),
                      ]}
                      icon={
                        isActive ? customIcons.activeIcon : customIcons.endIcon
                      }
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>
                            {isActive ? "🟡 Active" : "🔴 End"} (Session #
                            {session.sessionId})
                          </strong>
                          <br />
                          <strong>Time:</strong>{" "}
                          {isActive
                            ? "Active"
                            : formatDateTime(session.endTime)}
                          <br />
                          <strong>Coordinates:</strong>{" "}
                          {parseCoordinate(session.endLatitude).toFixed(6)},{" "}
                          {parseCoordinate(session.endLongitude).toFixed(6)}
                          <br />
                          <strong>Distance:</strong>{" "}
                          {(session.totalDistance / 1000).toFixed(2)} km
                          <br />
                          <div
                            className="inline-block w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: getSessionColor(index) }}
                          ></div>
                          <span>Session Color</span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

              {/* Pause markers for each session */}
              {showPauseMarkers &&
                multiSessionMapView.sessions.map((session, sessionIndex) => {
                  const pauses = detectPauses(session.sessionId);
                  return pauses.map((pause, pauseIndex) => {
                    const pauseLog = pause.start;
                    if (
                      isValidCoordinate(pauseLog.latitude, pauseLog.longitude)
                    ) {
                      return (
                        <Marker
                          key={`pause-${session.sessionId}-${pauseIndex}`}
                          position={[
                            parseCoordinate(pauseLog.latitude),
                            parseCoordinate(pauseLog.longitude),
                          ]}
                          icon={customIcons.pauseIcon}
                        >
                          <Popup>
                            <div className="text-sm min-w-[200px]">
                              <div className="flex items-center gap-2 mb-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                  style={{
                                    backgroundColor:
                                      getSessionColor(sessionIndex),
                                  }}
                                >
                                  <span className="font-bold text-sm">
                                    {sessionIndex + 1}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-lg text-lantern-blue-600">
                                    ⏸️ Pause Point
                                  </strong>
                                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span>Session #{session.sessionId}</span>
                                    <span>•</span>
                                    <span>Pause #{pauseIndex + 1}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Pause Start
                                    </p>
                                    <p className="font-medium">
                                      {formatDateTime(pause.start.timestamp)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Pause End
                                    </p>
                                    <p className="font-medium">
                                      {formatDateTime(pause.end.timestamp)}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-lg font-bold px-3 rounded-full bg-red-300 text-black dark:text-gray-400">
                                    Pause Duration -{" "}
                                    <span className="text-sm">
                                      {" "}
                                      {Math.round(pause.durationMinutes)}{" "}
                                      minutes
                                    </span>
                                  </p>
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>
                                      <strong>Coordinates:</strong>{" "}
                                      {parseCoordinate(
                                        pauseLog.latitude,
                                      ).toFixed(6)}
                                      ,{" "}
                                      {parseCoordinate(
                                        pauseLog.longitude,
                                      ).toFixed(6)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2"
                                      style={{
                                        backgroundColor:
                                          getSessionColor(sessionIndex),
                                      }}
                                    ></div>
                                    <span>Session Color</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  });
                })}

              {/* Log points markers for each session */}
              {showLogMarkersMulti &&
                multiSessionMapView.sessions.map((session, sessionIndex) => {
                  const logs = sessionLogs[session.sessionId] || [];
                  const filteredLogs = filterAndMapLogsToSession(logs, session);
                  return filteredLogs.slice(0, 50).map((log, logIndex) => {
                    if (isValidCoordinate(log.latitude, log.longitude)) {
                      return (
                        <Marker
                          key={`log-${session.sessionId}-${log.id || logIndex}`}
                          position={[
                            parseCoordinate(log.latitude),
                            parseCoordinate(log.longitude),
                          ]}
                          icon={L.divIcon({
                            className: "custom-marker",
                            html: `
                              <div style="
                                width: 8px;
                                height: 8px;
                                background-color: ${getSessionColor(sessionIndex)};
                                border: 1px solid white;
                                border-radius: 50%;
                                opacity: 0.7;
                                cursor: pointer;
                              "></div>
                            `,
                            iconSize: [8, 8],
                            iconAnchor: [4, 4],
                          })}
                        >
                          <Popup>
                            <div className="text-sm min-w-[200px]">
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      getSessionColor(sessionIndex),
                                  }}
                                ></div>
                                <strong>
                                  Session #{session.sessionId} - Point #
                                  {logIndex + 1}
                                </strong>
                              </div>
                              <div className="space-y-1">
                                <div>
                                  <strong>Time:</strong>{" "}
                                  {formatDateTime(log.timestamp)}
                                </div>
                                <div>
                                  <strong>Coordinates:</strong>{" "}
                                  {parseCoordinate(log.latitude).toFixed(6)},{" "}
                                  {parseCoordinate(log.longitude).toFixed(6)}
                                </div>
                                <div>
                                  <strong>Speed:</strong>{" "}
                                  {log.speed ? `${log.speed} km/h` : "N/A"}
                                </div>
                                <div>
                                  <strong>Status:</strong>{" "}
                                  {log.pause ? "⏸️ Pause" : "Moving"}
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  });
                })}
            </MapContainer>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
