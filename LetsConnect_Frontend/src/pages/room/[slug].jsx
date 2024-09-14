import { useSocket } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import peer from "@/service/peer";
import CallIcon from "@mui/icons-material/Call";
import VideoPlayer from "@/components/VideoPlayer";
import CallHandleButtons from "@/components/CallHandleButtons";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMute, setIsAudioMute] = useState(false);
  const [isVideoOnHold, setIsVideoOnHold] = useState(false);
  const [callButton, setCallButton] = useState(true);
  const [isSendButtonVisible, setIsSendButtonVisible] = useState(true);

  const handleUserJoined = useCallback(({ email, id }) => {
    setRemoteSocketId(id);
  }, []);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
    setIsSendButtonVisible(false);
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeededIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  // Handle tracks from remote user
  const handleTrackEvent = useCallback((ev) => {
    const remoteStream = ev.streams[0];
    if (remoteStream) {
      console.log("GOT TRACKS!", remoteStream);
      setRemoteStream(remoteStream);
    } else {
      console.log("No remote stream received.");
    }
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", handleTrackEvent);
    return () => {
      peer.peer.removeEventListener("track", handleTrackEvent);
    };
  }, [handleTrackEvent]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeededIncoming);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeededIncoming);
      socket.off("peer:nego:final", handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeededIncoming,
    handleNegoFinal,
  ]);

  useEffect(() => {
    socket.on("call:end", ({ from }) => {
      if (from === remoteSocketId) {
        peer.peer.close();
        if (myStream) {
          myStream.getTracks().forEach((track) => track.stop());
          setMyStream(null);
        }
        setRemoteStream(null);
        setRemoteSocketId(null);
      }
    });
    return () => {
      socket.off("call:end");
    };
  }, [remoteSocketId, myStream, socket]);

  useEffect(() => {
    socket.on("call:initiated", ({ from }) => {
      if (from === remoteSocketId) {
        setCallButton(false);
      }
    });
    return () => {
      socket.off("call:initiated");
    };
  }, [socket, remoteSocketId]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    if (isAudioMute) {
      stream.getAudioTracks().forEach((track) => (track.enabled = false));
    }
    if (isVideoOnHold) {
      stream.getVideoTracks().forEach((track) => (track.enabled = false));
    }

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
    setCallButton(false);
    socket.emit("call:initiated", { to: remoteSocketId });
  }, [remoteSocketId, socket, isAudioMute, isVideoOnHold, callButton]);

  const handleToggleAudio = () => {
    peer.toggleAudio();
    setIsAudioMute(!isAudioMute);
  };

  const handleToggleVideo = () => {
    peer.toggleVideo();
    setIsVideoOnHold(!isVideoOnHold);
  };

  const handleEndCall = useCallback(() => {
    peer.peer.close();

    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }

    setRemoteStream(null);

    if (remoteSocketId) {
      socket.emit("call:end", { to: remoteSocketId });
    }
    setRemoteSocketId(null);
    alert("Call Ended");
    router.push("/");
  }, [myStream, remoteSocketId, socket]);

  const router = useRouter();
  const { slug } = router.query;

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen overflow-hidden">
      <title>Room No. {slug}</title>
      <button
        className="absolute top-0 left-0 ml-[12px] bg-red-500"
        onClick={handleEndCall}
      >
        Disconnect
      </button>
      <h1 className="absolute top-[20px] left-0 text-5xl text-center font-josefin tracking-tighter mt-5 ml-5 mmd:text-xl mxs:text-sm">
        Let's Connect
      </h1>
      <h4 className="font-bold text-xl md:text-2xl mmd:text-sm mt-5 mb-4 msm:max-w-[100px] text-center">
        {remoteSocketId ? "Connected With Remote User!" : "No One In Room"}
      </h4>

      {remoteStream && remoteSocketId && isSendButtonVisible && (
        <button
          className="bg-green-500 hover:bg-green-600"
          onClick={sendStreams}
        >
          Send Stream
        </button>
      )}
      {remoteSocketId && callButton && (
        <button
          className="text-xl bg-green-500 hover:bg-green-600 rounded-3xl"
          onClick={handleCallUser}
        >
          Call{" "}
          <CallIcon fontSize="medium" className="animate-pulse scale-125" />
        </button>
      )}
      <div className="flex flex-col w-full items-center justify-center overflow-hidden">
        {myStream && (
          <VideoPlayer
            stream={myStream}
            name={"My Stream"}
            isAudioMute={isAudioMute}
          />
        )}
        {remoteStream && (
          <VideoPlayer
            stream={remoteStream}
            name={"Remote Stream"}
            isAudioMute={isAudioMute}
          />
        )}
      </div>
      {myStream && remoteStream && !isSendButtonVisible && (
        <CallHandleButtons
          isAudioMute={isAudioMute}
          isVideoOnHold={isVideoOnHold}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
};

export default RoomPage;
