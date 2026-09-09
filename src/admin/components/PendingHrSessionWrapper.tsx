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

  // IMPORTANT: only recapture when this render actually carries a NEW
  // incoming sessionId (state?.sessionId !== undefined). The cleanup effect
  // below calls navigate(..., { state: null }) right after mount to stop a
  // refresh/back-nav from replaying the "open session" instruction - but
  // even with replace:true, React Router still assigns a brand-new
  // location.key to that entry. If we recaptured on ANY navKey change
  // (as before), that self-triggered navigation would immediately come
  // back around, see a new key, and overwrite capturedRef.current with the
  // now-cleared (sessionId: undefined) state - wiping out the very session
  // we just captured before the child ever got a chance to open it. Gating
  // on state?.sessionId !== undefined means only a genuine new "pending
  // session" click can update the ref; our own clearing nav is ignored.
  if (
    capturedRef.current === null ||
    (state?.sessionId !== undefined &&
      capturedRef.current.navKey !== location.key)
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
    <TravelSessionHr
      initialSessionId={capturedRef.current.sessionId}
      userId={capturedRef.current.userId}
      navKey={capturedRef.current.navKey}
    />
  );
};

export default PendingHrSessionWrapper;
