import React from "react";

const RecommendationsGrid = ({ recommendations, searchType }) => {
  return (
    <>
      <h2 className="text-2xl my-8 font-lora">Your suggestions . . .</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-neutral-800 p-2 rounded-lg shadow-lg">
            {searchType === "album" ? (
              <>
                <img
                  src={rec.images?.[0]?.url ?? "placeholder-image-url"}
                  alt={rec.name ?? "Unknown Album"}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <h2 className="text-md font-bold mt-2 truncate">
                  {rec.name ?? "Unknown Album"}
                </h2>
                <p className="text-gray-500 truncate">
                  {rec.artists?.[0]?.name ?? "Unknown Artist"}
                </p>
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
                <h2 className="text-md font-bold mt-2 truncate">
                  {rec.track?.name ?? "Unknown Track"}
                </h2>
                <p className="text-gray-500 truncate">
                  {rec.track?.artists?.[0]?.name ?? "Unknown Artist"}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default RecommendationsGrid;
