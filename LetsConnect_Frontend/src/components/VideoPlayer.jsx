import ReactPlayer from "react-player";

const VideoPlayer = ({ stream, isAudioMute, name }) => {
  const myStream = name === "My Stream" ? true : false;
  return (
    <div>
      <div
        className={`${
          name === "My Stream"
            ? "flex flex-col items-center justify-center absolute top-2 right-3 z-10"
            : "px-2"
        }`}
      >
        <h1
          className={`text-sm font-poppins font-semibold text-center mb-1 
                    ${myStream ? "mt-1 md:text-xl" : "mt-4 md:text-xl"}`}
        >
          {name}
        </h1>
        <div
          className={`relative rounded-[30px] overflow-auto 
                    ${
                      myStream
                        ? "w-[100px] h-[120px] sm:w-[100px] sm:h-[180px] md:w-[140px] md:h-[220px] lg:w-[200px] lg:h-[230px]"
                        : "w-full h-[500px] sm:h-[500px] md:w-[800px] md:h-[500px] lg:h-[webkit-fill-available]"
                    }`}
        >
          <ReactPlayer
            url={stream}
            playing
            muted={isAudioMute}
            height="100%"
            width="100%"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
