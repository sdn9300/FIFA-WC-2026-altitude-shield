# 🏔️ FIFA World Cup 2026 Environmental Analytics

An end-to-end data engineering, statistical modeling, and interactive visualization platform designed to evaluate and predict the performance impact of **altitude** and **heat stress** on elite football players at the FIFA World Cup 2026 venues.

---

## 📌 Project Overview

The FIFA World Cup 2026 will span 16 host cities across Canada, Mexico, and the United States. These venues feature unprecedented geographical and climatic diversity—ranging from sea-level coastal stadiums (e.g., Miami, Seattle) to high-altitude venues situated over 1,500m to 2,200m above sea level (e.g., Guadalajara, Denver, Mexico City), often coupled with intense summer heat. 

This project implements a complete pipeline that:
1. **Aggregates** historical match results (StatsBomb, FBref), venue elevations (Open-Elevation API), and historical weather conditions (Meteostat API).
2. **Engineers** complex spatial-temporal features (cumulative travel distance, rest profiles, physiological adaptation variables).
3. **Models** player fatigue and defensive deterioration using Generalised Linear Mixed Models (GLMMs), showing a statistically significant relationship between environmental stressors and second-half goal concessions.
4. **Predicts** match outcomes and venue vulnerability profiles for the 2026 host venues.
5. **Visualizes** these insights via an interactive, modern Next.js web application.

---

## 🚀 Key Findings

*   **The Altitude Deterioration Threshold:** Teams playing at elevations above **1,000m** experience a statistically significant surge in second-half goals conceded, which is heavily compounded by short recovery periods ($\le 3$ rest days).
*   **Combined Stress Multiplier:** The physiological impact of combined heat index ($>28^\circ\text{C}$) and high altitude is super-additive, leading to an accelerated depletion of athletic output.
*   **Altitude Immunity:** Historical data indicates that high-altitude native teams (e.g., Mexico) show a physiological resilience (lower rate of second-half deterioration) compared to coastal/sea-level teams.

---

## 🛠️ Tech Stack & Architecture

### Data Engineering & Analytics Pipeline
*   **R & Python:** Data extraction, sanitization, and GLMM mixed-effects modeling.
*   **StatsBomb & FBref API:** Core historical tournament datasets.
*   **Meteostat API:** RapidAPI integration for stadium-specific historical weather (temperature, humidity).
*   **Open-Elevation API:** Stadium coordinates geocoding and elevation retrieval.

### Interactive Dashboard Web App
*   **Framework:** Next.js (TypeScript, App Router).
*   **Styling:** Custom modern dark theme using Vanilla CSS tokens, glassmorphism, responsive flex layouts.
*   **Icons:** Lucide React.
*   **Charts & Visualizations:** Recharts (featuring a custom Binned Line Chart for environmental risk exploration).

---

## 📂 Repository Structure

```directory
├── nextjs_site/                    # Next.js Frontend Dashboard
│   ├── app/                        # Next.js App Router (pages & layout)
│   ├── public/                     # Static assets (including match database CSV)
│   │   └── data/
│   │       └── team_match_master.csv
│   ├── utils/                      # CSV parser utilities (PapaParse)
│   └── styles/                     # CSS variables and styling modules
│
├── scripts/                        # Data Pipeline Steps
│   ├── 00_environment_setup.R      # Installs environment packages
│   ├── 01_match_data_py.py         # Match ingestion (StatsBomb/FBref)
│   ├── 02_venues_geocoding.R       # Geocoding match stadiums
│   ├── 03_elevation_py.py          # Querying Open-Elevation API
│   ├── 04_weather_py.py            # RapidAPI Meteostat fetching & validation
│   ├── 05_travel_rest.py           # Calculating travel distance & rest intervals
│   ├── 06_master_assembly.R        # Merges steps into master analytics database
│   └── 07_models.R                 # Negative Binomial GLMM regression modeling
│
├── data_raw/                       # Raw API source data (git-ignored)
├── data_interim/                   # Partially processed datasets (elevation, weather)
├── data_processed/                 # Cleaned datasets ready for modelling/visualization
└── tests/                          # Automated R unit tests (testthat assertions)
```

---

## 📊 Pipeline Executions & Data Processing

To run the data processing pipeline sequentially, use the scripts provided in `/scripts`:

1.  **Environment Setup:** Initialize packages.
    ```bash
    Rscript scripts/00_environment_setup.R
    ```
2.  **Weather Data Fetching & Validation:** Queries Meteostat for historical temperature (`temp_c`) and relative humidity (`rh_pct`) with strict physical boundary assertions (-10°C to 50°C, 0% to 100%).
    ```python
    python scripts/04_weather_py.py
    ```
3.  **Statistical Modeling:** Fits Negative Binomial Generalized Linear Mixed Models (GLMMs) on second-half goal concessions.
    ```bash
    Rscript scripts/07_models.R
    ```

---

## 💻 Web App Setup & Development

Run the interactive dashboard locally:

1.  Navigate to the site folder:
    ```bash
    cd nextjs_site
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 License

This project is licensed under the MIT License.
