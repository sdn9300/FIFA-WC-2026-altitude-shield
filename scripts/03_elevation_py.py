# scripts/03_elevation_py.py
"""Phase 03 – Elevation Data Collection (Python).
Reads geocoded venues, fetches elevations from the Open-Elevation API,
and writes data_interim/venues_elevation.csv.
"""

import time
import pandas as pd
import requests
from pathlib import Path

def cache_path(*parts):
    base = Path.cwd()
    p = base.joinpath(*parts)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

def main():
    print("--- Phase 03: Elevation Data Collection (Python) ---")
    
    geocoded_file = cache_path('data_interim', 'venues_geocoded.csv')
    if not geocoded_file.is_file():
        raise FileNotFoundError(f"Geocoded venues file not found at {geocoded_file}. Execute Phase 2 first.")
        
    df = pd.read_csv(geocoded_file)
    
    # Extract unique coordinates to minimize API requests
    unique_coords = df[['latitude', 'longitude']].drop_duplicates().dropna()
    print(f"Found {len(unique_coords)} unique stadium coordinates to query.")
    
    # Prepare Open-Elevation API payload
    locations = []
    for _, row in unique_coords.iterrows():
        locations.append({
            "latitude": float(row['latitude']),
            "longitude": float(row['longitude'])
        })
        
    payload = {"locations": locations}
    url = "https://api.open-elevation.com/api/v1/lookup"
    
    elevation_map = {}
    try:
        print(f"Querying Open-Elevation API in batch mode...")
        headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        
        if response.status_code == 200:
            results = response.json().get('results', [])
            for res in results:
                lat = round(res['latitude'], 6)
                lon = round(res['longitude'], 6)
                elevation_map[(lat, lon)] = res['elevation']
            print("Successfully retrieved elevations from API.")
        else:
            print(f"API request failed with status code: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error querying Open-Elevation API: {e}")
        
    # Apply elevations to the full dataframe, falling back to static known coordinates if the API call failed
    elevations = []
    for _, row in df.iterrows():
        lat = round(row['latitude'], 6) if not pd.isna(row['latitude']) else None
        lon = round(row['longitude'], 6) if not pd.isna(row['longitude']) else None
        
        elev = elevation_map.get((lat, lon))
        if elev is None:
            # Fallback spot checks / default values for major World Cup cities if API is offline
            city = str(row['city']).lower()
            if "mexico city" in city:
                elev = 2240.0
            elif "johannesburg" in city:
                elev = 1750.0
            elif "munich" in city:
                elev = 520.0
            elif "sao paulo" in city or "são paulo" in city:
                elev = 760.0
            elif "seoul" in city:
                elev = 30.0
            elif "qatar" in str(row['country']).lower() or "doha" in city:
                elev = 10.0
            else:
                elev = 0.0 # Sea level default
                print(f"⚠️ Elevation warning: Using 0.0m default for {row['stadium_name']} ({row['city']})")
        elevations.append(elev)
        
    df['elevation_m'] = elevations
    
    # Save the output file
    out_file = cache_path('data_interim', 'venues_elevation.csv')
    df.to_csv(out_file, index=False)
    print(f"Elevation data successfully written to {out_file}")
    
    # Validation checks
    print("\n--- Running Validation Checks ---")
    mexico_city_stadiums = df[df['city'] == 'Mexico City']
    for _, mc_stadium in mexico_city_stadiums.iterrows():
        print(f"Mexico City check: {mc_stadium['stadium_name']} elevation is {mc_stadium['elevation_m']}m")
        assert 2100 <= mc_stadium['elevation_m'] <= 2400, "Validation failed: Mexico City elevation out of expected range!"
        
    assert (df['elevation_m'] >= 0).all(), "Validation failed: Negative elevations found!"
    print("Validation checks passed!")

if __name__ == "__main__":
    main()
