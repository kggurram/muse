import React, { useState } from "react";
import { FaPlay, FaPause, FaBan } from "react-icons/fa"; // Import play, pause, and ban icons

const RecommendationsGrid = ({ recommendations, searchType }) => {
  const [playingTrack, setPlayingTrack] = useState(null); // Track currently playing
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(null); // To store the preview URL of the currently playing track

  const handlePlayPause = (previewUrl) => {
    if (playingTrack) {
      playingTrack.pause(); // Pause currently playing track
      setPlayingTrack(null); // Reset playing track
      setCurrentPreviewUrl(null); // Reset current preview URL

      // If clicking on the same track that's currently playing, just stop it
      if (currentPreviewUrl === previewUrl) return;
    }

    // Play the new track
    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audio.play();
      setPlayingTrack(audio);
      setCurrentPreviewUrl(previewUrl); // Track the current preview URL

      // Stop the preview after it finishes playing
      audio.onended = () => {
        setPlayingTrack(null);
        setCurrentPreviewUrl(null);
      };
    }
  };

  // Function to get a random track's preview URL from an album
  // const getRandomTrackPreview = (tracks) => {
  //   const previewTracks = tracks.filter((track) => track.preview_url);
  //   if (previewTracks.length > 0) {
  //     const randomIndex = Math.floor(Math.random() * previewTracks.length);
  //     return previewTracks[randomIndex]?.preview_url;
  //   }

  //   return null;
  // };

  return (
    <>
      <h2 className="text-2xl my-8 font-lora">
        You might like these {searchType}s . . .
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-neutral-800 p-3 rounded-lg shadow-lg relative"
          >
            {searchType === "album" ? (
              <>
                <img
                  src={rec.images?.[0]?.url ?? "placeholder-image-url"}
                  alt={rec.name ?? "Unknown Album"}
                  className="w-full h-fit object-cover rounded-lg"
                />
                <h2 className="text-md font-bold mt-2 truncate">
                  {rec.name ?? "Unknown Album"}
                </h2>
                <p className="text-gray-500 truncate">
                  {rec.artists?.[0]?.name ?? "Unknown Artist"}
                </p>

                {/* Play/Pause Button for Album
                {rec.tracks && rec.tracks.length > 0 ? (
                  <button
                    className="aspect-square w-min h-min m-auto mt-3 md:mt-4 lg:mt-4 text-white bg-blue-500 p-3 sm:p-3 md:p-2 lg:p-2 xl:p-2 rounded-full hover:bg-blue-700"
                    onClick={() =>
                      handlePlayPause(getRandomTrackPreview(rec.tracks))
                    }
                  >
                    {currentPreviewUrl === getRandomTrackPreview(rec.tracks) ? (
                      <FaPause size={16} />
                    ) : (
                      <FaPlay size={16} />
                    )}
                  </button>
                ) : (
                  <FaBan
                    size={20}
                    className="absolute bottom-3 right-3 text-red-500"
                    title="No Preview Available"
                  />
                )} */}
              </>
            ) : (
              <>
                <img
                  src={
                    rec.track?.album?.images?.[0]?.url ??
                    "placeholder-image-url"
                  }
                  alt={rec.track?.name ?? "Unknown Track"}
                  className="w-full h-fit rounded-lg"
                />
                <div className="flex  truncate">
                  <div className="w-10/12 sm:w-4/5 lg:w-4/6 xl:w-4/5 sm:pr-2">
                    <h2 className="text-md font-bold mt-2 truncate">
                      {rec.track?.name ?? "Unknown Track"}
                    </h2>
                    <p className="text-gray-500 truncate">
                      {rec.track?.artists?.[0]?.name ?? "Unknown Artist"}
                    </p>
                  </div>

                  {/* Play/Pause Button for Track */}
                  {rec.track?.preview_url ? (
                    <button
                      className="aspect-square w-min h-min mr-0 m-auto mt-3 md:mt-4 lg:mt-4 xl:mt-3 text-white bg-blue-500 p-3 sm:p-3 md:p-2 lg:p-2 xl:p-2 2xl:p-3 rounded-full hover:bg-blue-700 "
                      onClick={() => handlePlayPause(rec.track.preview_url)}
                    >
                      {currentPreviewUrl === rec.track.preview_url ? (
                        <FaPause size={16} />
                      ) : (
                        <FaPlay size={16} />
                      )}
                    </button>
                  ) : (
                    <FaBan
                      size={16}
                      className="aspect-square w-min h-min mr-0 m-auto mt-3 md:mt-4 lg:mt-4 xl:mt-3 text-white bg-red-500 p-3 sm:p-3 md:p-2 lg:p-2 xl:p-2 2xl:p-3 rounded-full"
                      title="No Preview Available"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default RecommendationsGrid;
