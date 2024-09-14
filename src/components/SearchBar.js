import React from "react";
import { AiOutlineSearch } from "react-icons/ai"; // Using react-icons for the search icon

const SearchBar = ({ query, setQuery }) => {
  return (
    <div className="relative flex items-center w-full">
      {/* Search Icon */}
      <AiOutlineSearch className="absolute left-3 text-gray-400" />

      {/* Input Field */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-2 pl-10 bg-neutral-800 border border-gray-600 rounded-xl w-full text-gray-400"
        placeholder="Search for a song or album..."
      />
    </div>
  );
};

export default SearchBar;
