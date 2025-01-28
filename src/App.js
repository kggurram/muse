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
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
// import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [searchType, setSearchType] = useState("track");
  const [selectedItems, setSelectedItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
      {/* <SpeedInsights /> */}
      <div className="w-full md:w-2/3 lg:w-1/2 mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center font-lora pt-16 sm:pt-24 lg:pt-32">
          Muse.
        </h1>
      </div>

      {/* <div className="mt-40 2xl:w-1/4 xl:w-1/3 lg:w-2/5 md:w-3/5 sm:w-1/2 w-3/5 mx-auto text-xl text-gray-500">
        Sorry... core functionality has been{" "}
        <span className="text-yellow-700">deprecated</span> in Spotify's API;
        this site is <span className="text-red-800">no longer operational</span>
        .
        <div className="mt-16">
          Feel free to check out the repo:{" "}
          <a
            className="text-blue-500"
            target="_blank"
            href="https://github.com/kggurram/muse"
          >
            GitHub
          </a>
        </div>
      </div> */}

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
                    // onClick={getRecommendations}
                    onClick={handleShow}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Generate"
                    )}
                  </button>
                )}
                <Modal
                  show={show}
                  onHide={handleClose}
                  backdrop="static"
                  keyboard={true}
                  centered
                  className=""
                >
                  <Modal.Header
                    closeButton
                    className="text-white border-1 bg-neutral-700 border-0 border-slate-800 px-8 pt-4"
                  >
                    <Modal.Title>Sorry...</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-white text-lg border-1 border-0 border-slate-800 bg-neutral-700 px-8">
                    Core functionality has been{" "}
                    <span className="text-yellow-600">deprecated</span> in
                    Spotify's API; this site is{" "}
                    <span className="text-red-600">no longer operational</span>
                  </Modal.Body>
                  <Modal.Footer className="text-white border-1 border-0 border-slate-800 bg-neutral-700 px-8 pb-4">
                    <Button
                      href="https://github.com/kggurram/muse"
                      target="_blank"
                      variant="primary"
                    >
                      GitHub
                    </Button>
                  </Modal.Footer>
                </Modal>
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
