import React, { useState, useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Array of your images
  const images = [
    "lantern_banner.png",
    "lanternloginbanner4.png",
    "lanternloginbanner3.png",
    "lanternbanner.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1,
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-white z-1 dark:bg-gray-900">
      <div className="relative flex flex-col lg:flex-row w-full min-h-screen dark:bg-gray-900">
        {/* Login side - full width on mobile/tablet, half on large screens */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
          {children}
        </div>

        {/* Banner side - hidden on mobile, visible on larger screens */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white/90 relative overflow-hidden">
          <div className="relative w-full h-screen">
            {/* Carousel Images */}
            {images.map((image, index) => (
              <img
                key={index}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                  index === currentIndex ? "opacity-100" : "opacity-0"
                }`}
                src={image}
                alt={`Welcome Banner ${index + 1}`}
              />
            ))}

            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />

            {/* Dots indicator */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-white w-8"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Optional: Slide counter */}
            <div className="absolute top-8 right-8 z-10 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
