# scripts/05_travel_rest.R
# Phase 05 — Travel & Rest calculations.
# This script computes rest days between matches for each team and the travel distance (km)
# from the previous venue using the Haversine formula. It reads a pre‑existing
# `team_schedule.csv` (or builds it from `goals_df` and venue coordinates) and writes the
# updated schedule back to `data_interim/team_schedule.csv`.

library(tidyverse)
library(geosphere)  # for distHaversine

# Helper to build absolute paths relative to project root
cache_path <- function(...) {
  base <- normalizePath(".", winslash = "/")
  file.path(base, ...)
}

# ---------------------------------------------------------------------------
# Load existing schedule if present, otherwise construct a minimal schedule
schedule_path <- cache_path("data_interim", "team_schedule.csv")
if (file.exists(schedule_path)) {
  team_schedule <- read_csv(schedule_path, col_types = cols())
} else {
  # Fallback: build from goals_df and venues_geocoded (requires those files)
  goals_df <- read_csv(cache_path("data_interim", "goals_df.csv"), col_types = cols())
fbref_matches <- read_csv(cache_path("data_interim", "fbref_matches_raw.csv"), col_types = cols())
goals_df <- left_join(goals_df, fbref_matches %>% select(match_id, stadium_name), by = "match_id")
  venues_geo <- read_csv(cache_path("data_interim", "venues_geocoded.csv"), col_types = cols())
  # Assume `goals_df` contains columns: match_id, team, wc_year, date, stadium_name
  # Join venue coordinates
  team_schedule <- goals_df %>%
    left_join(venues_geo %>% select(stadium_name, latitude, longitude),
              by = "stadium_name") %>%
    select(team, wc_year, match_id, date, stadium_name, latitude, longitude) %>%
    distinct()
}

# ---------------------------------------------------------------------------
# 05.1 – Rest Days
team_schedule <- team_schedule %>%
  group_by(team, wc_year) %>%
  arrange(date) %>%
  mutate(rest_days = as.integer(date - lag(date))) %>%
  mutate(rest_days = if_else(is.na(rest_days), -1L, rest_days)) %>%
  ungroup()

# ---------------------------------------------------------------------------
# 05.2 – Travel Distance (km) using geosphere
team_schedule <- team_schedule %>%
  arrange(team, wc_year, date) %>%
  mutate(prev_lat = lag(latitude),
         prev_lon = lag(longitude)) %>%
  mutate(travel_km = if_else(is.na(prev_lat) | is.na(prev_lon),
                             NA_real_,
                             distHaversine(cbind(prev_lon, prev_lat),
                                           cbind(longitude, latitude)) / 1000))

# ---------------------------------------------------------------------------
# Validation gates (as described in the implementation plan)
# Rest days must be -1 (first match) or a plausible gap (2‑21 days)
stopifnot(all(team_schedule$rest_days == -1L |
                between(team_schedule$rest_days, 2, 21)))
# Distance sanity check – 1° latitude ≈ 111 km
test_dist <- distHaversine(c(0, 0), c(0, 1)) / 1000
stopifnot(abs(test_dist - 111) < 2)

# ---------------------------------------------------------------------------
# Write updated schedule
write_csv(team_schedule, schedule_path)
message("Updated team schedule written to ", schedule_path)
