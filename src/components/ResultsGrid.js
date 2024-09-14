import React from "react";

const ResultsGrid = ({ results, toggleSelectItem, selectedItems }) => {
  return (
    <>
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((item) => (
            <div
              key={item.id}
              // Apply a blue border if the item is selected, otherwise no border
              className={`bg-neutral-800 p-3 rounded-lg shadow-lg cursor-pointer transition-transform transform hover:scale-105 ${
                selectedItems.find((i) => i.id === item.id)
                  ? "border-2 border-cyan-500"
                  : "border border-transparent"
              }`}
              onClick={() => toggleSelectItem(item)}
            >
              <img
                src={
                  (item.album?.images?.[0]?.url || item.images?.[0]?.url) ??
                  "placeholder-image-url"
                }
                alt={item.name}
                className="w-full h-fit rounded-lg"
              />
              <div className="">
                <h2 className="text-md text-white font-bold mt-2 truncate">
                  {item.name}
                </h2>
                <p className="text-gray-500 truncate">
                  {item.artists?.[0]?.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ResultsGrid;
