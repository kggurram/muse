import React, { useState, useEffect } from "react";
import axios from "axios";
import { searchSpotify } from "../services/spotify";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [searchType, setSearchType] = useState("track"); // Default to 'track' (songs)
  const [selectedItems, setSelectedItems] = useState([]); // Store selected items
  const [recommendations, setRecommendations] = useState([]); // Store recommendations
  const [searchCompleted, setSearchCompleted] = useState(false); // Track if user has pressed generate

  // Debounce the query to reduce the number of API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Fetch results when debounced query or searchType changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery) {
        const data = await searchSpotify(debouncedQuery, searchType); // Include searchType in the API call
        if (searchType === "track") {
          setResults(data.tracks?.items || []); // Use optional chaining to avoid undefined errors
        } else if (searchType === "album") {
          setResults(data.albums?.items || []); // Handle albums search
        }
      } else {
        setResults([]); // Clear results if query is empty
      }
    };

    fetchResults();
  }, [debouncedQuery, searchType]);

  // Handle selection of items
  const toggleSelectItem = (item) => {
    // Determine the type of the currently selected items
    const selectedType = searchType === "track" ? "track" : "album";

    // Check if the user is trying to mix types
    if (selectedItems.length > 0 && selectedItems[0].type !== selectedType) {
      // Clear the current selection if the types don't match
      alert(
        `You cannot mix songs and albums. Your current selection will be cleared.`
      );
      setSelectedItems([item]); // Start fresh with the new item
    } else {
      // If the types match, add or remove the item
      if (selectedItems.find((i) => i.id === item.id)) {
        // If the item is already selected, deselect it
        setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
      } else {
        // Otherwise, select the item
        setSelectedItems([...selectedItems, item]);
      }
    }
  };

  // Fetch recommendations from the backend after getting audio features
  const getRecommendations = async () => {
    try {
      // Clear previous recommendations to ensure no old data is kept
      setRecommendations([]); // Clear previous recommendations here

      const response = await axios.post("http://localhost:5000/recommend", {
        selected_items: selectedItems,
        search_type: searchType, // Send the search type (track or album)
      });

      setRecommendations(response.data || []); // Ensure recommendations are an array
      setSearchCompleted(true); // Indicate that search is complete
      setSelectedItems([]); // Clear the selection after generating recommendations
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  // Restart the process by resetting everything
  const restartProcess = () => {
    setQuery("");
    setResults([]);
    setSelectedItems([]);
    setRecommendations([]);
    setSearchCompleted(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-950 text-black dark:text-white">
      {!searchCompleted ? (
        <div className="w-full max-w-3xl">
          {/* Centered search bar */}
          <div className="mb-8 text-center">
            {/* Toggle between Songs and Albums */}
            <div className="flex justify-center items-center space-x-4 mb-4">
              <span>Songs</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={searchType === "album"}
                  onChange={() => {
                    setSearchType(searchType === "track" ? "album" : "track");
                    setSelectedItems([]); // Clear current selection when switching types
                  }}
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full">
                  <div
                    className={`${
                      searchType === "album" ? "translate-x-6" : "translate-x-1"
                    } inline-block w-4 h-4 bg-white rounded-full transform transition-transform`}
                  ></div>
                </div>
              </label>
              <span>Albums</span>
            </div>

            {/* Search bar */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="p-4 border border-gray-300 rounded w-full text-center"
              placeholder="Search for a song or album..."
            />
          </div>

          {/* Display selected items count */}
          {selectedItems.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-bold">Selected Items</h2>
              <p>{selectedItems.length} selected (minimum 10 required)</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-200 p-2 rounded-lg shadow-lg"
                  >
                    <img
                      src={
                        item.album?.images?.[0]?.url || item.images?.[0]?.url
                      }
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <p className="text-sm truncate">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white p-2 rounded-lg shadow-lg cursor-pointer ${
                    selectedItems.find((i) => i.id === item.id)
                      ? "border-4 border-green-500"
                      : ""
                  }`}
                  onClick={() => toggleSelectItem(item)}
                >
                  <img
                    src={item.album?.images?.[0]?.url || item.images?.[0]?.url}
                    alt={item.name}
                    className="w-full h-40 object-cover"
                  />
                  <h2 className="text-md font-bold mt-2 truncate">
                    {item.name}
                  </h2>
                  <p className="text-gray-500 truncate">
                    {item.artists?.[0]?.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Generate Recommendations Button (enabled only when 10 items are selected) */}
          {selectedItems.length >= 10 && (
            <div className="mt-8 text-center">
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-lg"
                onClick={getRecommendations}
              >
                Generate Recommendations
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          {/* Display final recommendations */}
          <h2 className="text-2xl font-bold text-center mb-8">
            Your Recommendations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.track.id}
                className="bg-white p-2 rounded-lg shadow-lg"
              >
                <img
                  src={
                    rec.track.album?.images?.[0]?.url || "placeholder-image-url"
                  }
                  alt={rec.track.name}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <h2 className="text-md font-bold mt-2 truncate">
                  {rec.track.name}
                </h2>
                <p className="text-gray-500 truncate">
                  {rec.track.artists?.[0]?.name}
                </p>
              </div>
            ))}
          </div>

          {/* Restart Button */}
          <div className="mt-8 text-center">
            <button
              className="px-6 py-2 bg-red-500 text-white rounded-lg"
              onClick={restartProcess}
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
