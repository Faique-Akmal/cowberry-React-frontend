import { useEffect, useState } from "react";

interface GreetingCardProps {
  greeting: string;
}

export default function GreetingCard({ greeting }: GreetingCardProps) {
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    // localStorage only exists client-side — guard against SSR crash
    setFullName(localStorage.getItem("full_name"));
  }, []);

  return (
    <div
      className="group relative text-center mb-8 p-6 rounded-lg shadow-md
                 backdrop-blur-lg bg-white/10 dark:bg-gray-900/20
                 border dark:border-gray-700/30 border-dashed
                 transition-shadow duration-300 hover:shadow-lg"
    >
      {/* Bitmoji-style avatar, top-right corner */}
      <div className="absolute -top-4 -right-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-300 text-3xl shadow-md">
        <span role="img" aria-label="avatar">
          😊
        </span>
        <span
          role="img"
          aria-label="waving hand"
          className="wave-hand absolute -right-2 -top-1 origin-bottom-right text-2xl"
        >
          👋
        </span>
      </div>

      <h1 className="text-3xl font-bold text-black dark:text-white uppercase">
        {greeting}, {fullName ?? "there"}!
      </h1>
      <p className="text-gray-900 dark:text-gray-300 mt-1">
        Welcome to your Dashboard
      </p>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(12deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(6deg); }
        }
        .group:hover .wave-hand {
          animation: wave 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
