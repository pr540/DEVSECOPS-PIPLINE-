import json
import sqlite3
import os
import requests

# CONFIG
DB_PATH = "/tmp/cinebook.db"
JSON_DATA = "data/movies_archive.json"

def import_json():
    print(f"[*] Reading cinematic dataset from {JSON_DATA}...")
    with open(JSON_DATA, 'r') as f:
        movies = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get Categories
    cursor.execute("SELECT id, name FROM categories")
    cats = {name: cid for cid, name in cursor.fetchall()}

    for m in movies:
        cat_name = m.get('category', 'Modern Era (2001-2026)')
        cat_id = cats.get(cat_name, 2) # Default to Modern

        ia_id = m.get('ia_id', 'default')
        stream_url = f"https://archive.org/download/{ia_id}/{ia_id}.mp4"
        
        # Check if exists
        cursor.execute("SELECT id FROM movies WHERE title = ?", (m['title'],))
        if cursor.fetchone():
            print(f"[-] Skipping {m['title']} (already indexed)")
            continue

        print(f"[+] Indexing {m['title']} ({m['year']}) [{m['language']}]")
        cursor.execute("""
            INSERT INTO movies (title, description, rating, image, language, quality, video_url, download_url, year, category_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            m['title'],
            f"Archival node for {m['title']}. Language: {m['language']}. Industry: {m['country']}.",
            m.get('rating', 0.0),
            f"https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800", # Better fallback posters
            m['language'],
            "1080p",
            stream_url,
            f"https://archive.org/details/{ia_id}",
            m['year'],
            cat_id
        ))
    
    conn.commit()
    conn.close()
    print("[*] Neural Import Complete.")

def imdb_bulk_instructions():
    print("\n--- OPTION 2: IMDb BULK INSTRUCTIONS ---")
    print("1. Download 'title.basics.tsv.gz' and 'title.ratings.tsv.gz' from https://datasets.imdbws.com/")
    print("2. Unzip and use 'pandas' to merge them on 'tconst'.")
    print("3. Filter by startYear 1990-2026 and titleType 'movie'.")
    print("4. Map 'primaryTitle' to 'title' and 'startYear' to 'year'.")
    print("5. Run this script to ingest.")

if __name__ == "__main__":
    if not os.path.exists(JSON_DATA):
        print(f"[!] Error: {JSON_DATA} not found. Generate it first.")
    else:
        import_json()
        imdb_bulk_instructions()
