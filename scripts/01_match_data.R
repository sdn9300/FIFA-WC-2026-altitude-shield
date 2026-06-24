# scripts/01_match_data.R – Phase 01: Match Data Collection

# ------------------------------------------------------------
# This script pulls together all match‑level data sources required for the
# project: FBref, Kaggle, and StatsBomb (xG).  It also parses raw goal‑time
# strings into half‑by‑half counts.
# ------------------------------------------------------------

# ==== Packages ------------------------------------------------
library(worldfootballR)   # FBref scraping
library(rvest)           # fallback HTML utilities
library(StatsBombR)      # xG data
library(tidyverse)       # data wrangling
library(lubridate)
library(janitor)

# ==== Helper: cache write/read ---------------------------------
cache_read <- function(path) {
  if (file.exists(path)) readRDS(path) else NULL
}

cache_write <- function(obj, path) {
  dir.create(dirname(path), recursive = TRUE, showWarnings = FALSE)
  saveRDS(obj, path)
}

# ==== 1. FBref match results -----------------------------------
fetch_fbref_matches <- function(years = c(2002, 2006, 2010, 2014, 2018, 2022)) {
  all_matches <- list()
  for (yr in years) {
    cache_path <- file.path("data_raw", paste0("fbref_matches_", yr, ".rds"))
    cached <- cache_read(cache_path)
    if (!is.null(cached)) {
      message("Using cached FBref data for ", yr)
      all_matches[[as.character(yr)]] <- cached
      next
    }
    message("Fetching FBref data for ", yr)
    # FBref URLs for World Cup season end year
    urls <- get_match_urls(
      country = "",
      gender = "M",
      season_end_year = yr,
      non_dom_league_url = "https://fbref.com/en/comps/1/history/World-Cup-Seasons"
    )
    # Respect rate‑limit policy
    Sys.sleep(3)
    matches <- get_match_results(
      country = "",
      gender = "M",
      season_end_year = yr,
      non_dom_league_url = "https://fbref.com/en/comps/1/history/World-Cup-Seasons"
    )
    cache_write(matches, cache_path)
    all_matches[[as.character(yr)]] <- matches
  }
  bind_rows(all_matches)
}

# ==== 2. Kaggle CSV cross‑check -------------------------------
fetch_kaggle_matches <- function() {
  path <- file.path("data_raw", "kaggle", "fifa-world-cup-1930-2022.csv")
  if (!file.exists(path)) {
    stop("Kaggle CSV not found at ", path, ". Please download it manually from Kaggle and place it there.")
  }
  read_csv(path) %>% clean_names()
}

# ==== 3. StatsBomb xG (2018 & 2022) --------------------------
fetch_statsbomb_xg <- function(years = c(2018, 2022)) {
  cache_path <- file.path("data_raw", "statsbomb_xg.rds")
  cached <- cache_read(cache_path)
  if (!is.null(cached)) {
    message("Using cached StatsBomb xG data")
    return(cached)
  }
  all_xg <- list()
  for (yr in years) {
    message("Fetching StatsBomb data for ", yr)
    comps <- FreeCompetitions() %>% filter(season_name == yr)
    matches <- FreeMatches(comps) %>% filter(competition_name == "FIFA World Cup")
    # Get event data and clean
    events <- StatsBombFreeEvents(MatchesDF = matches) %>% allclean()
    # Shot events with xG
    xg_df <- events %>%
      filter(type.name == "Shot") %>%
      mutate(half = ifelse(minute <= 45, "1H", "2H")) %>%
      group_by(team = team.name, half) %>%
      summarise(team_xg = sum(shot.statsbomb_xg, na.rm = TRUE), .groups = "drop")
    all_xg[[as.character(yr)]] <- xg_df
  }
  bind_rows(all_xg)
}

# ==== 4. Goal‑time parsing → half classification --------------
parse_goal_times <- function(matches_tbl) {
  # Assume `goal_times` column exists and contains a semicolon‑separated string of minutes
  matches_tbl %>%
    separate_rows(goal_times, sep = ";") %>%
    mutate(
      minute_raw = stringr::str_extract(goal_times, "\\d+"),
      minute = as.integer(minute_raw),
      half = ifelse(minute <= 45, "1H", "2H")
    )
}

# ==== 5. Main orchestration ------------------------------------
run_phase_01 <- function() {
  message("--- Phase 01: Match Data Collection ---")
  # FBref data
  # FBref data (may fail without internet)
fbref_raw <- tryCatch(fetch_fbref_matches(), error = function(e) {
  message("FBref fetch failed: ", e$message)
  NULL
})
if (!is.null(fbref_raw)) {
  write_csv(fbref_raw, file.path("data_interim", "fbref_matches_raw.csv"))
}

# Kaggle cross‑check
kaggle_raw <- fetch_kaggle_matches()
write_csv(kaggle_raw, file.path("data_interim", "kaggle_matches_raw.csv"))

# StatsBomb xG (may fail without internet)
sb_xg <- tryCatch(fetch_statsbomb_xg(), error = function(e) {
  message("StatsBomb fetch failed: ", e$message)
  NULL
})
if (!is.null(sb_xg)) {
  write_csv(sb_xg, file.path("data_interim", "statsbomb_xg.csv"))
}

# Goal‑time parsing (using FBref as source for goal_times)
if (!is.null(fbref_raw) && "goal_times" %in% colnames(fbref_raw)) {
  goals_df <- parse_goal_times(fbref_raw) %>%
    group_by(year, match_id, team) %>%
    summarise(
      goals_for_1h = sum(half == "1H" & team == home_team),
      goals_for_2h = sum(half == "2H" & team == home_team),
      goals_against_1h = sum(half == "1H" & team == away_team),
      goals_against_2h = sum(half == "2H" & team == away_team),
      .groups = "drop"
    )
  write_csv(goals_df, file.path("data_interim", "goals_df.csv"))
} else {
  message("Skipping goal‑time parsing: FBref data unavailable or missing `goal_times`.")
}

  message("Phase 01 completed – interim files written to `data_interim/`.")
}

# Only run when this script is sourced directly
if (identical(environment(), globalenv())) {
  run_phase_01()
}

# ------------------------------------------------------------
# End of 01_match_data.R
# ------------------------------------------------------------
