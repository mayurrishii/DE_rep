import os
import pickle
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Netflix Movie Recommender")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIES_PKL = os.path.join(BASE_DIR, "movies_dict.pkl")
SIMILARITY_PKL = os.path.join(BASE_DIR, "similarity.pkl")
TMDB_API_KEY = "6f5063ef2e5f56af3a5f04aed5082430"

print("Loading dataset and similarity matrix...")
with open(MOVIES_PKL, "rb") as f:
    movies_data = pickle.load(f)

# Convert list of dicts or dataframe to uniform list of objects
if isinstance(movies_data, dict):
    # pandas to_dict(orient='records') or dict of columns
    import pandas as pd
    movies_df = pd.DataFrame(movies_data)
    movies_list = movies_df.to_dict(orient="records")
elif hasattr(movies_data, "to_dict"):
    movies_list = movies_data.to_dict(orient="records")
else:
    movies_list = movies_data

with open(SIMILARITY_PKL, "rb") as f:
    similarity_matrix = pickle.load(f)

# Create fast title to index lookup map
title_to_index = {str(m["title"]).lower().strip(): idx for idx, m in enumerate(movies_list)}
title_exact_map = {str(m["title"]).lower().strip(): str(m["title"]) for m in movies_list}

print(f"Successfully loaded {len(movies_list)} movies.")

def fetch_tmdb_details(movie_id: int):
    """Fetch poster, backdrop, overview, vote_average, and release_date from TMDB API."""
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&language=en-US"
    fallback_poster = "https://via.placeholder.com/500x750/1f1f1f/ffffff?text=No+Poster+Available"
    fallback_backdrop = "https://via.placeholder.com/1280x720/1f1f1f/ffffff?text=No+Backdrop"
    
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            poster_path = data.get("poster_path")
            backdrop_path = data.get("backdrop_path")
            
            poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else fallback_poster
            backdrop_url = f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else fallback_backdrop
            
            genres = [g["name"] for g in data.get("genres", [])]
            
            return {
                "poster_url": poster_url,
                "backdrop_url": backdrop_url,
                "overview": data.get("overview", ""),
                "vote_average": round(data.get("vote_average", 0.0), 1),
                "vote_count": data.get("vote_count", 0),
                "release_date": data.get("release_date", "")[:4] if data.get("release_date") else "N/A",
                "runtime": data.get("runtime", 0),
                "genres": genres,
                "tagline": data.get("tagline", "")
            }
    except Exception as e:
        print(f"Error fetching TMDB data for movie_id {movie_id}: {e}")
        
    return {
        "poster_url": fallback_poster,
        "backdrop_url": fallback_backdrop,
        "overview": "Overview unavailable.",
        "vote_average": 0.0,
        "vote_count": 0,
        "release_date": "N/A",
        "runtime": 0,
        "genres": [],
        "tagline": ""
    }

@app.get("/api/movies")
def get_all_movies():
    """Return all movie titles for autocomplete."""
    titles = [m["title"] for m in movies_list]
    return {"count": len(titles), "titles": titles}

@app.get("/api/recommend")
def get_recommendations(title: str = Query(..., description="Movie title to get recommendations for"), top_n: int = 10):
    """Compute top N recommendations for a given movie title."""
    clean_title = title.lower().strip()
    if clean_title not in title_to_index:
        # Try fuzzy match
        matches = [t for t in title_to_index if clean_title in t]
        if matches:
            clean_title = matches[0]
        else:
            raise HTTPException(status_code=404, detail=f"Movie '{title}' not found in database.")
    
    idx = title_to_index[clean_title]
    target_movie = movies_list[idx]
    
    # Calculate similarity scores
    scores = list(enumerate(similarity_matrix[idx]))
    sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
    
    # Target movie TMDB info
    target_details = fetch_tmdb_details(target_movie["movie_id"])
    target_info = {
        "movie_id": target_movie["movie_id"],
        "title": target_movie["title"],
        **target_details
    }
    
    # Top N recommended movies (skipping index 0 which is the movie itself)
    recommendations = []
    for item_idx, sim_score in sorted_scores[1:top_n+1]:
        rec_movie = movies_list[item_idx]
        rec_details = fetch_tmdb_details(rec_movie["movie_id"])
        recommendations.append({
            "movie_id": rec_movie["movie_id"],
            "title": rec_movie["title"],
            "similarity_score": round(float(sim_score) * 100, 1),
            **rec_details
        })
        
    return {
        "target_movie": target_info,
        "recommendations": recommendations
    }

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

# Serve static directory if needed
app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
