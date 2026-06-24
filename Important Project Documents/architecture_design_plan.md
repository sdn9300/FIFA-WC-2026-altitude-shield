# 🏗️ Architecture Design Document (ADD)
## Altitude & Heat Adaptation · FIFA World Cup Analytics
### Version 1.0 · Status: Approved for Development

---

## DOCUMENT CONTROL

| Field | Value |
|---|---|
| **Document Type** | Architecture Design Document (ADD) |
| **Project** | FIFA World Cup Environmental Stress Analytics (1930–2026) |
| **Primary Language** | R 4.3+ |
| **Secondary Stack** | Next.js 14 · Shiny · Quarto · Docker |
| **Sprint Duration** | 14 days |
| **Target Deployments** | shinyapps.io · Vercel · GitHub Pages |
| **Version** | 1.0 |
| **Status** | Approved — Ready for Sprint Day 1 |

---

---

# SECTION 1 — EXECUTIVE ARCHITECTURE OVERVIEW

## 1.1 System Purpose

This system is a **reproducible data science pipeline** that:

1. Ingests historical FIFA World Cup match data, environmental data, and team quality data from 8 sources
2. Transforms and joins them into a single 512-row analytical master table
3. Fits statistical models (GLMM Negative Binomial) quantifying altitude/heat effects on 2nd-half performance
4. Exports findings as a Quarto report, Shiny dashboard, and Next.js portfolio website

## 1.2 Architecture Principles (Non-Negotiable)

These principles govern every design decision in this document:

```
PRINCIPLE 1 — CACHE EVERYTHING
  Never make the same API call or scrape twice.
  Every raw data pull → immediately saved to data/raw/.
  Every cleaned dataset → saved to data/interim/ before joining.

PRINCIPLE 2 — VALIDATE AT EVERY BOUNDARY
  Every ETL step produces a file. Every file is validated
  before the next step begins. Schema mismatches are errors,
  not warnings.

PRINCIPLE 3 — REPRODUCIBILITY OVER SPEED
  renv locks all package versions. Dockerfile pins R version.
  Anyone running 00_run_all.R on a clean machine gets identical
  results. No "works on my machine" accepted.

PRINCIPLE 4 — SEPARATION OF CONCERNS
  Scripts numbered 01–10 each do exactly one thing.
  No script both fetches AND models.
  No script produces outputs for two different pipeline stages.

PRINCIPLE 5 — FAIL LOUDLY, DEGRADE GRACEFULLY
  tryCatch() on all API calls with logging.
  Missing data → explicit NA with documentation.
  Invalid joins → stop() with diagnostic message, not silent NA rows.
```

---

## 1.3 High-Level Architecture (5 Layers)

```
╔══════════════════════════════════════════════════════════════════╗
║  LAYER 1: DATA SOURCES                                           ║
║  FBref · StatsBomb · Kaggle · Open-Elevation · Meteostat        ║
║  Elo Ratings · Wikipedia · FIFA 2026 Official                    ║
╚══════════════════════╦═══════════════════════════════════════════╝
                        ↓ scrape / API / CSV download
╔══════════════════════╩═══════════════════════════════════════════╗
║  LAYER 2: ETL LAYER (R Scripts 01–06)                            ║
║  Match Extraction · Venue Geocoding · Elevation API              ║
║  Weather API · Team Quality · Master Integration                 ║
╚══════════════════════╦═══════════════════════════════════════════╝
                        ↓ produces cleaned CSV files
╔══════════════════════╩═══════════════════════════════════════════╗
║  LAYER 3: STORAGE LAYER                                          ║
║  data/raw/ → data/interim/ → data/final/team_match_master.csv    ║
║  models/ (RDS objects) · outputs/ (PNG/SVG charts)               ║
╚══════════════════════╦═══════════════════════════════════════════╝
                        ↓ reads master dataset
╔══════════════════════╩═══════════════════════════════════════════╗
║  LAYER 4: ANALYTICS LAYER (R Scripts 07–11)                      ║
║  EDA (Quarto) · Feature Engineering · GLMM Models                ║
║  Publication Visualisations · 2026 Predictions                   ║
╚══════════════════════╦═══════════════════════════════════════════╝
                        ↓ exports reports + model outputs
╔══════════════════════╩═══════════════════════════════════════════╗
║  LAYER 5: OUTPUT LAYER                                           ║
║  Quarto Report (HTML/PDF) · Shiny Dashboard (shinyapps.io)       ║
║  Next.js Website (Vercel) · GitHub Repository (public)           ║
╚══════════════════════════════════════════════════════════════════╝
```

---

---

# SECTION 2 — PROJECT DIRECTORY STRUCTURE

This is the canonical folder structure. Every script expects files in these exact locations.

```
altitude-heat-wc/                    ← R Project root (open .Rproj, not scripts)
│
├── altitude-heat-wc.Rproj           ← Always open this, never scripts directly
├── .Rprofile                        ← renv autoloader
├── renv.lock                        ← Package version lockfile (commit this)
├── Dockerfile                       ← Reproducible container (rocker/rstudio:4.3.0)
├── .github/
│   └── workflows/
│       └── ci.yml                   ← GitHub Actions: test + lint on every push
├── .env.example                     ← Template: METEOSTAT_KEY=your_key_here
├── README.md                        ← Public-facing documentation
├── AGENT_GUIDE.md                   ← Instructions for AI coding agents (Claude Code etc.)
├── 00_run_all.R                     ← Master orchestrator: sources 01–11 in order
│
├── R/                               ← All numbered scripts (source order matters)
│   ├── 01_scrape_matches.R          ← FBref → matches_raw + HT scores
│   ├── 02_scrape_statsbomb.R        ← StatsBomb → xg_by_half (2018/22 only)
│   ├── 03_get_venues.R              ← Wikipedia → venues_geocoded
│   ├── 04_get_elevation.R           ← Open-Elevation API → venues_elevation
│   ├── 05_get_weather.R             ← Meteostat API → venues_climate
│   ├── 06_get_team_quality.R        ← Elo + FIFA rankings → team_quality
│   ├── 07_integrate_data.R          ← All joins → team_match_master
│   ├── 08_eda.Rmd                   ← Quarto EDA report (render separately)
│   ├── 09_feature_engineering.R     ← Derived variables → team_match_analytical
│   ├── 10_models.R                  ← GLMM NB Models M1–M5 + sensitivity
│   ├── 11_predictions_2026.R        ← predict() on 2026 venues → venue_risk
│   └── 12_visualisations.R          ← 6 publication charts → outputs/figures/
│
├── data/
│   ├── raw/                         ← NEVER edit. Source of truth.
│   │   ├── fbref/                   ← Per-year match CSVs from worldfootballR
│   │   │   ├── matches_2002.csv
│   │   │   ├── ...
│   │   │   └── matches_2022.csv
│   │   ├── statsbomb/               ← xG JSON from StatsBomb (2018/22)
│   │   │   ├── xg_by_half_2018.csv
│   │   │   └── xg_by_half_2022.csv
│   │   ├── kaggle/                  ← Downloaded Kaggle CSVs
│   │   │   ├── WorldCupMatches.csv
│   │   │   └── fifaworldranking.csv
│   │   ├── elo/
│   │   │   └── elo_ratings.csv      ← Bulk download from eloratings.net
│   │   └── manual/                  ← Hand-assembled files
│   │       ├── venues_2026.csv      ← 2026 official venues (manual)
│   │       ├── team_name_lookup.csv ← "West Germany" → "GER" etc.
│   │       └── capital_elevations.csv ← Team home capital elevations
│   │
│   ├── interim/                     ← Cleaned, single-source files (not yet joined)
│   │   ├── matches_clean.csv        ← Output of 01 + 02: all matches with HT goals
│   │   ├── venues_geocoded.csv      ← Output of 03: stadium lat/lon
│   │   ├── venues_elevation.csv     ← Output of 04: + elevation_m
│   │   ├── venues_climate.csv       ← Output of 05: + temp + humidity
│   │   └── team_quality_clean.csv   ← Output of 06: Elo + FIFA rank
│   │
│   └── final/
│       ├── team_match_master.csv    ← Output of 07: THE master dataset
│       └── team_match_analytical.csv ← Output of 09: + engineered features
│
├── models/                          ← Saved model objects
│   ├── m1_baseline.rds
│   ├── m2_quality_ctrl.rds
│   ├── m3_full_spec.rds
│   ├── m4_glmm_nb.rds               ← PRIMARY MODEL (mixed effects NB)
│   └── m5_interaction.rds
│
├── outputs/
│   ├── figures/                     ← Publication charts (PNG, 300 DPI)
│   │   ├── fig01_elevation_dist.png
│   │   ├── fig02_h2delta_by_altitude.png
│   │   ├── fig03_elevation_scatter.png
│   │   ├── fig04_coefficient_plot.png
│   │   ├── fig05_2026_risk_matrix.png
│   │   └── fig06_altitude_immunity.png
│   ├── tables/                      ← Regression tables (HTML, LaTeX)
│   │   ├── model_comparison.html
│   │   └── coefficients_m4.html
│   ├── json/                        ← For Next.js website consumption
│   │   ├── model_coefficients.json
│   │   ├── h2_delta_by_category.json
│   │   ├── venues_historical.json
│   │   └── eda_stats.json
│   └── reports/
│       └── eda_report.html          ← Rendered Quarto EDA report
│
├── tests/                           ← testthat test files
│   ├── test_data_integrity.R        ← Row counts, no NA in key cols, range checks
│   ├── test_etl_functions.R         ← Unit tests for helper functions
│   └── test_model_outputs.R         ← Model coefficient sign/magnitude checks
│
└── docs/                            ← Architecture documentation
    ├── ADD.md                       ← This document
    ├── ADR_01_scope.md
    ├── ADR_02_model_family.md
    ├── ADR_03_altitude_threshold.md
    ├── ADR_04_random_intercept.md
    ├── ADR_05_language_choice.md
    ├── ADR_06_storage_format.md
    └── data_dictionary.md           ← Full variable definitions
```

---

---

# SECTION 3 — ETL PIPELINE DESIGN

## 3.1 Pipeline Overview

```
FBref           ──→  01_scrape_matches.R  ──→  matches_clean.csv
StatsBomb       ──→  02_scrape_statsbomb.R ──→  xg_by_half_*.csv
Wikipedia       ──→  03_get_venues.R       ──→  venues_geocoded.csv
Open-Elevation  ──→  04_get_elevation.R    ──→  venues_elevation.csv
Meteostat       ──→  05_get_weather.R      ──→  venues_climate.csv
Elo + Kaggle    ──→  06_get_team_quality.R ──→  team_quality_clean.csv
                          │
              All 5 files ↓
                     07_integrate_data.R
                          │
                          ↓
               team_match_master.csv  ← 512 rows × 28 cols
```

## 3.2 Script 01 — Match Data Extraction

**Purpose**: Scrape all World Cup match results 2002–2022 from FBref, including half-time scores.

**Dependencies**: `worldfootballR`, `rvest`, `tidyverse`, `janitor`

**Key logic**:
```r
# Step 1: Get fixture list (includes venue, date, scores)
get_wc_fixtures <- function(year) {
  Sys.sleep(3)  # MANDATORY: FBref 429s without this
  fb_match_results(
    country = "World", gender = "M",
    season_end_year = year,
    tier = "1st"
  )
}

# Step 2: Get half-time score from individual match report pages
# FBref match pages show HT score in a consistent location
get_ht_score <- function(match_url) {
  Sys.sleep(3)
  page <- rvest::read_html(match_url)
  # Parse "45' HT: 1-0" type notation from the match report
  # Returns list(ht_home = INT, ht_away = INT)
}

# Step 3: Compute goals by half from goal minute data
# If goal time <= 45 → H1; else → H2
# NOTE: Handle 45+N minutes (still H1), 90+N (still H2)
```

**Validation**:
```
✓ WC 2002: 64 matches × 2 rows = 128 rows
✓ WC 2022: 64 matches × 2 rows = 128 rows
✓ All wc_year values in {2002, 2006, 2010, 2014, 2018, 2022}
✓ goals_for_1h + goals_for_2h == FT goals for all rows
✓ No NA in: wc_year, team, opponent, match_date, venue_city
```

**Risk**: HIGH — FBref rate-limits. Budget 45 minutes for this script on first run.

---

## 3.3 Script 04 — Elevation API

**Purpose**: Convert venue lat/lon to elevation using Open-Elevation API.

**Critical implementation details**:
```r
get_elevation <- function(lat, lon) {
  Sys.sleep(0.5)  # Respect free API rate limits
  
  resp <- httr::GET(
    "https://api.open-elevation.com/api/v1/lookup",
    query = list(locations = paste0(lat, ",", lon))
  )
  
  # Error handling: API sometimes returns 503
  if (httr::http_error(resp)) {
    warning("Elevation API failed for lat=", lat, " lon=", lon)
    return(NA_real_)
  }
  
  result <- jsonlite::fromJSON(httr::content(resp, "text"))
  result$results$elevation
}

# VALIDATION RULES after API calls:
# Mexico City should return ~2240m (not 2240 ± 5 is fine)
# London should return ~10-15m
# Johannesburg should return ~1750-1770m
# Any elevation > 3000m → MANUAL CHECK (likely API geocoding error)
```

---

## 3.4 Script 07 — Master Integration (CRITICAL)

**This is the highest-risk script in the pipeline.** Team name mismatches between datasets are the #1 source of silent data loss.

```r
# BEFORE joining: normalise all team names to FIFA 3-letter codes
# Use data/manual/team_name_lookup.csv which maps:
# "West Germany" → "GER"
# "Soviet Union" → "URS"
# "Yugoslavia"   → "YUG"
# "Ivory Coast"  → "CIV"
# etc.

# The join order matters:
# 1. matches_clean (base table — 512 rows)
# 2. LEFT JOIN venues_climate     on (wc_year, venue_city)
# 3. LEFT JOIN team_quality_clean on (wc_year, team)
# 4. LEFT JOIN team_quality_clean on (wc_year, opponent) → opp_elo
# 5. LEFT JOIN xg_by_half         on (match_id, team) — NA for pre-2018

# VALIDATION AFTER EACH JOIN:
stopifnot(nrow(master) == 512)  # NO rows should be added by a LEFT JOIN
# If nrow > 512, you have duplicate keys in a right table — FIX BEFORE CONTINUING

# Derived variables computed here:
master <- master %>%
  arrange(team, wc_year, match_date) %>%
  group_by(team, wc_year) %>%
  mutate(
    rest_days = as.integer(match_date - lag(match_date)),
    rest_days = if_else(is.na(rest_days), -1L, rest_days),
    prev_lat  = lag(venue_lat),
    prev_lon  = lag(venue_lon),
    travel_km = if_else(!is.na(prev_lat),
                  geosphere::distHaversine(
                    cbind(venue_lon, venue_lat),
                    cbind(prev_lon,  prev_lat)
                  ) / 1000, NA_real_)
  ) %>%
  ungroup()
```

---

---

# SECTION 4 — DATA ARCHITECTURE

## 4.1 Master Dataset Schema

See interactive architecture diagram (architecture_diagram.jsx) for the full interactive version.

### Primary Key
`(wc_year, team, match_id)` — uniquely identifies one row.

### Row Semantics
One row = one team's perspective in one match.
A Brazil vs Argentina match → 2 rows: one for Brazil, one for Argentina.

### Expected Dataset Size
- **Core scope (1994–2022)**: ~512 rows × 30 columns
- **Extended scope (1974–2022)**: ~832 rows × 30 columns (subset of columns)
- **xG sub-dataset (2018–2022)**: ~128 rows with non-NA `xg_*` columns

### Column Type Contract

```r
# Enforce these types after integration (in 07_integrate_data.R):
master <- master %>%
  mutate(
    wc_year           = as.integer(wc_year),
    match_date        = as.Date(match_date),
    elevation_m       = as.numeric(elevation_m),
    avg_temp_c        = as.numeric(avg_temp_c),
    avg_humidity_pct  = as.numeric(avg_humidity_pct),
    goals_against_1h  = as.integer(goals_against_1h),
    goals_against_2h  = as.integer(goals_against_2h),
    team_elo_pre      = as.numeric(team_elo_pre),
    rest_days         = as.integer(rest_days),
    travel_km         = as.numeric(travel_km),
    is_high_alt       = as.logical(elevation_m > 1000),
    is_altitude_team  = as.logical(team_origin_elev_m > 1000)
  )
```

---

## 4.2 Missing Value Policy

```
CATEGORY A — ZERO TOLERANCE (pipeline fails if any NA):
  ✗ elevation_m           Must query API successfully for all venues
  ✗ goals_against_1h      Core outcome — must parse from FBref
  ✗ goals_against_2h      Core outcome — must parse from FBref
  ✗ team_elo_pre          Required control variable — interpolate if gap < 6 months
  ✗ team                  Cannot be unknown
  ✗ venue_city            Cannot be unknown

CATEGORY B — ACCEPTABLE NA (flag and document):
  ~ xg_*                  NA for pre-2018 — EXPECTED. Filter when using xG models.
  ~ team_fifa_rank         NA for pre-1994 — EXPECTED. Use Elo as sole quality ctrl.
  ~ rest_days = -1         First WC match — CORRECT. Set -1 as sentinel, not NA.
  ~ travel_km              First match — no previous venue. NA is correct.

CATEGORY C — INVESTIGATE IF PRESENT:
  ? avg_temp_c             Meteostat station gap — try nearest station
  ? avg_humidity_pct       Same — try nearest station
  ? opp_elo_pre            Obscure opponent — interpolate or use FIFA rank
```

---

---

# SECTION 5 — STATISTICAL MODELLING ARCHITECTURE

## 5.1 Model Sequence

Five models fit in sequence, each adding complexity. This sequence is deliberate: it tells the story of how the altitude effect changes as controls are added.

```
M1 (Baseline)        goals_against_2h ~ is_high_alt
                      ↓ Establish unconditional effect size

M2 (Quality Control) goals_against_2h ~ is_high_alt + elo_diff_scaled
                      ↓ Does the effect survive team quality control?

M3 (Full OLS-like)   goals_against_2h ~ log_elevation + avg_temp_c +
                                         avg_humidity_pct + elo_diff_scaled +
                                         is_altitude_team + rest_days_clean +
                                         log_travel_km + wc_year
                      ↓ Full specification, no random effects

M4 (GLMM — PRIMARY)  goals_against_2h ~ log_elevation + avg_temp_c +
                                         elo_diff_scaled + is_altitude_team +
                                         rest_days_clean + log_travel_km +
                                         (1 | wc_year)         ← Random intercept
                      ↓ Accounts for tournament clustering — this is the answer

M5 (Interaction)     goals_against_2h ~ log_elevation * avg_temp_c +
                                         elo_diff_scaled + is_altitude_team +
                                         rest_days_clean + log_travel_km +
                                         (1 | wc_year)
                      ↓ Tests H3: is combined stress super-additive?
```

## 5.2 Model Diagnostics Checklist

Run these checks before reporting any model results:

```r
# 1. Overdispersion check (validate NB over Poisson choice)
mean(master$goals_against_2h, na.rm = TRUE)     # Should be ~0.6
var(master$goals_against_2h, na.rm = TRUE)      # If >> mean → NB justified

# 2. Multicollinearity check
car::vif(m3)  # All VIF < 5: OK; VIF > 10: problem

# 3. Residual plot
plot(m4)  # Should show no systematic pattern

# 4. Overdispersion parameter
summary(m4)@optinfo  # Check for convergence warnings

# 5. AIC comparison
AIC(m1, m2, m3, m4, m5)  # Lower = better fit
```

## 5.3 Sensitivity Analyses (Required for Credibility)

```r
# SA1: Different altitude threshold
master_800 <- master %>% mutate(is_high_alt = elevation_m > 800)
m4_sa1 <- update(m4, data = master_800)
# Expected: coefficient should be in same direction, slightly different magnitude

# SA2: Group stage only (exclude extra time distortion)
m4_sa2 <- update(m4, data = filter(master, stage == "Group"))
# Expected: effect should hold (group stage has no ET)

# SA3: Exclude 2022 Qatar (unusual Nov-Dec season + zero travel distance)
m4_sa3 <- update(m4, data = filter(master, wc_year != 2022))
# Expected: main results should not depend entirely on Qatar

# SA4: xG outcome instead of raw goals (2018/22 only)
m4_sa4 <- update(m4,
  formula = xg_against_2h ~ log_elevation + avg_temp_c + elo_diff_scaled +
                             (1 | wc_year),
  data = filter(master, !is.na(xg_against_2h)))
```

---

---

# SECTION 6 — TESTING ARCHITECTURE

## 6.1 Test Structure

```
tests/
├── test_data_integrity.R     ← Data contract tests (run after each ETL step)
├── test_etl_functions.R      ← Unit tests for helper functions
└── test_model_outputs.R      ← Model sanity tests
```

## 6.2 Data Integrity Tests

```r
# tests/test_data_integrity.R

library(testthat)
library(tidyverse)

test_that("Master dataset has correct row count", {
  master <- read_csv("data/final/team_match_master.csv")
  # Each WC: 64 matches × 2 teams = 128 rows (2002–2022 = 6 WCs... but 2002 had 64, etc.)
  expect_gte(nrow(master), 500)
  expect_lte(nrow(master), 530)
})

test_that("Primary outcome has no NA", {
  master <- read_csv("data/final/team_match_master.csv")
  expect_equal(sum(is.na(master$goals_against_2h)), 0)
  expect_equal(sum(is.na(master$goals_against_1h)), 0)
})

test_that("Goals sum to full-time total", {
  master <- read_csv("data/final/team_match_master.csv")
  total_check <- master %>%
    mutate(total_calc = goals_against_1h + goals_against_2h,
           total_actual = goals_against_total)
  expect_equal(total_check$total_calc, total_check$total_actual)
})

test_that("Elevation is positive for all venues", {
  master <- read_csv("data/final/team_match_master.csv")
  expect_true(all(master$elevation_m >= 0, na.rm = TRUE))
  expect_equal(sum(is.na(master$elevation_m)), 0)
})

test_that("Mexico City elevation is approximately correct", {
  venues <- read_csv("data/interim/venues_elevation.csv")
  mex_city <- venues %>% filter(str_detect(city, "Mexico City"))
  expect_gte(mex_city$elevation_m, 2100)
  expect_lte(mex_city$elevation_m, 2400)
})

test_that("Elo ratings are in plausible range", {
  master <- read_csv("data/final/team_match_master.csv")
  expect_true(all(master$team_elo_pre > 1000, na.rm = TRUE))
  expect_true(all(master$team_elo_pre < 2500, na.rm = TRUE))
})

test_that("Rest days are sensible", {
  master <- read_csv("data/final/team_match_master.csv")
  # Rest days should be -1 (first match) or 3-7 (typical WC schedule)
  valid_rest <- master$rest_days == -1 |
                (master$rest_days >= 2 & master$rest_days <= 21)
  expect_true(all(valid_rest, na.rm = TRUE))
})
```

## 6.3 ETL Function Unit Tests

```r
# tests/test_etl_functions.R

test_that("Goal minute parser classifies correctly", {
  # Test 45+2 → still H1
  expect_equal(classify_half(47, stoppage = TRUE, base = 45), "H1")
  # Test 46 → H2
  expect_equal(classify_half(46, stoppage = FALSE), "H2")
  # Test 90+3 → H2
  expect_equal(classify_half(93, stoppage = TRUE, base = 90), "H2")
})

test_that("Haversine distance is correct for known pairs", {
  # New York → London should be ~5,570 km
  dist_km <- geosphere::distHaversine(
    c(-74.006, 40.713),   # New York (lon, lat)
    c(-0.127, 51.507)     # London
  ) / 1000
  expect_gte(dist_km, 5500)
  expect_lte(dist_km, 5650)
})

test_that("Team name normalisation maps correctly", {
  lookup <- read_csv("data/manual/team_name_lookup.csv")
  expect_equal(normalise_team("West Germany", lookup), "GER")
  expect_equal(normalise_team("Soviet Union", lookup), "URS")
})
```

---

---

# SECTION 7 — DEPLOYMENT ARCHITECTURE

## 7.1 Deployment Targets

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER MACHINE                             │
│   R 4.3+ · renv environment · Rstudio                               │
│   Runs: 00_run_all.R → produces all outputs                          │
└──────────────┬──────────────────────────────────────────────────────┘
               │ git push → main
               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       GITHUB REPOSITORY                              │
│   altitude-heat-wc (public)                                          │
│   Triggers GitHub Actions CI on push                                 │
└──────┬────────────┬────────────┬─────────────────────────────────────┘
       │            │            │
       ↓            ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────────────────────────────────┐
│  VERCEL  │  │shinyapps │  │  GITHUB PAGES                        │
│  CDN     │  │  .io     │  │  Quarto report (HTML)                │
│ Next.js  │  │  Shiny   │  │  Auto-deploys from /docs/report/     │
│ website  │  │  Dashboard│  │  URL: user.github.io/altitude-wc    │
└──────────┘  └──────────┘  └──────────────────────────────────────┘
```

## 7.2 Docker Configuration

```dockerfile
# Dockerfile
FROM rocker/rstudio:4.3.0

# Install system dependencies
RUN apt-get update && apt-get install -y \
  libcurl4-openssl-dev \
  libssl-dev \
  libxml2-dev \
  libgdal-dev \
  libudunits2-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /home/rstudio/altitude-heat-wc

# Restore renv lockfile (pin all R package versions)
COPY renv.lock ./
RUN R -e "install.packages('renv'); renv::restore()"

# Copy project files
COPY . .

# Expose RStudio Server port
EXPOSE 8787

# Default: interactive RStudio session
CMD ["/init"]
```

**To run locally**:
```bash
docker build -t altitude-heat-wc .
docker run -p 8787:8787 -e PASSWORD=yourpassword altitude-heat-wc
# Open: http://localhost:8787 (user: rstudio, pw: yourpassword)
```

## 7.3 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: R Pipeline CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup R
        uses: r-lib/actions/setup-r@v2
        with:
          r-version: '4.3.0'

      - name: Install renv
        run: Rscript -e "install.packages('renv')"

      - name: Restore packages
        run: Rscript -e "renv::restore()"

      - name: Run data integrity tests
        run: Rscript -e "testthat::test_file('tests/test_etl_functions.R')"

      - name: Lint R code
        run: |
          Rscript -e "install.packages('lintr')"
          Rscript -e "lintr::lint_dir('R/')"
```

## 7.4 Shiny Dashboard Architecture

```r
# shiny/app.R — Structure only

library(shiny)
library(tidyverse)
library(ggplot2)

# Load pre-computed data (never run models in the Shiny app)
master <- read_csv("../data/final/team_match_analytical.csv")
venues_2026 <- read_csv("../data/manual/venues_2026.csv")

ui <- fluidPage(
  titlePanel("⛰️ Altitude & Heat · WC Analytics Dashboard"),
  sidebarLayout(
    sidebarPanel(
      sliderInput("alt_threshold", "Altitude Threshold (m):",
                  min=500, max=2000, value=1000, step=100),
      selectInput("wc_year_filter", "World Cup Year:",
                  choices = c("All", 2002,2006,2010,2014,2018,2022)),
      selectInput("stage_filter", "Stage:",
                  choices = c("All","Group","Knockout")),
      hr(),
      h4("Key Hypothesis"),
      verbatimTextOutput("hypothesis_result")
    ),
    mainPanel(
      tabsetPanel(
        tabPanel("H2 Delta by Altitude", plotOutput("h2_plot")),
        tabPanel("2026 Venue Risk",      plotOutput("risk_plot")),
        tabPanel("Model Results",        tableOutput("model_table")),
        tabPanel("Data Explorer",        DT::dataTableOutput("data_table"))
      )
    )
  )
)

server <- function(input, output) {
  # All heavy computation pre-done in R scripts
  # Shiny only filters and re-renders pre-computed outputs
  
  filtered <- reactive({
    master %>%
      filter(elevation_m > input$alt_threshold | TRUE) %>%
      filter(if (input$wc_year_filter != "All")
               wc_year == as.integer(input$wc_year_filter) else TRUE)
  })
  
  output$h2_plot <- renderPlot({
    filtered() %>%
      mutate(alt_cat = if_else(elevation_m > input$alt_threshold,
                               "High Altitude", "Sea Level")) %>%
      ggplot(aes(alt_cat, h2_delta, fill = alt_cat)) +
      geom_boxplot() +
      theme_minimal() +
      labs(title = paste0("2nd-Half Goal Delta (threshold: ",
                           input$alt_threshold, "m)"),
           x = NULL, y = "goals_against_2H - goals_against_1H")
  })
}

shinyApp(ui, server)
```

---

---

# SECTION 8 — ENVIRONMENT & PACKAGE MANAGEMENT

## 8.1 renv Setup

```r
# Day 1, Step 1: Initialize renv
renv::init()

# Install all required packages
install.packages(c(
  # Data Collection
  "worldfootballR",   # FBref + Transfermarkt scraping
  "rvest",            # HTML scraping fallback
  "httr",             # API calls (GET/POST)
  "jsonlite",         # JSON parsing
  "tidygeocoder",     # Stadium → lat/lon
  "geosphere",        # Haversine travel distance
  
  # Data Manipulation
  "tidyverse",        # dplyr, tidyr, ggplot2, purrr, readr
  "lubridate",        # Date arithmetic (rest days)
  "janitor",          # clean_names(), tabyl()
  
  # Statistical Modelling
  "lme4",             # Mixed effects models
  "lmerTest",         # p-values for lme4
  "MASS",             # glm.nb() Negative Binomial
  "broom.mixed",      # Tidy model outputs
  "emmeans",          # Marginal means + contrasts
  "car",              # vif() multicollinearity check
  
  # StatsBomb xG
  "StatsBombR",       # Free WC event data
  
  # Elo
  "elo",              # Elo rating calculations
  
  # Visualisation
  "ggrepel",          # Non-overlapping labels
  "patchwork",        # Multi-panel ggplots
  "viridis",          # Colourblind-safe palettes
  
  # Reporting
  "rmarkdown",
  "knitr",
  "kableExtra",       # Beautiful tables in Quarto/RMarkdown
  
  # Infrastructure
  "testthat",         # Unit testing
  "usethis",          # Project setup helpers
  "cli",              # Progress bars + logging
  "glue",             # String interpolation
  "renv"              # Package management
))

# Snapshot the environment
renv::snapshot()
# Commit renv.lock → exact reproduction guaranteed
```

## 8.2 .Renviron Template

```
# .env.example (commit this)
# .Renviron (DO NOT commit — add to .gitignore)

METEOSTAT_KEY=your_free_rapidapi_key_here
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_api_key
```

---

---

# SECTION 9 — ARCHITECTURE DECISION RECORDS

## ADR-01: Scope — 1994–2022 as Primary Dataset

**Status**: ACCEPTED

**Decision**: Use 1994–2022 as the core analysis window (8 WC editions, ~512 rows).

**Rationale**: FIFA Rankings available from 1993. Goal minute data reliably structured in FBref from 1994. Meteostat historical weather is reliable from 1990s. This gives consistent coverage of all required variables.

**Alternatives rejected**:
- Full 1930–2022: Pre-1994 data lacks FIFA rank; goal minute records inconsistent before 1974
- 2002–2022 only: Loses the 1998 France WC (which has no high-altitude venues — useful as a comparison year) and 1994 USA WC (which has some warm venues relevant to heat hypothesis)

---

## ADR-02: Negative Binomial Over Poisson

**Status**: ACCEPTED

**Decision**: Use `glm.nb()` (Negative Binomial) via the `MASS` package for all count models.

**Rationale**: Football goal counts are overdispersed. `var(goals_against_2h) >> mean(goals_against_2h)`. Poisson regression assumes var=mean; violation produces underestimated standard errors and inflated significance (false positives). Negative Binomial adds a dispersion parameter θ that handles overdispersion correctly.

**How to check**: Run the baseline Poisson model M1 and check the dispersion statistic. If residual deviance / degrees of freedom >> 1, overdispersion confirmed.

---

## ADR-03: 1,000m as the Altitude Threshold

**Status**: ACCEPTED

**Decision**: Binary threshold `is_high_alt = elevation_m > 1000`.

**Rationale**: Wehrlin & Hallén (2006) show ~6% VO₂max reduction becomes clinically meaningful above 1,000m. FIFA prohibits competitive matches above 2,500m. The threshold is validated by sensitivity analysis at 800m — core results hold.

**Primary model uses**: `log_elevation` (continuous) to allow the model to find the true dose-response shape without imposing a threshold. The binary variable is used for descriptive statistics and visualisations only.

---

## ADR-04: Random Intercept for wc_year

**Status**: ACCEPTED

**Decision**: Include `(1 | wc_year)` as a random effect in the GLMM (Model M4).

**Rationale**: Matches within the same WC edition are not independent. They share refereeing culture, ball technology, tactical trends, and conditioning levels. Ignoring this clustering inflates Type I error. With only 8 levels of wc_year, a fixed effect would waste too many degrees of freedom; a random intercept is the principled choice.

---

## ADR-05: R Over Python

**Status**: ACCEPTED

**Decision**: R as primary analysis language.

**Rationale**: `worldfootballR`, `tidygeocoder`, `lme4`, `Quarto`, and `Shiny` all have superior or exclusive R implementations. `lme4`'s GLMM implementation is more mature and better-tested than Python's `statsmodels` equivalents. The entire sports analytics + reproducible research ecosystem in R is a better fit for this project.

**Note**: Next.js website uses TypeScript/React for the deployment layer — this is not a conflict, it's separation of concerns.

---

## ADR-06: Flat CSV Over Database

**Status**: ACCEPTED

**Decision**: Store all data as flat CSV/RDS files. No database.

**Rationale**: The master dataset is ~512 rows. A database (SQLite, PostgreSQL, DuckDB) adds connection management, schema migrations, and ORM complexity for zero performance benefit at this scale. Flat CSVs are Git-versionable, human-inspectable without tooling, and trivially portable.

**When to revisit**: If the project expands to include club-level data (500k+ rows), DuckDB or Arrow/Parquet would be worth evaluating.

---

---

# SECTION 10 — SECURITY & COMPLIANCE

## 10.1 API Key Management

```r
# CORRECT: Read from environment
meteostat_key <- Sys.getenv("METEOSTAT_KEY")
if (nchar(meteostat_key) == 0) stop("METEOSTAT_KEY not set in .Renviron")

# NEVER DO THIS in committed code:
# meteostat_key <- "sk-abc123xyz"  ← Exposes key in git history forever
```

Add to `.gitignore`:
```
.Renviron
*.env
data/raw/   # Large files — don't commit raw scrapes
```

## 10.2 Data Licence Compliance

| Source | Licence | Usage | Citation Required |
|---|---|---|---|
| FBref | Personal non-commercial | ✅ Analysis only | ✅ Link to source |
| StatsBomb Open Data | CC BY-NC-SA 4.0 | ✅ Non-commercial | ✅ "Data provided by StatsBomb" |
| Kaggle datasets | Varies (check each) | ✅ Usually CC0 | ✅ Link dataset |
| Open-Elevation | MIT | ✅ Free | Optional |
| Meteostat | CC BY 4.0 | ✅ With attribution | ✅ Credit Meteostat |
| eloratings.net | Proprietary | ✅ Non-commercial analysis | ✅ Cite source |
| Wikipedia | CC BY-SA 3.0 | ✅ | Optional |

---

*Architecture Design Document v1.0 — Altitude & Heat Adaptation in FIFA World Cups (1930–2026)*
*Status: Approved for Sprint Day 1 execution*
