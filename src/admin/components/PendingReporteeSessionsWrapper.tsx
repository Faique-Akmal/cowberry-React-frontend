// PendingReporteeSessionsWrapper.tsx
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReporteeTravelSessionManager from "../../Reportee-hr/reporteeSessionsList";

interface NavState {
  sessionId?: string | number;
  userId?: string | number;
  from?: string;
}

const PendingReporteeSessionsWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as NavState | null;

  // Snapshot the incoming nav data + location.key on first render for this
  // history entry. location.key is unique per navigation entry (even if the
  // user clicks the SAME pending session again), so passing it through as
  // "navKey" lets the manager tell "same session, new click" apart from
  // "same session, component just re-rendered" and re-open the modal
  // correctly every time.
  const capturedRef = useRef<{
    sessionId?: string | number;
    userId?: string | number;
    navKey: string;
  } | null>(null);

  if (
    capturedRef.current === null ||
    capturedRef.current.navKey !== location.key
  ) {
    capturedRef.current = {
      sessionId: state?.sessionId,
      userId: state?.userId,
      navKey: location.key,
    };
  }

  // Clear the navigation state once it's been captured so refreshing the
  // page or navigating back/forward doesn't replay the same "open session"
  // instruction indefinitely.
  useEffect(() => {
    if (state?.sessionId !== undefined) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReporteeTravelSessionManager
      initialSessionId={capturedRef.current.sessionId}
      userId={capturedRef.current.userId}
      navKey={capturedRef.current.navKey}
    />
  );
};

export default PendingReporteeSessionsWrapper;
