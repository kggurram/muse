# Muse - A Spotify-Powered Music Recommendation App

**Muse** is a sleek, modern web app designed to provide personalized music recommendations. Powered by the **Spotify API**, Muse leverages both track and album data to generate insightful suggestions for the user. Built using **React**, **TailwindCSS**, and a backend powered by **Express.js**, Muse showcases a seamless integration of user experience, music discovery, and data processing.

---

## Features

- **Track and Album Search:** Users can easily search for songs or albums and toggle between the two.
- **Personalized Recommendations:** Based on your selected tracks or albums, Muse generates suggestions using Spotify’s rich data ecosystem.
- **Preview Playback:** Users can preview song clips directly from the recommendation results.
- **Real-Time Selection Management:** Tracks and albums can be selected and unselected easily, providing a dynamic and interactive experience.
- **Loading Indicator:** Visual feedback is provided during API requests, ensuring a smooth user experience.
- **Responsive Design:** Muse has been designed with responsiveness in mind, ensuring seamless usability across devices.

---

## Stack

- **Frontend:**
  - React (functional components with hooks)
  - TailwindCSS (for a modern, responsive UI)
  - Material UI (for components like buttons and loaders)
  - React Icons (for consistent and scalable icon usage)
- **Backend:**
  - Node.js with Express.js (REST API for handling token authentication)
  - Axios (for making requests to the Spotify API)
  - Dotenv (to manage sensitive credentials via environment variables)
- **Data:**
  - Spotify API (client credentials flow to access song and album data)
  - Python (for machine learning model integration using a KNN model for song similarity recommendations, not covered in this repo)

---

## Deployment & Hosting

Muse is hosted using **Render** and **Vercel**, a platforms that support frontend (React) and backend (Express.js) services. The backend is responsible for handling Spotify token generation and interfacing with Spotify’s API to fetch recommendations.

## API

Muse’s backend relies on **Spotify’s Client Credentials Flow** to fetch access tokens. These tokens are then used to access Spotify’s track and album data. Axios is used to handle these requests, and CORS is enabled for seamless communication between the frontend and backend services.
