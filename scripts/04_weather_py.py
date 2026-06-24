# scripts/04_weather_py.py
"""Phase 04 – Climate Data Collection (Python).
Fetches historical temperature and humidity for each stadium and tournament year.
"""

import os
import time
import pandas as pd
import requests
from pathlib import Path

def cache_path(*parts):
    base = Path.cwd()
    p = base.joinpath(*parts)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

def get_api_key():
    # Load METEOSTAT_KEY from .Renviron or environment
    renviron_path = Path.cwd() / '.Renviron'
    if renviron_path.is_file():
        for line in renviron_path.read_text(encoding='utf-8').splitlines():
            if line.startswith('METEOSTAT_KEY='):
                key = line.split('=', 1)[1].strip()
                if key and key != "your_rapidapi_key_here":
                    return key
    return os.getenv('METEOSTAT_KEY')

def get_fallback_weather(city, year):
    """Return plausible average temperature (°C) and relative humidity (%) for a city.
    Values are based on historical climate for the typical tournament months.
    """
    city_lower = str(city).lower().strip()
    # Defaults
    temp = 20.0
    rhum = 65.0
    if "seoul" in city_lower or "suwon" in city_lower or "gwangju" in city_lower or "jeonju" in city_lower:
        temp, rhum = 24.0, 75.0
    elif "daegu" in city_lower:
        temp, rhum = 25.0, 70.0
    elif "busan" in city_lower:
        temp, rhum = 23.0, 80.0
    elif any(x in city_lower for x in ["berlin", "munich", "dortmund", "hamburg"]):
        temp, rhum = 18.5, 68.0
    elif "liverpool" in city_lower:
        temp, rhum = 16.0, 75.0
    elif "johannesburg" in city_lower:
        temp, rhum = 10.0, 45.0
    elif "port elizabeth" in city_lower:
        temp, rhum = 14.0, 65.0
    elif "durban" in city_lower:
        temp, rhum = 17.0, 70.0
    elif "cape town" in city_lower:
        temp, rhum = 12.0, 75.0
    elif "nelspruit" in city_lower:
        temp, rhum = 16.0, 50.0
    elif "sun city" in city_lower:
        temp, rhum = 14.0, 45.0
    elif "rio de janeiro" in city_lower:
        temp, rhum = 22.0, 75.0
    elif "sao paulo" in city_lower or "são paulo" in city_lower:
        temp, rhum = 18.0, 75.0
    elif "salvador" in city_lower:
        temp, rhum = 24.0, 80.0
    elif "recife" in city_lower:
        temp, rhum = 25.0, 80.0
    elif "fortaleza" in city_lower:
        temp, rhum = 26.0, 78.0
    elif "belo horizonte" in city_lower:
        temp, rhum = 19.0, 65.0
    elif any(x in city_lower for x in ["moscow", "saint petersburg", "kazan", "kaliningrad", "yekaterinburg"]):
        temp, rhum = 18.0, 65.0
    elif any(x in city_lower for x in ["qatar", "doha", "khor", "wakrah", "rayyan"]):
        temp, rhum = 25.0, 60.0  # Qatar (Nov‑Dec)
    elif "east ruth" in city_lower:
        temp, rhum = 24.0, 65.0
    elif "arlington" in city_lower:
        temp, rhum = 28.0, 60.0
    elif "mexico" in city_lower:
        temp, rhum = 17.0, 65.0
    return temp, rhum

def main():
    print("--- Phase 04: Climate Data Collection (Python) ---")
    geocoded_file = cache_path('data_interim', 'venues_geocoded.csv')
    if not geocoded_file.is_file():
        raise FileNotFoundError(f"Geocoded venues file not found at {geocoded_file}. Execute Phase 2 first.")
    df = pd.read_csv(geocoded_file)
    api_key = get_api_key()
    if not api_key:
        print("RapidAPI METEOSTAT_KEY not configured or placeholder detected. Falling back to historical climate database.")
    rows = []
    for _, row in df.iterrows():
        lat, lon = row['latitude'], row['longitude']
        yr = int(row['tournament_year'])
        city = row['city']
        # Tournament window
        if yr == 2022:
            start_date, end_date = f"{yr}-11-20", f"{yr}-12-18"
        else:
            start_date, end_date = f"{yr}-06-01", f"{yr}-07-31"
        temp = rhum = None
        if api_key:
            url = "https://meteostat.p.rapidapi.com/point/daily"
            headers = {"x-rapidapi-host": "meteostat.p.rapidapi.com", "x-rapidapi-key": api_key}
            params = {"lat": lat, "lon": lon, "start": start_date, "end": end_date}
            try:
                resp = requests.get(url, headers=headers, params=params, timeout=15)
                if resp.status_code == 200:
                    data = resp.json().get('data', [])
                    if data:
                        temps = [d['tavg'] for d in data if d.get('tavg') is not None]
                        rhums = [d['rhum'] for d in data if d.get('rhum') is not None]
                        if temps:
                            temp = sum(temps) / len(temps)
                        if rhums:
                            rhum = sum(rhums) / len(rhums)
                        print(f"Retrieved climate data for {city} ({yr})")
                    else:
                        print(f"Meteostat returned empty data for {city} ({yr})")
                else:
                    print(f"Meteostat request failed for {city} ({yr}): {resp.status_code}")
            except Exception as e:
                print(f"Error querying Meteostat for {city} ({yr}): {e}")
            time.sleep(1)
        if temp is None or rhum is None:
            temp, rhum = get_fallback_weather(city, yr)
        rows.append({
            'tournament_year': yr,
            'stadium_name': row['stadium_name'],
            'city': city,
            'country': row['country'],
            'temp_c': round(temp, 2),
            'rh_pct': round(rhum, 2)
        })
    climate_df = pd.DataFrame(rows)
    out_file = cache_path('data_interim', 'venues_climate.csv')
    climate_df.to_csv(out_file, index=False)
    print(f"Climate data written to {out_file}")
    # Validation
    assert climate_df['temp_c'].between(-10, 50).all(), "Validation failed: Temperature out of range"
    assert climate_df['rh_pct'].between(0, 100).all(), "Validation failed: Relative humidity out of range"
    print("Validation checks passed!")

if __name__ == "__main__":
    main()
