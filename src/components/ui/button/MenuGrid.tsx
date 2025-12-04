import React from "react";
import { FiImage } from "react-icons/fi";


const icons = [
  { src: "./images/favicon.ico", alt: "Calendar", i: 0, x: -1, y: 0 },
  { src: "./images/favicon.ico", alt: "Camera", i: 1, x: 1, y: 0 },
  { src: "./images/favicon.ico", alt: "Chat", i: 2, x: 0, y: -1 },
  { src: "./images/favicon.ico", alt: "Folder", i: 3, x: 0, y: 1 },
  { src: "./images/favicon.ico", alt: "Locations", i: 4, x: 1, y: 1 },
  { src: "./images/favicon.ico", alt: "Magnifier", i: 5, x: -1, y: -1 },
  { src: "./images/favicon.ico", alt: "Messages", i: 6, x: 0, y: 0 },
  { src: "./images/favicon.ico", alt: "Notifications", i: 7, x: -1, y: 1 },
  { src: "./images/favicon.ico", alt: "Settings", i: 8, x: 1, y: -1 },
];

interface MenuGridProps {
  active: boolean;
}

const MenuGrid: React.FC<MenuGridProps> = ({ active }) => {
  // const [active, setActive] = useState(false);

  return (
    <div
      className={`absolute bottom-16 right-4 cursor-pointer flex justify-center items-center rounded-lg bg-brand-500 transition-all duration-500 ${active
        ? "w-[200px] h-[200px] opacity-100 delay-0"
        : "w-[50px] h-[50px] opacity-0 delay-[800ms]"
        }`}
    >
      {/* <p
        className={`absolute -top-11 text-green-800 text-2xl font-sans transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"
          }`}
      >
        Attachments
      </p> */}

      {icons.map((icon) => (
        <span
          key={icon.i}
          title={`i:${icon.i} x:${icon.x} y:${icon.y}`}
          style={
            {
              "--i": icon.i,
              "--x": icon.x,
              "--y": icon.y,
            } as React.CSSProperties
          }
          className={`absolute rounded-full flex items-center text-green-800 justify-center bg-green-200 transition-all duration-500 ease-in-out 
            [transition-delay:calc(0.1s*var(--i))]
            ${active
              ? "w-[45px] h-[45px] bg-[#333849] translate-x-[calc(60px*var(--x))] translate-y-[calc(60px*var(--y))]"
              : "w-[7px] h-[7px] translate-x-[calc(12px*var(--x))] translate-y-[calc(12px*var(--y))]"
            }`}
        >
          <FiImage className={active ? "opacity-100 delay-[300ms]" : "opacity-0 delay-[800ms]"
          } />
          {/* <img
            src={icon.src}
            alt={icon.alt}
            className={`object-cover rounded-full transition-all duration-500 ${active ? "w-11" : "w-0"
              }`}
          /> */}
        </span>
      ))}
    </div>
  );
};

export default MenuGrid;
