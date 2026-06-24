# ⛰️ FIFA WC 2026 Altitude Shield

![Language: R](https://img.shields.io/badge/Language-R-276DC3?style=flat-square&logo=r)
![Language: Python](https://img.shields.io/badge/Language-Python-3776AB?style=flat-square&logo=python)
![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js-000000?style=flat-square&logo=nextdotjs)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)

> An end-to-end sports analytics platform quantifying the physiological impact of **altitude** and **heat stress** on elite football players at the FIFA World Cup 2026 venues — backed by GLMM statistical modelling and an interactive Next.js dashboard.

---

## 📌 Project Overview

The FIFA World Cup 2026 will be hosted across **16 cities in Canada, Mexico, and the United States**, spanning an unprecedented range of climatic and geographical conditions. From sea-level stadiums in Miami, Toronto, and Vancouver to high-altitude venues above 1,500m–2,240m in Denver, Guadalajara, and Mexico City — often paired with intense summer heat — no prior World Cup has exposed teams to such diverse environmental stress.

This project builds a complete research pipeline that:

1. **Ingests** historical World Cup and international match data from StatsBomb, FBref, and Kaggle datasets.
2. **Geocodes** all stadiums and retrieves precise elevation data via the Open-Elevation API.
3. **Fetches** historical match-day weather (temperature, humidity) via the Meteostat/RapidAPI integration.
4. **Engineers** spatial-temporal features: cumulative travel distance, rest-day profiles, Elo team quality ratings, and physiological adaptation flags.
5. **Models** defensive deterioration and goal-scoring patterns using Negative Binomial Generalised Linear Mixed Models (GLMMs).
6. **Predicts** venue-level environmental risk for the 2026 host cities.
7. **Visualises** all findings in a real-time interactive dark-themed dashboard built with Next.js and Recharts.

---

## 🔬 Research Questions

| # | Question |
|---|----------|
| 1 | Does playing at altitude (>1,000m) significantly increase 2nd-half goals conceded? |
| 2 | Does heat stress (>28°C) measurably reduce offensive output in elite football? |
| 3 | Does cumulative travel burden compound environmental fatigue? |
| 4 | Do shorter rest periods (≤3 days) amplify venue stress effects? |
| 5 | Are high-altitude native teams physiologically immune to deterioration? |
| 6 | Which 2026 venues pose the highest combined environmental risk? |

---

## 💡 Hypotheses

| ID | Hypothesis |
|----|-----------|
| H1 | **Altitude Effect** — Elevation >1,000m leads to more 2nd-half goals conceded |
| H2 | **Heat Stress** — Temperature >28°C reduces offensive productivity |
| H3 | **Combined Stress** — Altitude × heat interaction is super-additive |
| H4 | **Rest Amplification** — ≤3 rest days magnifies all environmental fatigue penalties |
| H5 | **Altitude Immunity** — High-altitude native teams resist 2nd-half deterioration |

---

## 🚀 Key Findings

- **Altitude Deterioration Threshold:** Teams playing above **1,000m** show a statistically significant surge in 2nd-half goals conceded, compounded sharply when rest is ≤3 days.
- **Combined Stress Multiplier:** The interaction of heat (>28°C) and high altitude is super-additive — the combined effect is greater than the sum of its parts.
- **Altitude Immunity:** High-altitude native teams (e.g., Mexico) demonstrate physiological resilience with measurably lower 2nd-half deterioration rates compared to sea-level teams.
- **Critical Venue:** Mexico City (2,240m) scores a **92/100 environmental risk rating** — the highest of any 2026 host city.

---

## 🗺️ 2026 Host Venue Risk Ratings

| City | Country | Elevation | Risk Score | Category |
|------|---------|-----------|------------|----------|
| Mexico City | 🇲🇽 Mexico | 2,240m | 92 | CRITICAL |
| Guadalajara | 🇲🇽 Mexico | 1,566m | 71 | HIGH |
| Denver | 🇺🇸 USA | 1,609m | 69 | HIGH |
| Dallas | 🇺🇸 USA | 183m | 51 | MEDIUM |
| Kansas City | 🇺🇸 USA | 320m | 42 | MEDIUM |
| Atlanta | 🇺🇸 USA | 298m | 38 | LOW |
| Miami | 🇺🇸 USA | 3m | 58 | MEDIUM* |
| Toronto | 🇨🇦 Canada | 76m | 22 | LOW |
| Vancouver | 🇨🇦 Canada | 0m | 18 | LOW |
| Seattle | 🇺🇸 USA | 8m | 21 | LOW |

*Miami's elevated score is driven by extreme heat and humidity despite low altitude.

---

## 🛠️ Tech Stack & Architecture

### Data Engineering & Analytics Pipeline
| Tool | Role |
|------|------|
| **R (lme4, dplyr, testthat)** | GLMM modelling, data wrangling, unit testing |
| **Python (pandas, requests)** | API ingestion, elevation & weather data |
| **StatsBomb Open Data** | Historical match xG and event data |
| **FBref** | Additional match statistics |
| **Kaggle Datasets** | World Cup match history 1930–2022, Elo ratings |
| **Open-Elevation API** | Stadium elevation retrieval |
| **Meteostat / RapidAPI** | Historical match-day temperature & humidity |

### Interactive Dashboard
| Tool | Role |
|------|------|
| **Next.js 15 (TypeScript)** | React framework with App Router |
| **Recharts** | Binned Line Chart, Area Chart, Bar Chart, customized tooltips |
| **Lucide React** | Icon library |
| **Vanilla CSS** | Custom dark theme, glassmorphism, responsive layout |
| **PapaParse** | CSV data parsing on the client side |

---

## 📂 Repository Structure

```
FIFA-WC-2026-Altitude-Shield/
│
├── nextjs_site/                    # Interactive Dashboard (Next.js)
│   ├── app/                        # App Router — page.tsx, layout.tsx, globals.css
│   ├── public/data/                # Compiled match database CSV
│   │   └── team_match_master.csv
│   ├── utils/                      # Data loading utilities (PapaParse)
│   └── styles/                     # Global CSS tokens
│
├── scripts/                        # Ordered Data Pipeline
│   ├── 00_environment_setup.R      # Package installation
│   ├── 01_match_data_py.py         # Match data ingestion (StatsBomb / FBref)
│   ├── 01_match_data.R             # R-side match data assembly
│   ├── 02_venues_geocoding.R       # Stadium geocoding
│   ├── 03_elevation_py.py          # Open-Elevation API calls
│   ├── 04_weather_py.py            # Meteostat weather API & validation
│   ├── 05_travel_rest.py           # Travel distance & rest interval features
│   ├── 05_elo_adapt.R              # Elo rating adaptation
│   ├── 06_master_assembly.R        # Master dataset compilation
│   └── 07_models.R                 # GLMM negative binomial modelling
│
├── data_raw/                       # Raw source data (Kaggle CSVs, Elo ratings)
├── data_interim/                   # Intermediate processed files (elevation, weather, geocoding)
├── data_final/                     # Final merged dataset used by the dashboard
├── models/                         # Serialised R model objects (.rds)
├── docs/                           # EDA reports, model diagnostics, visualisations
├── tests/testthat/                 # R unit tests (testthat)
├── Important Project Documents/    # Planning docs, architecture & implementation plans
├── Dockerfile                      # Container deployment config
├── helm/                           # Kubernetes Helm chart
├── requirements.txt                # Python dependencies
└── README.md                       # This file
```

---

## 📊 Running the Data Pipeline

Run the scripts in numbered order from the project root:

```bash
# Step 0 — Install R packages
Rscript scripts/00_environment_setup.R

# Step 1 — Ingest historical match data
python scripts/01_match_data_py.py
Rscript scripts/01_match_data.R

# Step 2 — Geocode venues
Rscript scripts/02_venues_geocoding.R

# Step 3 — Fetch elevation data
python scripts/03_elevation_py.py

# Step 4 — Fetch weather data (requires Meteostat API key in .Renviron)
python scripts/04_weather_py.py

# Step 5 — Calculate travel & rest features + Elo ratings
python scripts/05_travel_rest.py
Rscript scripts/05_elo_adapt.R

# Step 6 — Assemble master dataset
Rscript scripts/06_master_assembly.R

# Step 7 — Run GLMM models
Rscript scripts/07_models.R
```

---

## 🌐 Running the Dashboard Locally

```bash
cd nextjs_site
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

The dashboard has four tabs:
- **Overview** — Project summary, research questions, and hypothesis cards
- **Analytics** — Live environmental explorer with interactive binned line chart and filters
- **2026 Risk** — Venue-level risk projections for all host cities
- **Pipeline** — End-to-end methodology walkthrough

---

## 🔑 Environment Variables

Create a `.Renviron` file in the project root (this is git-ignored and stays local):

```
RAPIDAPI_KEY=your_meteostat_rapidapi_key_here
```

---

## 🧪 Running Tests

```bash
Rscript -e "testthat::test_dir('tests/testthat')"
```

Tests cover:
- Phase 01: Match data schema validation
- Phase 03: Elevation bounds checking
- Phase 04: Weather data integrity (temperature -10°C–50°C, humidity 0%–100%)

---

## 📦 Data Sources

| Source | Data |
|--------|------|
| [StatsBomb Open Data](https://github.com/statsbomb/open-data) | xG, match events |
| [FBref](https://fbref.com) | Match statistics |
| [Kaggle — FIFA World Cup 1930–2022](https://www.kaggle.com/) | Historical results |
| [Kaggle — FIFA Elo Ratings](https://www.kaggle.com/) | Team quality ratings |
| [Open-Elevation API](https://open-elevation.com) | Stadium elevation |
| [Meteostat via RapidAPI](https://rapidapi.com/meteostat/api/meteostat) | Historical weather |

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Soumyadeep Nath**  
Data Science & Analytics | Sports Analytics  
[GitHub: sdn9300](https://github.com/sdn9300)
