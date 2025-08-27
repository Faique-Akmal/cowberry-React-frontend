import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import API from "../api/axios";

/** -------- Types -------- */
type TrackerStatus = "idle" | "starting" | "running" | "stopping" | "error";

interface LocationTrackerContextValue {
  status: TrackerStatus;
  lastSentAt: string | null;
  intervalMs: number | null;
  start: (userId: number) => Promise<void>;
  stop: () => Promise<void>;
}

interface LocationPayload {
  user: number;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO
}

/** -------- Storage Keys -------- */
const LS_ATT_KEY = "attendance_active"; // value: {"userId": number, "since": iso}
const LS_PENDING = "pendingLocationUpdates"; // value: LocationPayload[]
const LS_INTERVAL = "location_interval_ms"; // value: number

/** -------- Helpers -------- */
const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { }
};

const cacheOffline = (payload: LocationPayload) => {
  const cached = readJSON<LocationPayload[]>(LS_PENDING, []);
  cached.push(payload);
  writeJSON(LS_PENDING, cached);
};

const flushCached = async () => {
  const cached = readJSON<LocationPayload[]>(LS_PENDING, []);
  if (!cached.length) return;

  const survivors: LocationPayload[] = [];
  for (const p of cached) {
    try {
      await API.post("/locations/", p);
    } catch {
      survivors.push(p); // keep for next attempt
    }
  }
  if (survivors.length) writeJSON(LS_PENDING, survivors);
  else localStorage.removeItem(LS_PENDING);
};

/** -------- Core tracker (module-scoped singletons) -------- */
let geoWatchId: number | null = null;
let tickTimer: number | null = null;

let latestCoords: { lat: number; lng: number } | null = null;
let activeUserId: number | null = null;

const startGeoWatch = () => {
  if (geoWatchId !== null) return;
  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      latestCoords = {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
      };
    },
    // ignore errors — we’ll surface via send step
    () => { },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
};

const stopGeoWatch = () => {
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
};

/** -------- Context -------- */
const LocationTrackerContext = createContext<LocationTrackerContextValue | null>(null);

export const useLocationTracker = () => {
  const ctx = useContext(LocationTrackerContext);
  if (!ctx) throw new Error("useLocationTracker must be used within LocationTrackerProvider");
  return ctx;
};

export const LocationTrackerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [status, setStatus] = useState<TrackerStatus>("idle");
  const [intervalMs, setIntervalMs] = useState<number | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  const isRunningRef = useRef(false);

  /** Get interval from API or cache */
  const loadInterval = useCallback(async (): Promise<number> => {
    // try cache first to start fast
    const cached = readJSON<number | null>(LS_INTERVAL, null);
    if (cached && cached >= 5000) setIntervalMs(cached);

    try {
      const res = await API.get("/location-log-config/");
      console.log("my api location config result", res.data[0])
      const serverMs: number | undefined =
        typeof res?.data[0]?.refresh_interval === "number" ? res?.data[0]?.refresh_interval * 1000 : undefined;
      const finalMs = serverMs && serverMs >= 5000 ? serverMs : (cached ?? 15000);
      setIntervalMs(finalMs);
      writeJSON(LS_INTERVAL, finalMs);
      return finalMs;
    } catch {
      return cached ?? 15000; // sensible default
    }
  }, []);

  const sendOnce = useCallback(async () => {
    if (!activeUserId) return;
    // ensure we have coords
    const ensureCoords = (): Promise<{ lat: number; lng: number }> =>
      new Promise((resolve, reject) => {
        if (latestCoords) return resolve(latestCoords);
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
            }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );
      });

    try {
      const { lat, lng } = await ensureCoords();
      const payload: LocationPayload = {
        user: activeUserId,
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
      };

      if (navigator.onLine) {
        try {
          const res = await API.post("/locations/", payload);
          console.log(res.data)
        } catch {
          cacheOffline(payload);
        }
      } else {
        cacheOffline(payload);
      }
      setLastSentAt(new Date().toISOString());
    } catch {
      // geolocation error — do nothing; next tick will retry
    }
  }, []);

  const scheduleTicks = useCallback(
    (ms: number) => {
      const tick = async () => {
        if (!isRunningRef.current) return;
        await sendOnce();
        tickTimer = window.setTimeout(tick, ms);
      };

      // kick off
      tickTimer = window.setTimeout(tick, ms);
    },
    [sendOnce]
  );

  const clearTicks = () => {
    if (tickTimer) {
      window.clearTimeout(tickTimer);
      tickTimer = null;
    }
  };

  const start = useCallback(
    async (userId: number) => {
      if (isRunningRef.current) return;

      setStatus("starting");
      activeUserId = userId;
      writeJSON(LS_ATT_KEY, { userId, since: new Date().toISOString() });

      const ms = await loadInterval();
      startGeoWatch();

      // send immediately then schedule
      await sendOnce();
      isRunningRef.current = true;
      scheduleTicks(ms);
      setStatus("running");
    },
    [loadInterval, scheduleTicks, sendOnce]
  );

  const stop = useCallback(async () => {
    if (!isRunningRef.current && !readJSON(LS_ATT_KEY, null)) return;

    setStatus("stopping");
    isRunningRef.current = false;
    activeUserId = null;
    clearTicks();
    stopGeoWatch();
    localStorage.removeItem(LS_ATT_KEY);

    // best effort final flush of cached
    try {
      if (navigator.onLine) await flushCached();
    } catch { }
    setStatus("idle");
  }, []);

  /** Resume tracking on reload / route changes if attendance was active */
  useEffect(() => {
    const att = readJSON<{ userId: number; since: string } | null>(LS_ATT_KEY, null);
    if (att?.userId) {
      // fire and forget; no await inside effect
      start(att.userId).catch(() => setStatus("error"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Re-flush when we come back online */
  useEffect(() => {
    const onOnline = () => flushCached();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  /** Visibility change: we keep running, but this is a good moment to flush */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        flushCached();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const value = useMemo<LocationTrackerContextValue>(
    () => ({ status, lastSentAt, intervalMs, start, stop }),
    [status, lastSentAt, intervalMs, start, stop]
  );

  return <LocationTrackerContext.Provider value={value}>{children}</LocationTrackerContext.Provider>;
};