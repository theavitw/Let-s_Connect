class PeerService {
  constructor() {
    if (typeof window !== "undefined" && !this.worker) {
      this.worker = new Worker(new URL("./peer.worker.js", import.meta.url)); // Dynamically import the worker

      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    }
  }

  addTrack = (track, stream) => {
    this.peer.addTrack(track, stream);
  };

  getOffer = () => {
    return new Promise((resolve) => {
      this.peer.createOffer().then((offer) => {
        this.peer.setLocalDescription(offer);
        resolve(offer);
      });
    });
  };

  getAnswer = (offer) => {
    return new Promise((resolve) => {
      this.peer
        .setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          this.peer.createAnswer().then((answer) => {
            this.peer.setLocalDescription(answer);
            resolve(answer);
          });
        });
    });
  };

  setLocalDescription = async (ans) => {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
    }
  };

  toggleAudio = () => {
    const audioSender = this.peer
      .getSenders()
      .find((sender) => sender.track.kind === "audio");

    if (audioSender) {
      audioSender.track.enabled = !audioSender.track.enabled;
    }

    // Ensure the local audio track is not played back locally
    const localStream = this.peer.getLocalStreams()[0];
    if (localStream) {
      const localAudioTrack = localStream.getAudioTracks()[0];
      if (localAudioTrack) {
        localAudioTrack.enabled = !localAudioTrack.enabled;
        localAudioTrack.stop(); // Stop the local audio track to prevent playback
      }
    }
  };

  toggleVideo = () => {
    const videoTracks = this.peer
      .getSenders()
      .find((sender) => sender.track.kind === "video").track;
    videoTracks.enabled = !videoTracks.enabled;
  };
}

const peerService = new PeerService();

export default peerService;
