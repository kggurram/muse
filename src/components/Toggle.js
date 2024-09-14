import React from "react";

export default function Toggle({
  searchType,
  setSearchType,
  setSelectedItems,
}) {
  const handleSearchType = (type) => {
    setSearchType(type);
    setSelectedItems([]); // Clear current selection when switching types
  };

  return (
    <div className="flex space-x-2 text-sm">
      {/* Song Button */}
      <button
        onClick={() => handleSearchType("track")}
        className={`px-4 py-2 rounded-xl  ${
          searchType === "track"
            ? "bg-blue-500 text-white"
            : "bg-neutral-700 text-white"
        }`}
      >
        Song
      </button>

      {/* Album Button */}
      <button
        onClick={() => handleSearchType("album")}
        className={`px-4 py-2 rounded-xl  ${
          searchType === "album"
            ? "bg-blue-500 text-white"
            : "bg-neutral-700 text-white"
        }`}
      >
        Album
      </button>
    </div>
  );
}
