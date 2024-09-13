import { useSocket } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const router = useRouter();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      router.push(
        {
          pathname: `/room/${room}`,
          query: { room }, // Room is in the URL
        },
        undefined,
        { shallow: true, state: { email } }
      ); // Email is in the state, not in the URL
    },
    [router]
  );

  const HandleError = useCallback((data) => {
    const { error } = data;
    alert(error);
  }, []);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    socket.on("room:join:error", HandleError);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom, HandleError]);

  return (
    <div className="flex items-center md:flex-row   md: height:[auto]  flex-col  justify-evenly min-h-screen bg-gray-900 text-white">
      <div className="text-center mb-6">
        <title>Let's-Connect</title>
        <link
          rel="shortcut icon"
          href="../../public/favicon.ico"
          type="image/x-icon"
        />
        <h1 className="text-5xl font-bold mb-6 mt-6 text-center tracking-tight">
          Let's Connect
        </h1>
        <p className="text-2xl mt-2 mb-6 text-center max-w-md">
          powered by <b>WebRTC!</b>
        </p>
      </div>

      <div className="bg-custom-gradient height:[100vh]    rounded-xl w-[auto] shadow-lg hover:shadow-[0px_0px_30px_1px_rgba(0,_255,_117,_0.3)] F transition-shadow ">
        <div className="bg-gray-800 p-6 rounded-2xl   transition-transform duration-150 hover:scale-80 hover:rounded-[20px] ">
          <form onSubmit={handleSubmitForm}>
            <p className="text-white text-center text-2xl font-bold p-1">Join Room</p>

            <div className="flex items-center gap-2 p-3 rounded-full bg-gray-700 shadow-inner mb-4">
              <svg
                className="w-5 h-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z"></path>
              </svg>
              <input
                type="email"
                placeholder="Email"
                className="bg-transparent border-none text-gray-400 w-full focus:outline-none focus:ring-0 focus:border-blue-500"
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-full bg-gray-700 shadow-inner mb-6">
              <svg
                className="w-5 h-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
              </svg>
              <input
                type="text"
                placeholder="Room Id"
                className="bg-transparent border-none text-gray-400 w-full focus:outline-none focus:ring-0 focus:border-blue-500 hide-arrows"
                value={room}
                autoComplete="off"
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-center md:gap-0 gap-4 mb-6">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-black transition-colors"
              >
                Join
              </button>
            </div>
          </form>
          <div className="flex justify-center md:gap-0 gap-4 mb-6 flex-col items-center">
            ----- OR -----
            <button
              onClick={() => router.push("/create")}
              className="px-4 py-2 mt-4 bg-green-600 rounded"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
