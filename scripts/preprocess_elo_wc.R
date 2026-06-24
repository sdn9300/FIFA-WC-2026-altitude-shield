# scripts/preprocess_elo_wc.R
# ------------------------------------------------------------
# This script transforms the raw Elo ratings (from Kaggle) to a
# World‑Cup‑specific dataset. For each country and World‑Cup edition
# it selects the most recent rating on or before the tournament start
# date. If no rating exists before a start date, it carries forward the
# last available rating (forward fill). The result is written to a
# cleaned CSV file used by downstream scripts.

library(dplyr)
library(readr)
library(lubridate)
library(zoo) # for na.locf

# Helper for project‑relative paths
cache_path <- function(...) {
  base <- normalizePath(".", winslash = "/")
  file.path(base, ...)
}

# 1. Load raw Elo data (already converted to a uniform format)
elo_raw_path <- cache_path("data_raw", "eloratings.csv")
eloraw <- read_csv(elo_raw_path, col_types = cols())
# Ensure date column is Date type
eloraw <- eloraw %>% mutate(date = as.Date(date))

# 2. Load World Cup dates (wc_year, start_date)
wc_dates_path <- cache_path("data_interim", "wc_dates.csv")
wc_dates <- read_csv(wc_dates_path, col_types = cols()) %>%
  mutate(start_date = as.Date(start_date)) %>%
  arrange(wc_year)

# 3. Generate a grid of Country x wc_year
countries <- eloraw %>% distinct(team) %>% rename(Country = team)
grid <- crossing(Country = countries$Country, wc_dates)

# 4. For each row, find the latest rating on or before the start date.
#    If none exists, use the most recent rating from a previous WC edition
#    (forward fill). We'll compute in a grouped fashion.
result <- grid %>%
  group_by(Country) %>%
  arrange(wc_year) %>%
  mutate(rating = {
    country_elo <- eloraw %>% filter(team == Country)
    get_latest <- function(sdate) {
      cand <- country_elo %>% filter(date <= sdate)
      if (nrow(cand) == 0) NA_real_ else tail(cand$rating, 1)
    }
    sapply(start_date, get_latest)
  }) %>%
  # forward fill missing ratings within each country
  mutate(rating = zoo::na.locf(rating, na.rm = FALSE)) %>%
  ungroup()

# 5. Compute change (difference from previous WC edition) per country
result <- result %>%
  group_by(Country) %>%
  arrange(wc_year) %>%
  mutate(change = rating - lag(rating)) %>%
  ungroup()

# 6. Write cleaned data
clean_path <- cache_path("data_raw", "eloratings_wc_clean.csv")
write_csv(result %>% select(Country, wc_year, rating, change), clean_path)
cat("Cleaned WC‑specific Elo data written to", clean_path, "\n")
