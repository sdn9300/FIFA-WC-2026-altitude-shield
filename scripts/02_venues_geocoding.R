## 02_venues_geocoding.R
# ------------------------------------------------------------
# Phase 02 – Venue & Geospatial Data
# ------------------------------------------------------------
# This script builds a stadium inventory for every FIFA World Cup edition
# (2002‑2022) plus the upcoming 2026 hosts (USA, Canada, Mexico). It then
# geocodes each venue using the `tidygeocoder` package and caches the
# result in `data_interim/venues_geocoded.csv`.

# ---- Packages ------------------------------------------------
library(tidyverse)
library(tidygeocoder) # for OSM geocoding

# ---- Helper: read cached results if they exist ----------------
cache_path <- file.path("data_interim", "venues_geocoded.csv")
if (file.exists(cache_path)) {
  venues <- read_csv(cache_path, show_col_types = FALSE)
  message("✅ Loaded cached geocoded venues from ", cache_path)
} else {
  # ---- Step 1: Compile stadium list ---------------------------
  # For brevity we include a curated subset. In a full project you would
  # source this from a reliable reference (e.g., Wikipedia tables).
  venues_raw <- tibble(
    tournament_year = c(
      2002, 2002, 2002, 2002, 2002, 2002,
      2006, 2006, 2006, 2006, 2006, 2006,
      2010, 2010, 2010, 2010, 2010, 2010,
      2014, 2014, 2014, 2014, 2014, 2014,
      2018, 2018, 2018, 2018, 2018, 2018,
      2022, 2022, 2022, 2022, 2022, 2022,
      2026, 2026, 2026
    ),
    stadium_name = c(
      # 2002 (Korea/Japan)
      "Seoul World Cup Stadium", "Daegu World Cup Stadium", "Suwon World Cup Stadium",
      "Busan Asiad Main Stadium", "Gwangju World Cup Stadium", "Jeonju World Cup Stadium",
      # 2006 (Germany)
      "Olympiastadion Berlin", "Signal Iduna Park", "Allianz Arena", "Volksparkstadion Hamburg",
      "Stadion Anfield", "Stadion Friedrich-Ludwig-Jahn",
      # 2010 (South Africa)
      "Soccer City", "Nelson Mandela Bay Stadium", "Moses Mabhida Stadium",
      "Green Point Stadium", "Mbombela Stadium", "Royal Bafokeng Stadium",
      # 2014 (Brazil)
      "Estádio do Maracanã", "Arena Corinthians", "Arena Fonte Nova", "Arena Pernambuco",
      "Arena Castelão", "Estádio Mineirão",
      # 2018 (Russia)
      "Luzhniki Stadium", "Kazan Arena", "Spartak Stadium", "Saint Petersburg Stadium",
      "Kaliningrad Stadium", "Ekaterinburg Arena",
      # 2022 (Qatar)
      "Al Bayt Stadium", "Al Thumama Stadium", "Al Janoub Stadium", "Education City Stadium",
      "Ahmad Bin Ali Stadium", "Khalifa International Stadium",
      # 2026 (USA/Canada/Mexico) – placeholder venues – will be replaced with official names later
      "MetLife Stadium (NY/NJ)", "AT&T Stadium (Dallas)", "Estadio Azteca (Mexico City)"
    ),
    city = c(
      "Seoul", "Daegu", "Suwon", "Busan", "Gwangju", "Jeonju",
      "Berlin", "Dortmund", "Munich", "Hamburg", "Liverpool", "Berlin",
      "Johannesburg", "Port Elizabeth", "Durban", "Cape Town", "Nelspruit", "Sun City",
      "Rio de Janeiro", "São Paulo", "Salvador", "Recife", "Fortaleza", "Belo Horizonte",
      "Moscow", "Kazan", "Moscow", "Saint Petersburg", "Kaliningrad", "Yekaterinburg",
      "Al Khor", "Doha", "Al Wakrah", "Al Rayyan", "Al Rayyan", "Doha",
      "East Rutherford", "Arlington", "Mexico City"
    ),
    country = c(
      rep("South Korea", 6),
      rep("Germany", 6),
      rep("South Africa", 6),
      rep("Brazil", 6),
      rep("Russia", 6),
      rep("Qatar", 6),
      "USA", "USA", "Mexico"
    )
  )

  # ---- Step 2: Geocode --------------------------------------
  message("🔎 Geocoding " , nrow(venues_raw) , " venues …")
  venues <- venues_raw %>%
    mutate(full_address = paste(city, country, sep = ", ")) %>%
    geocode(address = full_address, method = "osm", lat = latitude, long = longitude, verbose = FALSE)

  # ---- Step 3: Cache results --------------------------------
  write_csv(venues, cache_path)
  message("💾 Cached geocoded data to ", cache_path)
}

# ---- Validation gate ---------------------------------------
if (any(is.na(venues$latitude) | is.na(venues$longitude))) {
  stop("❌ Validation failed: Some venues have missing coordinates.")
} else {
  message("✅ Validation passed: All venues have latitude/longitude.")
}

# ------------------------------------------------------------
# End of 02_venues_geocoding.R
# ------------------------------------------------------------
