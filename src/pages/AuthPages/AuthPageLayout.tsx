import React, { useState, useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Array of your 3 images
  const images = [
    "lantern_banner.png",
    "lanternloginbanner4.png",
    "lanternloginbanner3.png",
    "lanternbanner.png",
  ];

  useEffect(() => {
    // Change image every 3 seconds (3000ms)
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1,
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-white z-1 dark:bg-gray-900">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full lg:w-1/2 bg-white/90 lg:flex lg:justify-center lg:items-center">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Carousel Images */}
            {images.map((image, index) => (
              <img
                key={index}
                className={`absolute w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                  index === currentIndex ? "opacity-100" : "opacity-0"
                }`}
                src={image}
                alt={`Welcome Banner ${index + 1}`}
              />
            ))}

            {/* Dots indicator */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
