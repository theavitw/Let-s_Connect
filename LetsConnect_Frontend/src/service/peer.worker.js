self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case "create-offer":
      const offer = await self.peer.createOffer();
      await self.peer.setLocalDescription(offer);
      postMessage({ type: "offer-created", payload: offer });
      break;
    case "create-answer":
      await self.peer.setRemoteDescription(payload);
      const answer = await self.peer.createAnswer();
      await self.peer.setLocalDescription(answer);
      postMessage({ type: "answer-created", payload: answer });
      break;
    case "set-remote-description":
      await self.peer.setRemoteDescription(new RTCSessionDescription(payload));
      break;
    case "toggle-audio":
      const audioTrack = self.peer
        .getSenders()
        .find((sender) => sender.track.kind === "audio").track;
      audioTrack.enabled = !audioTrack.enabled;
      break;
    case "toggle-video":
      const videoTrack = self.peer
        .getSenders()
        .find((sender) => sender.track.kind === "video").track;
      videoTrack.enabled = !videoTrack.enabled;
      break;
    default:
      console.error("Unknown message type:", type);
  }
};
