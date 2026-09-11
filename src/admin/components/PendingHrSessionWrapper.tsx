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

  // Snapshot the incoming nav data + location.key for this history entry.
  const capturedRef = useRef<{
    sessionId?: string | number;
    userId?: string | number;
    navKey: string;
  } | null>(null);

  // Recapture ONLY when this render carries a genuinely new sessionId (a
  // real click), never when state is null. This matters because the effect
  // below clears the nav state via navigate(..., { state: null }) - and
  // even with replace:true, React Router still hands that entry a brand
  // new location.key. If we recaptured on any navKey change, that
  // self-triggered clear would immediately come back around with a new key
  // and state.sessionId === undefined, wiping out the session we just
  // captured before TravelSessionHr ever got a chance to open it. Gating on
  // state?.sessionId !== undefined means our own clear is ignored, while a
  // genuinely new click (which always carries a sessionId) still updates
  // the ref - so clicking a second pending session while this route stays
  // mounted also works, and no artificial delay is needed.
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

  // TEMP DEBUG - remove once the open-session flow is confirmed working.
  // eslint-disable-next-line no-console
  console.log("[PendingHrSessionWrapper] render", {
    incomingState: state,
    locationKey: location.key,
    captured: capturedRef.current,
  });

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
      initialSessionId={capturedRef.current?.sessionId}
      userId={capturedRef.current?.userId}
      navKey={capturedRef.current?.navKey}
    />
  );
};

export default PendingHrSessionWrapper;
