


export default function Customers() {
 
  return (
      <div className="bg-white rounded-xl shadow-sm p-5 w-full max-w-xs">
      <h4 className="text-base font-semibold text-gray-800 mb-4">Customers</h4>

      {/* Circle with 4 dots */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="w-full h-full rounded-full border-[10px] border-blue-100"></div>

        {/* 4 blue dots */}
        <span className="absolute w-4 h-4 bg-blue-500 rounded-full top-0 left-1/2 -translate-x-1/2" />
        <span className="absolute w-4 h-4 bg-blue-500 rounded-full bottom-0 left-1/2 -translate-x-1/2" />
        <span className="absolute w-4 h-4 bg-blue-500 rounded-full left-0 top-1/2 -translate-y-1/2" />
        <span className="absolute w-4 h-4 bg-blue-500 rounded-full right-0 top-1/2 -translate-y-1/2" />
      </div>

      {/* Customer Stats */}
      <div className="flex justify-around text-center">
        <div>
          <p className="text-xl font-bold text-gray-900">34,249</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>New Customers</span>
          </div>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">1420</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-200 rounded-full"></span>
            <span>Repeated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
