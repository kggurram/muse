require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors"); // Import CORS

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

const clientId = process.env.ID;
const clientSecret = process.env.Secret;

app.get("/token", async (req, res) => {
  try {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const headers = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
    };
    const body = "grant_type=client_credentials";

    const response = await axios.post(tokenUrl, body, headers);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching token", error);
    res.status(500).send("Error fetching token");
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
