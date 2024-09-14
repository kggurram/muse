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

# Fetch similar tracks based on albums, validate, and handle missing/empty seed tracks
def fetch_similar_tracks_from_albums(token, seed_albums, total_tracks=100):
    recommendations_url = 'https://api.spotify.com/v1/recommendations'
    headers = {'Authorization': f'Bearer {token}'}

    seed_tracks = []

    # Extract more tracks from each selected album
    for album_id in seed_albums:
        album_tracks_url = f'https://api.spotify.com/v1/albums/{album_id}/tracks'
        album_tracks_response = requests.get(album_tracks_url, headers=headers)
        album_tracks_data = album_tracks_response.json()

        if 'items' in album_tracks_data:
            # Extract all tracks instead of limiting to 5
            track_ids = [track['id'] for track in album_tracks_data['items']]
            if track_ids:
                seed_tracks.extend(track_ids)  # Use as many tracks as possible
            else:
                print(f"Album {album_id} has no tracks to use for recommendations.")
        else:
            print(f"Error: 'items' not found for album {album_id}")

    if not seed_tracks:
        print("No valid tracks found to use as seeds for recommendations.")
        return []

    # Paginate seed tracks into chunks of 5 and request for recommendations in batches
    all_recommended_tracks = []
    for i in range(0, len(seed_tracks), 5):
        chunk = seed_tracks[i:i+5]  # Get a chunk of up to 5 seed tracks (Spotify's limit)
        params = {
            'seed_tracks': ','.join(chunk),  # Use the chunk of seed tracks
            'limit': 100,  # Set the limit to maximum of 100
        }
        
        response = requests.get(recommendations_url, headers=headers, params=params)
        data = response.json()

        if 'tracks' in data:
            all_recommended_tracks.extend(data['tracks'])  # Add the recommended tracks to the list
        else:
            # Log the error response from Spotify to understand why it failed
            print(f"Error fetching recommendations: {data}")

        # Stop if we have collected enough tracks
        if len(all_recommended_tracks) >= total_tracks:
            break

    # Return the collected recommendations, truncated to the total_tracks limit
    return all_recommended_tracks[:total_tracks]



# Fetch similar songs (remains unchanged)
def fetch_similar_songs(token, seed_tracks, total_songs=100):
    recommendations_url = 'https://api.spotify.com/v1/recommendations'
    headers = {'Authorization': f'Bearer {token}'}

    all_songs = []
    for i in range(0, len(seed_tracks), 5):
        seed_chunk = seed_tracks[i:i+5]
        params = {'seed_tracks': ','.join(seed_chunk), 'limit': total_songs}
        response = requests.get(recommendations_url, headers=headers, params=params)
        data = response.json()

        if 'tracks' in data:
            all_songs.extend(data['tracks'])
        else:
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
        # Fetch audio features for tracks
        tracks_response = requests.get(tracks_url, headers=headers, params={'ids': ','.join(item_ids)})
        tracks_data = tracks_response.json()

        if 'tracks' not in tracks_data:
            print(f"Error: 'tracks' key not found in response: {tracks_data}")
            return combined_data  # Return empty list

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
        # Fetch tracks and audio features for albums
        for album_id in item_ids:
            album_tracks_url = f'https://api.spotify.com/v1/albums/{album_id}/tracks'
            album_tracks_response = requests.get(album_tracks_url, headers=headers)
            album_tracks_data = album_tracks_response.json()

            if 'items' not in album_tracks_data:
                print(f"Error: 'items' key not found for album {album_id}")
                continue

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

def train_knn_model(audio_features, neighbors=15):
    global knn_model, knn_features
    knn_features = extract_relevant_features(audio_features)
    if len(knn_features) == 0:
        raise ValueError("No valid audio features to train the model")

    n_neighbors = min(neighbors, len(knn_features))
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
    recommended_albums = []
    for track in recommended_tracks:
        # Safely access album field to avoid KeyError
        album = track.get('track', {}).get('album')
        if album and album['id'] not in selected_album_ids:
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

    # Fetch tracks and audio features based on the selected search type
    combined_data.extend(get_tracks_and_audio_features(item_ids, search_type, token))

    if search_type == 'track':
        # Fetch similar songs for track-based search
        similar_songs = fetch_similar_songs(token, seed_tracks=item_ids, total_songs=100)
        combined_data.extend(get_tracks_and_audio_features([song['id'] for song in similar_songs], 'track', token))
        train_knn_model([item['audio_features'] for item in combined_data], 15)
        recommendations = recommend_tracks([item['audio_features'] for item in combined_data], combined_data, selected_ids=item_ids)

    elif search_type == 'album':
        # Fetch similar tracks based on album selection, validate and fetch
        similar_tracks = fetch_similar_tracks_from_albums(token, seed_albums=item_ids, total_tracks=100)
        
        if not similar_tracks:
            print("No similar tracks found for the selected albums.")
            return jsonify([])  # No recommendations, return empty response
        
        combined_data.extend(get_tracks_and_audio_features([track['id'] for track in similar_tracks], 'track', token))
        train_knn_model([item['audio_features'] for item in combined_data], 30)

        # Get track recommendations and convert to albums
        recommended_tracks = recommend_tracks([item['audio_features'] for item in combined_data], combined_data, selected_ids=item_ids)
        recommendations = recommend_albums_from_tracks(recommended_tracks, selected_album_ids=item_ids)
        # print(recommendations)

    return jsonify(recommendations)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Get port from environment, fallback to 5000
    app.run(host='0.0.0.0', port=port, debug=True)
