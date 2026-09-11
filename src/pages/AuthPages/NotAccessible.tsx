// pages/NotAccessible.tsx
import { useNavigate } from "react-router-dom";

export default function NotAccessible() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">403 — Not Accessible</h1>
      <p className="text-gray-600">
        You don't have permission to view this page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Home
        </button>
      </div>
    </div>
  );
}
