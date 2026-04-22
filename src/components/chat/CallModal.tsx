import React, { useEffect, useRef, useState } from "react";
import {
  PhoneOff,
  PhoneCall,
  Video,
  Mic,
  MicOff,
  VideoOff,
} from "lucide-react";

// ============================================================
// OUTGOING CALL COMPONENT (DirectCall - you initiate)
// ============================================================
interface DirectCallProps {
  isOpen: boolean;
  isVideo: boolean;
  firstName: string;
  contactId: number;
  myId: number;
  socket: any;
  onClose: () => void;
}

export const DirectCall: React.FC<DirectCallProps> = ({
  isOpen,
  isVideo,
  firstName,
  contactId,
  myId,
  socket,
  onClose,
}) => {
  const [status, setStatus] = useState("initiating");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  // Prevents double-start when React StrictMode double-fires effects
  const hasStarted = useRef(false);

  const cleanup = () => {
    if (stream.current) {
      stream.current.getTracks().forEach((t) => t.stop());
      stream.current = null;
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
  };

  const endCall = () => {
    setStatus("ended");
    socket?.emit("call_end", { to: contactId, from: myId });
    cleanup();
    hasStarted.current = false;
    setTimeout(onClose, 500);
  };

  const setupConnection = () => {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
    pc.current = new RTCPeerConnection(config);

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit("ice_candidate", {
          candidate: e.candidate,
          to: contactId,
          from: myId,
        });
      }
    };

    pc.current.ontrack = (e) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
        setStatus("connected");
      }
    };

    pc.current.onconnectionstatechange = () => {
      const state = pc.current?.connectionState;
      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        endCall();
      }
    };

    if (stream.current) {
      stream.current.getTracks().forEach((track) => {
        pc.current?.addTrack(track, stream.current!);
      });
    }
  };

  const startCall = async () => {
    try {
      setStatus("media");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      stream.current = mediaStream;
      if (localVideo.current) {
        localVideo.current.srcObject = mediaStream;
      }

      setStatus("connecting");
      setupConnection();

      const offer = await pc.current?.createOffer();
      await pc.current?.setLocalDescription(offer);

      setStatus("calling");
      socket?.emit("call_offer", {
        to: contactId,
        from: myId,
        callerName: firstName,
        isVideo: isVideo,
        offer: offer,
      });
    } catch (err) {
      console.error("startCall error:", err);
      endCall();
    }
  };

  // SINGLE useEffect - no duplicate
  useEffect(() => {
    if (!isOpen || !socket) return;
    if (hasStarted.current) return; // Prevent double-start
    hasStarted.current = true;

    startCall();

    const handleAnswer = async (data: any) => {
      if (data.from === contactId && pc.current) {
        await pc.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
        setStatus("connected");
      }
    };

    const handleIce = async (data: any) => {
      if (data.from === contactId && pc.current && data.candidate) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("ICE candidate error:", e);
        }
      }
    };

    const handleEnd = () => {
      cleanup();
      hasStarted.current = false;
      setStatus("ended");
      setTimeout(onClose, 500);
    };

    socket.on("call_answered", handleAnswer);
    socket.on("ice_candidate", handleIce);
    socket.on("call_ended", handleEnd);

    return () => {
      socket.off("call_answered", handleAnswer);
      socket.off("ice_candidate", handleIce);
      socket.off("call_ended", handleEnd);
      cleanup();
      hasStarted.current = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="relative w-full max-w-4xl h-3/4 bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl">
        {/* Remote video (full screen) */}
        {isVideo && (
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Local video (picture-in-picture) */}
        {isVideo && (
          <div className="absolute bottom-24 right-4 w-40 h-52 rounded-xl overflow-hidden border-2 border-white/20 bg-black shadow-lg z-20">
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />

        <div className="relative z-10 flex flex-col items-center justify-between h-full p-6">
          {/* Avatar & Status */}
          <div className="text-center mt-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-bold text-white">
                {firstName?.[0]?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{firstName}</h2>
            <p className="text-white/70 text-sm tracking-wide">
              {status === "initiating" && "Initializing..."}
              {status === "media" && "Accessing camera/mic..."}
              {status === "connecting" && "Setting up connection..."}
              {status === "calling" && "Ringing..."}
              {status === "connected" && "● Connected"}
              {status === "ended" && "Call ended"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-8">
            {/* Mute toggle */}
            <button
              onClick={() => {
                if (stream.current) {
                  const audioTrack = stream.current.getAudioTracks()[0];
                  if (audioTrack) {
                    audioTrack.enabled = isMuted; // toggle
                    setIsMuted(!isMuted);
                  }
                }
              }}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Video toggle (only for video calls) */}
            {isVideo && (
              <button
                onClick={() => {
                  if (stream.current) {
                    const videoTrack = stream.current.getVideoTracks()[0];
                    if (videoTrack) {
                      videoTrack.enabled = isVideoOff; // toggle
                      setIsVideoOff(!isVideoOff);
                    }
                  }
                }}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-white/20 hover:bg-white/30"
                }`}
                title={isVideoOff ? "Turn video on" : "Turn video off"}
              >
                {isVideoOff ? (
                  <VideoOff className="w-6 h-6 text-white" />
                ) : (
                  <Video className="w-6 h-6 text-white" />
                )}
              </button>
            )}

            {/* End call */}
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              title="End call"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// INCOMING CALL COMPONENT (someone is calling you)
// ============================================================
interface IncomingCallProps {
  isOpen: boolean;
  callerName: string;
  callerId: number;
  isVideo: boolean;
  offer: RTCSessionDescriptionInit;
  myId: number;
  socket: any;
  onClose: () => void;
}

export const IncomingCall: React.FC<IncomingCallProps> = ({
  isOpen,
  callerName,
  callerId,
  isVideo,
  offer,
  myId,
  socket,
  onClose,
}) => {
  const [status, setStatus] = useState<"ringing" | "connected" | "ended">(
    "ringing",
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const cleanup = () => {
    if (stream.current) {
      stream.current.getTracks().forEach((t) => t.stop());
      stream.current = null;
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
  };

  const rejectCall = () => {
    socket?.emit("call_end", { to: callerId, from: myId });
    cleanup();
    setStatus("ended");
    setTimeout(onClose, 500);
  };

  const acceptCall = async () => {
    try {
      setStatus("connected");

      // Get local media
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      stream.current = mediaStream;
      if (localVideo.current) {
        localVideo.current.srcObject = mediaStream;
      }

      // Create peer connection
      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };
      pc.current = new RTCPeerConnection(config);

      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket?.emit("ice_candidate", {
            candidate: e.candidate,
            to: callerId,
            from: myId,
          });
        }
      };

      pc.current.ontrack = (e) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = e.streams[0];
        }
      };

      pc.current.onconnectionstatechange = () => {
        const state = pc.current?.connectionState;
        if (
          state === "disconnected" ||
          state === "failed" ||
          state === "closed"
        ) {
          cleanup();
          setStatus("ended");
          setTimeout(onClose, 500);
        }
      };

      // Add local tracks
      stream.current.getTracks().forEach((track) => {
        pc.current?.addTrack(track, stream.current!);
      });

      // Set remote description from offer
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      socket?.emit("call_answer", {
        to: callerId,
        from: myId,
        answer: answer,
      });
    } catch (err) {
      console.error("acceptCall error:", err);
      rejectCall();
    }
  };

  useEffect(() => {
    if (!isOpen || !socket) return;

    const handleIce = async (data: any) => {
      if (data.from === callerId && pc.current && data.candidate) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("ICE error:", e);
        }
      }
    };

    const handleEnd = () => {
      cleanup();
      setStatus("ended");
      setTimeout(onClose, 500);
    };

    socket.on("ice_candidate", handleIce);
    socket.on("call_ended", handleEnd);

    return () => {
      socket.off("ice_candidate", handleIce);
      socket.off("call_ended", handleEnd);
      cleanup();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="relative w-full max-w-4xl h-3/4 bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl">
        {/* Remote video */}
        {isVideo && status === "connected" && (
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Local video PiP */}
        {isVideo && status === "connected" && (
          <div className="absolute bottom-24 right-4 w-40 h-52 rounded-xl overflow-hidden border-2 border-white/20 bg-black shadow-lg z-20">
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />

        <div className="relative z-10 flex flex-col items-center justify-between h-full p-6">
          {/* Caller info */}
          <div className="text-center mt-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-bold text-white">
                {callerName?.[0]?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
            <p className="text-white/70 text-sm tracking-wide">
              {status === "ringing" &&
                (isVideo ? "Incoming video call..." : "Incoming voice call...")}
              {status === "connected" && "● Connected"}
              {status === "ended" && "Call ended"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-6 mb-8">
            {status === "ringing" ? (
              <>
                {/* Reject */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={rejectCall}
                    className="p-5 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-white/60 text-xs">Decline</span>
                </div>

                {/* Accept */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={acceptCall}
                    className="p-5 rounded-full bg-green-500 hover:bg-green-600 transition-colors shadow-lg animate-pulse"
                  >
                    <PhoneCall className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-white/60 text-xs">Accept</span>
                </div>
              </>
            ) : (
              <>
                {/* Mute */}
                <button
                  onClick={() => {
                    if (stream.current) {
                      const audioTrack = stream.current.getAudioTracks()[0];
                      if (audioTrack) {
                        audioTrack.enabled = isMuted;
                        setIsMuted(!isMuted);
                      }
                    }
                  }}
                  className={`p-4 rounded-full transition-colors ${
                    isMuted
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Video toggle */}
                {isVideo && (
                  <button
                    onClick={() => {
                      if (stream.current) {
                        const videoTrack = stream.current.getVideoTracks()[0];
                        if (videoTrack) {
                          videoTrack.enabled = isVideoOff;
                          setIsVideoOff(!isVideoOff);
                        }
                      }
                    }}
                    className={`p-4 rounded-full transition-colors ${
                      isVideoOff
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-6 h-6 text-white" />
                    ) : (
                      <Video className="w-6 h-6 text-white" />
                    )}
                  </button>
                )}

                {/* End call */}
                <button
                  onClick={rejectCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
