from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
import os

app = Flask(__name__)
CORS(app)


client_id = os.environ.get('ID')
client_secret = os.environ.get('Secret')

FEATURE_KEYS = ['danceability', 'energy', 'valence', 'tempo', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness']

knn_model = None
knn_features = []

def get_spotify_token():
    auth_url = 'https://accounts.spotify.com/api/token'
    auth_response = requests.post(auth_url, {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
    })

    auth_response_data = auth_response.json()
    if 'access_token' in auth_response_data:
        return auth_response_data['access_token']
    else:
        raise Exception("Failed to fetch Spotify access token")

def fetch_similar_tracks_from_albums(token, seed_albums, total_tracks=150):
    recommendations_url = 'https://api.spotify.com/v1/recommendations'
    headers = {'Authorization': f'Bearer {token}'}

    seed_tracks = []
    
    # Extract up to 5 tracks from each selected album
    for album_id in seed_albums:
        album_tracks_url = f'https://api.spotify.com/v1/albums/{album_id}/tracks'
        album_tracks_response = requests.get(album_tracks_url, headers=headers)
        album_tracks_data = album_tracks_response.json()

        if 'items' in album_tracks_data:
            track_ids = [track['id'] for track in album_tracks_data['items']]
            seed_tracks.extend(track_ids[:5])  # Use up to 5 tracks from each album
        else:
            print(f"Error: 'items' not found for album {album_id}")

    if not seed_tracks:
        print("No valid tracks found to use as seeds for recommendations.")
        return []

    # Fetch recommendations using the seed tracks
    params = {
        'seed_tracks': ','.join(seed_tracks[:5]),  # Use up to 5 seed tracks
        'limit': total_tracks
    }

    response = requests.get(recommendations_url, headers=headers, params=params)
    data = response.json()

    if 'tracks' in data:
        return data['tracks']  # Return the recommended tracks
    else:
        # Log the error response from Spotify to understand why it failed
        print(f"Error fetching recommendations: {data}")
        return []

def fetch_similar_songs(token, seed_tracks, total_songs=150):
    recommendations_url = 'https://api.spotify.com/v1/recommendations'
    headers = {'Authorization': f'Bearer {token}'}

    all_songs = []
    for i in range(0, len(seed_tracks), 5):
        seed_chunk = seed_tracks[i:i+5]
        params = {'seed_tracks': ','.join(seed_chunk), 'limit': min(50, total_songs)}
        response = requests.get(recommendations_url, headers=headers, params=params)
        data = response.json()

        if 'tracks' in data:
            all_songs.extend(data['tracks'])
        else:
            # Log the response data for debugging
            print(f"Error fetching tracks: {data}")

        if len(all_songs) >= total_songs:
            break

    return all_songs[:total_songs]

def get_tracks_and_audio_features(item_ids, search_type, token):
    tracks_url = f'https://api.spotify.com/v1/tracks'
    features_url = f'https://api.spotify.com/v1/audio-features'
    headers = {'Authorization': f'Bearer {token}'}
    combined_data = []

    if search_type == "track":
        # If we're working with tracks, fetch their audio features directly
        tracks_response = requests.get(tracks_url, headers=headers, params={'ids': ','.join(item_ids)})
        tracks_data = tracks_response.json()

        # Check for the 'tracks' key before proceeding
        if 'tracks' not in tracks_data:
            print(f"Error: 'tracks' key not found in response: {tracks_data}")
            return combined_data  # Return an empty list to prevent KeyError

        # Fetch audio features
        features_response = requests.get(features_url, headers=headers, params={'ids': ','.join(item_ids)})
        features_data = features_response.json()

        # Combine track and audio features
        for track, feature in zip(tracks_data['tracks'], features_data.get('audio_features', [])):
            if feature is not None:
                combined_data.append({
                    'track': track,
                    'audio_features': feature
                })

    elif search_type == "album":
        # For albums, fetch tracks for each album and their audio features
        for album_id in item_ids:
            album_tracks_url = f'https://api.spotify.com/v1/albums/{album_id}/tracks'
            album_tracks_response = requests.get(album_tracks_url, headers=headers)
            album_tracks_data = album_tracks_response.json()

            if 'items' not in album_tracks_data:
                continue  # Skip this album if no tracks were found

            track_ids = [track['id'] for track in album_tracks_data['items']]

            if track_ids:
                # Fetch audio features for the album's tracks
                features_response = requests.get(features_url, headers=headers, params={'ids': ','.join(track_ids[:100])})
                features_data = features_response.json()

                for track, feature in zip(album_tracks_data['items'], features_data.get('audio_features', [])):
                    if feature is not None:
                        combined_data.append({
                            'track': track,
                            'audio_features': feature
                        })

    return combined_data

def extract_relevant_features(audio_features):
    valid_features = [song for song in audio_features if song is not None]
    if len(valid_features) == 0:
        return np.array([])

    feature_matrix = np.array([[song[feature] for feature in FEATURE_KEYS] for song in valid_features])
    scaler = StandardScaler()
    return scaler.fit_transform(feature_matrix)

def train_knn_model(audio_features):
    global knn_model, knn_features
    knn_features = extract_relevant_features(audio_features)
    if len(knn_features) == 0:
        raise ValueError("No valid audio features to train the model")

    n_neighbors = min(10, len(knn_features))
    knn_model = NearestNeighbors(n_neighbors=n_neighbors)
    knn_model.fit(knn_features)

def recommend_tracks(selected_audio_features, full_audio_features, selected_ids):
    global knn_model
    if knn_model is None:
        return []

    selected_features = extract_relevant_features(selected_audio_features)
    avg_features = np.mean(selected_features, axis=0)
    distances, indices = knn_model.kneighbors([avg_features])

    valid_recommendations = [
        full_audio_features[i] for i in indices[0]
        if full_audio_features[i] is not None and 'track' in full_audio_features[i]
    ]
    recommendations = [rec for rec in valid_recommendations if rec['track']['id'] not in selected_ids]
    return recommendations

def recommend_albums_from_tracks(recommended_tracks, selected_album_ids):
    # Extract the album IDs from the recommended tracks and use that as album recommendations
    recommended_albums = []
    for track in recommended_tracks:
        album = track['track']['album']
        if album['id'] not in selected_album_ids:
            recommended_albums.append(album)

    return recommended_albums

@app.route('/recommend', methods=['POST'])
def recommend():
    global knn_model, knn_features
    knn_model = None
    knn_features = []
    combined_data = []
    data = request.json
    selected_items = data.get('selected_items', [])
    search_type = data.get('search_type', 'track')
    token = get_spotify_token()
    item_ids = [item['id'] for item in selected_items]

    # Fetch audio features and tracks based on selected search type
    combined_data.extend(get_tracks_and_audio_features(item_ids, search_type, token))

    if search_type == 'track':
        # Fetch similar songs for track-based search
        similar_songs = fetch_similar_songs(token, seed_tracks=item_ids, total_songs=150)
        combined_data.extend(get_tracks_and_audio_features([song['id'] for song in similar_songs], 'track', token))
        train_knn_model([item['audio_features'] for item in combined_data])
        recommendations = recommend_tracks([item['audio_features'] for item in combined_data], combined_data, selected_ids=item_ids)

    elif search_type == 'album':
        # Fetch tracks from the selected albums, fetch similar tracks, and train the model
        similar_tracks = fetch_similar_tracks_from_albums(token, seed_albums=item_ids, total_tracks=150)
        combined_data.extend(get_tracks_and_audio_features([track['id'] for track in similar_tracks], 'track', token))
        train_knn_model([item['audio_features'] for item in combined_data])

        # Get recommendations from the KNN model
        recommended_tracks = recommend_tracks([item['audio_features'] for item in combined_data], combined_data, selected_ids=item_ids)

        # Convert recommended tracks to albums
        recommendations = recommend_albums_from_tracks(recommended_tracks, selected_album_ids=item_ids)

    return jsonify(recommendations)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
