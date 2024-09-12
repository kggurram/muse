import axios from "axios";

// Fetch the Spotify token from your backend (or generate it directly if using client credentials flow)
const fetchSpotifyToken = async () => {
  const response = await axios.get("http://localhost:3001/token");
  return response.data.access_token;
};

// Search Spotify for songs or albums
const searchSpotify = async (query, type = "track") => {
  const token = await fetchSpotifyToken();
  const response = await axios.get("https://api.spotify.com/v1/search", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      q: query,
      type: type, // 'track' or 'album'
      limit: 50, // Adjust the number of results if necessary
    },
  });
  return response.data;
};

// Fetch audio features for a list of song IDs
const getAudioFeatures = async (ids) => {
  const token = await fetchSpotifyToken();
  const response = await axios.get(
    `https://api.spotify.com/v1/audio-features`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        ids: ids.join(","), // Pass song IDs as a comma-separated string
      },
    }
  );
  return response.data.audio_features;
};

export { searchSpotify, getAudioFeatures };
