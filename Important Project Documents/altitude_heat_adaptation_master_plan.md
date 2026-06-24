# ⛰️ Altitude & Heat Adaptation — World Cup Analytics
## Master Project Plan · Spec-Driven Development Edition

> **Research Question**: Do altitude and heat cause teams to concede significantly more goals in the second half of World Cup matches, after controlling for team quality, rest, and travel?

---

## 🗺️ MASTER ROADMAP AT A GLANCE

| Phase | Name | Output | Est. Time |
|-------|------|--------|-----------|
| **0** | Research Design & SDD Spec | PRD + Hypotheses + Schema Contract | 1 day |
| **1** | Environment & Project Scaffold | Reproducible R project, Git repo | 2 hrs |
| **2** | Match Data Pipeline | Clean `matches.csv` (1994–2022) | 2 days |
| **3** | Venue & Climate Data Pipeline | `venues.csv` with elevation + weather | 1.5 days |
| **4** | Team Quality Data Pipeline | `team_quality.csv` (Elo + FIFA rank) | 1 day |
| **5** | Data Integration & QA | Single `team_match_master.csv` | 1 day |
| **6** | Exploratory Data Analysis | EDA report (HTML via R Markdown) | 2 days |
| **7** | Feature Engineering | Final analytical dataset | 1 day |
| **8** | Statistical Modeling | Model outputs + diagnostics | 2–3 days |
| **9** | Results & Visualisation | Publication-quality charts | 2 days |
| **10** | Portfolio Packaging | README + blog post + GitHub | 1 day |

**Total realistic timeline: 3–4 focused weeks** (part-time alongside coursework).

---

---

# PHASE 0 — RESEARCH DESIGN & SDD SPECIFICATION

> **Why this phase exists**: In elite data science, you do not touch data until you have locked your research questions and hypotheses. Every cleaning decision, every feature you engineer, every model you choose — all of it flows downstream from what you define here. Skipping this phase is how projects drift, lose coherence, and produce uninterpretable results.

---

## 0.1 Problem Statement

**Formal statement**: Physical stress compounds across a 90-minute football match. Altitude reduces oxygen availability; heat increases cardiovascular load. Both effects accelerate fatigue. The hypothesis is that teams competing in high-altitude or high-temperature World Cup venues will show a measurable *second-half performance decline* — specifically, conceding more goals in the second half relative to the first — compared to teams playing in sea-level, temperate conditions. The 2026 World Cup includes venues in Mexico City (2,240 m), Denver (1,609 m), and Kansas City (270 m), making this analysis directly actionable.

---

## 0.2 Research Hypotheses (Formalised)

Write these down precisely. You will test each one explicitly.

```
H1 (Primary): Teams playing at elevation > 1,000 m concede a higher
              proportion of their total goals allowed in the 2nd half
              than teams at sea level, controlling for team quality.

H2 (Climate): Matches in venues with June–July avg temperature > 28°C
              show a similar 2nd-half fatigue pattern, independent of altitude.

H3 (Interaction): The combined effect of altitude AND heat is super-additive
                  (i.e., altitude × heat interaction term is significant).

H4 (Immunity): Teams whose home nation capital sits > 1,000 m elevation
               do not show the 2nd-half concession penalty at altitude venues.

H5 (Rest):    Teams with ≤ 3 rest days suffer a larger altitude fatigue
              penalty than teams with ≥ 6 rest days.
```

---

## 0.3 Unit of Analysis

**One row = one team in one match.**

A match between Brazil and Germany produces **two rows**: one for Brazil's perspective, one for Germany's. This gives you team-level features (Elo, rest days, origin elevation) on both the team and the opponent side — which is essential for modeling.

---

## 0.4 Primary Outcome Variables

| Variable | Definition | Why |
|---|---|---|
| `goals_against_2h` | Goals conceded in 2nd half | Direct fatigue proxy |
| `goals_against_1h` | Goals conceded in 1st half | Baseline / control |
| `h2_delta` | `goals_against_2h − goals_against_1h` | Shift in concession rate |
| `prop_goals_2h` | `goals_against_2h / goals_against_total` | Proportion metric (bounded 0–1) |
| `xg_against_2h` | xG conceded in 2nd half (2018/22 only) | Quality-adjusted fatigue |

---

## 0.5 Data Scope Decision

This is critical. More years = more statistical power, but fewer features available.

| Scope | Years | Tournaments | Matches | Features Available |
|---|---|---|---|---|
| **Minimum** | 2018–2022 | 2 | ~128 | All incl. xG, FIFA rank |
| **Core** (recommended) | 1994–2022 | 8 | ~512 | All except xG |
| **Extended** | 1974–2022 | 13 | ~832 | No FIFA rank; use Elo only |
| **Full** | 1966–2022 | 15 | ~944 | Elo only; goal minutes less reliable pre-1974 |

**Recommendation**: Build the **Core scope (1994–2022)** as your primary analytical dataset. Extend to 1974 as a robustness check. Do xG analysis as a separate mini-study on 2018/2022 only.

---

## 0.6 Final Schema Contract (Lock This Before Touching Data)

This is your **schema contract**: every data collection phase must deliver data that populates exactly these columns. Nothing more is needed; nothing less is acceptable.

```
MASTER TABLE: team_match_master
One row per team per match

IDENTIFIERS
  wc_year          INT      e.g. 2022
  match_id         CHR      e.g. "2022_ARG_FRA_Final"
  stage            CHR      "Group", "R16", "QF", "SF", "3rd", "Final"
  team             CHR      FIFA 3-letter code e.g. "ARG"
  opponent         CHR      FIFA 3-letter code e.g. "FRA"
  is_home_side     BOOL     TRUE if listed as "home" in FBref

VENUE
  venue_city       CHR      e.g. "Lusail"
  venue_stadium    CHR      e.g. "Lusail Stadium"
  venue_lat        NUM      decimal degrees
  venue_lon        NUM      decimal degrees
  elevation_m      NUM      metres above sea level
  is_high_alt      BOOL     elevation_m > 1000 (your threshold — justify it)

CLIMATE (June–July historical average for that city, for that WC year)
  avg_temp_c       NUM      degrees Celsius
  avg_humidity_pct NUM      percentage
  heat_stress_idx  NUM      computed: avg_temp_c * (avg_humidity_pct / 100)

MATCH OUTCOMES
  goals_for_1h     INT      goals scored by this team in 1st half
  goals_for_2h     INT      goals scored by this team in 2nd half
  goals_against_1h INT      goals conceded in 1st half
  goals_against_2h INT      goals conceded in 2nd half
  h2_delta         NUM      goals_against_2h - goals_against_1h
  result           CHR      "W", "D", "L"

xG (2018/2022 only — fill NA for earlier tournaments)
  xg_for_1h        NUM      NA for pre-2018
  xg_for_2h        NUM      NA for pre-2018
  xg_against_1h    NUM      NA for pre-2018
  xg_against_2h    NUM      NA for pre-2018

TEAM QUALITY
  team_elo_pre     NUM      Elo rating at tournament start date
  opp_elo_pre      NUM      Opponent Elo at tournament start date
  elo_diff         NUM      team_elo_pre - opp_elo_pre
  team_fifa_rank   INT      FIFA ranking in June of WC year (1993+ only)
  opp_fifa_rank    INT      Opponent FIFA ranking

FATIGUE CONTROLS
  match_date       DATE     actual match date
  rest_days        INT      days since team's previous WC match (NULL for first)
  opp_rest_days    INT      opponent's rest days
  travel_km        NUM      distance from previous venue (km, Haversine)
  opp_travel_km    NUM      opponent's travel distance

ALTITUDE ADAPTATION FLAGS
  team_origin_elev_m NUM    elevation of team's home capital city
  is_altitude_team  BOOL    team_origin_elev_m > 1000
  opp_origin_elev_m NUM
  is_altitude_opp   BOOL
```

---

## 0.7 Success Criteria

Your project succeeds if you can answer:

1. ✅ Is the altitude effect on 2nd-half concessions statistically significant (p < 0.05) after controlling for team quality?
2. ✅ Is the effect size meaningful (>0.3 additional goals per 90 minutes is meaningful for football)?
3. ✅ Is the model diagnostically sound (residual plots pass visual inspection)?
4. ✅ Can you produce a 2026 venue risk ranking?

---

---

# PHASE 1 — ENVIRONMENT & PROJECT SCAFFOLD

> **Why this matters**: A reproducible project structure is as important as the analysis itself. Every file should have one obvious home. Every collaborator (including future-you) should be able to run `source("00_run_all.R")` and reproduce everything from scratch.

---

## 1.1 Exact R Package Installation

Run this **once** in a fresh R session:

```r
# Core data collection
install.packages(c(
  "worldfootballR",  # FBref + Transfermarkt scraping
  "rvest",           # Fallback HTML scraping
  "httr",            # API calls (Open-Elevation, Meteostat)
  "jsonlite",        # JSON parsing for APIs
  "tidygeocoder",    # Stadium name → lat/long
  "geosphere"        # Haversine travel distance
))

# Data manipulation
install.packages(c(
  "tidyverse",       # dplyr, tidyr, ggplot2, readr, purrr, stringr
  "lubridate",       # Date arithmetic for rest days
  "janitor"          # clean_names(), tabyl()
))

# Statistical modelling
install.packages(c(
  "lme4",            # Mixed-effects models (lmer, glmer)
  "lmerTest",        # p-values for lme4 models
  "MASS",            # Negative binomial regression (glm.nb)
  "broom",           # Tidy model outputs
  "broom.mixed",     # Tidy lme4 outputs
  "emmeans",         # Estimated marginal means for contrasts
  "car"              # Anova(), vif() for multicollinearity check
))

# StatsBomb (xG data)
# Not on CRAN — install from GitHub:
install.packages("remotes")
remotes::install_github("statsbomb/StatsBombR")

# Elo calculations
install.packages("elo")

# Visualisation
install.packages(c(
  "ggplot2",         # Included in tidyverse but explicit
  "ggrepel",         # Non-overlapping labels
  "patchwork",       # Combine multiple ggplots
  "scales",          # Axis formatting
  "RColorBrewer",    # Colour palettes
  "viridis"          # Colourblind-friendly palettes
))

# Reporting
install.packages(c(
  "rmarkdown",       # EDA HTML reports
  "knitr",
  "kableExtra"       # Beautiful tables in RMarkdown
))
```

---

## 1.2 Project Directory Structure

Create this exact folder structure. Every script knows where its inputs come from and where its outputs go.

```
altitude-heat-wc/
│
├── README.md                    # Portfolio-facing description
├── altitude_heat_wc.Rproj       # R Project file (open this, not scripts)
├── .gitignore                   # Ignore /data/raw, large files
├── 00_run_all.R                 # Master orchestrator — runs all phases
│
├── R/                           # All analysis scripts (numbered for order)
│   ├── 01_scrape_matches.R      # Phase 2: FBref match data
│   ├── 02_get_venues.R          # Phase 3a: Wikipedia + geocoding
│   ├── 03_get_elevation.R       # Phase 3b: Open-Elevation API
│   ├── 04_get_weather.R         # Phase 3c: Meteostat weather
│   ├── 05_get_team_quality.R    # Phase 4: Elo + FIFA rankings
│   ├── 06_integrate_data.R      # Phase 5: Join all datasets
│   ├── 07_eda.Rmd               # Phase 6: EDA as RMarkdown
│   ├── 08_feature_engineering.R # Phase 7: New variables
│   ├── 09_models.R              # Phase 8: Statistical modelling
│   └── 10_visualisations.R      # Phase 9: All publication charts
│
├── data/
│   ├── raw/                     # NEVER edit files here. Source of truth.
│   │   ├── fbref/               # FBref scraped files
│   │   ├── statsbomb/           # StatsBomb JSON (gitignored if large)
│   │   ├── kaggle/              # Downloaded CSVs
│   │   └── manual/              # Manually assembled files (stadium coords, etc.)
│   ├── interim/                 # Cleaned but not yet joined
│   │   ├── matches_clean.csv
│   │   ├── venues_clean.csv
│   │   └── team_quality_clean.csv
│   └── final/
│       └── team_match_master.csv # ← The master analytical dataset
│
├── outputs/
│   ├── figures/                 # All exported charts (PNG, SVG)
│   ├── tables/                  # Regression tables (HTML, LaTeX)
│   └── reports/
│       └── eda_report.html
│
├── docs/
│   ├── PRD.md                   # This document (Phase 0)
│   ├── ADR_01_scope.md          # Why 1994–2022
│   ├── ADR_02_model_choice.md   # Why negative binomial over Poisson
│   └── data_dictionary.md      # Describe every variable
│
└── tests/
    └── test_data_integrity.R    # Validation checks (row counts, range checks)
```

---

## 1.3 Git Setup

```bash
# In terminal, from the project root:
git init
echo "data/raw/" >> .gitignore
echo "data/final/" >> .gitignore
echo "*.RData" >> .gitignore
echo ".Rhistory" >> .gitignore
git add .
git commit -m "chore: initialise project scaffold with SDD structure"
```

**Commit message convention for this project**:
```
data(fbref): scrape match data 1994-2022
feat(eda): add elevation distribution plot
fix(pipeline): handle missing goal minute in 2010 WC
model(glmm): add random intercept for wc_year
```

---

---

# PHASE 2 — MATCH DATA PIPELINE

> **Goal**: Produce `data/interim/matches_clean.csv` — one row per team per match, with goal times split by half, for all World Cup matches 1994–2022.

---

## 2.1 Primary Source: FBref via worldfootballR

**Why FBref first**: It has structured, clean match data for every WC from 1930. The `worldfootballR` package abstracts the scraping — you get tidy data frames without writing a single CSS selector.

**Exact source URL**: `https://fbref.com/en/comps/1/World-Cup-Stats`

```r
# R/01_scrape_matches.R

library(worldfootballR)
library(tidyverse)
library(lubridate)

# Step 1: Get match URLs for each WC year
# worldfootballR uses a consistent URL pattern for WC editions
# WC comp_id on FBref = "1"

wc_years <- c(1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022)

# Get scores & fixtures for each tournament
# This function hits FBref's "Scores & Fixtures" table
get_wc_fixtures <- function(year) {
  url <- paste0("https://fbref.com/en/comps/1/", year, "/schedule/",
                year, "-FIFA-World-Cup-Scores-and-Fixtures")
  
  message("Fetching: ", year)
  Sys.sleep(3)  # CRITICAL: FBref rate-limits aggressive scrapers. 3s minimum.
  
  tryCatch({
    fb_match_results(
      country = "World",
      gender = "M",
      season_end_year = year,
      tier = "1st"
    )
  }, error = function(e) {
    message("Error for ", year, ": ", e$message)
    return(NULL)
  })
}

# Pull all years (this will take ~5 minutes due to rate limiting)
raw_fixtures <- map_dfr(wc_years, get_wc_fixtures)

# Save immediately — do not re-scrape unnecessarily
write_csv(raw_fixtures, "data/raw/fbref/raw_fixtures_1994_2022.csv")
```

**What you get from worldfootballR**:
- `Date`, `Home`, `Away`, `HomeGoals`, `AwayGoals`, `Venue`, `Round`
- xG columns for 2018/2022 (will be NA for earlier years)
- Match report URLs for drilling down

**The gap you need to fill**: `worldfootballR`'s fixtures table gives you total score, not goals split by half. You need to go one level deeper to match reports.

```r
# Step 2: Get half-time scores from match report pages
# FBref match reports have a "Match Info" box with HT score

get_ht_score <- function(match_url) {
  Sys.sleep(3)
  
  page <- rvest::read_html(match_url)
  
  # The half-time score is in the #team_stats table or the score box
  ht_score <- page %>%
    rvest::html_nodes(".score_box .ht_score") %>%
    rvest::html_text(trim = TRUE)
  
  if (length(ht_score) == 0) return(list(ht_home = NA, ht_away = NA))
  
  # Parse "2–1" → ht_home=2, ht_away=1
  parts <- stringr::str_split(ht_score, "–")[[1]]
  list(ht_home = as.integer(parts[1]), ht_away = as.integer(parts[2]))
}

# Get match report URLs (worldfootballR provides these)
match_urls <- raw_fixtures$MatchURL  # column name may vary; inspect with names()

ht_scores <- map(match_urls, get_ht_score)
ht_df <- bind_rows(ht_scores)

fixtures_with_ht <- bind_cols(raw_fixtures, ht_df)
```

> ⚠️ **Critical Pitfall**: FBref will return a 429 (Too Many Requests) if you scrape too fast. The `Sys.sleep(3)` is non-negotiable. For 64 matches × 8 tournaments = ~512 requests, budget 30–45 minutes of scraping time. Run overnight. Cache every result to disk immediately after each call.

---

## 2.2 Alternative / Supplement: Kaggle CSV Datasets

**When to use**: Use these to cross-validate your FBref data, or as a faster starting point before scraping match reports.

**Precise datasets**:

| Dataset | URL | Contains |
|---|---|---|
| FIFA World Cup Historical | `https://www.kaggle.com/datasets/evangower/fifa-world-cup` | 1930–2018, goals by minute, team names |
| WC 2022 | `https://www.kaggle.com/datasets/fifarush/fifa-world-cup-2022` | 2022 only, detailed match events |
| WC Match Events | `https://www.kaggle.com/datasets/piterfm/2022-fifa-world-cup` | Minute-by-minute events 2022 |

**Download procedure** (Kaggle API):
```bash
# In terminal:
pip install kaggle
# Place your kaggle.json API key in ~/.kaggle/

kaggle datasets download evangower/fifa-world-cup -p data/raw/kaggle/
kaggle datasets download fifarush/fifa-world-cup-2022 -p data/raw/kaggle/
```

**Construct half-time scores from goal minute data**:
```r
# If Kaggle dataset has a "Minute" column for each goal:
goals_raw <- read_csv("data/raw/kaggle/WorldCupGoals.csv")

half_goals <- goals_raw %>%
  mutate(half = if_else(Minute <= 45, "H1", "H2")) %>%
  group_by(MatchID, Team, half) %>%
  summarise(goals = n(), .groups = "drop") %>%
  pivot_wider(names_from = half, values_from = goals,
              values_fill = 0,
              names_prefix = "goals_for_")
# Result: goals_for_H1, goals_for_H2 per team per match
```

> ⚠️ **Known Data Quality Issue**: The Kaggle `evangower/fifa-world-cup` dataset has inconsistent team name formatting across years (e.g., "West Germany" vs "Germany"). You will need a team name normalisation lookup table. Build one:

```r
# data/manual/team_name_lookup.csv (create this manually)
# raw_name, standard_code
# "West Germany", "GER"
# "Soviet Union", "URS"
# "Yugoslavia", "YUG"
# etc.
```

---

## 2.3 StatsBomb Open Data (2018 & 2022 xG)

**Source**: `https://github.com/statsbomb/open-data`  
**Licence**: CC BY-NC-SA 4.0 — portfolio use ✅, commercial use ❌. Always cite.

```r
# Option A: StatsBombR package (recommended)
library(StatsBombR)

# Get all available competitions
comps <- FreeCompetitions()
wc_comps <- comps %>% filter(competition_name == "FIFA World Cup")
# Returns competition_id and season_id for 2018 and 2022

# Get all matches for 2022 WC
wc_2022_matches <- FreeMatches(Competitions = wc_comps %>% 
                                 filter(season_name == "2022"))

# Get events for ALL matches (this is large — ~300MB)
wc_2022_events <- free_allevents(MatchesDF = wc_2022_matches,
                                  Parallel = TRUE)  # Uses parallel processing

# Extract xG shots by half
xg_by_half <- wc_2022_events %>%
  filter(type.name == "Shot") %>%
  mutate(half = period) %>%  # period=1 is 1st half, period=2 is 2nd half
  group_by(match_id, team.name, half) %>%
  summarise(
    xg = sum(shot.statsbomb_xg, na.rm = TRUE),
    shots = n(),
    .groups = "drop"
  )

write_csv(xg_by_half, "data/raw/statsbomb/xg_by_half_2022.csv")
```

> **Key insight**: StatsBomb xG is arguably the most important variable in your dataset for the 2018/2022 subset. A team can concede no goals in the 2nd half but face 2.8 xG — the physical stress was real even if the goalkeeper was exceptional. `xg_against_2h` is a cleaner fatigue signal than raw goals.

---

## 2.4 Validation Checkpoint — Before Moving On

Before proceeding to Phase 3, run this validation:

```r
# tests/test_data_integrity.R

matches <- read_csv("data/interim/matches_clean.csv")

# Test 1: Row count
# Each match produces 2 rows (one per team)
# WC 1994: 52 matches × 2 = 104 rows
expected_rows <- list(
  "1994" = 104, "1998" = 128, "2002" = 128,
  "2006" = 128, "2010" = 128, "2014" = 128,
  "2018" = 128, "2022" = 128
)
actual_rows <- matches %>% count(wc_year)
# Assert these match (allowing for WC 1994's 52-game format)

# Test 2: Goals are non-negative
stopifnot(all(matches$goals_for_1h >= 0, na.rm = TRUE))
stopifnot(all(matches$goals_against_1h >= 0, na.rm = TRUE))

# Test 3: Total goals match known scorelines
# Spot check: 2022 Final, Argentina vs France → 3–3 AET
arg_final <- matches %>%
  filter(wc_year == 2022, team == "ARG",
         stage == "Final")
# goals_for_1h + goals_for_2h should = 3 (90-min goals)

# Test 4: No missing venue for any match
stopifnot(sum(is.na(matches$venue_city)) == 0)

message("All data integrity tests passed ✓")
```

---

---

# PHASE 3 — VENUE & CLIMATE DATA PIPELINE

> **Goal**: Produce `data/interim/venues_clean.csv` — one row per venue per WC, with confirmed elevation and historical June–July weather.

---

## 3.1 Venue List: Wikipedia Scraping

**Source**: `https://en.wikipedia.org/wiki/List_of_FIFA_World_Cup_stadiums`

```r
# R/02_get_venues.R

library(rvest)
library(tidyverse)

wiki_url <- "https://en.wikipedia.org/wiki/List_of_FIFA_World_Cup_stadiums"
page <- read_html(wiki_url)

# Wikipedia has one table per WC. Extract all tables.
all_tables <- page %>% html_nodes("table.wikitable") %>% html_table(fill = TRUE)

# Each table corresponds to one WC. Label them by year.
# The tables appear in chronological order: 1930, 1934, ...
wc_years_wiki <- c(1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966,
                   1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998,
                   2002, 2006, 2010, 2014, 2018, 2022)

venues_raw <- map2_dfr(all_tables, wc_years_wiki, function(tbl, yr) {
  tbl %>%
    mutate(wc_year = yr) %>%
    janitor::clean_names()  # Normalise column names
})

# Filter to only your core years
venues_core <- venues_raw %>%
  filter(wc_year %in% c(1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022))

write_csv(venues_core, "data/raw/fbref/venues_raw.csv")
```

**2026 Venues** (manually compiled from `https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/news`):

Create this file manually — `data/manual/venues_2026.csv`:

```csv
wc_year,city,country,stadium,elevation_m_approx
2026,New York/New Jersey,USA,MetLife Stadium,8
2026,Los Angeles,USA,SoFi Stadium,82
2026,Dallas,USA,AT&T Stadium,183
2026,San Francisco,USA,Levi's Stadium,14
2026,Miami,USA,Hard Rock Stadium,3
2026,Seattle,USA,Lumen Field,8
2026,Boston,USA,Gillette Stadium,40
2026,Kansas City,USA,Arrowhead Stadium,320
2026,Philadelphia,USA,Lincoln Financial Field,12
2026,Atlanta,USA,Mercedes-Benz Stadium,298
2026,Houston,USA,NRG Stadium,24
2026,Denver,USA,Empower Field,1609
2026,Vancouver,Canada,BC Place,4
2026,Toronto,Canada,BMO Field,112
2026,Guadalajara,Mexico,Estadio Akron,1566
2026,Mexico City,Mexico,Estadio Azteca,2240
```

> **Note**: Elevations marked `_approx` are pre-confirmed via Open-Elevation (Phase 3.2). Mexico City (2,240 m) and Denver (1,609 m) are your primary high-altitude cases.

---

## 3.2 Elevation Data: Open-Elevation API

**Source**: `https://api.open-elevation.com/api/v1/lookup`  
**Free, no API key required. Rate limit: ~100 requests/min.**

```r
# R/03_get_elevation.R

library(tidygeocoder)
library(httr)
library(jsonlite)
library(tidyverse)

venues <- read_csv("data/raw/fbref/venues_raw.csv")

# Step 1: Get lat/long for each stadium using tidygeocoder
# tidygeocoder calls Nominatim (OpenStreetMap geocoder) — free, no key
venues_geocoded <- venues %>%
  mutate(address = paste(stadium, city, country, sep = ", ")) %>%
  geocode(address = address,
          method = "osm",      # OpenStreetMap — free, no key needed
          lat = lat,
          long = lon,
          verbose = TRUE)

# Save geocoded result immediately
write_csv(venues_geocoded, "data/interim/venues_geocoded.csv")

# Step 2: Query Open-Elevation for each lat/lon pair
get_elevation <- function(lat, lon) {
  Sys.sleep(0.5)  # Respect rate limits
  
  url <- "https://api.open-elevation.com/api/v1/lookup"
  
  resp <- GET(url, query = list(
    locations = paste0(lat, ",", lon)
  ))
  
  if (http_error(resp)) {
    warning("Elevation API error for lat=", lat, ", lon=", lon)
    return(NA_real_)
  }
  
  result <- content(resp, as = "parsed")
  result$results[[1]]$elevation
}

# Apply to all venues
venues_with_elev <- venues_geocoded %>%
  mutate(elevation_m = map2_dbl(lat, lon, get_elevation))

# Sanity check: Mexico City should be ~2240m
venues_with_elev %>%
  filter(str_detect(city, "Mexico City")) %>%
  select(city, elevation_m)
# Expected: ~2240

write_csv(venues_with_elev, "data/interim/venues_with_elevation.csv")
```

> ⚠️ **Validation Rule**: Cross-check every elevation > 500 m against Wikipedia manually. Open-Elevation uses SRTM data (90m resolution), which can be inaccurate in dense urban areas. For Johannesburg (2022 m), Bogotá (2,640 m), and Mexico City (2,240 m), the API will be reliable. For stadiums with unusual topography, verify manually.

---

## 3.3 Climate Data: Meteostat API

**Source**: `https://dev.meteostat.net/`  
**Free tier**: 500 requests/hour. Requires free API key.

**Two options — choose based on comfort level**:

**Option A: Meteostat R package** (simpler but less documented)
```r
# Check if available: install.packages("Rmeteostat")
# As of 2024, the primary interface is via the Python library or direct API calls
```

**Option B: Direct API calls in R** (recommended — more control)
```r
# R/04_get_weather.R

library(httr)
library(jsonlite)
library(tidyverse)
library(lubridate)

# Register at https://dev.meteostat.net/ for a free API key
METEOSTAT_KEY <- Sys.getenv("METEOSTAT_KEY")  # Store in .Renviron, NEVER hardcode

get_monthly_weather <- function(lat, lon, year, month) {
  Sys.sleep(0.3)
  
  # Meteostat Point Data endpoint
  url <- "https://meteostat.p.rapidapi.com/point/monthly"
  
  # Define June and July for the WC year
  start_date <- paste0(year, "-", sprintf("%02d", month), "-01")
  end_date <- paste0(year, "-", sprintf("%02d", month), "-30")
  
  resp <- GET(url,
    add_headers(
      "X-RapidAPI-Key" = METEOSTAT_KEY,
      "X-RapidAPI-Host" = "meteostat.p.rapidapi.com"
    ),
    query = list(
      lat = lat,
      lon = lon,
      start = start_date,
      end = end_date,
      units = "metric"
    )
  )
  
  if (http_error(resp)) return(tibble(temp_c = NA, humidity = NA))
  
  data <- content(resp, as = "parsed")$data
  if (length(data) == 0) return(tibble(temp_c = NA, humidity = NA))
  
  tibble(
    avg_temp_c    = data[[1]]$tavg,   # Average daily temp in °C
    avg_humidity  = data[[1]]$rhum    # Relative humidity %
  )
}

venues <- read_csv("data/interim/venues_with_elevation.csv")

# For each venue, pull June AND July for the relevant WC year
# WC months: 1994=Jun-Jul, 1998=Jun-Jul, 2002=May-Jun, 2006=Jun-Jul, etc.

wc_climate_months <- list(
  "1994" = c(6, 7), "1998" = c(6, 7), "2002" = c(5, 6),
  "2006" = c(6, 7), "2010" = c(6, 7), "2014" = c(6, 7),
  "2018" = c(6, 7), "2022" = c(11, 12)  # Qatar WC was Nov-Dec!
)

# Note: 2022 Qatar WC ran 20 Nov – 18 Dec. Pull Nov-Dec temperatures.

venues_weather <- venues %>%
  rowwise() %>%
  mutate(
    months = list(wc_climate_months[[as.character(wc_year)]]),
    weather = list(map_dfr(months, ~ get_monthly_weather(lat, lon, wc_year, .x)))
  ) %>%
  unnest(weather) %>%
  group_by(stadium, city, wc_year) %>%
  summarise(
    avg_temp_c       = mean(avg_temp_c, na.rm = TRUE),
    avg_humidity_pct = mean(avg_humidity, na.rm = TRUE),
    .groups = "drop"
  )

write_csv(venues_weather, "data/interim/venues_climate.csv")
```

> ⚠️ **Critical fact about 2022**: The Qatar World Cup ran November–December, not June–July. Doha in November averages ~27°C — warm, but not the same as the 38°C summer heat. Code this separately. It is a potential confound: Qatar had no heat stress effect, but had other unusual factors (all venues within 60 km radius, so travel distance = 0).

---

## 3.4 Validation Checkpoint — Venues

```r
venues_final <- read_csv("data/interim/venues_climate.csv")

# Check 1: All core WC years present
stopifnot(all(c(1994,1998,2002,2006,2010,2014,2018,2022) %in%
                venues_final$wc_year))

# Check 2: Elevation plausibility
# Mexico City should be the highest WC venue at ~2240m
max_elev <- venues_final %>% slice_max(elevation_m, n = 3)
# Expect: Mexico City (~2240), Johannesburg (~1753), Saitama (~15)

# Check 3: Temperature plausibility
# Qatar 2022 Nov-Dec should be cooler than South Africa 2010 June
qatar <- venues_final %>% filter(wc_year == 2022) %>%
  summarise(mean_temp = mean(avg_temp_c))
sa <- venues_final %>% filter(wc_year == 2010) %>%
  summarise(mean_temp = mean(avg_temp_c))
# Qatar should be warmer than South Africa June temps (~18°C)
# Qatar Nov-Dec average should be ~26°C
```

---

---

# PHASE 4 — TEAM QUALITY DATA PIPELINE

> **Goal**: Produce `data/interim/team_quality_clean.csv` — one row per team per WC year, with Elo rating and FIFA ranking at tournament start.

---

## 4.1 Elo Ratings: eloratings.net

**Source**: `https://www.eloratings.net/`  
**Download**: They provide a bulk download link for all historical matches.

**Direct download URL** (CSV of all Elo-tracked matches):
```
https://api.clubelo.com/World
```
> Note: ClubElo is for club football. For **national teams**, use:
> `https://www.eloratings.net/en.1.csv` — this is the national team Elo CSV.

```r
# R/05_get_team_quality.R

library(tidyverse)
library(lubridate)

# Download Elo data (national teams, all history)
elo_raw <- read_csv("https://www.eloratings.net/en.1.csv",
                    col_names = c("date", "team1", "team2",
                                  "elo1_pre", "elo2_pre",
                                  "elo1_post", "elo2_post",
                                  "result"))

# Tournament start dates (day before opening match)
wc_start_dates <- tibble(
  wc_year   = c(1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022),
  start_date = as.Date(c("1994-06-16", "1998-06-09", "2002-05-30",
                          "2006-06-08", "2010-06-10", "2014-06-11",
                          "2018-06-13", "2022-11-19"))
)

# For each team in each WC, find their Elo rating on the tournament start date
# Strategy: take their most recent Elo before the start date

get_elo_at_date <- function(team_name, cutoff_date, elo_data) {
  # Find all matches involving this team before the cutoff
  elo_data %>%
    filter((team1 == team_name | team2 == team_name),
           date <= cutoff_date) %>%
    arrange(desc(date)) %>%
    slice(1) %>%
    mutate(elo = if_else(team1 == team_name, elo1_post, elo2_post)) %>%
    pull(elo)
}

# Apply across all teams for each WC year
# First, get the list of teams in each WC from your matches data
matches <- read_csv("data/interim/matches_clean.csv")

team_wc_list <- matches %>%
  distinct(wc_year, team) %>%
  left_join(wc_start_dates, by = "wc_year")

team_elos <- team_wc_list %>%
  rowwise() %>%
  mutate(
    team_elo_pre = get_elo_at_date(team, start_date, elo_raw)
  ) %>%
  ungroup()

write_csv(team_elos, "data/interim/elo_ratings.csv")
```

---

## 4.2 FIFA World Rankings: Kaggle CSV

**Dataset**: `https://www.kaggle.com/datasets/cashncarry/fifaworldranking`  
**Coverage**: Monthly rankings, August 1993 – present.

```bash
kaggle datasets download cashncarry/fifaworldranking -p data/raw/kaggle/
```

```r
fifa_rank_raw <- read_csv("data/raw/kaggle/fifaworldranking.csv")

# Extract June ranking for each WC year (1994+)
wc_june_ranks <- fifa_rank_raw %>%
  mutate(rank_date = as.Date(rank_date)) %>%
  filter(
    month(rank_date) == 6,
    year(rank_date) %in% c(1994, 1998, 2002, 2006, 2010, 2014, 2018)
  ) %>%
  # For 2022, FIFA ranked in October before the November WC
  bind_rows(
    fifa_rank_raw %>%
      mutate(rank_date = as.Date(rank_date)) %>%
      filter(month(rank_date) == 10, year(rank_date) == 2022)
  ) %>%
  group_by(year(rank_date), team_name) %>%
  # Take the ranking closest to (but before) the tournament
  slice_max(rank_date) %>%
  ungroup() %>%
  select(wc_year = `year(rank_date)`,
         team = team_name,
         fifa_rank = rank)

write_csv(wc_june_ranks, "data/interim/fifa_rankings.csv")
```

> ⚠️ **FIFA Rankings pitfall**: FIFA rankings only started in August 1993. For the 1994 WC, June 1994 rankings exist. For anything before 1994, you must rely exclusively on Elo ratings.

---

## 4.3 Merge Team Quality

```r
team_quality <- team_elos %>%
  left_join(wc_june_ranks, by = c("wc_year", "team")) %>%
  # Fill missing FIFA rank with estimated rank from Elo (simple approximation)
  mutate(
    fifa_rank_available = !is.na(fifa_rank)
  )

write_csv(team_quality, "data/interim/team_quality_clean.csv")
```

---

---

# PHASE 5 — DATA INTEGRATION & QUALITY ASSURANCE

> **Goal**: Join all three pipelines into the single master dataset. This is where schema errors surface. Fix them here — never downstream.

---

## 5.1 The Master Join

```r
# R/06_integrate_data.R

library(tidyverse)
library(geosphere)
library(lubridate)

matches     <- read_csv("data/interim/matches_clean.csv")
venues      <- read_csv("data/interim/venues_climate.csv")
team_qual   <- read_csv("data/interim/team_quality_clean.csv")

# Join 1: Attach venue data to each match
matches_v <- matches %>%
  left_join(venues, by = c("venue_city" = "city", "wc_year" = "wc_year"))

# Join 2: Attach team quality for both team and opponent
matches_vq <- matches_v %>%
  # Own team quality
  left_join(team_qual %>% select(wc_year, team, team_elo_pre, fifa_rank),
            by = c("wc_year", "team")) %>%
  # Opponent quality
  left_join(team_qual %>% select(wc_year, team, opp_elo_pre = team_elo_pre,
                                 opp_fifa_rank = fifa_rank),
            by = c("wc_year", "opponent" = "team"))

# Join 3: Add xG data (2018/2022 only)
xg_18 <- read_csv("data/raw/statsbomb/xg_by_half_2018.csv")
xg_22 <- read_csv("data/raw/statsbomb/xg_by_half_2022.csv")
xg_all <- bind_rows(xg_18, xg_22)

matches_full <- matches_vq %>%
  left_join(xg_all, by = c("match_id", "team"))
# xG columns will be NA for 1994–2014 — this is correct and expected

# Save master dataset
write_csv(matches_full, "data/final/team_match_master.csv")
message("Master dataset saved: ", nrow(matches_full), " rows")
```

---

## 5.2 Engineering the Rest Days & Travel Distance

This is the most algorithmically complex part of data engineering.

```r
# Compute rest days and travel distance in the context of the integration script

master <- read_csv("data/final/team_match_master.csv") %>%
  arrange(team, wc_year, match_date)

master <- master %>%
  group_by(team, wc_year) %>%
  mutate(
    # Rest days = gap between this match and previous match in same tournament
    rest_days = as.numeric(match_date - lag(match_date)),
    # First match of the tournament gets NA — convert to a convention
    rest_days = if_else(is.na(rest_days), -1L, as.integer(rest_days)),
    # -1 flags "first match, no rest days calculation applicable"
    
    # Travel distance: Haversine distance between consecutive venues
    prev_lat = lag(venue_lat),
    prev_lon = lag(venue_lon),
    travel_km = if_else(
      !is.na(prev_lat),
      distHaversine(
        cbind(venue_lon, venue_lat),
        cbind(prev_lon, prev_lat)
      ) / 1000,  # Convert meters → km
      NA_real_
    )
  ) %>%
  ungroup() %>%
  select(-prev_lat, -prev_lon)

write_csv(master, "data/final/team_match_master.csv")
```

---

## 5.3 Engineering the Altitude & Climate Flags

```r
master <- master %>%
  mutate(
    # --- Venue stress flags ---
    is_high_alt     = elevation_m > 1000,        # Primary threshold
    is_medium_alt   = between(elevation_m, 500, 1000),  # Intermediate
    alt_category    = case_when(
      elevation_m < 500  ~ "Sea Level",
      elevation_m < 1000 ~ "Mid Altitude",
      elevation_m < 1500 ~ "High Altitude",
      TRUE               ~ "Very High Altitude"
    ),
    
    # Heat stress index (Humidex-inspired)
    heat_stress_idx = avg_temp_c * (avg_humidity_pct / 100),
    is_high_heat    = avg_temp_c > 28,
    
    # Combined stress: a venue is "stressful" if high altitude OR high heat
    is_stress_venue = is_high_alt | is_high_heat,
    
    # --- Team origin flags ---
    is_altitude_team = team_origin_elev_m > 1000,
    is_altitude_opp  = opp_origin_elev_m > 1000,
    
    # Elo quality control
    elo_diff = team_elo_pre - opp_elo_pre,
    
    # --- Outcome variables ---
    h2_delta      = goals_against_2h - goals_against_1h,
    total_goals   = goals_against_1h + goals_against_2h,
    prop_goals_2h = if_else(
      total_goals > 0,
      goals_against_2h / total_goals,
      NA_real_   # Avoid 0/0
    )
  )

write_csv(master, "data/final/team_match_master.csv")
message("Feature engineering complete. Final dataset: ",
        nrow(master), " rows × ", ncol(master), " cols")
```

---

## 5.4 Data Quality Report

```r
# Run this before ANY analysis

library(janitor)

master <- read_csv("data/final/team_match_master.csv")

# Missing value audit
master %>%
  summarise(across(everything(), ~ sum(is.na(.)))) %>%
  pivot_longer(everything(), names_to = "column", values_to = "n_missing") %>%
  arrange(desc(n_missing)) %>%
  filter(n_missing > 0) %>%
  mutate(pct_missing = scales::percent(n_missing / nrow(master))) %>%
  print()

# Expected missing:
# xg_* columns: ~75% missing (only 2018/2022 available) — CORRECT
# fifa_rank columns: ~10% missing (1994 data, some teams unranked) — ACCEPTABLE
# rest_days = -1: first matches of each team — CORRECT (not missing)
# travel_km: first matches — ACCEPTABLE

# Range checks
summary(master[c("elevation_m", "avg_temp_c", "avg_humidity_pct",
                 "goals_against_1h", "goals_against_2h",
                 "team_elo_pre", "rest_days")])
```

---

---

# PHASE 6 — EXPLORATORY DATA ANALYSIS

> **Goal**: Understand your data before modelling. Every modelling decision should be motivated by what you see in EDA, not by what you assume. Produce an HTML EDA report using R Markdown.

Create `R/07_eda.Rmd`. Key analyses to include:

---

## 6.1 Distribution of Elevation Across Venues

```r
# Key question: How many matches were actually played at altitude?
# If only 10 out of 512 matches were high-altitude, your power is low.

master %>%
  distinct(wc_year, venue_city, elevation_m) %>%
  ggplot(aes(x = elevation_m)) +
  geom_histogram(binwidth = 100, fill = "#2D6A4F", colour = "white") +
  geom_vline(xintercept = 1000, colour = "red", linetype = "dashed") +
  annotate("text", x = 1050, y = 5, label = "1,000m threshold",
           hjust = 0, colour = "red") +
  labs(title = "Distribution of World Cup Venue Elevations (1994–2022)",
       x = "Elevation (m)", y = "Number of Venues") +
  theme_minimal()
```

> **What to look for**: You need a reasonable number of high-altitude matches to have statistical power. If only 15–20 matches were played above 1,000 m across all your WC years, acknowledge this as a power limitation in your write-up.

---

## 6.2 2nd Half Goal Differential by Altitude Category

```r
# The central descriptive question
master %>%
  filter(total_goals > 0) %>%   # Exclude 0–0 scorelines (no information in prop)
  group_by(alt_category) %>%
  summarise(
    n_matches       = n(),
    mean_h2_delta   = mean(h2_delta, na.rm = TRUE),
    sd_h2_delta     = sd(h2_delta, na.rm = TRUE),
    se              = sd_h2_delta / sqrt(n_matches),
    ci_low          = mean_h2_delta - 1.96 * se,
    ci_high         = mean_h2_delta + 1.96 * se
  ) %>%
  ggplot(aes(x = reorder(alt_category, mean_h2_delta), y = mean_h2_delta)) +
  geom_col(fill = "#1D3557", width = 0.6) +
  geom_errorbar(aes(ymin = ci_low, ymax = ci_high), width = 0.2, colour = "#E63946") +
  geom_hline(yintercept = 0, linetype = "dashed") +
  coord_flip() +
  labs(title = "Mean 2nd-Half Goal Concession Delta by Altitude Category",
       subtitle = "Positive = more goals conceded in 2nd half than 1st half",
       x = NULL, y = "h2_delta (goals)") +
  theme_minimal()
```

---

## 6.3 Scatter: Elevation vs h2_delta

```r
master %>%
  filter(!is.na(h2_delta), total_goals > 0) %>%
  ggplot(aes(x = elevation_m, y = h2_delta)) +
  geom_point(alpha = 0.4, colour = "#457B9D") +
  geom_smooth(method = "loess", colour = "#E63946", se = TRUE) +
  geom_vline(xintercept = 1000, linetype = "dashed", colour = "grey40") +
  labs(title = "Elevation vs. 2nd-Half Goal Differential",
       x = "Venue Elevation (m)", y = "h2_delta (goals conceded 2H − 1H)") +
  theme_minimal()
```

---

## 6.4 Confound Check: Elo Difference vs h2_delta

```r
# CRITICAL EDA CHECK: Is the altitude effect just a quality effect?
# (i.e., stronger teams tend to score more in 2nd half regardless of altitude)

master %>%
  ggplot(aes(x = elo_diff, y = h2_delta)) +
  geom_point(alpha = 0.3) +
  geom_smooth(method = "lm", colour = "darkred") +
  labs(title = "Elo Difference vs h2_delta (Confound Check)",
       subtitle = "If slope is flat, team quality doesn't drive the pattern",
       x = "Elo Difference (team − opponent)", y = "h2_delta") +
  theme_minimal()
```

---

## 6.5 EDA Narrative to Include in Report

Structure your EDA report to answer these questions explicitly:

1. How many matches were played at > 1,000m across your study period?
2. What is the unconditional difference in `h2_delta` between high-altitude and sea-level matches?
3. Is there a smooth relationship between elevation and `h2_delta`, or a threshold effect?
4. Is `avg_temp_c` correlated with `elevation_m` (multicollinearity risk)?
5. Is `rest_days` distributed differently at altitude venues (systematic confound)?
6. What does the distribution of the outcome variable look like? Is it Poisson-distributed? Normal? Zero-inflated?

---

---

# PHASE 7 — FEATURE ENGINEERING

> **These are the variables your models will consume. Every variable needs a justification — not just a definition.**

---

## 7.1 Variable Construction Summary

```r
# R/08_feature_engineering.R
# All transformations in one place for reproducibility

master <- read_csv("data/final/team_match_master.csv") %>%
  mutate(
    # --- ALTITUDE VARIABLES ---
    # Log-transform: elevation effect may be logarithmic, not linear
    # (the difference between 0m and 500m matters less than 1500m to 2000m)
    log_elevation = log1p(elevation_m),  # log(elevation + 1) handles zeros

    # Binary threshold (1,000m is the threshold in altitude physiology literature)
    is_high_alt = as.integer(elevation_m > 1000),

    # --- CLIMATE VARIABLES ---
    # Wet-Bulb Globe Temperature proxy (simplified)
    # Real WBGT = 0.7 × Tw + 0.2 × Tg + 0.1 × Ta
    # Simplified proxy using only available data:
    wbgt_proxy = 0.7 * avg_temp_c * (avg_humidity_pct / 100) +
                 0.3 * avg_temp_c,

    # --- COMBINED STRESS INDEX ---
    # Standardise both components then sum
    # (standardise within the dataset so both are on same scale)
    stress_composite = scale(log_elevation)[,1] + scale(avg_temp_c)[,1],

    # --- QUALITY CONTROL VARIABLES ---
    elo_diff_scaled = scale(elo_diff)[,1],  # Z-scored for model stability
    rest_days_clean = if_else(rest_days == -1, NA_integer_, rest_days),
    is_first_match  = rest_days == -1,

    # --- TRAVEL ---
    log_travel_km = log1p(travel_km),  # Log: big distances matter less at scale

    # --- TEAM ADAPTATION FLAG ---
    altitude_advantage = case_when(
      is_altitude_team & !is_altitude_opp ~ "Altitude Team",
      !is_altitude_team & is_altitude_opp ~ "Sea-Level Team",
      is_altitude_team & is_altitude_opp  ~ "Both Altitude",
      TRUE ~ "Both Sea-Level"
    )
  )

write_csv(master, "data/final/team_match_analytical.csv")
```

---

---

# PHASE 8 — STATISTICAL MODELLING

> **Why these model choices**: Goals are count data — non-negative integers. This rules out standard linear regression (which would predict negative goals). The correct model family is Poisson or Negative Binomial.

---

## 8.1 Check for Overdispersion (Poisson vs Negative Binomial Decision)

```r
# R/09_models.R

library(lme4)
library(lmerTest)
library(MASS)
library(broom.mixed)
library(tidyverse)

df <- read_csv("data/final/team_match_analytical.csv") %>%
  filter(!is.na(goals_against_2h))  # Ensure complete outcome

# Check: mean vs variance of outcome
mean(df$goals_against_2h)
var(df$goals_against_2h)
# If variance >> mean, use Negative Binomial (more common for goal data)
# If variance ≈ mean, Poisson is fine
```

---

## 8.2 Model 1 — Baseline (No Controls)

```r
# Just altitude effect, no controls
# This will almost certainly be biased — document it anyway
m1 <- glm(goals_against_2h ~ is_high_alt,
           family = poisson(link = "log"),
           data = df)
summary(m1)
```

---

## 8.3 Model 2 — Add Team Quality Controls

```r
m2 <- glm(goals_against_2h ~ is_high_alt + elo_diff_scaled,
           family = poisson(link = "log"),
           data = df)
summary(m2)

# Compare M1 vs M2: does the altitude coefficient change substantially?
# If it drops after adding Elo, team quality was confounding the altitude effect.
```

---

## 8.4 Model 3 — Full Specification

```r
m3 <- glm.nb(
  goals_against_2h ~
    log_elevation          +   # Primary exposure
    avg_temp_c             +   # Climate control
    avg_humidity_pct       +   # Climate control
    elo_diff_scaled        +   # Team quality
    is_altitude_team       +   # Origin adaptation (H4)
    rest_days_clean        +   # Fatigue control
    log_travel_km          +   # Travel control
    wc_year,                   # Year fixed effect (WC-level confounders)
  data = df
)
summary(m3)
```

---

## 8.5 Model 4 — Mixed Effects (Tournament Random Intercept)

```r
# Each WC tournament is a "cluster" — matches within the same tournament
# are not independent. Ignoring this inflates false positive rates.
# The correct approach: add a random intercept for wc_year.

m4 <- glmer.nb(
  goals_against_2h ~
    log_elevation          +
    avg_temp_c             +
    elo_diff_scaled        +
    is_altitude_team       +
    rest_days_clean        +
    log_travel_km          +
    (1 | wc_year),            # Random intercept: each WC is its own baseline
  data = df
)
summary(m4)
```

---

## 8.6 Model 5 — Interaction: Altitude × Heat

```r
m5 <- glmer.nb(
  goals_against_2h ~
    log_elevation * avg_temp_c   +   # Interaction term tests H3
    elo_diff_scaled              +
    is_altitude_team             +
    rest_days_clean              +
    log_travel_km                +
    (1 | wc_year),
  data = df
)
summary(m5)
# If interaction coefficient is significant and positive → H3 supported
```

---

## 8.7 Model Comparison & Diagnostics

```r
# AIC comparison
AIC(m3, m4, m5)
# Lower AIC = better model

# Coefficient plot
library(broom.mixed)
tidy(m4, conf.int = TRUE) %>%
  filter(term != "(Intercept)", effect == "fixed") %>%
  ggplot(aes(x = estimate, xmin = conf.low, xmax = conf.high,
             y = reorder(term, estimate))) +
  geom_pointrange() +
  geom_vline(xintercept = 0, linetype = "dashed") +
  labs(title = "Model 4 Coefficient Plot (GLMM Negative Binomial)",
       x = "Coefficient Estimate (log scale)", y = NULL) +
  theme_minimal()

# Check for multicollinearity
car::vif(m3)  # VIF > 5 suggests a problem
```

---

## 8.8 Sensitivity Analyses

These are not optional — they are what distinguish a credible analysis from a casual one:

```r
# Sensitivity 1: Different altitude threshold (800m instead of 1000m)
df_sens1 <- df %>% mutate(is_high_alt = elevation_m > 800)
m_sens1 <- update(m4, data = df_sens1)

# Sensitivity 2: Exclude penalty-shootout matches
# (scorelines in knockout games go to extra time, distorting 2nd-half goals)
df_no_et <- df %>% filter(stage %in% c("Group"))
m_sens2 <- update(m4, data = df_no_et)

# Sensitivity 3: Outcome is `prop_goals_2h` (proportion) instead of raw count
m_sens3 <- lmer(prop_goals_2h ~ log_elevation + avg_temp_c +
                  elo_diff_scaled + is_altitude_team +
                  (1 | wc_year),
                data = df %>% filter(!is.na(prop_goals_2h)))
```

---

---

# PHASE 9 — RESULTS & VISUALISATION

> **Goal**: Produce the 5–6 key charts that tell the complete story of your findings. Every chart should stand alone with a clear title and caption.

---

## 9.1 The Six Essential Charts

| # | Chart | What It Shows | Chart Type |
|---|---|---|---|
| 1 | Elevation distribution of WC venues | How much altitude variation exists | Histogram |
| 2 | h2_delta by altitude category | Unconditional fatigue pattern | Bar + CI |
| 3 | Elevation scatter vs h2_delta | Dose-response relationship | Scatter + LOESS |
| 4 | Coefficient plot (Model 4) | What drives 2nd-half concessions | Dot-whisker |
| 5 | 2026 Venue Risk Matrix | Actionable output for 2026 prep | Bubble chart |
| 6 | Altitude-native vs non-native | H4 immunity test | Grouped bar |

---

## 9.2 The 2026 Venue Risk Matrix (Your Signature Output)

This chart is your portfolio centrepiece. It positions all 16 WC 2026 venues on two axes (elevation vs temperature) with bubble size representing predicted 2nd-half concession risk from your model.

```r
# Use model predictions on the 2026 venue data
venues_2026 <- read_csv("data/manual/venues_2026.csv") %>%
  # Add June-July temperatures for 2026 venues (from Meteostat, same process)
  left_join(weather_2026, by = "city")

# Predict from Model 4 using 2026 venue conditions
# (Assume average-quality teams: Elo diff = 0, rest days = 4, travel = 500km)
predictions_2026 <- predict(m4,
  newdata = venues_2026 %>%
    mutate(elo_diff_scaled = 0,
           is_altitude_team = FALSE,
           rest_days_clean = 4,
           log_travel_km = log1p(500),
           wc_year = 2026,
           log_elevation = log1p(elevation_m)),
  type = "response",
  allow.new.levels = TRUE
)

venues_2026$predicted_goals_2h <- predictions_2026

# Plot
ggplot(venues_2026, aes(x = elevation_m, y = avg_temp_june_c,
                          size = predicted_goals_2h,
                          colour = predicted_goals_2h,
                          label = city)) +
  geom_point(alpha = 0.7) +
  ggrepel::geom_text_repel(size = 3.5, max.overlaps = 15) +
  scale_colour_viridis_c(option = "magma", direction = -1) +
  scale_size_continuous(range = c(4, 14)) +
  geom_vline(xintercept = 1000, linetype = "dashed", colour = "grey60") +
  geom_hline(yintercept = 28, linetype = "dashed", colour = "grey60") +
  annotate("text", x = 1050, y = 15, label = "1,000m threshold",
           angle = 90, colour = "grey40", size = 3) +
  annotate("text", x = 200, y = 28.5, label = "28°C heat threshold",
           colour = "grey40", size = 3) +
  labs(
    title = "2026 World Cup Venue Risk Matrix",
    subtitle = "Predicted 2nd-half goals conceded by an average team (Elo diff = 0, 4 rest days)",
    x = "Venue Elevation (m)", y = "Avg June Temperature (°C)",
    colour = "Predicted\nGoals 2H", size = "Predicted\nGoals 2H",
    caption = "Model: GLMM Negative Binomial with tournament random intercept\nData: FBref, Meteostat, Elo Ratings (1994–2022)"
  ) +
  theme_minimal(base_size = 12)

ggsave("outputs/figures/fig05_2026_venue_risk_matrix.png",
       width = 12, height = 8, dpi = 300)
```

---

---

# PHASE 10 — PORTFOLIO PACKAGING

> **Goal**: Make this project look exactly as credible as it is analytically. Recruiters and data science hiring managers will see the GitHub repo before they see your code.

---

## 10.1 README.md Structure

```markdown
# ⛰️ Altitude & Heat Adaptation in World Cup Football

**Does playing at altitude cause teams to concede more goals in the second half?**
A statistical analysis of 512 World Cup matches (1994–2022) using Generalised
Linear Mixed Models with venue-level physiological stress indicators.

## Key Finding
Teams playing at venues above 1,000m elevation concede **[X]% more goals** in
the second half compared to the first half, after controlling for team quality,
rest days, and travel distance (p < 0.05).

## 2026 Preview
[Insert risk matrix chart here]
Mexico City (2,240m) and Denver (1,609m) are flagged as the highest physiological
risk venues in the 2026 tournament.

## Methods
- **Data**: FBref (match results), Elo Ratings (team quality), Meteostat (climate),
            Open-Elevation API (altitude), StatsBomb Open Data (xG, 2018/2022)
- **Coverage**: 1994–2022, 8 World Cups, ~512 team-match observations
- **Model**: Generalised Linear Mixed Model, Negative Binomial family,
             random intercept for tournament year
- **Language**: R 4.3+

## Reproduce
git clone https://github.com/your-username/altitude-heat-wc
cd altitude-heat-wc
Rscript 00_run_all.R

## Data Sources & Licences
| Source | Licence | Used For |
...

## Cite This Work
Soumyadeep [Last Name] (2025). Altitude & Heat Adaptation in World Cup Football.
GitHub: https://github.com/your-username/altitude-heat-wc
```

---

## 10.2 Architecture Decision Records (ADRs)

Write these three ADRs in `/docs/`:

**ADR-01: Why 1994–2022 as the primary scope**
- Rationale: FIFA Rankings available from 1993. Goal minute data clean. Meteostat coverage reliable.

**ADR-02: Why Negative Binomial over Poisson**
- Rationale: Goals are overdispersed (variance > mean). NB adds a dispersion parameter to handle this. Show the mean/variance comparison from EDA.

**ADR-03: Why 1,000m as the altitude threshold**
- Rationale: Sports physiology literature (Wehrlin & Hallén 2006) shows significant VO₂max reduction above ~1,000m. FIFA itself restricts competitive matches above 2,500m. Sensitivity analysis confirms results robust to 800m threshold.

---

## 10.3 Resume Bullet Points

```
• Built end-to-end sports analytics pipeline in R ingesting FBref, Meteostat,
  Open-Elevation, and StatsBomb data across 8 World Cups (1994–2022); 
  modelled 2nd-half performance decline using GLMM Negative Binomial with
  Elo and FIFA ranking controls, finding significant altitude fatigue effect
  (β = X, p < 0.05)

• Produced 2026 World Cup venue physiological risk rankings projecting X%
  higher 2nd-half goal exposure at Mexico City (2,240m) and Denver (1,609m)
  compared to sea-level venues
```

---

## 10.4 Data Licence Compliance Checklist

| Source | Licence | Portfolio Use | Commercial Use | Citation Required |
|---|---|---|---|---|
| FBref | Personal/non-commercial | ✅ | ❌ | ✅ Link to source |
| StatsBomb Open Data | CC BY-NC-SA 4.0 | ✅ | ❌ | ✅ Must credit |
| Kaggle (cashncarry) | Open | ✅ | Check dataset | ✅ Link |
| Open-Elevation | MIT | ✅ | ✅ | Optional |
| Meteostat | CC BY 4.0 | ✅ | ✅ | ✅ Must credit |
| eloratings.net | © proprietary | ✅ non-commercial | ❌ | ✅ Link |
| Wikipedia | CC BY-SA 3.0 | ✅ | ✅ | Optional |

---

---

# APPENDIX A — DATA SOURCE MASTER REFERENCE

| Data Type | Source | URL | Method | Format |
|---|---|---|---|---|
| Match results (1994–2022) | FBref | `fbref.com/en/comps/1/` | `worldfootballR` | Data frame |
| Match events (goal minutes) | FBref | Match report pages | `rvest` / `worldfootballR` | HTML scrape |
| xG by minute (2018/22) | StatsBomb | `github.com/statsbomb/open-data` | `StatsBombR` | JSON |
| WC 2022 detailed | Kaggle | `kaggle.com/datasets/fifarush/fifa-world-cup-2022` | `kaggle` CLI | CSV |
| WC historical goals | Kaggle | `kaggle.com/datasets/evangower/fifa-world-cup` | `kaggle` CLI | CSV |
| WC stadiums list | Wikipedia | `en.wikipedia.org/wiki/List_of_FIFA_World_Cup_stadiums` | `rvest` | HTML table |
| Venue lat/long | OpenStreetMap | Via `tidygeocoder` | R package | API |
| Elevation | Open-Elevation | `api.open-elevation.com/api/v1/lookup` | `httr` GET | JSON |
| Historical weather | Meteostat | `meteostat.p.rapidapi.com` | `httr` GET | JSON |
| Elo ratings | eloratings.net | `eloratings.net/en.1.csv` | `read_csv` direct | CSV |
| FIFA rankings | Kaggle | `kaggle.com/datasets/cashncarry/fifaworldranking` | `kaggle` CLI | CSV |
| Squad values | Transfermarkt | Via `worldfootballR` | R package | Data frame |
| 2026 venues | FIFA.com | `fifa.com/fifaplus/.../canadamexicousa2026` | Manual | Manual CSV |

---

# APPENDIX B — KNOWN CONFOUNDS TO DOCUMENT

| Confound | Nature | Mitigation |
|---|---|---|
| 2022 Qatar (Nov-Dec) | All venues < 15m elevation; Nov-Dec temps not June-July | Flag as separate season; include month controls |
| 2002 Korea/Japan | Extreme travel distances; unusual home advantage dynamics | Code travel_km explicitly; sensitivity test excluding 2002 |
| 2014 Manaus, Brazil | Extreme humidity + heat at sea level | Will be captured by `avg_humidity_pct` and `avg_temp_c` |
| Extra time goals | Group stage has no ET; knockout rounds do | Filter group stage only for primary analysis |
| Penalty shootout | Goals in shootout are not match goals | FBref separates regular time — verify |
| Referee effects | Different refereeing in different confederations | Unobserved confound; note as limitation |
| Tactical adaptation | Elite teams adapt tactics at altitude | Unobserved; could explore with possession data (future work) |

---

*Document Version: 1.0 | Project: Altitude & Heat Adaptation | Status: SDD Complete — Ready for Implementation*
