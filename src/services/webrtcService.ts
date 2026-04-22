// services/webrtcService.ts
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: {
    onRemoteStream?: (stream: MediaStream) => void;
    onCallEnded?: () => void;
    onError?: (error: string) => void;
    onIceCandidate?: (candidate: RTCIceCandidate) => void;
  } = {};
  private isEnding = false; // Add flag to prevent recursive calls

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate?.(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.callbacks.onRemoteStream?.(this.remoteStream);
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (
        !this.isEnding &&
        (this.peerConnection?.connectionState === "disconnected" ||
          this.peerConnection?.connectionState === "failed" ||
          this.peerConnection?.connectionState === "closed")
      ) {
        this.endCall();
      }
    };
  }

  async startCall(isVideo: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw new Error("Unable to access camera/microphone");
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");
    await this.peerConnection.setRemoteDescription(description);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");
    await this.peerConnection.addIceCandidate(candidate);
  }

  endCall() {
    // Prevent recursive calls
    if (this.isEnding) return;
    this.isEnding = true;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;

    // Call the callback without triggering recursion
    const onCallEnded = this.callbacks.onCallEnded;
    this.callbacks.onCallEnded = undefined; // Clear callback to prevent future calls

    if (onCallEnded) {
      onCallEnded();
    }

    this.isEnding = false;
    this.initializePeerConnection(); // Reinitialize for next call
  }

  setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}
