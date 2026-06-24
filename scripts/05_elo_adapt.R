# scripts/05_elo_adapt.R

# This script loads raw Elo ratings, filters to World Cup years,
# carries forward the most recent rating up to each tournament start date,
# merges with capital city elevation data, and writes cleaned outputs.

# Install required packages if missing
required_pkgs <- c("dplyr", "readr", "stringr", "tidyr", "zoo")
installed <- rownames(installed.packages())
for (pkg in required_pkgs) {
  if (!pkg %in% installed) {
    install.packages(pkg, dependencies = TRUE)
  }
}
library(dplyr)
library(readr)
library(stringr)
library(tidyr)
library(zoo)

# Helper for absolute paths relative to project root
cache_path <- function(...) {
  base <- normalizePath(".", winslash = "/")
  file.path(base, ...)
}

# Load raw Elo data (Kaggle CSV)
elo_raw_path <- cache_path("data_raw", "eloratings.csv")
eloraw <- read_csv(elo_raw_path, col_types = cols()) %>%
  mutate(date = as.Date(date, format = "%Y-%m-%d"))

# Load World Cup dates (wc_year, start_date)
wc_dates_path <- cache_path("data_interim", "wc_dates.csv")
wc_dates <- read_csv(wc_dates_path, col_types = cols()) %>%
  mutate(start_date = as.Date(start_date, format = "%Y-%m-%d"))

# Load capital city elevations – columns: Country, Capital, Elevation_m
elev_path <- cache_path("data_interim", "capital_elevations.csv")
elev_df <- read_csv(elev_path, col_types = cols())

# Generate grid Country x wc_year
countries <- eloraw %>% distinct(team) %>% rename(Country = team)
grid <- crossing(Country = countries$Country, wc_dates)

# For each country/year, get most recent rating on or before start_date,
# forward‑fill missing values.
cleaned_elo <- grid %>%
  group_by(Country) %>%
  arrange(wc_year) %>%
  mutate(rating = {
    current_country <- Country[1]
    country_elo <- eloraw %>% filter(team == current_country)
    get_latest <- function(sdate) {
      cand <- country_elo %>% filter(date <= sdate)
      if (nrow(cand) == 0) NA_real_ else tail(cand$rating, 1)
    }
    sapply(start_date, get_latest)
  }) %>%
  mutate(rating = zoo::na.locf(rating, na.rm = FALSE)) %>%
  ungroup() %>%
  select(Country, wc_year, rating)

# Write cleaned Elo data
cleaned_elo_path <- cache_path("data_raw", "eloratings_wc_clean.csv")
write_csv(cleaned_elo, cleaned_elo_path)
cat("Cleaned Elo data written to", cleaned_elo_path, "\n")

# Merge with elevation data and add adaptation flag (>1500 m)
team_quality <- cleaned_elo %>%
  left_join(elev_df, by = "Country") %>%
  mutate(adapted = if_else(!is.na(Elevation_m) & Elevation_m > 1500, TRUE, FALSE)) %>%
  select(Country, wc_year, rating, adapted)

# Write final team quality file (new naming)
team_quality_path <- cache_path("data_interim", "team_quality_clean.csv")
write_csv(team_quality, team_quality_path)
cat("Team quality data written to", team_quality_path, "\n")
