// src/components/ThemeCustomizer.tsx
import React from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeCustomizer: React.FC = () => {
  const { updateSectionTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label className="block font-medium">Header Background</label>
        <input
          type="color"
          onChange={(e) =>
            updateSectionTheme("header", { background: e.target.value })
          }
          className="w-16 h-10 cursor-pointer"
        />
      </div>

      <div>
        <label className="block font-medium">Sidebar Background</label>
        <input
          type="color"
          onChange={(e) =>
            updateSectionTheme("sidebar", { background: e.target.value })
          }
          className="w-16 h-10 cursor-pointer"
        />
      </div>

      <div>
        <label className="block font-medium">Footer Background</label>
        <input
          type="color"
          onChange={(e) =>
            updateSectionTheme("footer", { background: e.target.value })
          }
          className="w-16 h-10 cursor-pointer"
        />
      </div>

      <div>
        <label className="block font-medium">Content Background</label>
        <input
          type="color"
          onChange={(e) =>
            updateSectionTheme("content", { background: e.target.value })
          }
          className="w-16 h-10 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ThemeCustomizer;
