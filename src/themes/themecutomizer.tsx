// src/components/ThemeCustomizer.tsx
import React from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeCustomizer: React.FC = () => {
  const { updateSectionTheme } = useTheme();

  return (
   <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
   

       <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow">
    <span className="text-sm font-medium text-gray-700">Header Background</span>
    <input
     type="color"
          onChange={(e) =>
            updateSectionTheme("header", { background: e.target.value })
          }
      className="w-12 h-8 rounded-md cursor-pointer border shadow-sm"
    />
  </div>

       <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow">
    <span className="text-sm font-medium text-gray-700">Sidebar Background</span>
    <input
      type="color"
          onChange={(e) =>
            updateSectionTheme("sidebar", { background: e.target.value })
          }
      className="w-12 h-8 rounded-md cursor-pointer border shadow-sm"
    />
  </div>
{/* 
       <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow">
    <span className="text-sm font-medium text-gray-700">Footer Background</span>
    <input
     type="color"
          onChange={(e) =>
            updateSectionTheme("footer", { background: e.target.value })
          }
      className="w-12 h-8 rounded-md cursor-pointer border shadow-sm"
    />
  </div> */}

       <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow">
    <span className="text-sm font-medium text-gray-700">Content Background</span>
    <input
       type="color"
          onChange={(e) =>
            updateSectionTheme("content", { background: e.target.value })
          }
      className="w-12 h-8 rounded-md cursor-pointer border shadow-sm"
    />
  </div>
    </div>
  );
};

export default ThemeCustomizer;
