// import LiveLocationMap from "./LiveLocationMap";
import LiveTracker from "./LiveTracker";


function MapComponent() {
  return (
    <div className="bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:px-6 sm:py-6">
      <div className="flex flex-col  gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          {/* <LiveLocationMap /> */}
          <LiveTracker />
        </div>
      </div>
    </div>
  )
}

export default MapComponent;