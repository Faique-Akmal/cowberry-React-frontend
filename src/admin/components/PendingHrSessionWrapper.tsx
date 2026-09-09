// PendingHrSessionWrapper.tsx
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TravelSessionHr from "../../Reportee-hr/hrSessionsList";

interface NavState {
  sessionId?: string | number;
  userId?: string | number;
  from?: string;
}

const PendingHrSessionWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as NavState | null;

  // Snapshot the incoming nav data on first render for this history entry
  const capturedRef = useRef<{
    sessionId?: string | number;
    userId?: string | number;
    navKey: string;
  } | null>(null);

  // Only capture if we have a sessionId from state
  if (state?.sessionId !== undefined && capturedRef.current === null) {
    capturedRef.current = {
      sessionId: state.sessionId,
      userId: state.userId,
      navKey: location.key,
    };
  }

  // Clear the navigation state after a delay to prevent re-opening on refresh
  // but keep it long enough for the component to mount and process
  useEffect(() => {
    // Use setTimeout to ensure the child component has time to process the initialSessionId
    const timer = setTimeout(() => {
      if (state?.sessionId !== undefined) {
        navigate(location.pathname, { replace: true, state: null });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TravelSessionHr
      initialSessionId={capturedRef.current?.sessionId}
      userId={capturedRef.current?.userId}
      navKey={capturedRef.current?.navKey}
    />
  );
};

export default PendingHrSessionWrapper;
