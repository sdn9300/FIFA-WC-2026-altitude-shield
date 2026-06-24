# 🛠️ PHASE-WISE IMPLEMENTATION PLAN
## Altitude & Heat Adaptation in FIFA World Cups
### From Raw Data to Deployed Product — Complete Execution Manual

---

## DOCUMENT CONTROL

| Field | Value |
|---|---|
| **Document Type** | Implementation Plan (execution-level, code-grounded) |
| **Scope** | FIFA World Cups 2002–2022 (primary) · 2026 venue profiling (predictive) |
| **Language** | R 4.3+ |
| **Sprint Length** | 14 days, 8 sequential phases |
| **Companion Documents** | Mission Plan v1.0 · Architecture Design Document v1.0 · Problem Statement v2.0 |
| **Status** | Approved — ready for Phase 00 execution |

This document is the **execution layer** beneath the Mission Plan and Architecture Design Document already produced. Where those documents describe *what* and *why*, this plan describes *exactly how* — with the real R code, the real API calls, and the real validation logic for every phase.

---

## SCOPE & DELIVERABLES (Locked)

**In scope**: Men's FIFA World Cups 2002–2022 at the team-match level, with a predictive extension to all 16 confirmed FIFA World Cup 2026 venues. Outcome focus is on second-half goals against, under altitude, heat, humidity, and travel-fatigue stressors. Daily/mean weather values on match dates. xG included where available (StatsBomb, 2018 & 2022 only).

**Out of scope**: Player-level microdata, non-World Cup tournaments, club football, GPS/tracking data, injury records.

**Final deliverables**:
- **Data**: Raw sources, stadium coordinates/elevations, weather data, Elo ratings, adaptation flags, and the merged `team_match_master.csv`
- **Code & Environment**: Numbered R scripts, `Dockerfile`, `renv.lock`, GitHub Actions CI config
- **Report & Dashboard**: Quarto report (EDA + modelling results) and a Shiny dashboard for interactive exploration
- **Documentation**: Schema dictionary, source licences, testing plan, this implementation plan

---

---

# PHASE 00 — ENVIRONMENT & PROJECT SCAFFOLD
### Day 1 · Foundation Phase

## Objective
Stand up a fully reproducible R environment before a single byte of data is collected. Every later phase assumes this phase succeeded cleanly.

## Step-by-Step Implementation

### 00.1 — Initialise renv and Install Packages

```r
renv::init()

install.packages(c(
  # Match data
  "worldfootballR", "rvest", "StatsBombR",
  # Geospatial
  "tidygeocoder", "geosphere",
  # API clients
  "httr2", "jsonlite",
  # Data wrangling
  "tidyverse", "lubridate", "janitor",
  # Statistical modelling
  "lme4", "lmerTest", "MASS", "broom.mixed", "car",
  # Reporting & dashboard
  "rmarkdown", "knitr", "kableExtra", "shiny", "quarto",
  # Testing & infra
  "testthat", "usethis", "cli", "glue", "renv"
))

renv::snapshot()   # Produces renv.lock — commit this file
```

### 00.2 — Folder Structure

```
altitude-heat-wc/
├── altitude-heat-wc.Rproj
├── renv.lock
├── Dockerfile
├── .github/workflows/ci.yml
├── .Renviron              ← gitignored; holds METEOSTAT_KEY
├── README.md
├── scripts/
│   ├── 01_match_data.R
│   ├── 02_venues_geocoding.R
│   ├── 03_elevation.R
│   ├── 04_weather.R
│   ├── 05_travel_rest.R
│   ├── 06_team_strength.R
│   ├── 07_master_join.R
│   └── run_all.R
├── data_raw/
├── data_interim/
├── data_final/
├── logs/
├── tests/
│   └── testthat/
└── docs/
```

### 00.3 — Dockerfile

```dockerfile
FROM rocker/rstudio:4.3.0
WORKDIR /home/rstudio/project
COPY renv.lock ./
RUN R -e "install.packages('renv'); renv::restore()"
COPY . .
CMD ["Rscript", "scripts/run_all.R"]
```

### 00.4 — GitHub Actions CI Skeleton

```yaml
name: R CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: r-lib/actions/setup-r@v2
      - uses: r-lib/actions/setup-pandoc@v2
      - uses: r-lib/actions/setup-r-dependencies@v2
      - run: Rscript -e 'renv::restore()'
      - run: Rscript -e 'devtools::test()'
      - run: Rscript -e 'source("scripts/run_analysis.R")'
```

### 00.5 — .Renviron Template (never commit the real file)

```
METEOSTAT_KEY=your_rapidapi_key_here
```

Add `.Renviron` to `.gitignore` immediately, before it ever contains a real key.

## Deliverable
A reproducible R environment with `renv.lock` committed, a working Dockerfile, a CI skeleton, and the full folder scaffold.

## Validation Gate
```r
# On a clean checkout, this must succeed without manual intervention:
renv::restore()
source("scripts/run_all.R")  # Even if every step is a stub, it must source cleanly
```

---

---

# PHASE 01 — MATCH DATA COLLECTION
### Days 2–3 · FBref + Kaggle + StatsBomb

## Objective
Extract match-level results, then decompose them into half-by-half goal counts — the foundation of the entire outcome variable.

## 01.1 — FBref Match Results via worldfootballR

```r
library(worldfootballR)

wc_urls <- get_match_urls(
  country = "", gender = "M", season_end_year = 2022,
  non_dom_league_url =
    "https://fbref.com/en/comps/1/history/World-Cup-Seasons"
)

wc_matches <- get_match_results(
  country = "", gender = "M", season_end_year = 2022,
  non_dom_league_url =
    "https://fbref.com/en/comps/1/history/World-Cup-Seasons"
)
```

Iterate this across every tournament year (2002, 2006, 2010, 2014, 2018, 2022). **Mandatory**: insert `Sys.sleep(3)` between calls and set a custom user-agent. Cache every year's raw HTML/result locally the instant it returns — never re-scrape a year you've already pulled.

## 01.2 — Kaggle CSV Cross-Check

```r
kaggle_matches <- readr::read_csv("data_raw/kaggle/fifa-world-cup-1930-2022.csv")
# Use this to validate FBref scrape totals match official record
# Unify team name spelling differences before any join (see 01.4)
```

## 01.3 — StatsBomb xG (2018 & 2022 Only)

Use the StatsBombR package or read the open JSON directly from the StatsBomb GitHub repository. Extract team-level xG per match, split by half using the `period` field in the event data. CC BY-NC-SA 4.0 — credit StatsBomb in any published output, non-commercial use only.

## 01.4 — Goal-Time Parsing → Half Classification

```r
library(dplyr); library(stringr)

goals_df <- matches_tbl %>%
  separate_rows(goal_times, sep = ";") %>%
  mutate(
    minute = as.integer(str_extract(goal_times, "\\d+")),
    half   = ifelse(minute <= 45, "1H", "2H")
  ) %>%
  group_by(year, match_id, team) %>%
  summarize(
    goals_for_1h     = sum(half == "1H" & team == home_team),
    goals_for_2h      = sum(half == "2H" & team == home_team),
    goals_against_1h  = sum(half == "1H" & team == away_team),
    goals_against_2h  = sum(half == "2H" & team == away_team)
  )
```

**Edge case to handle explicitly**: stoppage time notation like `"45+2"` or `"90+3"` — the regex `str_extract(goal_times, "\\d+")` captures the first number (`45` or `90`), which correctly keeps these in their actual half. Write a unit test for this (see Phase 05 testing section).

## Deliverable
`data_interim/matches_clean.csv` and `goals_df` — match-level and team-match-level goal data with half classification.

## Validation Gate
```r
# Total goals per match must equal the official scoreline
stopifnot(all(goals_df %>%
  group_by(match_id) %>%
  summarise(total = sum(goals_for_1h + goals_for_2h)) %>%
  pull(total) == official_totals))
```

---

---

# PHASE 02 — VENUE & GEOSPATIAL DATA
### Days 4–5 · Stadiums → Coordinates

## Objective
Build a clean stadium table and convert every stadium into a precise lat/lon pair.

## 02.1 — Stadium List Compilation

Scrape Wikipedia's "List of FIFA World Cup stadiums" or manually compile from official FIFA announcements for 2002–2022 plus the 16 confirmed 2026 venues. Fields: `venue_name`, `city`, `country`, `wc_year`.

## 02.2 — Geocoding via tidygeocoder

```r
library(tidygeocoder)

stadiums <- tibble(venue = ..., city = ..., country = ...)

coords <- stadiums %>%
  geocode(
    address = paste(venue, city, country),
    method = "osm",
    full_results = FALSE
  )
```

**Failure handling**: tidygeocoder returns NA for failed lookups. For any NA, retry with `city` alone (drop the stadium name, which is sometimes too specific for Nominatim to match). Cache the resulting `coords` table immediately — OSM geocoding is rate-limited and slow to re-run.

## Deliverable
`data_interim/venues_geocoded.csv` — venue, lat, lon for every stadium across 2002–2022 and the 2026 host cities.

## Validation Gate
```r
stopifnot(sum(is.na(coords$lat)) == 0)  # Every venue must have resolved coordinates
```

---

---

# PHASE 03 — ELEVATION DATA
### Days 5 (continued) · Open-Elevation API

## Objective
Convert every venue's lat/lon into a confirmed elevation in metres.

## 03.1 — Open-Elevation API Call

```r
library(httr2)

elev_req <- request("https://api.open-elevation.com/api/v1/lookup") %>%
  req_url_query(locations = paste(lat, lon, sep = ","))

elev_json <- elev_req %>% req_perform() %>% resp_body_json()
elevation <- elev_json$results$elevation
```

**Rate limit discipline**: the free tier allows 1,000 requests/month — more than sufficient for ~50 unique venues, but pause `Sys.sleep(1)` between calls regardless, and cache every result by `(lat, lon)` key so a re-run never re-queries an already-known coordinate.

## Deliverable
`data_interim/venues_elevation.csv` — venue, lat, lon, elevation_m.

## Validation Gate
```r
# Spot-check against known values
stopifnot(between(venues_elevation %>% filter(venue_city == "Mexico City") %>% pull(elevation_m), 2100, 2400))
stopifnot(all(venues_elevation$elevation_m >= 0, na.rm = TRUE))
```

Manually cross-check every elevation above 500m against an independent source (Wikipedia or official stadium specs) before accepting it into the pipeline.

---

---

# PHASE 04 — CLIMATE DATA COLLECTION
### Days 5–6 · Meteostat API

## Objective
Attach historical temperature and humidity to every venue for the relevant tournament window.

## 04.1 — Meteostat JSON API via RapidAPI

```r
base_url <- "https://meteostat.p.rapidapi.com/point/daily"

weather_json <- request(base_url) %>%
  req_headers(
    "x-rapidapi-host" = "meteostat.p.rapidapi.com",
    "x-rapidapi-key"  = Sys.getenv("METEOSTAT_KEY")
  ) %>%
  req_url_query(lat = stad_lat, lon = stad_lon,
                start = "YYYY-MM-01", end = "YYYY-MM-31") %>%
  req_perform() %>% resp_body_json()

weather_df <- tibble(
  date   = weather_json$data$date,
  temp_c = weather_json$data$tavg,
  rh_pct = weather_json$data$rhum
)
```

**Critical exception**: 2022 Qatar World Cup ran **November–December**, not June–July. Hardcode this exception explicitly in the month-window lookup — it is the single most common silent error in this phase.

**Quota discipline**: 500 calls/month free tier. With ~50 unique venue-years, this comfortably fits. Cache by `(venue, date)` key so re-runs never duplicate a query.

## Deliverable
`data_interim/venues_climate.csv` — venue, wc_year, avg temp_c, avg rh_pct for the tournament window.

## Validation Gate
```r
stopifnot(all(between(venues_climate$temp_c, -10, 50)))
stopifnot(all(between(venues_climate$rh_pct, 0, 100)))
```

For any venue where Meteostat returns no data, fall back to the nearest available weather station rather than leaving the row NA.

---

---

# PHASE 05 — TRAVEL, REST & TEAM STRENGTH
### Days 6–7 · Fatigue & Quality Controls

## Objective
Compute the controls that separate "environment caused this" from "team quality or fatigue caused this."

## 05.1 — Rest Days

```r
team_schedule <- team_schedule %>%
  group_by(team, wc_year) %>%
  arrange(date) %>%
  mutate(
    rest_days = as.integer(date - lag(date)),
    rest_days = if_else(is.na(rest_days), -1L, rest_days)
  ) %>%
  ungroup()
```

`-1` is a deliberate sentinel for "this team's first match of the tournament" — not a true missing value. Document this convention in the data dictionary so it is never mistaken for a data quality problem.

## 05.2 — Travel Distance via geosphere

```r
library(geosphere)

team_schedule <- team_schedule %>%
  arrange(date) %>%
  mutate(prev_lat = lag(venue_lat), prev_lon = lag(venue_lon)) %>%
  mutate(travel_km = distHaversine(
    cbind(prev_lon, prev_lat),
    cbind(venue_lon, venue_lat)
  ) / 1000)
```

`distHaversine()` returns **metres** — dividing by 1000 to get kilometres is not optional and is a common silent unit-error.

## 05.3 — Elo Ratings & Adaptation Flag

```r
# Elo: pick the most recent rating before the tournament start date
elo_at_wc <- elo_df %>%
  filter(date <= wc_start_date) %>%
  group_by(team) %>%
  slice_max(date) %>%
  ungroup() %>%
  select(team, team_elo = elo)

master_partial <- master_partial %>%
  left_join(elo_at_wc, by = "team") %>%
  left_join(elo_at_wc %>% rename(opponent = team, opp_elo = team_elo),
            by = "opponent") %>%
  mutate(elo_diff = team_elo - opp_elo)

# Altitude adaptation: capital city elevation > 1,500m → "high-altitude team"
adapted_flag <- capital_elevations %>%
  mutate(adapted = elevation_m > 1500) %>%
  select(team, adapted)
```

## Deliverable
`data_interim/team_schedule.csv` — rest_days, travel_km — and `data_interim/team_quality.csv` — team_elo, opp_elo, elo_diff, adapted_flag.

## Validation Gate
```r
# Known-distance sanity check: 1 degree of latitude ≈ 111 km
test_dist <- distHaversine(c(0,0), c(0,1)) / 1000
stopifnot(abs(test_dist - 111) < 2)

# Rest days should be -1 or a plausible WC schedule gap (2–21 days)
stopifnot(all(team_schedule$rest_days == -1L |
              between(team_schedule$rest_days, 2, 21)))
```

---

---

# PHASE 06 — MASTER TABLE ASSEMBLY
### Day 8 · The Highest-Risk Phase

## Objective
Join all five interim sources into the single team-match master table. This is the phase where silent data corruption is most likely and least visible — treat every join with suspicion until proven correct.

## 06.1 — Schema (Locked Contract)

| Column | Type | Description |
|---|---|---|
| `year` | integer | World Cup year |
| `date` | Date | Match date |
| `stage` | factor | Tournament stage (Group, QF, etc.) |
| `venue` | char | Stadium name |
| `elevation_m` | numeric | Stadium elevation (metres) |
| `team` | char | Team name |
| `opponent` | char | Opposing team name |
| `team_elo`, `opp_elo`, `elo_diff` | numeric | Elo ratings and difference |
| `adapted_flag` | logical | High-altitude team indicator |
| `rest_days` | integer | Days since previous match |
| `travel_km` | numeric | Distance travelled since previous match |
| `temp_c`, `humidity` | numeric | Match-day temperature, relative humidity |
| `goals_for_1h`, `goals_for_2h`, `goals_against_1h`, `goals_against_2h` | int | Goals by half |

## 06.2 — Sequential Join with Row-Count Discipline

```r
master <- goals_df %>%
  left_join(venues_elevation, by = c("venue" = "venue_name"))
stopifnot(nrow(master) == nrow(goals_df))   # Assert IMMEDIATELY after this join

master <- master %>%
  left_join(venues_climate, by = c("venue", "year" = "wc_year"))
stopifnot(nrow(master) == nrow(goals_df))   # Assert again — never wait until the end

master <- master %>%
  left_join(team_quality, by = c("year", "team"))
stopifnot(nrow(master) == nrow(goals_df))

master <- master %>%
  left_join(team_schedule %>% select(team, year, match_id, rest_days, travel_km),
            by = c("team", "year", "match_id"))
stopifnot(nrow(master) == nrow(goals_df))
```

**The rule that prevents the costliest failure mode in this entire project**: assert the row count after *every individual join*, never as a single check at the very end. If a join silently duplicates or drops rows, the assertion immediately after that join tells you exactly which join is at fault — checking only at the end leaves you debugging blind across five candidate joins.

## 06.3 — Team Name Normalisation (Do This Before Any Join)

Build `data_raw/manual/team_name_lookup.csv` mapping every historical name variant to a canonical code before joining anything: `"West Germany"` → `"GER"`, `"Soviet Union"` → `"URS"`, etc. Apply this normalisation to every table's team column before the join chain begins.

## Deliverable
`data_final/team_match_master.csv` — the single source of truth for all downstream analysis.

## Validation Gate (Full testthat Suite)

```r
library(testthat)

test_that("No missing keys", {
  expect_equal(sum(is.na(master$team)), 0)
  expect_equal(sum(is.na(master$opponent)), 0)
})

test_that("Score consistency", {
  totals <- master %>%
    group_by(match_id) %>%
    summarise(total = sum(goals_for_1h + goals_for_2h))
  expect_equal(totals$total, official_match_totals)
})

test_that("No duplicate keys", {
  expect_equal(sum(duplicated(master[c("year","match_id","team")])), 0)
})

test_that("Ranges are valid", {
  expect_true(all(between(master$temp_c, -10, 50)))
  expect_true(all(between(master$humidity, 0, 100)))
  expect_true(all(master$elevation_m >= 0, na.rm = TRUE))
})
```

Do not proceed to Phase 07 until every one of these tests passes green.

---

---

# PHASE 07 — STATISTICAL MODELLING & EDA
### Days 9–11 · From Data to Answer

## Objective
Understand the data, then fit the model sequence that answers the mission's central question.

## 07.1 — EDA Checklist (Quarto Document)

- Distribution of `elevation_m` across all venues — how many matches were actually played at altitude?
- Confound check: scatter of `elo_diff` against `h2_delta` (does team quality alone explain the pattern?)
- Overdispersion check: compare `mean(goals_against_2h)` vs `var(goals_against_2h)` — this single comparison decides Poisson vs Negative Binomial

## 07.2 — Model Sequence

```r
library(lme4); library(MASS); library(broom.mixed)

# M1: Baseline
m1 <- glm.nb(goals_against_2h ~ elevation_m, data = master)

# M2: + Team quality control
m2 <- glm.nb(goals_against_2h ~ elevation_m + elo_diff, data = master)

# M3: Full fixed-effects specification
m3 <- glm.nb(goals_against_2h ~ elevation_m + temp_c + humidity +
               elo_diff + adapted_flag + rest_days + travel_km + year,
             data = master)

# M4: PRIMARY MODEL — GLMM with tournament random intercept
m4 <- glmer.nb(goals_against_2h ~ elevation_m + temp_c + elo_diff +
                 adapted_flag + rest_days + travel_km + (1 | year),
               data = master)

# M5: Altitude × heat interaction
m5 <- glmer.nb(goals_against_2h ~ elevation_m * temp_c + elo_diff +
                 adapted_flag + rest_days + travel_km + (1 | year),
               data = master)
```

## 07.3 — Diagnostics (Mandatory Before Reporting Any Result)

```r
car::vif(m3)              # All values should be < 5
AIC(m1, m2, m3, m4, m5)   # Lower AIC = better fit
plot(m4)                  # Residuals should show no systematic pattern
```

## Deliverable
Rendered Quarto EDA report (HTML) and five saved model objects (`.rds`).

## Validation Gate
M4 converges without warnings. At least one coefficient among elevation, temperature, or their interaction is significant at p < 0.05, and the result is directionally stable across the four sensitivity checks (different altitude threshold, group-stage-only, excluding 2022 Qatar, xG as the outcome).

---

---

# PHASE 08 — REPORTING, DASHBOARD & DEPLOYMENT
### Days 12–14 · Shipping the Product

## Objective
Package every finding into artefacts a stranger can engage with — a report, a live dashboard, a deployed website, a public repository.

## 08.1 — Quarto Report

Render the full analytical narrative — problem statement, EDA, model results, 2026 predictions — to both HTML and PDF using `quarto render`.

## 08.2 — Shiny Dashboard Skeleton

```r
library(shiny)

ui <- fluidPage(
  titlePanel("Altitude & Heat — WC Analytics"),
  sidebarLayout(
    sidebarPanel(
      sliderInput("alt_threshold", "Altitude Threshold (m):",
                  min = 500, max = 2000, value = 1000, step = 100)
    ),
    mainPanel(plotOutput("h2_plot"))
  )
)

server <- function(input, output) {
  output$h2_plot <- renderPlot({
    master %>%
      mutate(alt_cat = if_else(elevation_m > input$alt_threshold,
                               "High Altitude", "Sea Level")) %>%
      ggplot(aes(alt_cat, goals_against_2h - goals_against_1h)) +
      geom_boxplot()
  })
}

shinyApp(ui, server)
```

Deploy via `rsconnect::deployApp()` to shinyapps.io.

## 08.3 — CI/CD Finalisation

Confirm the GitHub Actions workflow (drafted in Phase 00) runs `renv::restore()`, `devtools::test()`, and the full analysis script on every push to `main`, and that it passes green before the mission is declared complete.

## Deliverable
Live Quarto report, live Shiny dashboard, live Next.js website (if built per the companion Website SDD), and a public, well-documented GitHub repository.

## Validation Gate
All public URLs resolve. The GitHub README is comprehensible to a non-statistician within three minutes. CI is green on `main`.

---

---

# CACHING & RATE-LIMIT POLICY (Applies Across All Phases)

```
RULE 1   Every raw API response or scrape result is written to disk
         the instant it is received — never held only in memory.

RULE 2   Every cache lookup happens BEFORE every API call:
         if (lat,lon) or (venue,date) is already cached, skip the call.

RULE 3   Sys.sleep() delays are non-negotiable:
           FBref scraping        → 3 seconds
           OSM geocoding         → respects tidygeocoder defaults
           Open-Elevation API    → 1 second
           Meteostat API         → spaced to stay under 500 calls/month

RULE 4   API keys live only in .Renviron, retrieved via Sys.getenv(),
         and .Renviron is .gitignore'd before it ever holds a real key.
```

---

# LICENCE COMPLIANCE SUMMARY

| Source | Licence | Constraint |
|---|---|---|
| FBref | No formal licence; personal analytical use is standard | No redistribution of raw scraped data |
| StatsBomb Open Data | CC BY-NC-SA 4.0 | Credit StatsBomb; non-commercial only |
| Kaggle datasets | Usually CC0 | Verify each dataset individually |
| Open-Elevation | GPLv2 | Free for non-commercial use, <1,000 req/month |
| Meteostat | Free tier | Non-commercial, <500 calls/month |
| Elo Ratings | Public, no strict licence | Cite source |
| Wikipedia | CC BY-SA | Extracting facts (names, elevations) is permitted |

---

# PHASE-TO-DAY MAPPING (Quick Reference)

| Phase | Days | Core Deliverable |
|---|---|---|
| 00 — Environment & Scaffold | 1 | `renv.lock`, folder structure, Dockerfile, CI |
| 01 — Match Data Collection | 2–3 | `matches_clean.csv`, half-by-half goals |
| 02 — Venue & Geospatial Data | 4–5 | `venues_geocoded.csv` |
| 03 — Elevation Data | 5 | `venues_elevation.csv` |
| 04 — Climate Data | 5–6 | `venues_climate.csv` |
| 05 — Travel, Rest & Team Strength | 6–7 | `team_schedule.csv`, `team_quality.csv` |
| 06 — Master Table Assembly | 8 | `team_match_master.csv` |
| 07 — Statistical Modelling & EDA | 9–11 | EDA report + 5 fitted models |
| 08 — Reporting, Dashboard & Deploy | 12–14 | Live report, dashboard, website, repo |

---

*Phase-Wise Implementation Plan v1.0 · Altitude & Heat Adaptation in FIFA World Cups*
*Status: Approved — Execute Phase 00 first; do not skip ahead*
