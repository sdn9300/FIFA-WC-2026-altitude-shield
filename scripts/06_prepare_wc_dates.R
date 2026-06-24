# scripts/06_prepare_wc_dates.R

# This script converts the comprehensive edition data into the simple
# `wc_dates.csv` format expected by Phase 05.
# It creates columns:
#   wc_year   – numeric tournament year
#   start_date – ISO 8601 date (YYYY-MM-DD)
# It also adds a placeholder for the 2026 edition (update when the official date is known).

library(readr)
library(dplyr)
library(lubridate)

src_path <- "data_raw/wc_comprehensive_data/wc_all_editions.csv"
out_path <- "data_interim/wc_dates.csv"

# ---------------------------------------------------------------------------
# Helper: turn a month‑day string (e.g. "July 13") plus the year into ISO date
# ---------------------------------------------------------------------------
make_iso <- function(year, md) {
  # Append year to the month‑day text and parse with lubridate
  # `parse_date_time` can handle formats like "July 13 1930"
  parsed <- parse_date_time(paste(md, year), orders = "BdY", locale = "C")
  format(parsed, "%Y-%m-%d")
}

# ---------------------------------------------------------------------------
# Load the source CSV and keep only the needed columns
# ---------------------------------------------------------------------------
wc_raw <- read_csv(src_path, col_types = cols())

wc_fixed <- wc_raw %>%
  transmute(
    wc_year   = year,
    start_date = make_iso(year, start_date)
  )

# ---------------------------------------------------------------------------
# Add a placeholder for the 2026 edition (replace when the official date is known)
# ---------------------------------------------------------------------------
wc_fixed <- wc_fixed %>%
  add_row(wc_year = 2026,
          start_date = "2026-06-08")  # placeholder date

# ---------------------------------------------------------------------------
# Write the tidy file
# ---------------------------------------------------------------------------
write_csv(wc_fixed, out_path)
cat("wc_dates.csv written to", out_path, "\n")
