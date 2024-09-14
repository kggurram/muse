import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import SelectedItems from "./components/SelectedItems";
import ResultsGrid from "./components/ResultsGrid";
import RecommendationsGrid from "./components/RecommendationsGrid";
import RestartButton from "./components/RestartButton";
import { searchSpotify } from "./services/spotify";
import Toggle from "./components/Toggle";
import { CircularProgress } from "@mui/material";
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [searchType, setSearchType] = useState("track");
  const [selectedItems, setSelectedItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery) {
        const data = await searchSpotify(debouncedQuery, searchType);
        if (searchType === "track") {
          setResults(data.tracks?.items || []);
        } else if (searchType === "album") {
          setResults(data.albums?.items || []);
        }
      } else {
        setResults([]);
      }
    };

    fetchResults();
  }, [debouncedQuery, searchType]);

  const toggleSelectItem = (item) => {
    const selectedType = searchType === "track" ? "track" : "album";

    if (selectedItems.length > 0 && selectedItems[0].type !== selectedType) {
      alert(
        `You cannot mix songs and albums. Your current selection will be cleared.`
      );
      setSelectedItems([item]);
    } else {
      if (selectedItems.find((i) => i.id === item.id)) {
        setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
    }
  };

  const getRecommendations = async () => {
    try {
      setLoading(true);
      setRecommendations([]);

      const response = await axios.post(
        "https://muse-ba43.onrender.com/recommend",
        {
          selected_items: selectedItems,
          search_type: searchType,
        }
      );

      setRecommendations(response.data || []);
      setSearchCompleted(true);
      setSelectedItems([]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setLoading(false);
    }
  };

  const restartProcess = () => {
    setQuery("");
    setResults([]);
    setSelectedItems([]);
    setRecommendations([]);
    setSearchCompleted(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-roboto sm:px-10 px-8">
      <SpeedInsights />
      <div className="w-full md:w-2/3 lg:w-1/2 mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center font-lora pt-16 sm:pt-24 lg:pt-32">
          Muse.
        </h1>
      </div>

      <div className="p-4 w-full md:w-2/3 lg:w-1/2 mx-auto">
        {!searchCompleted ? (
          <div className="space-y-3 pt-8 sm:pt-12 md:pt-16 lg:pt-20">
            <div className="w-full md:w-3/4 lg:w-1/2 mx-auto space-y-4">
              <div className="flex justify-between">
                <Toggle
                  searchType={searchType}
                  setSearchType={setSearchType}
                  setSelectedItems={setSelectedItems}
                />

                {selectedItems.length >= 10 && (
                  <button
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm flex items-center justify-center"
                    onClick={getRecommendations}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Generate"
                    )}
                  </button>
                )}
              </div>

              <SearchBar query={query} setQuery={setQuery} />
            </div>

            <div className="py-4">
              <SelectedItems
                selectedItems={selectedItems}
                toggleSelectItem={toggleSelectItem}
              />
            </div>

            <div className="pt-4 pb-20">
              <ResultsGrid
                results={results}
                toggleSelectItem={toggleSelectItem}
                selectedItems={selectedItems}
              />
            </div>
          </div>
        ) : (
          <>
            <RestartButton restartProcess={restartProcess} />
            <RecommendationsGrid
              recommendations={recommendations}
              searchType={searchType}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
