import os
import pandas as pd
import math

def cache_path(*paths):
    """Build absolute path relative to project root."""
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    return os.path.join(base, *paths)

# Load data files
goals_path = cache_path('data_interim', 'goals_df.csv')
venues_geo_path = cache_path('data_interim', 'venues_geocoded.csv')
kaggle_matches_path = cache_path('data_interim', 'kaggle_matches_raw.csv')
team_schedule_path = cache_path('data_interim', 'team_schedule.csv')

# Read CSVs
goals_df = pd.read_csv(goals_path)
venues_geo = pd.read_csv(venues_geo_path)
kaggle_matches = pd.read_csv(kaggle_matches_path)

# Map match_id to date and venue in kaggle_matches
# Construct match_id exactly as we did in master join
kaggle_matches['stadium_name'] = kaggle_matches['venue'].str.replace(r',.*', '', regex=True)
kaggle_matches['match_id'] = kaggle_matches['year'].astype(str) + "_" + (kaggle_matches.index).astype(str)

# Select relevant columns from kaggle_matches to join with goals_df
matches_info = kaggle_matches[['match_id', 'date', 'stadium_name']]

# Merge goals_df with date and stadium info
merged = goals_df.merge(matches_info, on='match_id', how='left')

# Merge coordinates from venues_geo
merged = merged.merge(venues_geo[['stadium_name', 'latitude', 'longitude']], on='stadium_name', how='left')

# Ensure wc_year exists and match date is parsed
merged['wc_year'] = merged['year']
merged['date'] = pd.to_datetime(merged['date'])

# Compute rest days: group by team and wc_year, sort by date
merged = merged.sort_values(['team', 'wc_year', 'date'])
merged['rest_days'] = merged.groupby(['team', 'wc_year'])['date'].diff().dt.days
merged['rest_days'] = merged['rest_days'].fillna(-1).astype(int)

# Haversine distance in km
def haversine(lat1, lon1, lat2, lon2):
    if pd.isna(lat1) or pd.isna(lon1) or pd.isna(lat2) or pd.isna(lon2):
        return pd.NA
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    km = 6371 * 2 * math.asin(math.sqrt(a))
    return km

# Compute travel distance from previous match
merged['prev_lat'] = merged.groupby(['team', 'wc_year'])['latitude'].shift(1)
merged['prev_lon'] = merged.groupby(['team', 'wc_year'])['longitude'].shift(1)
merged['travel_km'] = merged.apply(lambda r: haversine(r['prev_lat'], r['prev_lon'], r['latitude'], r['longitude']), axis=1)

# Save updated schedule
merged.to_csv(team_schedule_path, index=False)
print(f"Updated team schedule written to {team_schedule_path}")

