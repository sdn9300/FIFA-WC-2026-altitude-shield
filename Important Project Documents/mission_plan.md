# 🏔️ MISSION PLAN
## Operation Altitude Shield
### FIFA World Cup Environmental Stress Analytics · 14-Day Execution Window

---

## DOCUMENT CONTROL

| Field | Value |
|---|---|
| **Mission Designation** | Operation Altitude Shield |
| **Mission Type** | Data Science Research + Portfolio Engineering |
| **Execution Window** | 14 days |
| **Mission Owner** | Soumyadeep |
| **Primary Theatre** | R 4.3+ analytical pipeline |
| **Secondary Theatre** | Next.js / Shiny / Quarto deployment layer |
| **Plan Status** | Approved — Phase 2 Active |
| **Version** | 1.0 |

---

---

# SECTION 1 — SITUATION

## 1.1 Background

FIFA World Cup 2026 will be staged across 16 venues spanning sea-level Miami to 2,240-metre Mexico City — the widest environmental range in the tournament's history. No existing public analysis has quantified, at scale, whether altitude and heat measurably degrade team performance across World Cup history. The window to produce and publish this analysis ahead of the tournament is open now and will not remain open indefinitely.

## 1.2 Why This Mission Matters

Three audiences are watching outcomes of different kinds:

- **Hiring managers** evaluating whether the mission owner can ship an end-to-end data product, not just a notebook.
- **Sports analysts and federations** who could use venue risk findings to inform 2026 preparation camps and squad rotation.
- **The mission owner's own portfolio**, which needs a novel, defensible, well-communicated piece of work — not a replication of an existing Kaggle notebook.

## 1.3 Terrain Assessment (What We're Working With)

| Asset | Status |
|---|---|
| Data sources identified | 8 sources, all free or open-licence, fully scoped |
| Technical stack | R (analysis) + Next.js (deployment) + Shiny (interactivity) — all known to mission owner |
| Schema | Locked in Phase 0 — 28-column master table contract |
| Time budget | 14 days, part-time around IIT Roorkee coursework |
| Prior friendly contact | AlignResume + Future Fit projects already demonstrate full-stack + ML delivery capability |

---

---

# SECTION 2 — MISSION STATEMENT

> **Build and deploy a statistically rigorous, fully reproducible analytics pipeline that determines whether altitude, heat, and humidity measurably degrade football performance at the FIFA World Cup — and use those findings to produce an actionable environmental risk assessment for all 16 venues of the 2026 tournament — within a 14-day execution window.**

This single sentence is the test every task in this plan must pass. If a task does not serve this sentence, it does not belong in the current sprint — park it in `docs/future_work.md`.

---

---

# SECTION 3 — COMMANDER'S INTENT

Success is not "a model ran." Success is a defensible answer to one question — *does the environment show up in the scoreline* — that:

1. Survives sensitivity testing (it isn't an artefact of one tournament or one threshold choice)
2. Is communicated clearly enough that a non-statistician understands the finding in under a minute
3. Is packaged well enough that a stranger reading the GitHub README spends three minutes engaged, not thirty seconds skimming

If time runs short, preserve **rigour and clarity** over **breadth**. A narrower analysis that is airtight beats a broader one with a shaky join or an unjustified model choice.

---

---

# SECTION 4 — MISSION OBJECTIVES

## 4.1 Primary Objectives (Must Achieve)

```
P1. Build a reproducible R pipeline ingesting all 8 data sources into one
    master table (team_match_master.csv, ~512 rows × 28 columns)

P2. Fit a GLMM Negative Binomial model quantifying the altitude/heat effect
    on 2nd-half goals conceded, with tournament-level random intercept

P3. Produce a statistically defensible answer to H1 (altitude effect)
    with a p-value, effect size, and confidence interval

P4. Generate 2026 venue risk rankings for all 16 host cities, derived
    from the fitted model
```

## 4.2 Secondary Objectives (Should Achieve)

```
S1. Test H2–H5 (heat stress, altitude×heat interaction, rest amplification,
    altitude-native immunity)

S2. Deploy an interactive Shiny dashboard for live model exploration
    on shinyapps.io

S3. Ship a production Next.js portfolio website on Vercel

S4. Render the full Quarto analytical report (HTML + downloadable PDF)
```

## 4.3 Stretch Objectives (Could Achieve)

```
X1. Extend the robustness sample to 1974–2022 (13 tournaments) as a
    secondary check on the primary 1994–2022 finding

X2. Build a team-specific vulnerability calculator for 2026
    ("select your team → see your highest-risk venues")

X3. Publish a LinkedIn launch post and tag the GitHub repo with
    discoverable topics for recruiter visibility
```

**Rule of engagement**: Do not begin a Secondary objective until all Primary objectives are deliverable. Do not begin a Stretch objective until all Secondary objectives are deliverable. This is not a suggestion — it is how 14-day missions fail: by spending Day 9 polishing a website when the model hasn't been fit yet.

---

---

# SECTION 5 — FORCES & RESOURCES AVAILABLE

## 5.1 Data Assets (8 Sources)

| Source | Role | Risk Level |
|---|---|---|
| FBref | Match results, goal timings, venues | HIGH (rate limiting) |
| StatsBomb Open Data | xG by half, 2018 & 2022 only | LOW |
| Kaggle (evangower, fifaworldranking) | Backup match data, FIFA rankings | LOW |
| Wikipedia | Stadium list, capital elevations | LOW |
| Open-Elevation API | Stadium elevation in metres | LOW |
| Meteostat API | Historical June–July temp/humidity | MEDIUM |
| eloratings.net | Team strength pre-tournament | LOW |
| FIFA.com (manual) | 2026 official venue list | LOW |

## 5.2 Technical Assets

```
ANALYSIS LAYER     R 4.3+ · worldfootballR · lme4 · MASS · Quarto
INTERACTIVITY      Shiny · shinyapps.io
DEPLOYMENT         Next.js 14 · TypeScript · Tailwind · Vercel
VERSION CONTROL    Git · GitHub · GitHub Actions CI
REPRODUCIBILITY    renv · Docker (rocker/rstudio)
```

## 5.3 Skill Assets

The mission owner brings a Literature → Data Science background that is a genuine narrative differentiator, not a liability to manage around. Prior delivery of AlignResume (Next.js + Groq, hallucination guardrails) and Future Fit (Prophet + Apriori on real job data) demonstrates the exact full-stack + statistical modelling combination this mission requires.

---

---

# SECTION 6 — CONCEPT OF OPERATIONS: 7 MISSION PHASES

```
PHASE 0           PHASE 1          PHASE 2            PHASE 3
RECONNAISSANCE  → STAGING        → COLLECTION       → FUSION
(Day 1)           (Day 1)          (Days 2–7)         (Day 8)
Lock the spec     Build the        Extract all 8      Join into one
                  environment      sources            master table

PHASE 4           PHASE 5          PHASE 6
ANALYSIS        → ENGAGEMENT     → EXTRACTION
(Days 9–10)       (Days 11–12)     (Days 13–14)
EDA + features    Fire the model   Deploy everything
                   sequence
```

## PHASE 0 — RECONNAISSANCE *(Day 1 · STATUS: COMPLETE)*

**Objective**: Lock research questions, hypotheses, and the schema contract before any data is touched. No exploration happens without a destination.

**Tasks**:
- Define H1–H5 with full statistical formulation
- Lock the unit of analysis (one row = one team × one match)
- Freeze the 28-column schema contract

**Deliverable**: PRD + 5 formal hypotheses + locked schema

**Exit criteria**: Schema contract signed off. Any future change requires a new ADR — this is not bureaucracy, it's what prevents the dataset from drifting mid-sprint.

---

## PHASE 1 — STAGING *(Day 1 · STATUS: COMPLETE)*

**Objective**: Stand up the reproducible environment. Nothing is collected until the environment is locked, because re-running a half-built pipeline against a half-built environment is how silent bugs enter undetected.

**Tasks**:
- `renv::init()` and install all 24 required packages
- Create the canonical folder structure (`data/raw`, `data/interim`, `data/final`, `R/`, `tests/`, `docs/`)
- `git init` + first commit
- Draft the Dockerfile (rocker/rstudio base)

**Deliverable**: `renv.lock` + folder scaffold + initialised GitHub repo

**Exit criteria**: `00_run_all.R` exists (even with empty phase stubs) and `renv::restore()` succeeds on a clean checkout.

---

## PHASE 2 — COLLECTION *(Days 2–7 · STATUS: ACTIVE)*

**Objective**: Extract raw data from all 8 sources without transformation. This is the longest phase and the one most exposed to forces outside our control — API rate limits, scraping blocks, third-party downtime. Cache everything the instant it's retrieved.

**Tasks**:
- Scrape FBref match results 1994–2022 (`Sys.sleep(3)` between every request — non-negotiable)
- Pull StatsBomb xG JSON for 2018 and 2022 only
- Geocode all WC venues via OpenStreetMap/Nominatim
- Query Open-Elevation API for every venue's altitude
- Query Meteostat API for June–July historical climate (Nov–Dec for 2022 Qatar — flag this exception explicitly)
- Download Elo ratings and FIFA rankings as static CSVs

**Deliverable**: 6 interim CSVs — `matches_clean.csv`, `xg_by_half_*.csv`, `venues_geocoded.csv`, `venues_elevation.csv`, `venues_climate.csv`, `team_quality_clean.csv`

**Exit criteria**: All 6 interim files exist with 0% missing values in required columns. Manual elevation cross-check completed and signed off for every venue above 500 metres.

---

## PHASE 3 — FUSION *(Day 8 · STATUS: STANDBY)*

**Objective**: Join all 6 interim sources into the single master table. **This is the highest-risk phase in the entire mission** — silent join failures from team-name mismatches ("West Germany" vs "GER") produce datasets that look complete but are quietly wrong, and that wrongness propagates invisibly into every downstream model.

**Tasks**:
- Normalise every team name via `team_name_lookup.csv`
- Execute sequential `left_join()`s with a row-count assertion (`stopifnot(nrow(master) == 512)`) **after every single join**, not just at the end
- Compute `rest_days` (lag of match date) and `travel_km` (Haversine distance from previous venue)
- Run the full `testthat` data integrity suite

**Deliverable**: `team_match_master.csv` — approximately 512 rows × 28 columns

**Exit criteria**: Row count confirmed correct after every join individually. All `testthat` checks pass green. Goal totals reconcile against known FBref scorelines.

---

## PHASE 4 — ANALYSIS *(Days 9–10 · STATUS: STANDBY)*

**Objective**: Understand the data before any modelling claim is made. Every modelling decision in Phase 5 must trace back to something observed here — never to an assumption.

**Tasks**:
- Render distributions, confound checks (Elo vs h2_delta), and correlation matrices in a Quarto EDA report
- Engineer `log_elevation`, `heat_stress_idx`, and scaled control variables
- Confirm overdispersion in the outcome variable (this justifies Negative Binomial over Poisson — do not skip this check)

**Deliverable**: Rendered Quarto EDA report (HTML) + the engineered analytical dataset

**Exit criteria**: EDA report explicitly answers all 6 EDA questions from the schema contract. The feature set is frozen — no new engineered variables are introduced after this gate.

---

## PHASE 5 — ENGAGEMENT *(Days 11–12 · STATUS: STANDBY)*

**Objective**: Fire the full model sequence, M1 through M5. This phase extracts the actual answer to the mission question — everything before this was preparation, everything after this is packaging.

**Tasks**:
- Fit M1 (baseline) → M2 (quality control) → M3 (full spec) → M4 (GLMM, primary model) → M5 (altitude×heat interaction)
- Run all 4 sensitivity analyses (different threshold, group-stage-only, exclude 2022 Qatar, xG outcome)
- Run diagnostics: VIF for multicollinearity, residual plots, AIC model comparison
- `predict()` the fitted model onto 2026 venue conditions to generate risk scores

**Deliverable**: 5 fitted model objects + coefficient tables + 2026 venue risk scores

**Exit criteria**: The primary model (M4) converges without warnings. At least one of H1–H5 is significant at p < 0.05. All sensitivity checks confirm the core finding is robust, not an artefact of one modelling choice.

---

## PHASE 6 — EXTRACTION *(Days 13–14 · STATUS: STANDBY)*

**Objective**: Package every output for public consumption and portfolio defence. A finding that exists only in an R console is a finding that doesn't exist for a hiring manager.

**Tasks**:
- Export 6 publication-quality charts (300 DPI PNG)
- Deploy the Shiny dashboard to shinyapps.io
- Deploy the Next.js website to Vercel
- Publish README, all 6 ADRs, and the LinkedIn launch post

**Deliverable**: Live Vercel site + live Shiny dashboard + public GitHub repository + rendered Quarto report

**Exit criteria**: All four URLs resolve publicly. The GitHub README is readable and convincing to a stranger within three minutes.

---

---

# SECTION 7 — RISK REGISTER

Ten risks, ranked by score (likelihood × impact, each 1–5):

| ID | Risk | L | I | Score | Phase | Mitigation |
|---|---|---|---|---|---|---|
| **R2** | Silent NA rows from team-name mismatch in joins | 4 | 5 | **20** | Fusion | Name lookup table built up front; row-count assertion after *every* join, not just the final one |
| **R7** | Model overfitting / spurious significance | 2 | 5 | **10** | Engagement | All 4 sensitivity analyses run before any result is reported; random intercept avoids pseudo-replication |
| **R5** | Low statistical power — too few high-altitude matches | 4 | 4 | **16** | Analysis | Extend robustness sample to 1974–2022; report confidence intervals, not just p-values |
| **R1** | FBref rate-limit / IP block during scraping | 4 | 3 | **12** | Collection | Mandatory `Sys.sleep(3)`; cache every tournament year immediately; budget 45 minutes |
| **R6** | 14-day timeline overrun | 3 | 4 | **12** | All | Minimum Viable Scope pre-defined: drop the StatsBomb xG sub-study first if behind by Day 9 |
| **R3** | Meteostat API key issues / 2022 Qatar date anomaly | 3 | 3 | **9** | Collection | Key stored in `.Renviron`; explicit Nov–Dec override hardcoded for 2022 |
| **R8** | Scope creep (player tracking, injury data, etc.) | 3 | 3 | **9** | All | Locked Phase 0 schema contract; new variables require a new ADR before entering the pipeline |
| **R10** | Vercel / shinyapps.io deployment failure | 2 | 3 | **6** | Extraction | Local build test before every push; staging app name before promoting to production |
| **R4** | Open-Elevation inaccuracy in dense urban terrain | 2 | 2 | **4** | Collection | Manual cross-check against Wikipedia for every venue above 500m |
| **R9** | StatsBomb 300MB download / parse memory load | 2 | 2 | **4** | Collection | `Parallel=TRUE`; extract only shot/xG fields, discard full event object immediately |

## 7.1 The Two Risks That Matter Most

**R2 (score 20)** is the single highest-priority risk in this entire mission. A join that silently drops or duplicates rows produces a dataset that *looks* fine — same column names, plausible row count — but is quietly corrupted. The mitigation is procedural discipline: assert the row count after every individual join, not as a single check at the end of Phase 3.

**R5 (score 16)** is a structural limitation, not an engineering bug. If only 15–20 matches in the dataset were played above 1,000m, no amount of careful modelling manufactures statistical power that doesn't exist. The honest response is to report this limitation explicitly rather than to overstate confidence in a thin sample.

---

---

# SECTION 8 — DECISION GATES (GO / NO-GO)

Five checkpoints. Do not proceed past a gate until every listed criterion is satisfied.

### GATE 1 — Staging → Collection
- `renv::restore()` succeeds on a clean checkout
- `00_run_all.R` sources without error, even with empty phase stubs
- GitHub repository has its first commit

**NO-GO ACTION**: If `renv` fails to restore, fix dependency conflicts before writing a single Collection script. Every later script assumes a working environment.

### GATE 2 — Collection → Fusion
- All 6 interim CSVs exist on disk
- 0% missing values in `elevation_m` and goal columns
- Manual elevation cross-check signed off for every venue above 500m

**NO-GO ACTION**: If any interim file has incomplete required columns, do not begin joins. A join against incomplete data produces errors that are effectively undetectable downstream.

### GATE 3 — Fusion → Analysis
- `nrow(master) == 512` (±tolerance for the 1994 52-game tournament format)
- `testthat::test_dir("tests/")` returns zero failures
- Goal totals reconcile exactly against known FBref scorelines

**NO-GO ACTION**: If the row count is wrong, stop immediately. Do not patch with manual row deletion — find and fix the actual join key mismatch.

### GATE 4 — Analysis → Engagement
- EDA confirms overdispersion in the outcome variable (justifies Negative Binomial)
- Feature set is frozen — no new engineered variables permitted after this gate
- Confound checks (Elo vs h2_delta) are documented in the EDA report

**NO-GO ACTION**: If overdispersion is not confirmed, revisit the model family choice before proceeding. Do not default to Negative Binomial without the EDA evidence to justify it.

### GATE 5 — Engagement → Extraction
- The primary model (M4) converges without warnings
- At least one of H1–H5 is significant at p < 0.05
- All 4 sensitivity analyses are completed and documented

**NO-GO ACTION**: If the model fails to converge, simplify the random effects structure before adding additional fixed effects — do not fight convergence by adding complexity.

---

---

# SECTION 9 — COMMAND & CONTROL

## 9.1 Reporting Rhythm

```
DAILY:    One commit minimum, with a conventional commit message
          (e.g. "data(fbref): scrape match data 1994-2022")

END OF EACH PHASE:  A short written note in docs/phase_log.md —
                     what was done, what broke, what the next
                     phase needs to know

GATE CHECKPOINTS:    Explicit go/no-go decision recorded before
                     starting the next phase
```

## 9.2 File & Commit Discipline

- Never edit files in `data/raw/` — if a source needs re-pulling, re-run the extraction script
- Every script is numbered and does exactly one thing (Phase 2 scripts only extract, never transform)
- Commit messages follow the convention: `data(source): action`, `feat(component): action`, `fix(issue): action`, `model(stage): action`

## 9.3 Escalation Path (When Something Breaks)

```
1. Is this a known risk (R1–R10)?
   → Yes: apply the documented mitigation immediately
   → No: log it as a new risk before attempting a fix

2. Does the fix require changing the locked schema contract?
   → Yes: write a one-paragraph ADR before changing anything
   → No: proceed with the fix and note it in the phase log

3. Will the fix consume more than 2 hours?
   → Yes: invoke the Minimum Viable Scope fallback (R6 mitigation)
   → No: proceed
```

---

---

# SECTION 10 — INTELLIGENCE REQUIREMENTS

Information that must be confirmed before the next phase can responsibly begin:

| Before Phase | Must Know |
|---|---|
| Fusion | Are there any unmapped team names after applying the lookup table? |
| Analysis | Is the outcome variable overdispersed? What does the confound check between Elo and h2_delta show? |
| Engagement | Does the EDA show a linear, threshold, or curved relationship between elevation and h2_delta? |
| Extraction | Did the sensitivity analyses change the *direction* of any coefficient, or only its magnitude? |

If any of these questions cannot be answered confidently, that is itself a signal to pause rather than proceed.

---

---

# SECTION 11 — SUSTAINMENT (TOOLING & ENVIRONMENT)

```
DEPENDENCY MANAGEMENT   renv::snapshot() after installing any new package;
                         renv.lock committed to Git every time it changes

CONTAINERISATION         Dockerfile based on rocker/rstudio:4.3.0,
                         rebuilt and tested before Phase 6

SECRETS                  METEOSTAT_KEY and Kaggle credentials live only
                         in .Renviron — never committed, .gitignore'd

CI                       GitHub Actions runs testthat + lintr on every push
                         to catch regressions before they reach main
```

---

---

# SECTION 12 — COMMUNICATIONS PLAN

| Channel | Purpose | Timing |
|---|---|---|
| GitHub README | Primary technical credibility artefact | Updated continuously, finalised Day 14 |
| Quarto Report | Full methodological transparency | Rendered end of Phase 5, polished Phase 6 |
| LinkedIn Post | Recruiter/network visibility | Day 14, after all 4 deployment URLs are live |
| Shiny Dashboard | Interactive credibility for technical reviewers | Deployed Day 13 |

---

---

# SECTION 13 — DEFINITION OF VICTORY

This mission is won if, by Day 14:

1. ✅ `team_match_master.csv` exists, passes all integrity tests, and is reproducible from a clean checkout via `00_run_all.R`
2. ✅ At least one hypothesis among H1–H5 is supported with p < 0.05 and the finding survives all 4 sensitivity analyses
3. ✅ A 2026 venue risk ranking exists and passes a basic face-validity check (Mexico City and Denver rank among the highest-risk venues)
4. ✅ The GitHub repository, Quarto report, Shiny dashboard, and Next.js website are all live and publicly accessible
5. ✅ A stranger with no statistics background can read the README and understand the headline finding within three minutes

If objectives 1–3 are met but 4–5 are not, the mission is a **partial success** — the analytical core succeeded but the packaging did not, and Phase 6 becomes a fast-follow rather than a failure.

If objective 1 is not met, the mission has failed at its foundation, and the appropriate response is to invoke the Minimum Viable Scope fallback and re-scope rather than to abandon the project.

---

---

# SECTION 14 — CONTINGENCY PLANS (PLAN B)

| If This Happens | Then Do This |
|---|---|
| FBref blocks scraping entirely | Switch fully to Kaggle CSV datasets; accept loss of some xG/advanced stats granularity |
| Statistical power for H1 is too low even at 1974–2022 scope | Reframe as a descriptive effect-size finding; state the power limitation explicitly in the report rather than overclaiming significance |
| Day 9 arrives and Collection/Fusion are incomplete | Drop the StatsBomb xG sub-study; proceed with goals-only outcomes for the remaining phases |
| Vercel deployment fails repeatedly | Fall back to GitHub Pages for the Next.js static export |
| Shiny free tier runs out of hours | Provide a recorded screen-capture demo video embedded on the website instead of a live app |
| Model fails to converge even after simplification | Drop the random intercept and use a fixed `wc_year` effect instead, documenting the trade-off in ADR-04 |

---

---

# SECTION 15 — AFTER-ACTION REVIEW TEMPLATE

To be completed at the end of Day 14, regardless of outcome:

```
1. Which objectives were achieved? (Primary / Secondary / Stretch)
2. Which risks in the register actually materialised?
3. Were the mitigations effective, or did contingencies have to be invoked?
4. What would the schema contract change if this mission were repeated?
5. What is the single highest-value addition for a "Season 2" of this project?
```

---

---

# APPENDIX A — QUICK REFERENCE CARD

```
MISSION STATEMENT
  Does altitude/heat measurably affect 2nd-half WC performance?

PRIMARY MODEL
  glmer.nb(goals_against_2h ~ log_elevation + avg_temp_c +
           elo_diff_scaled + is_altitude_team + rest_days_clean +
           log_travel_km + (1 | wc_year))

ALTITUDE THRESHOLD
  1,000m (binary flag) · log_elevation (continuous, primary model input)

HIGHEST-RISK STEP
  Phase 3 Fusion — team name mismatches → silent join corruption

CRITICAL VALIDATION
  stopifnot(nrow(master) == 512) after EVERY join, not just the last one

MINIMUM VIABLE SCOPE (if behind schedule)
  Drop StatsBomb xG sub-study first → proceed with goals-only outcomes
```

---

# APPENDIX B — EMERGENCY FALLBACK DATA SOURCES

| Primary Source Fails | Fallback |
|---|---|
| FBref scraping blocked | Kaggle `evangower/fifa-world-cup` |
| Meteostat API exhausted | NOAA GHCN-Daily archive |
| Open-Elevation inaccurate | Google Elevation API (manual spot-check) |
| Vercel deployment blocked | GitHub Pages static export |
| Shiny free tier exhausted | Recorded demo video on website |

---

*Mission Plan v1.0 · Operation Altitude Shield · Status: Approved — Phase 2 Active*
*Next Review: Gate 2 (Collection → Fusion), end of Day 7*
