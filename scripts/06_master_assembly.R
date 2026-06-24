# Phase 06 — Master Table Assembly (R).
# Joins all interim data sources into the final `team_match_master.csv`.
# Validation checks are performed after each join to ensure row counts remain stable.


library(tidyverse)
library(readr)
library(janitor)

# Helper to build absolute paths relative to project root
cache_path <- function(...) {
  base <- normalizePath(".", winslash = "/")
  file.path(base, ...)
}

# Load interim data --------------------------------------------------------
goals_df          <- read_csv(cache_path("data_interim", "goals_df.csv"))
kaggle_matches    <- read_csv(cache_path("data_interim", "kaggle_matches_raw.csv"))
venues_geo        <- read_csv(cache_path("data_interim", "venues_geocoded.csv"))
venues_elev       <- read_csv(cache_path("data_interim", "venues_elevation.csv"))
venues_climate    <- read_csv(cache_path("data_interim", "venues_climate.csv"))
statsbomb_xg      <- read_csv(cache_path("data_interim", "statsbomb_xg.csv"))
team_schedule     <- read_csv(cache_path("data_interim", "team_schedule.csv"))
team_quality      <- read_csv(cache_path("data_interim", "team_quality_clean.csv"))

# Parse match_id from date/year to match goals_df, or reconstruct match_ids.
kaggle_matches <- kaggle_matches %>%
  mutate(stadium_name = sub(",.*", "", venue))

goals_df <- goals_df %>%
  rename(tournament_year = year) %>%
  left_join(kaggle_matches %>% select(year, home_team, away_team, stadium_name) %>%
              mutate(match_id = paste0(year, "_", row_number() - 1)), by = "match_id") %>%
  mutate(opponent = if_else(team == home_team, away_team, home_team)) %>%
  select(-home_team, -away_team, -year)

# Basic sanity checks ------------------------------------------------------
stopifnot(nrow(goals_df) > 0)
stopifcall <- function(cond, msg) if (!cond) stop(msg)

# Join steps ---------------------------------------------------------------
# 1. Join elevation (by stadium name)
master <- goals_df %>%
  left_join(venues_elev %>% select(stadium_name, city, country, elevation_m), by = "stadium_name")
stopifcall(nrow(master) == nrow(goals_df), "Row count changed after elevation join")

# 2. Join climate (by stadium name)
master <- master %>%
  left_join(venues_climate %>% select(stadium_name, temp_c, rh_pct), by = "stadium_name")
stopifcall(nrow(master) == nrow(goals_df), "Row count changed after climate join")

# 3. Join geocoding (lat/lon)
master <- master %>%
  left_join(venues_geo %>% select(stadium_name, latitude, longitude), by = "stadium_name")
stopifcall(nrow(master) == nrow(goals_df), "Row count changed after geocode join")

# 4. Join StatsBomb xG
statsbomb_xg_wide <- statsbomb_xg %>%
  pivot_wider(names_from = half, values_from = team_xg, names_prefix = "xg_") %>%
  rename(team_xg_1h = `xg_1H`, team_xg_2h = `xg_2H`)

master <- master %>%
  left_join(statsbomb_xg_wide, by = c("team" = "team", "tournament_year" = "year"))
stopifcall(nrow(master) == nrow(goals_df), "Row count changed after StatsBomb xG join")

# 5. Join Elo Quality and Adaptation flags
# Team Elo
master <- master %>%
  left_join(team_quality %>% select(Country, wc_year, rating, adapted),
            by = c("team" = "Country", "tournament_year" = "wc_year")) %>%
  rename(team_elo = rating, adapted_flag = adapted)
stopifcall(nrow(master) == nrow(goals_df), "Row count changed after team Elo join")

# Opponent Elo
master <- master %>%
  left_join(team_quality %>% select(Country, wc_year, rating) %>% rename(opp_elo = rating),
            by = c("opponent" = "Country", "tournament_year" = "wc_year")) %>%
  mutate(elo_diff = team_elo - opp_elo)
stopifcall(nrow(master) == nrow(goals_df), "Row count changed after opponent Elo join")

# 6. Join Travel and Rest fatigue parameters
master <- master %>%
  left_join(team_schedule %>% select(match_id, team, rest_days, travel_km), by = c("match_id", "team"))
stopifcall(nrow(master) == nrow(goals_df), "Row count changed after fatigue join")

# Final column clean-up ----------------------------------------------------
master <- master %>%
  rename(humidity = rh_pct) %>%
  select(
    year = tournament_year, match_id, stadium_name, city, country,
    latitude, longitude, elevation_m,
    team, opponent,
    team_elo, opp_elo, elo_diff,
    adapted_flag,
    rest_days, travel_km,
    temp_c, humidity,
    goals_for_1h, goals_for_2h, goals_against_1h, goals_against_2h,
    team_xg_1h, team_xg_2h
  )

# Validation gates ----------------------------------------------------------
temp_c_valid <- master$temp_c[!is.na(master$temp_c)]
rh_pct_valid <- master$humidity[!is.na(master$humidity)]
elevation_m_valid <- master$elevation_m[!is.na(master$elevation_m)]

stopifcall(all(between(temp_c_valid, -10, 50)), "Temperature out of plausible range")
stopifcall(all(between(rh_pct_valid, 0, 100)), "Relative humidity out of range")
stopifcall(all(elevation_m_valid >= 0), "Negative elevation detected")

# Write final master table --------------------------------------------------
output_path <- cache_path("data_final", "team_match_master.csv")
write_csv(master, output_path)
message("Master table written to ", output_path)

