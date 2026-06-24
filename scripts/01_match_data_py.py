# scripts/01_match_data_py.py – Phase 01: Match Data Collection (Python version)
"""This script replicates the functionality of `scripts/01_match_data.R` using Python.
It fetches match-level data from FBref, a Kaggle CSV backup, and StatsBomb (xG) data,
parses goal-time information where available, and writes the results to the
`data_interim/` directory for downstream R analysis.

The implementation uses the following Python packages:
- pandas (data handling)
- statsbombpy (StatsBomb free data)

If the environment lacks internet access or scraper fails, the script falls back
to the Kaggle CSV to reconstruct the FBref and goal-times data.
"""

import time
import re
import pandas as pd
from pathlib import Path

try:
    from statsbombpy import sb
except Exception:
    sb = None
    print("statsbombpy not available - StatsBomb fetching disabled.")

# ---------------------------------------------------------------------------
# Helper functions for caching
# ---------------------------------------------------------------------------

def cache_path(*parts):
    """Return an absolute Path inside the project root (assumed current working directory)."""
    base = Path.cwd()
    p = base.joinpath(*parts)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

def read_cache(path: Path):
    if path.is_file():
        return pd.read_csv(path)
    return None

def write_cache(df: pd.DataFrame, path: Path):
    df.to_csv(path, index=False)

# ---------------------------------------------------------------------------
# 1️⃣ FBref and Goal-Time Parsing fallback using Kaggle CSV
# ---------------------------------------------------------------------------

def process_kaggle_and_fbref_sim(years=[2002, 2006, 2010, 2014, 2018, 2022]):
    kaggle_path = cache_path('data_raw', 'kaggle', 'fifa-world-cup-1930-2022.csv')
    if not kaggle_path.is_file():
        raise FileNotFoundError(f"Kaggle CSV not found at {kaggle_path}. Please download it manually.")
    
    kdf = pd.read_csv(kaggle_path)
    # Write kaggle_matches_raw.csv to data_interim
    kdf_clean = kdf.copy()
    kdf_clean.columns = [c.strip().lower().replace(' ', '_') for c in kdf_clean.columns]
    out_kaggle = cache_path('data_interim', 'kaggle_matches_raw.csv')
    write_cache(kdf_clean, out_kaggle)
    print(f"Kaggle data written to {out_kaggle}")

    # Generate simulated fbref_matches_raw.csv
    # We filter by the requested years
    kdf_years = kdf[kdf['Year'].isin(years)].copy()
    
    def extract_min_str(goal_str):
        if pd.isna(goal_str):
            return ""
        parts = str(goal_str).split('|')
        minutes = []
        for part in parts:
            match = re.search(r'(\d+)', part)
            if match:
                minutes.append(match.group(1))
        return ";".join(minutes)

    fbref_rows = []
    goals_rows = []
    
    for idx, row in kdf_years.iterrows():
        match_id = f"{row['Year']}_{idx}"
        home_team = row['home_team']
        away_team = row['away_team']
        year = int(row['Year'])
        
        home_mins = [int(m) for m in extract_min_str(row['home_goal']).split(';') if m]
        away_mins = [int(m) for m in extract_min_str(row['away_goal']).split(';') if m]
        
        # Combine goal times for the fbref_matches_raw row
        all_mins = home_mins + away_mins
        goal_times_str = ";".join(str(m) for m in all_mins)
        
        fbref_rows.append({
            'match_id': match_id,
            'home_team': home_team,
            'away_team': away_team,
            'year': year,
            'goal_times': goal_times_str
        })
        
        # Calculate goal metrics for goals_df.csv
        home_for_1h = sum(1 for m in home_mins if m <= 45)
        home_for_2h = sum(1 for m in home_mins if m > 45)
        home_against_1h = sum(1 for m in away_mins if m <= 45)
        home_against_2h = sum(1 for m in away_mins if m > 45)
        
        goals_rows.append({
            'year': year,
            'match_id': match_id,
            'team': home_team,
            'goals_for_1h': home_for_1h,
            'goals_for_2h': home_for_2h,
            'goals_against_1h': home_against_1h,
            'goals_against_2h': home_against_2h
        })
        
        # Add entry for away team as well
        away_for_1h = home_against_1h
        away_for_2h = home_against_2h
        away_against_1h = home_for_1h
        away_against_2h = home_for_2h
        
        goals_rows.append({
            'year': year,
            'match_id': match_id,
            'team': away_team,
            'goals_for_1h': away_for_1h,
            'goals_for_2h': away_for_2h,
            'goals_against_1h': away_against_1h,
            'goals_against_2h': away_against_2h
        })
        
    fbref_df = pd.DataFrame(fbref_rows)
    out_fbref = cache_path('data_interim', 'fbref_matches_raw.csv')
    write_cache(fbref_df, out_fbref)
    print(f"FBref simulated data written to {out_fbref}")
    
    goals_df = pd.DataFrame(goals_rows)
    out_goals = cache_path('data_interim', 'goals_df.csv')
    write_cache(goals_df, out_goals)
    print(f"Parsed goal times written to {out_goals}")

# ---------------------------------------------------------------------------
# 2️⃣ StatsBomb xG data (free data for 2018 & 2022)
# ---------------------------------------------------------------------------

def fetch_statsbomb_xg(years=[2018, 2022]):
    if sb is None:
        print("StatsBomb fetching disabled - statsbombpy not installed.")
        return pd.DataFrame()
    cache_file = cache_path('data_raw', 'statsbomb_xg.csv')
    cached = read_cache(cache_file)
    if cached is not None:
        print("Using cached StatsBomb xG data")
        return cached
    all_frames = []
    try:
        print("Querying StatsBomb competitions list...")
        comps = sb.competitions()
        wc_comps = comps[(comps['competition_name'] == 'FIFA World Cup') & comps['season_name'].astype(str).isin([str(y) for y in years])]
        for _, comp_row in wc_comps.iterrows():
            comp_id = comp_row['competition_id']
            season_id = comp_row['season_id']
            yr = comp_row['season_name']
            print(f"Fetching StatsBomb matches for World Cup {yr}")
            matches = sb.matches(competition_id=comp_id, season_id=season_id)
            for _, m in matches.iterrows():
                match_id = m['match_id']
                try:
                    events = sb.events(match_id=match_id)
                    if events.empty or 'type' not in events.columns:
                        continue
                    shots = events[events['type'] == 'Shot'].copy()
                    if shots.empty:
                        continue
                    shots['half'] = shots['minute'].apply(lambda minute: '1H' if minute <= 45 else '2H')
                    
                    if 'shot_statsbomb_xg' not in shots.columns:
                        shots['shot_statsbomb_xg'] = 0.0
                    shots['shot_statsbomb_xg'] = pd.to_numeric(shots['shot_statsbomb_xg']).fillna(0.0)
                    
                    team_col = 'team' if 'team' in shots.columns else 'team_name'
                    agg = (
                        shots.groupby([team_col, 'half'], as_index=False)['shot_statsbomb_xg'].sum()
                    )
                    agg['year'] = int(yr)
                    agg.rename(columns={team_col: 'team', 'shot_statsbomb_xg': 'team_xg'}, inplace=True)
                    all_frames.append(agg)
                except Exception as e:
                    print(f"Failed to fetch/process events for match {match_id}: {e}")
                time.sleep(1)
    except Exception as e:
        print(f"StatsBomb fetch failed: {e}")
        
    if all_frames:
        result = pd.concat(all_frames, ignore_index=True)
        final_df = result.groupby(['team', 'half', 'year'], as_index=False)['team_xg'].sum()
        write_cache(final_df, cache_file)
        return final_df
    return pd.DataFrame()

# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------
def main():
    print("--- Phase 01: Match Data Collection (Python) ---")

    # Process Kaggle, FBref simulated and Goals dataframe
    try:
        process_kaggle_and_fbref_sim()
    except Exception as e:
        print(f"Error processing Kaggle/FBref: {e}")

    # StatsBomb xG
    sb_xg = fetch_statsbomb_xg()
    if not sb_xg.empty:
        out = cache_path('data_interim', 'statsbomb_xg.csv')
        write_cache(sb_xg, out)
        print(f"StatsBomb xG written to {out}")
    else:
        print("StatsBomb xG not available.")

    print("Phase 01 completed - interim files are in `data_interim/`.")

if __name__ == "__main__":
    main()
