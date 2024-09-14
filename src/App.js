import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import SelectedItems from "./components/SelectedItems";
import ResultsGrid from "./components/ResultsGrid";
import RecommendationsGrid from "./components/RecommendationsGrid";
import RestartButton from "./components/RestartButton";
// import ToggleButtons from "./components/Toggle";
import { searchSpotify } from "./services/spotify";
import Toggle from "./components/Toggle";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [searchType, setSearchType] = useState("track");
  const [selectedItems, setSelectedItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchCompleted, setSearchCompleted] = useState(false);

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
      setRecommendations([]);

      const response = await axios.post("http://localhost:5000/recommend", {
        selected_items: selectedItems,
        search_type: searchType,
      });

      setRecommendations(response.data || []);
      setSearchCompleted(true);
      setSelectedItems([]);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
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
    <div className="min-h-screen bg-neutral-950 text-white font-roboto">
      <div className="w-1/3 mx-auto">
        <h1 className="text-7xl text-center font-lora pt-40">Muse</h1>
      </div>

      <div className="p-4 w-1/3 mx-auto">
        {!searchCompleted ? (
          <div className="space-y-3 pt-20 ">
            <div className="w-1/2 mx-auto space-y-4">
              <div className="flow-root">
                <div className="float-left">
                  <Toggle
                    searchType={searchType}
                    setSearchType={setSearchType}
                    setSelectedItems={setSelectedItems}
                  />
                </div>

                {selectedItems.length >= 10 && (
                  <div className="text-center float-right">
                    <button
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm"
                      onClick={getRecommendations}
                    >
                      Generate
                    </button>
                  </div>
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
            <div className="pt-4">
              <ResultsGrid
                results={results}
                toggleSelectItem={toggleSelectItem}
                selectedItems={selectedItems}
              />
            </div>

            {/* {selectedItems.length >= 10 && (
              <div className="mt-8 text-center">
                <button
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg"
                  onClick={getRecommendations}
                >
                  Generate Recommendations
                </button>
              </div>
            )} */}
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
