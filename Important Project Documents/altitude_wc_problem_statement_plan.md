# ⛰️ FIFA World Cup Environmental Stress Analytics
## Formal Problem Statement + Professional Website SDD
### Version 2.0 · Spec-Driven Development Edition

---

# PART I — ELEVATED PROBLEM STATEMENT

---

## DOCUMENT CLASSIFICATION

| Field | Value |
|---|---|
| **Project Title** | Altitude, Heat & Humidity Effects on Team Performance in FIFA World Cups (1930–2026) |
| **Project Type** | Sports Analytics Research + Portfolio Engineering Project |
| **Primary Audience** | Hiring Managers, Sports Data Analysts, Football Researchers |
| **Secondary Audience** | Football Coaches, Tournament Organisers, Sports Science Community |
| **Analytical Language** | R (primary) · Python (secondary) |
| **Document Status** | Approved for Development |
| **Version** | 2.0 |

---

## SECTION 1 — EXECUTIVE SUMMARY

Elite football performance is shaped by tactical intelligence, player quality, and squad depth. What the analytical community has systematically ignored is that **physical laws do not care about your Elo rating**.

A team playing in Mexico City (2,240 metres above sea level) is competing in an atmosphere where the partial pressure of oxygen is approximately 25% lower than at sea level. Every outfield player's cardiovascular system must compensate — through hyperventilation, elevated heart rate, and accelerated glycogen depletion — from the first minute of the match. By the 60th minute, the physiological deficit compounds. Goals follow.

This project asks a deceptively simple question: **does the physics of the environment show up in the scoreline?**

Using historical FIFA World Cup data spanning 1930 to 2022 — integrated with open-source elevation data, historical climate records, and national team strength indicators — this project constructs the first large-scale empirical framework quantifying how altitude, heat, humidity, travel fatigue, and rest periods shape match-level performance outcomes in elite international football.

The findings will generate direct, actionable 2026 World Cup venue risk assessments for all 16 host cities, providing a novel analytical lens on the most environmentally diverse tournament in World Cup history.

---

## SECTION 2 — PHYSIOLOGICAL MECHANISMS

> This section is foundational. Every variable you engineer, every hypothesis you test, every model you run derives its justification from these mechanisms. A data scientist who understands the biology is infinitely more credible than one who just runs regressions.

### 2.1 Altitude: The Oxygen Debt Machine

At sea level, the partial pressure of inspired oxygen (PiO₂) is approximately 159 mmHg. Hemoglobin saturation in arterial blood is ~98%.

As altitude increases, barometric pressure falls. PiO₂ falls proportionally. The consequences are cascading:

| Altitude | VO₂max Reduction | Hemoglobin Saturation | PiO₂ (mmHg) |
|---|---|---|---|
| 0 m (sea level) | 0% | ~98% | 159 |
| 500 m | ~2–3% | ~97% | 150 |
| 1,000 m | ~5–7% | ~95% | 141 |
| 1,500 m | ~8–10% | ~93% | 133 |
| 2,000 m | ~12–14% | ~90% | 125 |
| 2,240 m (Mexico City) | ~14–16% | ~89% | 121 |

**Source**: Adapted from Wehrlin & Hallén (2006), *Scandinavian Journal of Medicine & Science in Sports*.

**What this means for a 90-minute football match**:

- Reduced VO₂max → lower aerobic capacity → earlier onset of anaerobic metabolism
- Anaerobic metabolism produces lactate → acidosis → muscular fatigue
- Compensatory hyperventilation (breathing harder) → increased respiratory muscle oxygen demand → less O₂ available for locomotion
- Glycogen depletion accelerates → reduced sprint capacity and technical precision in the 2nd half

The critical insight: **these effects do not accumulate linearly**. Fatigue is known to be exponential in nature. A team that enters the 2nd half already physiologically stressed — because of high altitude — will deteriorate faster than the raw oxygen-reduction numbers suggest.

### 2.2 Heat Stress: The Cardiovascular Overload

Core body temperature during intense exercise rises at approximately 1°C per 5–7 minutes without adequate heat dissipation. The cardiovascular system's response to heat is to redistribute blood from muscles to the skin surface for cooling — a process called **cardiovascular drift**.

Consequences in a football context:
- Reduced muscle blood flow → decreased force production
- Elevated heart rate at any given workload (an inefficiency tax)
- Reduced time to exhaustion at submaximal intensities
- Increased rate of perceived exertion → conservative positioning, shorter sprints

At ambient temperatures above 28°C, the **International Olympic Committee** and sports medicine literature consider heat a significant performance risk for athletes not acclimatised to the conditions.

**2026 Critical Venues** (June climate):
- Dallas: ~34°C average high, moderate humidity
- Miami: ~32°C with 70%+ relative humidity
- Houston: ~35°C with high humidity

### 2.3 Humidity: The Heat Amplifier

The human body cools through sweat evaporation. Evaporation rate depends on the **vapour pressure gradient** between sweat on the skin and ambient air. When humidity is high, this gradient collapses — sweat cannot evaporate efficiently, heat is trapped, and core temperature rises faster.

This is why 30°C at 80% humidity (Manaus, Brazil, 2014 WC) is physiologically more stressful than 35°C at 20% humidity (a dry desert heat).

**The Wet-Bulb Globe Temperature (WBGT)** is the gold-standard index combining temperature, humidity, solar radiation, and wind. For this project, we use a simplified proxy:

```
heat_stress_proxy = avg_temp_c × (avg_humidity_pct / 100)
```

This captures the interaction between temperature and humidity without requiring solar radiation data.

### 2.4 The Compound Effect: Why This Study Is Novel

Sports physiology literature has studied altitude effects in the lab. Exercise scientists have studied heat effects in the lab. But **no large-scale field study** has simultaneously modelled:

- Altitude + heat + humidity interaction effects
- Across all FIFA World Cup editions (1930–2022)
- At the team-match level
- While controlling for team quality, rest, and travel

This is the analytical gap this project fills.

---

## SECTION 3 — LITERATURE CONTEXT & GAP ANALYSIS

### 3.1 What Is Known

| Finding | Source | Relevance |
|---|---|---|
| VO₂max decreases ~7% per 1,000m above 1,000m | Wehrlin & Hallén, 2006 | Justifies altitude threshold of 1,000m |
| Full altitude acclimatisation requires 3+ weeks | Levine et al., 1997 | WC teams get 0 weeks: maximum vulnerability |
| FIFA prohibits competitive matches above 2,500m | FIFA Circular, 2007 | Confirms 2,240m (Mexico City) is at regulatory limit |
| Bolivia played all 2006 WC qualifiers at 3,640m (La Paz) — and used it deliberately | Sports press record | Supports altitude advantage hypothesis (H5) |
| Manaus (2014) heat/humidity impaired England vs Italy visibly | Journalistic + basic analytics | Informal evidence; no systematic study |

### 3.2 What Is Not Known (The Gap)

1. **No peer-reviewed study** has systematically analysed altitude effects across all World Cup editions simultaneously.
2. **No sports analytics paper** integrates elevation, climate, rest, travel, and team quality into a single model at the match level.
3. **No predictive framework** exists for estimating environmental risk in future tournaments.
4. The 2026 WC's unusual venue diversity — the widest range of environmental conditions in tournament history — makes this analysis **more urgent than ever**.

### 3.3 Why This Project Matters Beyond Academia

- **Team analysts at national football associations** can use this to plan preparation camps, rotation strategies, and acclimatisation timelines.
- **Betting markets** have largely ignored environmental variables — this represents unexploited signal.
- **FIFA itself** may use findings to inform future venue selection and match scheduling policies.
- **Portfolio value**: this is a genuinely novel analytical contribution, not a replication of existing work.

---

## SECTION 4 — FORMAL RESEARCH QUESTIONS

**RQ1**: Does playing at altitude (elevation > 1,000m) cause a measurable increase in 2nd-half goal concession rates, after controlling for team quality, rest days, and travel?

**RQ2**: Do elevated temperature and humidity independently reduce a team's offensive output in the 2nd half of World Cup matches?

**RQ3**: Is the combined effect of altitude and heat super-additive (i.e., does their interaction term carry additional explanatory power beyond their individual effects)?

**RQ4**: Do shorter inter-match rest periods amplify the physiological penalties of playing in stressful environments?

**RQ5**: Do national teams whose home environment is at high altitude show statistically smaller performance declines at altitude venues compared to sea-level teams?

**RQ6**: Based on historical patterns, which FIFA World Cup 2026 host venues pose the greatest environmental performance risk to competing teams?

---

## SECTION 5 — FORMAL HYPOTHESES

### H1 — Altitude Effect Hypothesis

> **Statement**: Venue elevation is positively associated with the 2nd-half goal concession differential, after controlling for team quality.

**Statistical formulation**:

In the model:
```
E[goals_against_2h | X] = exp(β₀ + β₁·log_elevation + β₂·elo_diff + β₃·rest_days + ...)
```

**H1: β₁ > 0** (the log-elevation coefficient is positive and statistically significant)

**Operationalisation**: `is_high_alt = TRUE` when `elevation_m > 1,000`

**Theoretical mechanism**: Reduced VO₂max → accelerated 2nd-half fatigue → reduced defensive organisation → more goals conceded

---

### H2 — Heat Stress Hypothesis

> **Statement**: Venues with mean June-July temperature above 28°C show increased 2nd-half goal concession rates relative to cooler venues.

**Statistical formulation**:

**H2: β_temp > 0** in the same model, independent of elevation coefficient

**Operationalisation**: `is_high_heat = avg_temp_c > 28`

**Theoretical mechanism**: Cardiovascular drift → reduced muscle perfusion → accelerating fatigue after halftime

---

### H3 — Interaction / Super-Additivity Hypothesis

> **Statement**: The simultaneous presence of high altitude AND high temperature produces a performance decline greater than the sum of each factor individually.

**Statistical formulation**:

**H3: β_interaction > 0** in a model with an `elevation_m × avg_temp_c` interaction term

**Theoretical mechanism**: Altitude causes compensatory hyperventilation (itself metabolically costly); heat increases cardiovascular load; together they overwhelm the body's compensatory capacity faster than either alone

---

### H4 — Rest & Recovery Hypothesis

> **Statement**: Teams with 3 or fewer rest days before an altitude/heat match show larger 2nd-half performance deterioration than teams with 6+ rest days.

**Statistical formulation**:

**H4: β_rest×altitude > 0** — the interaction between `is_high_alt` and `rest_days` is significant

**Operationalisation**: `short_rest = rest_days ≤ 3`

---

### H5 — Environmental Adaptation Immunity Hypothesis

> **Statement**: National teams whose home country capital sits above 1,000m elevation do not show the 2nd-half concession penalty at altitude venues, unlike sea-level teams.

**Statistical formulation**:

**H5: β_altitude_team×high_alt < β_sealevel_team×high_alt**

The altitude effect coefficient is significantly smaller (or null) for altitude-native teams.

**Operationalisation**: `is_altitude_team = team_origin_elevation_m > 1,000`

---

## SECTION 6 — ANALYTICAL SCOPE

### Included

| Domain | Scope |
|---|---|
| **Time period** | FIFA World Cups 1994–2022 (primary) · 1974–2022 (extended robustness check) |
| **Unit of analysis** | Team × Match (one row per team per match) |
| **Expected observations** | ~512 (1994–2022) · ~832 (1974–2022) |
| **Outcome variables** | `goals_against_2h`, `h2_delta`, `prop_goals_2h`, `xg_against_2h` (2018/22 only) |
| **Environmental variables** | Elevation, temperature, humidity, heat stress index, WBGT proxy |
| **Quality controls** | Elo rating, FIFA ranking, Transfermarkt squad value |
| **Fatigue controls** | Rest days, travel distance (km), is_first_match flag |
| **Adaptation flags** | Team origin elevation, is_altitude_team |
| **xG subset** | StatsBomb Open Data · 2018 and 2022 WC only |
| **Predictive scope** | All 16 FIFA World Cup 2026 host venues |

### Explicitly Excluded

| Excluded Variable | Reason |
|---|---|
| Individual player GPS/tracking data | Not publicly available at this scale |
| Injury reports | Not systematically recorded historically |
| Tactical formation data | Not available pre-2010 |
| Possession metrics pre-2018 | StatsBomb data only covers 2018+ |
| Extra-time goals | Distort 2nd-half signal; analysed separately in sensitivity checks |
| Penalty shootout goals | Not regular match goals; excluded entirely |
| Referee nationality effects | Unobservable confound; noted as limitation |

---

## SECTION 7 — DATA ARCHITECTURE REQUIREMENTS

### 7.1 Final Analytical Dataset Schema

**Table**: `team_match_master` · **Granularity**: one row per team per match

```
═══════════════════════════════════════════════════════════
IDENTIFIERS
  wc_year           INT     e.g. 2022
  match_id          CHR     e.g. "2022_ARG_FRA_Final"
  match_date        DATE    actual match date
  stage             CHR     "Group" | "R16" | "QF" | "SF" | "Final"
  team              CHR     FIFA 3-letter code, e.g. "ARG"
  opponent          CHR     FIFA 3-letter code, e.g. "FRA"

VENUE (Phase 3 output)
  venue_city        CHR     e.g. "Lusail"
  venue_stadium     CHR     e.g. "Lusail Stadium"
  venue_lat         NUM     decimal degrees
  venue_lon         NUM     decimal degrees
  elevation_m       NUM     metres above sea level (Open-Elevation API)
  log_elevation     NUM     log1p(elevation_m)
  is_high_alt       BOOL    elevation_m > 1,000
  alt_category      CHR     "Sea Level" | "Mid" | "High" | "Very High"

CLIMATE (Phase 3 output)
  avg_temp_c        NUM     June-July mean temperature °C (Meteostat)
  avg_humidity_pct  NUM     June-July mean relative humidity %
  heat_stress_proxy NUM     avg_temp_c × (avg_humidity_pct/100)
  wbgt_proxy        NUM     simplified Wet-Bulb Globe Temperature
  is_high_heat      BOOL    avg_temp_c > 28

MATCH OUTCOMES (Phase 2 output)
  goals_for_1h      INT     goals scored, 1st half
  goals_for_2h      INT     goals scored, 2nd half
  goals_against_1h  INT     goals conceded, 1st half
  goals_against_2h  INT     goals conceded, 2nd half [PRIMARY OUTCOME]
  h2_delta          NUM     goals_against_2h - goals_against_1h
  prop_goals_2h     NUM     goals_against_2h / total_goals (if total > 0)
  result            CHR     "W" | "D" | "L"
  stage             CHR     tournament stage

xG DATA (2018 & 2022 only; NA for prior years)
  xg_for_1h         NUM     xG generated, 1st half
  xg_for_2h         NUM     xG generated, 2nd half
  xg_against_1h     NUM     xG conceded, 1st half
  xg_against_2h     NUM     xG conceded, 2nd half [QUALITY OUTCOME]

TEAM QUALITY (Phase 4 output)
  team_elo_pre      NUM     Elo at tournament start date
  opp_elo_pre       NUM     Opponent Elo at tournament start date
  elo_diff          NUM     team_elo_pre - opp_elo_pre
  elo_diff_scaled   NUM     z-scored elo_diff
  team_fifa_rank    INT     FIFA rank, June of WC year (1994+ only)
  opp_fifa_rank     INT     Opponent FIFA rank

FATIGUE CONTROLS (Phase 5 derived)
  rest_days         INT     days since previous WC match (-1 = first match)
  opp_rest_days     INT     opponent rest days
  is_first_match    BOOL    rest_days == -1
  travel_km         NUM     distance from previous venue, Haversine
  log_travel_km     NUM     log1p(travel_km)
  opp_travel_km     NUM     opponent travel distance

ADAPTATION FLAGS (Phase 5 derived)
  team_origin_elev_m NUM    elevation of team's home capital (Wikipedia)
  is_altitude_team   BOOL   team_origin_elev_m > 1,000
  opp_origin_elev_m  NUM
  is_altitude_opp    BOOL
  altitude_matchup   CHR    "Alt vs Sea" | "Both Alt" | "Both Sea" | "Sea vs Alt"
═══════════════════════════════════════════════════════════
```

### 7.2 Data Quality Requirements

| Check | Required Standard |
|---|---|
| Missing values in outcome variables | 0% missing |
| Missing Elo ratings | < 5% (impute via linear interpolation if needed) |
| Missing FIFA rankings | Acceptable for pre-1994 data; use Elo as sole quality control |
| Elevation API errors | Manual cross-check required for all elevations > 500m |
| Temperature / humidity | Meteostat failure rate < 10%; use nearest station as fallback |
| Goal total consistency | Sum (goals_for_1h + goals_for_2h) = total FT goals for every row |

---

## SECTION 8 — SUCCESS CRITERIA

### Data Engineering
✅ Automated pipeline generates `team_match_master.csv` with < 5% missing values on core variables
✅ Pipeline is fully reproducible: `source("00_run_all.R")` runs end-to-end on a clean machine

### Statistical Analysis
✅ At least one hypothesis (H1–H5) achieves statistical significance (p < 0.05) in the full model
✅ Model diagnostics pass: residual plots show no systematic patterns; VIF < 5 for all predictors
✅ Sensitivity analyses confirm core findings are robust to (a) different altitude threshold, (b) group-stage-only sample

### Predictive Output
✅ 2026 venue risk rankings are computed and interpretable by a non-statistician
✅ At least Mexico City and Denver are identified as highest-risk venues (face validity check)

### Portfolio / Software
✅ GitHub repository is public, well-documented, and recruiter-ready
✅ Quarto analytical report renders to HTML
✅ Shiny dashboard is deployed on shinyapps.io with at least 3 interactive filters
✅ Professional website is deployed on Vercel with the research narrative, visualisations, and 2026 risk matrix

---

---

# PART II — PROFESSIONAL WEBSITE SDD

---

## SECTION 9 — WEBSITE PRODUCT REQUIREMENT DOCUMENT (PRD)

### 9.1 Product Statement

Build a **professional-grade portfolio + research dissemination website** for the Altitude & Heat Adaptation project. The website serves a dual purpose: it demonstrates full-stack engineering competence (Next.js, TypeScript, Recharts, deployed on Vercel) while communicating the research findings to non-statistician audiences including recruiters, sports analysts, and football enthusiasts.

### 9.2 User Personas

**Persona 1 — The Hiring Manager** (Primary)
- Role: Data science / ML team lead at a sports analytics company or data-first organisation
- Motivation: Evaluating whether Soumyadeep can build end-to-end data products, not just run models in a Jupyter notebook
- What they look for: Clean code, clear communication, production deployment, methodological rigour
- Success: They click "GitHub" and spend > 3 minutes reading the README

**Persona 2 — The Sports Analyst**
- Role: Data analyst at a football club or national federation
- Motivation: Curious about whether environmental factors could inform their squad preparation
- What they look for: Credible methodology, interpretable results, specific 2026 predictions
- Success: They share the 2026 venue risk matrix with their coaching staff

**Persona 3 — The Data Science Peer**
- Role: Fellow IIT Roorkee student, Kaggle competitor, LinkedIn connection
- Motivation: Learning from the approach; social proof; technical inspiration
- What they look for: Stack choices, model architecture, code quality
- Success: They star the GitHub repository

**Persona 4 — The Football Fan**
- Role: Interested casual reader who clicked a social media link
- Motivation: Curiosity about "does Mexico City really give a home advantage?"
- What they look for: Easy-to-read visualisations, surprising statistics, 2026 predictions
- Success: They share the 2026 risk map on social media

---

### 9.3 Core User Flows

```
PERSONA 1 (Hiring Manager):
Landing Page → [reads headline + stats] → Research Section → [reads methodology]
→ Analysis Section → [checks model quality] → GitHub CTA → [inspects code]

PERSONA 2 (Sports Analyst):
Landing Page → [2026 risk preview] → 2026 Venue Risk Page → [interactive risk map]
→ Methodology → [validates credibility] → Downloads full Quarto report

PERSONA 3 (Data Science Peer):
Landing Page → [notes tech stack] → GitHub CTA → [reads README]
→ Data section → [inspects pipeline design] → Stars repository

PERSONA 4 (Football Fan):
Landing Page → [drawn by headline] → 2026 Risk section → [explores venue cards]
→ Shares risk map → Done
```

---

## SECTION 10 — WEBSITE ARCHITECTURE

### 10.1 Site Structure

```
altitude-heat-wc/                   ← Root Next.js project
├── app/                            ← App Router directory
│   ├── layout.tsx                  ← Root layout (nav + footer)
│   ├── page.tsx                    ← / (Landing page)
│   ├── research/
│   │   └── page.tsx                ← /research (Full problem statement)
│   ├── data/
│   │   └── page.tsx                ← /data (Sources + pipeline explanation)
│   ├── analysis/
│   │   ├── page.tsx                ← /analysis (EDA + model results overview)
│   │   ├── eda/page.tsx            ← /analysis/eda (EDA charts, interactive)
│   │   └── model/page.tsx          ← /analysis/model (Coefficient plots, tables)
│   ├── venues/
│   │   ├── page.tsx                ← /venues (All WC venues, historical)
│   │   └── 2026/page.tsx           ← /venues/2026 (2026 risk matrix — hero page)
│   ├── report/
│   │   └── page.tsx                ← /report (Quarto HTML report embed + download)
│   └── dashboard/
│       └── page.tsx                ← /dashboard (Links to Shiny app on shinyapps.io)
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── charts/
│   │   ├── VO2maxCurve.tsx         ← Altitude vs VO₂max reduction (Recharts)
│   │   ├── VenueRiskMatrix.tsx     ← 2026 scatter: elevation × temp (Recharts)
│   │   ├── H2DeltaByAltitude.tsx   ← Bar chart: h2_delta by altitude category
│   │   ├── CoefficientPlot.tsx     ← Forest plot of model coefficients
│   │   └── GoalTimeline.tsx        ← Goals distribution across 90 minutes
│   ├── maps/
│   │   └── VenueMap.tsx            ← react-leaflet: all WC venues or 2026 only
│   ├── ui/
│   │   ├── VenueCard.tsx           ← Reusable venue risk card component
│   │   ├── HypothesisCard.tsx
│   │   ├── StatBadge.tsx
│   │   └── RiskBar.tsx
│   └── sections/
│       ├── HeroSection.tsx
│       ├── StatsBar.tsx
│       ├── ResearchSection.tsx
│       ├── VenueRiskSection.tsx
│       ├── PipelineSection.tsx
│       └── TechStackSection.tsx
│
├── data/                           ← Pre-computed R outputs as JSON
│   ├── team_match_summary.json     ← Aggregated stats by altitude category
│   ├── model_coefficients.json     ← Export from R broom::tidy()
│   ├── venues_2026.json            ← 2026 venue risk scores
│   ├── venues_historical.json      ← All historical WC venues with elevation
│   └── h2_delta_by_year.json       ← Year-level trends
│
├── public/
│   ├── og-image.png                ← Open Graph image for social sharing
│   └── figures/                    ← Static chart exports from R (PNG)
│       ├── risk_matrix_2026.png
│       └── coefficient_plot.png
│
├── lib/
│   ├── types.ts                    ← TypeScript interfaces for all data shapes
│   └── utils.ts                    ← Formatting, colour scale, risk computation
│
├── styles/
│   └── globals.css                 ← Tailwind base + custom design tokens
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### 10.2 Page-by-Page Specification

#### Page 1: `/` — Landing Page

**Purpose**: Convert visitor into engaged reader within 8 seconds.

**Sections** (in order):
1. **Navbar** — sticky, blurred glass background, logo + 5 nav links + Dashboard CTA
2. **Hero** — 2-column: left (headline + description + CTAs + 3 hero stats) / right (VO₂max area chart card)
3. **Stats Bar** — 4 key metrics with icons: peak elevation, VO₂max reduction, 2026 venues, critical-risk venues
4. **Research Gap** — left prose + right interactive hypothesis cards (clickable)
5. **2026 Preview** — venue risk cards with animated progress bars
6. **Methodology Pipeline** — 5-step visual with connecting line
7. **Tech Stack** — pill badges
8. **Footer** — licence info, attribution

**Key Interactions**:
- Hypothesis cards expand on click to show full statistical formulation
- Venue cards highlight on hover with border colour matching risk level
- Stats counter animation on scroll-into-view (Framer Motion)

---

#### Page 2: `/research` — Research Deep Dive

**Purpose**: Full problem statement for serious analysts and hiring managers.

**Content**: The complete PART I of this document, rendered with:
- Custom typographic treatment (pull quotes, highlighted research questions)
- Collapsible methodology cards
- Inline citation tooltips
- Physiological mechanism diagram (SVG or Recharts illustration)
- Download button for full Quarto PDF report

---

#### Page 3: `/data` — Data Sources

**Purpose**: Demonstrate data engineering rigour.

**Sections**:
- Pipeline architecture diagram (vertical flowchart)
- Source table (each source: name, URL, method, variables extracted, licence)
- Schema explorer: interactive table of `team_match_master` variables
- "How to reproduce" accordion with key R code snippets

---

#### Page 4: `/analysis` — Analysis Hub

**Sub-pages**:

**/analysis/eda** — Key EDA findings:
- Elevation distribution of WC venues (histogram)
- h2_delta by altitude category (bar + CI)
- Elevation scatter vs h2_delta (LOESS smoothed)
- Confound check: Elo difference vs h2_delta
- Climate correlation matrix

**/analysis/model** — Statistical results:
- Coefficient plot for Model 4 (GLMM NB)
- AIC comparison table (Models 1–5)
- Model interpretation: "A 1,000m increase in elevation is associated with X% more 2nd-half goals conceded"
- Sensitivity analysis results

---

#### Page 5: `/venues/2026` — 2026 Risk Matrix (Hero Page)

**Purpose**: The most shareable, most impactful page on the site.

**Sections**:
1. **Interactive Bubble Chart**: elevation (x) × temperature (y) × predicted risk (size + colour)
2. **Venue Cards Grid**: all 16 venues with risk scores, elevation, flag, category
3. **Team Vulnerability Calculator**: select your team → see which 2026 venues pose the highest risk based on the model
4. **Embeds link to Shiny dashboard** for interactive model exploration

---

#### Page 6: `/report`

**Purpose**: Embed or link the full Quarto analytical report.

**Options** (choose based on file size):
- Option A: Render Quarto HTML report and serve as static file in `/public/report.html`, embed via iframe
- Option B: Deploy Quarto report on GitHub Pages (via GitHub Actions), link from this page
- Option C: Export Quarto to PDF, provide download button

---

#### Page 7: `/dashboard`

**Purpose**: Link to Shiny app on shinyapps.io with description of interactive features.

**Shiny App Features**:
- Elevation threshold slider → model re-runs
- Team selector → show that team's performance across altitude venues
- Year filter
- 2026 venue predictions with confidence intervals

---

## SECTION 11 — TECH STACK DECISION MATRIX

| Layer | Choice | Justification | Alternatives Rejected |
|---|---|---|---|
| **Framework** | Next.js 14 (App Router) | You already know it from AlignResume. SSG pre-renders analysis pages (fast, SEO-friendly). Server Components reduce JS bundle. | Vite + React (no SSG), SvelteKit (learning curve) |
| **Language** | TypeScript | Type-safe data shapes prevent silent JSON-mismatch bugs. All chart data has known shape. | Plain JavaScript (no autocomplete, runtime errors) |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first = rapid iteration. shadcn/ui gives accessible, unstyled components you own. | MUI (too opinionated), styled-components (DX overhead) |
| **Charts** | Recharts | React-native, declarative, responsive. Excellent for all chart types needed. | D3.js (verbose, overkill for this), Chart.js (less React-native) |
| **Maps** | react-leaflet | Free, open-source, OpenStreetMap tiles. Good enough for venue location display. | Mapbox (costs money), Google Maps (API key complexity) |
| **Animation** | Framer Motion | Clean scroll-reveal animations, counter animations, card transitions. | GSAP (heavier), CSS only (limited) |
| **Deployment** | Vercel | One-click Next.js deploy. Handles ISR, SSG, SSR natively. Free tier generous. | Netlify (fine but less Next.js-native), AWS (complexity overkill) |
| **R Analysis** | Quarto | Best-in-class for reproducible analytical reports. HTML output embeds perfectly. | R Markdown (Quarto supersedes it), Jupyter (Python-first) |
| **Interactive R** | Shiny on shinyapps.io | Free tier. Allows real-time model interaction. Embeds via iframe in Next.js. | Self-hosted Shiny (DevOps overhead), Observable (different stack) |
| **Data Bridge** | JSON exports from R | R scripts export `broom::tidy()` model outputs, summary stats, and venue scores as JSON. Next.js consumes these as static data. No API server needed. | REST API from R (plumber) — adds backend complexity unnecessarily |

---

## SECTION 12 — IMPLEMENTATION ROADMAP

### Sprint 1 (Days 1–3): Foundation
- [ ] Scaffold Next.js 14 project with TypeScript + Tailwind
- [ ] Build Navbar, Footer, root layout
- [ ] Build HeroSection with VO₂max chart (Recharts AreaChart)
- [ ] Build StatsBar component
- [ ] Deploy skeleton to Vercel with placeholder content
- [ ] Commit: `feat(scaffold): initialise Next.js 14 project with design system`

### Sprint 2 (Days 4–6): Core Pages
- [ ] Build `/research` page with full problem statement content
- [ ] Build `/data` page with pipeline diagram and source table
- [ ] Build reusable VenueCard, HypothesisCard, RiskBar components
- [ ] Wire up JSON data files (even with placeholder values initially)
- [ ] Commit: `feat(pages): add research and data pages with static content`

### Sprint 3 (Days 7–9): Analysis Pages
- [ ] Build `/analysis/eda` with 4 key EDA charts (real R outputs as JSON)
- [ ] Build `/analysis/model` with coefficient plot
- [ ] Import actual R model outputs as JSON
- [ ] Commit: `feat(analysis): add EDA and model results pages with real data`

### Sprint 4 (Days 10–12): 2026 Risk Matrix
- [ ] Build `/venues/2026` as the centrepiece page
- [ ] Build interactive bubble chart (Recharts ScatterChart or custom)
- [ ] Build all 16 venue cards with risk scores
- [ ] Add Shiny embed link
- [ ] Commit: `feat(2026): add venue risk matrix page — centrepiece deliverable`

### Sprint 5 (Days 13–14): Polish & Launch
- [ ] Add Framer Motion: scroll reveals, counter animations, hover states
- [ ] Add Open Graph meta tags (social sharing image)
- [ ] Performance audit: Lighthouse score > 90 for all pages
- [ ] Accessibility audit: keyboard navigation, ARIA labels
- [ ] Add `/report` page with Quarto embed or download
- [ ] Final production deploy on Vercel with custom domain (optional)
- [ ] Commit: `release: v1.0.0 — production launch`

---

## SECTION 13 — DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    USER / BROWSER                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│             VERCEL CDN (Global Edge Network)                 │
│   Next.js static pages served from nearest edge node        │
│   URL: altitude-wc.vercel.app (or custom domain)            │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
┌──────────▼──────────┐        ┌──────────▼──────────────────┐
│  STATIC ASSETS      │        │  SHINY APP (iframe embed)    │
│  /public/figures/   │        │  shinyapps.io free tier      │
│  /data/*.json       │        │  Serves interactive model     │
│  R chart exports    │        │  explorer                    │
└─────────────────────┘        └─────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│           GITHUB PAGES (Quarto report)                       │
│   Quarto renders to HTML → deployed via GitHub Actions       │
│   URL: your-username.github.io/altitude-wc-report            │
└─────────────────────────────────────────────────────────────┘

DATA FLOW (Build Time):
R Analysis Pipeline → JSON exports → committed to /data/*.json
→ Next.js reads at build time → rendered into static HTML → deployed to Vercel
```

---

## SECTION 14 — DESIGN SYSTEM

### Colour Tokens

```typescript
// lib/designTokens.ts
export const colors = {
  bg:          '#050B18',   // Page background: deep space navy
  card:        '#0D1627',   // Card background
  cardAlt:     '#0A1020',   // Tooltip / elevated card background
  border:      '#1E2D4A',   // Default border
  borderLight: '#253450',   // Hover border

  accent:      '#00C896',   // Teal: positive, data, CTAs
  blue:        '#4361EE',   // Blue: methodology, pipelines
  red:         '#EF4444',   // Red: risk, altitude, warnings
  gold:        '#F59E0B',   // Gold: heat, medium risk, caution
  purple:      '#A855F7',   // Purple: interaction effects

  text:        '#E8EDF5',   // Primary text
  muted:       '#64748B',   // Labels, captions
  muted2:      '#8895A7',   // Body text, descriptions
};

// Risk level → colour mapping
export const riskColor = (risk: number): string => {
  if (risk >= 80) return colors.red;
  if (risk >= 60) return colors.gold;
  if (risk >= 40) return '#F97316'; // Orange
  return colors.accent;
};
```

### Typography

```css
/* globals.css */
:root {
  --font-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

/* Type scale */
h1: 44px / weight 900 / tracking -2px  (hero headline)
h2: 32px / weight 900 / tracking -1px  (section titles)
h3: 20px / weight 700 / tracking -0.5px
body: 15px / weight 400 / line-height 1.75
label: 11px / weight 700 / tracking 1px / uppercase
mono: 13px JetBrains Mono (code, stats, badges)
```

---

## SECTION 15 — PORTFOLIO & RECRUITER ASSETS

### GitHub Repository Description
```
Sports analytics research project quantifying the effect of altitude, heat,
and humidity on FIFA World Cup performance using GLMM Negative Binomial models.
Covers 1994–2022. Produces 2026 venue risk predictions. R + Next.js + Shiny.
```

### GitHub Topics
```
sports-analytics football-analytics world-cup altitude environmental-analytics
r-statistics mixed-effects-models glmm shiny quarto nextjs data-science portfolio
```

### LinkedIn Post (For Launch Day)
```
🏔️ Just shipped: Altitude & Heat Adaptation in FIFA World Cups

The question: does physics show up in the scoreline?

After analysing 512+ World Cup team-match observations (1994–2022), integrating
elevation data, historical climate records, and national team Elo ratings into
a single GLMM framework — here's what I found:

[Key finding, e.g.: Teams at venues above 1,000m concede X% more goals in the
2nd half than teams at sea level, even after controlling for team quality. p < 0.05.]

The 2026 World Cup has the most environmentally diverse venue portfolio in history.
Mexico City (2,240m). Denver (1,609m). Miami (high humidity). Dallas (summer heat).

I built a risk matrix projecting which 2026 venues pose the highest physiological
risk — and which teams are most vulnerable.

🔗 Full analysis + interactive dashboard: [link]
🔗 GitHub (R + Next.js, fully reproducible): [link]

Built with: R · worldfootballR · StatsBomb · lme4 · Quarto · Shiny · Next.js · Vercel

#sportsanalytics #datascience #football #WorldCup2026 #R #statistics
```

### Resume Bullets
```
• Engineered end-to-end sports analytics pipeline in R ingesting FBref, StatsBomb,
  Meteostat, and Open-Elevation APIs across 8 World Cups (1994–2022); modelled
  2nd-half fatigue effects using GLMM Negative Binomial with tournament random
  intercepts, Elo quality controls, and altitude × temperature interaction terms

• Identified statistically significant altitude fatigue effect (β = X, p < 0.05)
  across 512 team-match observations; produced 2026 World Cup venue risk rankings
  projecting critical physiological exposure at Mexico City (2,240m) and Denver (1,609m)

• Deployed research as a full-stack Next.js website on Vercel with interactive
  Recharts visualisations, react-leaflet venue map, and embedded Shiny dashboard
  on shinyapps.io; Quarto report serves as reproducible supplementary material
```

---

*Document Version: 2.0 · Status: Approved for Development · Next Action: Phase 1 Sprint 1 — Next.js Scaffold*
