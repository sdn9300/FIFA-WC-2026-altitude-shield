# 🧩 EDGE CASE PLAN
## Altitude & Heat Adaptation in FIFA World Cups
### Every Way This Pipeline Can Quietly Produce a Wrong Answer — Catalogued and Handled

---

## DOCUMENT CONTROL

| Field | Value |
|---|---|
| **Document Type** | Edge Case Plan (failure-mode catalogue + handling strategy) |
| **Companion Documents** | Mission Plan v1.0 · Architecture Design Document v1.0 · Implementation Plan v1.0 · Evaluation Plan v1.0 |
| **Total Catalogued Cases** | 37 |
| **Severity Distribution** | 9 Critical · 9 High · 11 Medium · 8 Low |
| **Status** | Approved — referenced during every ETL and modelling phase |

---

---

# SECTION 1 — WHY EDGE CASES GET THEIR OWN DOCUMENT

The Risk Register in the Mission Plan covers project-level threats — things that could derail the *schedule* or the *mission*. This document operates at a different altitude entirely: it catalogues the specific, granular ways the *data and code* can be technically correct in the common case and silently wrong in an uncommon one.

The danger with edge cases is precisely that they are uncommon. A bug that fires on every row gets caught on the first test run. A bug that fires on 3 rows out of 512 — one own goal, one stoppage-time goal, one defunct nation — passes every casual inspection and survives all the way into a published finding, where it is far more expensive to find and far more damaging to credibility.

This document exists so that every edge case is handled **by design**, not discovered by accident.

---

---

# SECTION 2 — CATALOGUE STRUCTURE

Each edge case below follows the same five-part structure:

```
ID         A stable reference code (EC-01 through EC-37)
SEVERITY   CRITICAL / HIGH / MEDIUM / LOW
WHAT       The specific scenario that breaks the naive implementation
WHY        The downstream consequence if unhandled
HANDLING   The concrete code-level or procedural fix
```

**Severity definitions**:
- **CRITICAL** — silently corrupts the primary outcome variable or the central finding; must be fixed before Phase 06 (Master Join) is considered complete
- **HIGH** — corrupts a control variable or a secondary analysis; must be fixed before Phase 07 (Modelling) begins
- **MEDIUM** — produces a documented limitation rather than a silent error if left unhandled, but a fix is preferred
- **LOW** — affects a small number of historical rows or a stretch objective; acceptable to document as a known limitation rather than engineer a fix

---

---

# SECTION 3 — MATCH & GOAL DATA EDGE CASES

## EC-01 — Stoppage-Time Goal Misclassification *(CRITICAL)*

**What**: FBref notates stoppage-time goals as `"45+2"` or `"90+3"`. A naive regex like `str_extract(x, "\\d+")` captures the **first** number it finds, which depending on string construction could return the stoppage offset (`2`) instead of the base minute (`45`).

**Why**: A goal scored in actual minute 47 (45+2) gets misclassified as minute 2 — moving it from the 2nd half into the 1st half. Across a full dataset, this systematically under-counts genuine 2nd-half goals, biasing the central outcome variable toward the null.

**Handling**:
```r
# WRONG: captures whichever number regex finds first
minute_wrong <- as.integer(str_extract(goal_time, "\\d+"))

# CORRECT: explicitly split on "+" and take the base minute
parse_minute <- function(goal_time) {
  base <- str_extract(goal_time, "^\\d+")  # everything before any "+"
  as.integer(base)
}
# "45+2" → 45 (correctly still 1st half)
# "90+3" → 90 (correctly still 2nd half, or extra time depending on context)
```

Write a `testthat` unit test asserting `parse_minute("45+2") == 45` and `parse_minute("90+3") == 90` before this function ever touches real data.

---

## EC-02 — Own Goals Attributed to the Wrong Team *(HIGH)*

**What**: FBref marks own goals with an `"(OG)"` suffix. The goal is listed under the scoring sequence of the team that benefits, but a careless parser that simply maps "listed team" → "goals_for" will get this backwards for an own goal, where the team *causing* the own goal is who should be charged defensively.

**Why**: Misattributing even a handful of own goals shifts both teams' `goals_for`/`goals_against` tallies in a match-altering way for those specific rows.

**Handling**: Add an explicit parsing branch — if the goal annotation contains `"(OG)"`, flip the for/against assignment relative to the naive mapping before aggregating into half-by-half sums.

---

## EC-03 — Extra-Time Goals Counted as "2nd Half" *(CRITICAL)*

**What**: Knockout matches that go to extra time produce goals in minutes 91–120. These are neither "1st half" nor "2nd half" in the same physiological sense as goals scored in regular time — a team playing extra time has already endured 90 minutes of fatigue before this period even begins.

**Why**: Pooling extra-time goals into `goals_against_2h` contaminates the outcome variable with a fundamentally different fatigue regime, weakening the precision of the altitude/heat signal.

**Handling**: Create a distinct `goals_against_et` bucket, separate from `goals_against_2h`. The primary model uses regular-time goals only; the group-stage-only sensitivity analysis (which by construction has no extra time) serves as an additional clean check.

---

## EC-04 — Penalty Shootout Goals Leaking Into Counts *(CRITICAL)*

**What**: Penalty shootouts are scored in a structurally separate part of the match report. A scraper that doesn't explicitly scope its target table can accidentally merge shootout "goals" into the regular-time goal count.

**Why**: A shootout score of 4–2 is not a football outcome in the sense this study measures — it has nothing to do with altitude or heat fatigue during 90 minutes of play. Including it would badly distort any match it touches.

**Handling**: Scope the scraper explicitly to the in-game `"Score"` table and never touch the `"Penalty Shootout"` table for outcome variables. Add a unit test using a known penalty-shootout match (e.g., 2022 Final) confirming the parsed `goals_against_2h` matches the 90-minute scoreline, not the shootout result.

---

## EC-05 — 0–0 Draws Break the Proportion Metric *(MEDIUM)*

**What**: `prop_goals_2h = goals_against_2h / total_goals` divides by zero whenever a match ends scoreless.

**Why**: An unguarded division produces `NaN`, which silently propagates through downstream `mean()` calls (returning `NA` for the whole column unless `na.rm=TRUE` is remembered everywhere) or, worse, gets coerced into `0` by careless cleanup code, falsely implying "no 2nd-half goals conceded" when the truth is "no goals at all."

**Handling**:
```r
master <- master %>%
  mutate(prop_goals_2h = if_else(
    (goals_against_1h + goals_against_2h) > 0,
    goals_against_2h / (goals_against_1h + goals_against_2h),
    NA_real_
  ))
```

---

## EC-06 — Historical Replayed Knockout Matches *(LOW)*

**What**: A small number of pre-1970 tournament knockout matches that ended tied were fully replayed rather than decided by extra time or penalties.

**Handling**: Treat the replay as canonical; document the original tied match as deliberately excluded in the data dictionary, with a one-line rationale. Affects fewer than five matches across the entire historical record — not worth more elaborate handling.

---

## EC-07 — FBref Table Layout Differs Across Eras *(MEDIUM)*

**What**: Pre-1990 tournament pages use a noticeably different HTML structure than 2010-onward pages.

**Handling**: Write year-conditional branches in the scraper. Validate against one known year from each structural era (e.g., 1994 and 2018) before committing to a full historical pull — never assume one parser works for all 8 tournament years untested.

---

---

# SECTION 4 — VENUE & CLIMATE EDGE CASES

## EC-08 — Indoor/Climate-Controlled Stadiums Invalidate Ambient Heat Data *(CRITICAL)*

**What**: Several World Cup venues are not simply "outdoors at the listed coordinates." Lusail Stadium (2022) used advanced cooling technology. AT&T Stadium and Mercedes-Benz Stadium (both confirmed 2026 venues) have retractable roofs frequently closed during events. SoFi Stadium has a translucent canopy reducing direct solar exposure. None of these match the assumption that ambient outdoor weather equals pitch-level conditions.

**Why**: This is arguably the single most consequential edge case in the entire dataset for hypothesis H2 (heat stress). A climate-controlled venue assigned the city's outdoor June temperature will appear to be a "hot venue" in the dataset while the players actually experienced a regulated, far milder environment. Left unhandled, this dilutes — or in the worst case, completely masks — a true heat effect by averaging real heat-stressed matches together with falsely-labelled "hot" matches that were never actually hot on the pitch.

**Handling**:
```r
venues <- venues %>%
  mutate(is_climate_controlled = venue_stadium %in% c(
    "Lusail Stadium", "AT&T Stadium", "Mercedes-Benz Stadium", "SoFi Stadium"
    # Extend this list as additional retractable-roof venues are confirmed for 2026
  ))

# Run H2 testing BOTH ways and report both results:
m_with_indoor    <- glmer.nb(... , data = master)
m_excl_indoor    <- glmer.nb(... , data = filter(master, !is_climate_controlled))
```

Report the comparison explicitly in the EDA and the final write-up — this is not a detail to bury in a footnote.

---

## EC-09 — Day vs Night Kickoff Temperature Mismatch *(HIGH)*

**What**: Meteostat's daily summary returns a single average temperature for the whole day. A 9pm kickoff in 22°C evening air and a 1pm kickoff in 38°C midday sun on the *same date* in the *same city* receive an identical `avg_temp_c` value under the naive daily-average approach.

**Why**: This is a measurement-error problem that adds noise to the heat hypothesis test, potentially weakening a true effect rather than creating a false one — but it should be acknowledged, not ignored.

**Handling**: Where Meteostat's hourly endpoint is available, pull the temperature reading closest to actual kickoff time (available from FBref match metadata) rather than the daily mean. Where hourly data is unavailable for a given historical match, retain the daily average but flag the row with `temp_data_resolution = "daily"` versus `"hourly"`, and report this measurement limitation explicitly in the final write-up.

---

## EC-12 — 2022 Qatar Ran November–December, Not June–July *(CRITICAL)*

**What**: Every other World Cup in the study window was played in its traditional June–July slot. Qatar 2022 was moved to November–December due to the regional summer heat — ironically, the one edition most relevant to a heat-stress study and the one most likely to be mishandled by a hardcoded month assumption.

**Handling**:
```r
wc_climate_months <- list(
  "2002" = c(5, 6),   "2006" = c(6, 7),  "2010" = c(6, 7),
  "2014" = c(6, 7),   "2018" = c(6, 7),  "2022" = c(11, 12)  # ← the exception
)
months_for_year <- wc_climate_months[[as.character(wc_year)]]
```

This lookup table must be referenced explicitly, not inferred from a "all WCs are June–July" assumption baked into a generic helper function.

---

## EC-10 — City Name Geocoding Ambiguity *(MEDIUM)*

**What**: "Guadalajara" resolves to locations in both Mexico and Spain. "Toledo" resolves to both Ohio, USA and Spain. A geocoder given an ambiguous string can silently return coordinates on the wrong continent.

**Handling**: Always geocode the full `"stadium name, city, country"` string, never city alone. After geocoding, programmatically verify the returned country code matches the expected country before accepting the coordinate.

---

## EC-11 — SRTM Satellite Elevation Resolution Error *(LOW)*

**What**: Open-Elevation's underlying SRTM data has roughly 90-metre horizontal resolution — sufficient for mountain ranges, imprecise for pinpointing a single stadium's exact elevation within a dense urban grid.

**Handling**: Manually cross-check every API-returned elevation above 500m against an independent source (Wikipedia, official stadium specifications) before accepting it into the master table.

---

## EC-13 — Multiple Stadiums in the Same Host City *(LOW)*

**What**: Joining venue data on city name alone can attach the wrong elevation when a city has hosted World Cup matches at more than one stadium across different tournament editions.

**Handling**: Always join on `(venue_stadium, wc_year)`, never on city name alone, even though within-city elevation differences are usually negligible.

---

## EC-14 — Stadium Renamed Between Tournaments *(MEDIUM)*

**What**: Sponsorship-driven stadium renamings mean the same physical venue can appear under different display names across different tournament years' source data, breaking a naive string-match join.

**Handling**: Maintain a `canonical_venue_id` independent of the display name, with an alias mapping table (`data/manual/venue_aliases.csv`) built once and referenced by every join.

---

---

# SECTION 5 — TEAM IDENTITY & STRENGTH EDGE CASES

## EC-15 — Defunct Nations Break Every Join *(CRITICAL)*

**What**: "West Germany," "Soviet Union," "Yugoslavia," and "Czechoslovakia" all appear in historical match data but have no current Elo rating or FIFA ranking record under those exact names — those organisations no longer exist in the modern data sources.

**Why**: Without normalisation, every row for these historical teams silently fails the Elo and FIFA-rank joins, producing NA team-quality controls for a non-trivial slice of the dataset — and because the failure is silent (a `LEFT JOIN` just produces `NA`, not an error), it is easy to miss entirely.

**Handling**:
```r
# data/manual/team_name_lookup.csv
# historical_name      , canonical_code
# West Germany          , GER
# Soviet Union          , RUS   (or URS if treating as historically distinct — pick one, document the choice)
# Yugoslavia            , SRB   (or YUG — same documentation requirement)
# Czechoslovakia        , CZE

master <- master %>%
  left_join(team_name_lookup, by = c("team" = "historical_name")) %>%
  mutate(team = coalesce(canonical_code, team))
```

Apply this normalisation **before** any join to Elo or FIFA ranking data — never after.

---

## EC-16 — First-Time Qualifiers With No Elo History *(MEDIUM)*

**What**: A nation appearing in its first-ever World Cup has no prior international match history from which to compute a meaningful Elo rating.

**Handling**: Impute using the confederation-average Elo for that nation's region and era, with an `is_imputed_elo` flag added so this approximation is traceable and excludable in a sensitivity check if needed.

---

## EC-17 — FIFA-Suspended or Banned Teams *(LOW)*

**What**: Russia's 2022 suspension, South Africa's apartheid-era exclusion, and similar bans mean certain nation-years are legitimately and correctly absent from the dataset — this is not a data quality defect.

**Handling**: No fix required. Document explicitly in the data dictionary so a reviewer doesn't mistake a correct absence for a pipeline failure.

---

## EC-18 — Co-Host Nations Qualify Automatically *(MEDIUM)*

**What**: Host nations skip the qualifying tournament entirely, meaning their pre-tournament form is potentially less battle-tested than a team that fought through a full qualifying campaign.

**Handling**: Add an `is_host` covariate. Check whether host status independently predicts performance before attributing any observed pattern solely to environmental factors.

---

## EC-19 — Mid-Tournament Managerial Change *(LOW)*

**What**: A coaching change between a team's matches within the same tournament is not reflected in a single static pre-tournament Elo rating.

**Handling**: Accepted limitation — document in the final report rather than attempting dynamic in-tournament Elo updates, which is explicitly out of scope per the Phase 0 schema contract.

---

---

# SECTION 6 — REST, TRAVEL & MODELLING EDGE CASES

## EC-20 — First Match of Tournament Has No Rest-Days Reference *(CRITICAL)*

**What**: There is no "previous match" to subtract a date from for any team's tournament opener.

**Handling**: Use `-1` as an explicit, documented sentinel — never a true `NA`, which could be silently dropped by a careless `na.rm=TRUE` aggregation and bias the rest-days distribution.

---

## EC-21 — Qatar 2022's Geographically Compressed Venues *(MEDIUM)*

**What**: All eight 2022 venues sit within roughly 60km of each other, collapsing `travel_km` to near-zero for the entire tournament — a structural anomaly, not a finding about travel fatigue.

**Handling**: Run a sensitivity analysis excluding 2022 entirely (already planned as SA3 in the Implementation Plan) to confirm the core finding does not depend on this single, atypical edition.

---

## EC-23 — Singular Fit / Convergence Failure in the GLMM *(HIGH)*

**What**: With only 6–8 distinct `wc_year` levels, `lme4` can return a "singular fit" warning, indicating the random-intercept variance estimate is unstable or pushed to a boundary value.

**Handling**: If singular, first try simplifying the random-effects structure. If the warning persists, document the trade-off explicitly in ADR-04 and fall back to a fixed `wc_year` effect, acknowledging the loss of partial pooling this entails.

---

## EC-24 — Elevation and Temperature Are Negatively Correlated *(HIGH)*

**What**: Mexico City (2,240m) is high-altitude but climatically mild. Gulf-region venues are low-altitude but extremely hot. This near-orthogonality between the two stressors threatens the stability of the `elevation × temperature` interaction term in Model M5.

**Handling**: Check VIF specifically on the interaction term, not just the main effects. If unstable, report the main effects of altitude and heat separately and treat the interaction model as exploratory rather than confirmatory — say so explicitly rather than overstating confidence in H3.

---

## EC-25 — Outlier Blowout Matches Skew the Negative Binomial Fit *(MEDIUM)*

**What**: A 7–1 scoreline carries disproportionate statistical leverage in a count model fit on roughly 512 observations.

**Handling**: Run a sensitivity check excluding matches above the 97.5th percentile of total goals scored; confirm the altitude/heat coefficient's direction is unchanged with and without these outliers included.

---

## EC-26 — Same Two Teams Meeting Twice in One Tournament *(LOW)*

**What**: Extremely rare, but a group-stage meeting followed by a later knockout-stage rematch between identical opponents could violate a naive uniqueness assumption.

**Handling**: Always construct `match_id` to include the match date, never just the team pair — this guarantees uniqueness even in the rematch scenario.

---

---

# SECTION 7 — PIPELINE & ENGINEERING EDGE CASES

## EC-27 — API Timeout or Null Response Mid-Pipeline *(HIGH)*

**What**: Open-Elevation or Meteostat can occasionally return a 503 error or an empty response body for an otherwise valid coordinate.

**Handling**: Wrap every API call in `tryCatch()`. On failure, log the specific failing key `(lat, lon)` or `(venue, date)` to an explicit retry queue file — never silently insert `NA` and continue without a trace of what failed and why.

---

## EC-28 — FBref IP Block Mid-Scrape *(CRITICAL)*

**What**: A scrape interrupted partway through (e.g., blocked after completing 5 of 8 tournament years) should never force a full restart from year one.

**Handling**: Checkpoint to disk immediately after each tournament year completes. On any re-run, check for an existing cache file per year and skip years already successfully retrieved.

---

## EC-29 — Encoding Issues in Accented Names *(MEDIUM)*

**What**: "Côte d'Ivoire" and "São Paulo" can silently corrupt into mangled characters if file I/O does not explicitly enforce UTF-8 throughout the pipeline.

**Handling**: Force `encoding = "UTF-8"` explicitly on every `readr::read_csv()` and `write_csv()` call. Never rely on the operating system's default locale, which varies across development machines and CI runners.

---

## EC-30 — Kaggle Dataset Silently Updated Post-Download *(LOW)*

**What**: A dataset maintainer pushing a revision after the initial download could change row counts, column names, or values mid-project without any visible warning.

**Handling**: Record the exact dataset version and download date in the data dictionary. Never re-download a Kaggle source mid-sprint without explicitly re-validating the schema against what the pipeline expects.

---

## EC-31 — StatsBomb JSON Schema Differs 2018 vs 2022 *(MEDIUM)*

**What**: Minor field-naming inconsistencies exist between StatsBomb's 2018 and 2022 World Cup open-data exports.

**Handling**: Write a version-aware parsing branch and unit-test it against one known match from each tournament year before running the full xG extraction.

---

## EC-32 — Non-Idempotent Scrape Creates Duplicate Cache Rows *(MEDIUM)*

**What**: Re-running a scraping script without a check-before-write guard can silently append duplicate rows to an already-existing cache file.

**Handling**: Always check `if (file.exists(cache_path))`, read and deduplicate before writing — or write to a fresh temp file and atomically replace the original, never append blindly.

---

---

# SECTION 8 — 2026 EXTRAPOLATION RISKS

## EC-33 — 48-Team, 104-Match Format Is Structurally Unseen *(CRITICAL)*

**What**: Every model in this project is trained exclusively on the historical 32-team, 64-match tournament structure. The 2026 World Cup expands to 48 teams and 104 matches — a structural change, not merely a scale change.

**Handling**: State this extrapolation risk explicitly and prominently in both the Quarto report and the website's 2026 section. The risk rankings are projections under the assumption that environmental physiology effects generalise across tournament formats — a reasonable assumption, but an assumption nonetheless, and it must be named as such rather than buried.

---

## EC-34 — New "Round of 32" Stage Is an Unseen Factor Level *(HIGH)*

**What**: R's `predict()` function will error, or silently misbehave, when a categorical predictor encounters a factor level absent from the training data — and 2026 introduces a Round of 32 knockout stage that did not exist in any historical tournament in the dataset.

**Handling**: Map the new Round of 32 stage to its nearest structural equivalent (historically, Round of 16) purely for the purpose of generating a prediction, and document this mapping explicitly as a modelling choice rather than letting it pass unremarked.

---

## EC-35 — 2026 Indoor Stadiums Need the Same Flag as EC-08 *(CRITICAL)*

**What**: AT&T Stadium, Mercedes-Benz Stadium, and SoFi Stadium are all confirmed 2026 venues where naively applying outdoor ambient weather data would misrepresent actual pitch-level conditions — the same failure mode as EC-08, applied prospectively.

**Handling**: Apply the `is_climate_controlled` flag to the 2026 venue table before generating any risk score. Either exclude these venues from the heat-risk ranking entirely, or annotate them explicitly as "climate-controlled — realised risk likely lower than ambient data alone would suggest."

---

## EC-36 — Three Co-Host Nations Auto-Qualify for 2026 *(LOW)*

**What**: USA, Canada, and Mexico all qualify automatically as 2026 hosts — the same structural pattern already flagged in EC-18, now applied prospectively to the 2026 predictions.

**Handling**: Apply the same `is_host` covariate logic established in EC-18; no additional handling is required.

---

## EC-37 — Several 2026 Cities Have No World Cup Historical Record *(LOW)*

**What**: Cities such as Kansas City or Atlanta have never hosted a World Cup match, unlike Mexico City or Johannesburg, which carry decades of historical context.

**Handling**: No fix required — elevation and climate data are independently obtainable for any city regardless of its World Cup history. The model requires venue-level environmental data, not a history of prior World Cup attendance at that specific location.

---

---

# SECTION 9 — SEVERITY SUMMARY & PRIORITISATION

| Severity | Count | Must Resolve Before |
|---|---|---|
| **CRITICAL** | 9 | Phase 06 (Master Join) sign-off |
| **HIGH** | 9 | Phase 07 (Modelling) begins |
| **MEDIUM** | 11 | Final report — documented if not fully resolved |
| **LOW** | 8 | Acceptable as documented limitations |

## The Nine Critical Cases, At a Glance

```
EC-01  Stoppage-time goal misclassification         → regex fix before any parsing
EC-03  Extra-time goals miscounted as 2nd half       → separate ET bucket
EC-04  Penalty shootout goals leaking into counts    → scrape table scoping
EC-08  Indoor stadiums invalidate heat data          → is_climate_controlled flag
EC-12  2022 Qatar wrong season weather               → explicit month lookup table
EC-15  Defunct nations break joins                   → team_name_lookup.csv, applied first
EC-20  First-match rest_days has no reference         → -1 sentinel, documented
EC-28  FBref IP block mid-scrape                      → per-year checkpointing
EC-33  48-team 2026 format is structurally unseen     → explicit extrapolation caveat
```

These nine are the cases worth re-reading before starting Phase 01 of the Implementation Plan — every one of them, left unhandled, produces a result that *looks* fine and *is* wrong.

---

*Edge Case Plan v1.0 · Altitude & Heat Adaptation in FIFA World Cups*
*Status: Approved — referenced continuously through Phases 01–08*
