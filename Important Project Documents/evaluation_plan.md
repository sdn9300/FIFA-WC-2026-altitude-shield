# 📋 EVALUATION PLAN
## Altitude & Heat Adaptation in FIFA World Cups
### A Five-Dimension Framework for Judging Whether This Project Actually Succeeded

---

## DOCUMENT CONTROL

| Field | Value |
|---|---|
| **Document Type** | Evaluation Plan (quality assurance + success measurement framework) |
| **Companion Documents** | Mission Plan v1.0 · Architecture Design Document v1.0 · Phase-Wise Implementation Plan v1.0 |
| **Evaluation Cadence** | Continuous (at every phase gate) + Summative (Day 14) |
| **Scoring Model** | 5 weighted dimensions, 0–100 composite score |
| **Status** | Approved — applies from Phase 00 onward |

---

---

# SECTION 1 — EVALUATION PHILOSOPHY

## 1.1 Why a Dedicated Evaluation Plan Exists

"It ran without errors" is the weakest possible bar for a data science project, and it is not the bar this plan uses. A pipeline can execute cleanly from end to end and still produce a finding that is statistically meaningless, a website that nobody can navigate, or a GitHub repository that a recruiter abandons after ten seconds. Evaluation has to be deliberate, multi-dimensional, and scheduled — not an afterthought performed once on Day 14 when it is too late to fix what's broken.

This plan treats evaluation as **five separate questions**, each with its own evidence, its own checks, and its own weight in the final judgement:

```
1. Is the DATA trustworthy?
2. Is the STATISTICAL FINDING defensible?
3. Is the ENGINEERING sound and reproducible?
4. Is the PRODUCT usable and live?
5. Can a STRANGER understand and believe it?
```

A project can fail on any one of these axes even while succeeding on the other four. A beautiful website built on a corrupted join is not a success. A statistically airtight model that nobody can access because the deployment failed is not a success either.

## 1.2 Evaluation Is Continuous, Not Terminal

Every gate defined in the Mission Plan (Section 8) and every phase exit criterion in the Implementation Plan corresponds to a partial evaluation. This document does not introduce new checkpoints — it defines the **standard against which those checkpoints are judged** and adds the one evaluation that only makes sense at the very end: the composite, weighted, whole-project score.

---

---

# SECTION 2 — THE FIVE EVALUATION DIMENSIONS

| Dimension | Weight | Core Question |
|---|---|---|
| **1. Data Quality & Integrity** | 20% | Can every number in the master table be trusted? |
| **2. Statistical Validity & Rigor** | 30% | Is the central finding actually true, or did we get lucky? |
| **3. Software Engineering Quality** | 20% | Could someone else run this and get the same answer? |
| **4. Product & Deployment Quality** | 15% | Can anyone actually use what was built? |
| **5. Communication & Portfolio Quality** | 15% | Does anyone outside this project understand or care? |

**Why Statistical Validity carries the most weight (30%)**: this project's entire value proposition is a defensible empirical claim about altitude and heat effects. Every other dimension — clean data, working code, a deployed website — exists in service of that claim. A project with perfect engineering and a statistically meaningless finding has produced nothing of substance. A project with a real, well-supported finding wrapped in slightly rough code has still produced something genuinely valuable.

---

---

# SECTION 3 — DIMENSION 1: DATA QUALITY & INTEGRITY (20%)

## 3.1 Evaluation Criteria

| Criterion | Metric | Method | Target |
|---|---|---|---|
| **Completeness** | % missing in required columns | `sum(is.na(x))` per column | 0% in `elevation_m`, `goals_against_*`, `team_elo_pre` |
| **Accuracy** | Spot-check deviation from known truth | Manual cross-reference | Mexico City elevation within ±50m of 2,240m |
| **Consistency** | Duplicate key count | `sum(duplicated(master[c("year","team","match_id")]))` | 0 |
| **Validity** | Out-of-range value count | Range assertions | 0 (temp ∈ [-10,50]°C, humidity ∈ [0,100]%, elevation ≥ 0) |
| **Referential integrity** | Row count stability across joins | `nrow()` assertion after every join | Constant at ~512 throughout Phase 06 |

## 3.2 Evaluation Method

This dimension is evaluated almost entirely through **automated tests**, not subjective judgement — that is by design. Data quality should never depend on someone "eyeballing" a spreadsheet. The `testthat` suite defined in the Implementation Plan's Phase 06 section is the primary evidence source:

```r
# Run this and capture the output as evidence for the evaluation
test_results <- testthat::test_dir("tests/", reporter = "summary")
# Evaluation score for this dimension = % of tests passing, weighted by criticality
```

## 3.3 Scoring Rubric (1–5 scale)

| Score | Description |
|---|---|
| **5** | All automated tests pass; manual elevation cross-check complete for every venue >500m; zero duplicate keys |
| **4** | All automated tests pass; manual cross-check complete for the top 5 highest-elevation venues only |
| **3** | 95%+ tests pass; minor, documented missingness in non-critical columns (e.g. `team_fifa_rank` pre-1994) |
| **2** | Some required-field missingness exists undocumented; duplicate keys present but small in number |
| **1** | Test suite not run, or failing tests were silently ignored rather than fixed |

---

---

# SECTION 4 — DIMENSION 2: STATISTICAL VALIDITY & RIGOR (30%)

This is the dimension that determines whether the project has actually said something true. It receives the most scrutiny in this plan because it is the easiest dimension to fake — a model can run, produce a p-value under 0.05, and still be wrong in a way that only a careful audit catches.

## 4.1 Evaluation Criteria

| Criterion | Evidence Required | Pass Condition |
|---|---|---|
| **Model family justification** | Mean vs. variance comparison of outcome variable | Overdispersion demonstrated → Negative Binomial choice is justified, not assumed |
| **Convergence** | `summary(m4)` output | No convergence warnings from `glmer.nb()` |
| **Multicollinearity** | `car::vif(m4)` output | All VIF values < 5 |
| **Residual diagnostics** | `plot(m4)` visual inspection | No systematic pattern (fan shape, curvature) in residuals |
| **Significance with robustness** | p-values across primary model AND all 4 sensitivity analyses | At least one hypothesis significant at p<0.05 in the primary model, with the *direction* of the effect unchanged across all sensitivity checks |
| **Effect size reporting** | Coefficient + 95% CI, not p-value alone | Every reported finding includes a confidence interval and a plain-language magnitude statement |
| **Confound control** | Elo difference, rest days, travel distance all included as covariates | Altitude/heat effect persists after these controls are added (compare M1 vs M4 coefficient) |
| **Honest power assessment** | Count of matches above the altitude threshold | If n < 30 high-altitude matches, this limitation is explicitly stated in the report — not hidden |
| **No p-hacking** | Hypotheses H1–H5 timestamped from Phase 0 | Hypotheses were locked before any model was fit, not adjusted after seeing results |
| **Appropriate framing of 2026 outputs** | Language used in report and website | "Projection under historical patterns," never "prediction" or "will happen" |

## 4.2 The Sensitivity Analysis Gate

A finding that only holds under one specific modelling choice is not a finding — it's an artefact. Every primary result must be re-run under all four sensitivity conditions before it is reported as a conclusion:

```
SA1 — Different altitude threshold (800m instead of 1,000m)
SA2 — Group-stage-only sample (removes extra-time distortion)
SA3 — Excluding 2022 Qatar (removes the Nov-Dec, zero-travel-distance outlier edition)
SA4 — xG as the outcome instead of raw goals (2018/2022 subset only)
```

**Evaluation rule**: if the *direction* of the altitude coefficient flips sign under any sensitivity check, the finding fails this dimension regardless of how clean the primary model looked. If only the *magnitude* changes while the direction holds, the finding passes with a documented caveat about the magnitude's sensitivity to modelling choices.

## 4.3 Scoring Rubric (1–5 scale)

| Score | Description |
|---|---|
| **5** | All 10 criteria met; sensitivity analyses fully documented; power limitations stated explicitly; 2026 framing is consistently careful throughout report and website |
| **4** | 8–9 criteria met; one minor gap (e.g. only 3 of 4 sensitivity analyses completed) but transparently noted |
| **3** | Primary model is sound but sensitivity testing is incomplete or confound control is partial |
| **2** | Model runs and produces a p-value, but diagnostics were not checked (VIF, residuals, convergence) |
| **1** | Significance is reported without any robustness checking — the textbook definition of an unreliable finding |

---

---

# SECTION 5 — DIMENSION 3: SOFTWARE ENGINEERING QUALITY (20%)

## 5.1 Evaluation Criteria

| Criterion | Metric | Method |
|---|---|---|
| **Reproducibility** | Clean-checkout success | `renv::restore()` + `source("scripts/run_all.R")` on a fresh clone |
| **Test coverage** | testthat pass rate | `devtools::test()` — target 100% pass |
| **Secrets hygiene** | Git history scan | `.Renviron` never appears in any commit, including history |
| **CI health** | GitHub Actions status | Green checkmark on `main` at time of evaluation |
| **Code modularity** | Script responsibility audit | Each numbered script does exactly one ETL/analysis step — no script both scrapes and models |
| **Documentation completeness** | README + ADR presence | README explains setup, usage, and findings; all 6 ADRs exist and are individually readable |
| **Lint cleanliness** | `lintr::lint_dir("R/")` output | Zero critical style/correctness warnings |

## 5.2 The Clean-Checkout Test (Single Most Important Engineering Check)

```bash
# Simulate a stranger cloning the repo for the first time
git clone https://github.com/username/altitude-heat-wc.git fresh-clone
cd fresh-clone
Rscript -e "renv::restore()"
Rscript scripts/run_all.R
```

If this sequence fails at any point — a missing package, a hardcoded local file path, an uncommitted data file the pipeline silently depended on — the reproducibility claim is false, regardless of how well the pipeline ran on the original development machine.

## 5.3 Scoring Rubric (1–5 scale)

| Score | Description |
|---|---|
| **5** | Clean-checkout test passes; 100% test pass rate; CI green; all documentation present; zero secrets in history |
| **4** | Clean-checkout passes with one minor manual step (e.g. manually setting an API key) clearly documented in README |
| **3** | Reproducible with moderate friction; test suite mostly passing; documentation present but incomplete |
| **2** | Pipeline only runs reliably on the original development machine; missing or stale documentation |
| **1** | Not reproducible by anyone other than the original author; no tests; secrets present in Git history |

---

---

# SECTION 6 — DIMENSION 4: PRODUCT & DEPLOYMENT QUALITY (15%)

## 6.1 Evaluation Criteria

| Criterion | Metric | Tool |
|---|---|---|
| **Website performance** | Lighthouse score | Chrome DevTools Lighthouse, run on the deployed Vercel URL |
| **Website accessibility** | Lighthouse accessibility score | Same tool — target > 90 |
| **Dashboard responsiveness** | Load time to first interactive chart | Manual timing on shinyapps.io deployed URL |
| **Report rendering** | Successful HTML + PDF render | `quarto render` exit code 0, visual spot-check of all figures |
| **Cross-device check** | Mobile + desktop rendering | Manual check on at least one mobile viewport width |
| **Uptime/availability** | All 4 URLs resolve | Manual check at evaluation time: Vercel, shinyapps.io, GitHub repo, GitHub Pages report |

## 6.2 Scoring Rubric (1–5 scale)

| Score | Description |
|---|---|
| **5** | All 4 deployments live; Lighthouse performance + accessibility both >90; report renders cleanly in both formats |
| **4** | All deployments live; Lighthouse scores 75–90; minor rendering quirk in one format (e.g. PDF table overflow) |
| **3** | 3 of 4 deployments live; one component (commonly the Shiny dashboard, due to free-tier hour limits) intermittently unavailable |
| **2** | Only the GitHub repository is reliably accessible; website or dashboard deployment failed |
| **1** | Nothing is deployed; outputs exist only as local files |

---

---

# SECTION 7 — DIMENSION 5: COMMUNICATION & PORTFOLIO QUALITY (15%)

## 7.1 Evaluation Criteria

| Criterion | Test | Pass Condition |
|---|---|---|
| **The One-Minute Test** | Show the website headline + 2026 risk matrix to someone with no statistics background | They can correctly restate the central finding in their own words within 60 seconds |
| **The Recruiter Test** | Open only the GitHub README, time the engagement | A reader continues scrolling/reading for 3+ minutes without external prompting |
| **ADR defensibility** | Mock interview: "Why Negative Binomial and not Poisson?" | The mission owner can answer from memory, not by re-reading the document |
| **Licence attribution** | Audit every data source credit | All 8 sources correctly attributed per their actual licence terms |
| **Visual design coherence** | Side-by-side comparison of website and Quarto report | Consistent colour palette, typography, and tone across both artefacts |
| **Narrative arc** | Read the problem statement → website → report in sequence | Problem → method → finding → implication flows without requiring the reader to backtrack |

## 7.2 The Recruiter Test, Operationalised

This is the highest-leverage check in the entire evaluation plan because it is the one most directly tied to the project's stated purpose — portfolio value for someone positioning as an Aspiring Data Scientist. Ask a friend, classmate, or mentor unfamiliar with the project to do the following, timed:

```
1. Open the GitHub repository README only (not the website, not the report)
2. Read for as long as they want
3. Stop the clock when they either close the tab or ask "so what's the conclusion?"
4. Target: 3+ minutes of unprompted engagement
```

If the reader stops within 30 seconds, the README's opening is the problem — most commonly because it leads with implementation detail (package lists, folder structures) instead of the headline finding.

## 7.3 Scoring Rubric (1–5 scale)

| Score | Description |
|---|---|
| **5** | Passes One-Minute Test, Recruiter Test, and ADR defensibility check; all licences correctly attributed; visual coherence between website and report |
| **4** | Passes Recruiter Test and ADR check; minor gaps in licence attribution or visual consistency |
| **3** | README is informative but leads with technical detail rather than the finding; ADRs exist but require notes to defend |
| **2** | Documentation is present but written for the author, not for an outside reader; no one outside the project has reviewed it |
| **1** | No README beyond auto-generated boilerplate; no one has ever read the project's output but the author |

---

---

# SECTION 8 — EVALUATION METHODOLOGY

## 8.1 Three Modes of Evaluation

```
MODE 1 — AUTOMATED (continuous, every commit)
  testthat suite · lintr · GitHub Actions CI · Lighthouse CI (if configured)
  Runs without human involvement. Catches regressions immediately.

MODE 2 — SELF-AUDIT (at every Mission Plan gate)
  The mission owner runs the relevant dimension's checklist personally,
  honestly marking partial or failing items rather than rounding up.

MODE 3 — EXTERNAL REVIEW (once, near Day 13–14)
  A person outside the project (classmate, mentor, online community)
  performs the Recruiter Test and the One-Minute Test blind —
  without being told what to look for in advance.
```

External review matters because self-evaluation has a structural blind spot: the person who built the pipeline already understands it, and cannot easily simulate the experience of someone encountering it cold. Mode 3 is not optional for Dimension 5.

## 8.2 The "Devil's Advocate" Pass

Before the final scorecard is completed, perform one deliberate adversarial review: read the entire Quarto report as if you were a skeptical hiring manager actively looking for a reason to dismiss the finding. Specifically attempt to answer:

```
- Could this result be explained entirely by team quality, and not environment at all?
- Is the 2026 risk matrix making a claim the data can't actually support?
- Is there a more boring explanation for the pattern that wasn't considered?
- If I only had 30 seconds, what's the one thing I'd criticise?
```

If this exercise surfaces a genuine weakness, fix it before evaluation, not after — a weakness found internally is a non-event; the same weakness found by an actual interviewer is a credibility problem.

---

---

# SECTION 9 — DEFINITION OF DONE (MASTER CHECKLIST)

The project is considered **complete** only when every item below is checked. This list is the union of every dimension's pass criteria — nothing here is new, it is the consolidated acceptance bar.

```
DATA QUALITY
  [ ] Zero missing values in elevation_m, goals_against_1h/2h, team_elo_pre
  [ ] Mexico City elevation confirmed within ±50m of 2,240m
  [ ] Zero duplicate (year, team, match_id) keys
  [ ] All testthat data integrity tests passing

STATISTICAL VALIDITY
  [ ] Overdispersion explicitly demonstrated before choosing Negative Binomial
  [ ] M4 (primary GLMM) converges with no warnings
  [ ] VIF < 5 for all predictors
  [ ] At least one hypothesis significant at p<0.05, direction stable across all 4 sensitivity checks
  [ ] Effect sizes reported with 95% confidence intervals
  [ ] Statistical power limitation stated explicitly if high-altitude sample is small
  [ ] 2026 outputs consistently framed as "projections," never "predictions"

ENGINEERING
  [ ] Clean-checkout test passes (renv::restore() + run_all.R on a fresh clone)
  [ ] 100% testthat pass rate
  [ ] Zero secrets in Git history
  [ ] GitHub Actions CI green on main
  [ ] All 6 ADRs written and committed

PRODUCT & DEPLOYMENT
  [ ] Next.js site live on Vercel, Lighthouse performance > 90
  [ ] Shiny dashboard live on shinyapps.io, loads < 5s
  [ ] Quarto report renders cleanly to HTML and PDF
  [ ] GitHub repository public with complete README

COMMUNICATION
  [ ] Recruiter Test passed (3+ minutes unprompted README engagement)
  [ ] One-Minute Test passed (non-statistician restates the finding correctly)
  [ ] All 8 data sources correctly attributed per their licence
  [ ] Devil's Advocate review completed and any surfaced weakness addressed
```

---

---

# SECTION 10 — WEIGHTED SCORING MODEL

## 10.1 Composite Score Formula

```
Overall Score = Σ (Dimension Score / 5) × Dimension Weight

Where:
  Data Quality              weight = 20
  Statistical Validity      weight = 30
  Engineering Quality       weight = 20
  Product & Deployment      weight = 15
  Communication & Portfolio weight = 15
                              ─────────
                              Total = 100
```

**Worked example**: Data=4, Stats=4, Eng=5, Product=3, Comms=4
```
(4/5)×20 + (4/5)×30 + (5/5)×20 + (3/5)×15 + (4/5)×15
= 16 + 24 + 20 + 9 + 12
= 81 / 100  →  "Good — Minor Revisions"
```

## 10.2 Score Interpretation Thresholds

| Score Range | Verdict | Action |
|---|---|---|
| **90–100** | Portfolio Ready | Ship it. Publish the LinkedIn post. |
| **75–89** | Good — Minor Revisions | Identify the lowest-scoring dimension and spend remaining time there before shipping |
| **60–74** | Needs Work | Do not publish externally yet; at least one dimension has a structural gap |
| **0–59** | Not Ready | A core failure exists — most likely Statistical Validity or Engineering Reproducibility — that undermines everything built on top of it |

## 10.3 Why Statistical Validity Failures Cap the Whole Score

Even a perfect 5/5 in every other dimension cannot fully compensate for a failing Statistical Validity score, because that dimension carries 30% of the total. A project scoring 5/5/5/1/5 in Data/Stats/Eng/Product/Comms — Data=5, Stats=1, Eng=5, Product=5, Comms=5 — produces:

```
(5/5)×20 + (1/5)×30 + (5/5)×20 + (5/5)×15 + (5/5)×15
= 20 + 6 + 20 + 15 + 15 = 76/100
```

Even with everything else perfect, a failing statistical core caps the project at "Needs Work" — which is exactly the intended behaviour. No amount of polish substitutes for a finding that isn't actually true.

---

---

# SECTION 11 — FINAL EVALUATION REPORT TEMPLATE

To be completed once, at the end of Phase 08, using this exact structure:

```markdown
## Final Evaluation Report — Operation Altitude Shield

**Date completed:**
**Evaluator(s):**

### Dimension Scores
| Dimension | Score (1–5) | Weighted | Evidence |
|---|---|---|---|
| Data Quality | __ | __ | [link to test output] |
| Statistical Validity | __ | __ | [link to model diagnostics] |
| Engineering Quality | __ | __ | [link to CI run] |
| Product & Deployment | __ | __ | [Lighthouse report link] |
| Communication & Portfolio | __ | __ | [Recruiter Test notes] |

**Overall Composite Score:** ___ / 100
**Verdict:** [Portfolio Ready / Good / Needs Work / Not Ready]

### What Worked
-

### What Didn't (and why)
-

### If This Were Repeated (Season 2 Notes)
-

### Sign-off
This evaluation was conducted honestly, including marking partial or
failing criteria rather than rounding scores upward.
```

---

---

# SECTION 12 — EVALUATION CALENDAR

Evaluation checkpoints aligned to the Mission Plan's gates and the Implementation Plan's phase boundaries:

| Day | Gate | Evaluation Activity |
|---|---|---|
| Day 1 | Gate 1 | Environment reproducibility check (`renv::restore()` on clean checkout) |
| Day 7 | Gate 2 | Data completeness audit across all 6 interim files; manual elevation cross-check |
| Day 8 | Gate 3 | Full `testthat` suite run; row-count integrity verified after every individual join |
| Day 10 | Gate 4 | Overdispersion check; confound check (Elo vs h2_delta) reviewed in EDA report |
| Day 12 | Gate 5 | Model diagnostics (VIF, residuals, convergence); all 4 sensitivity analyses completed |
| Day 13 | — | Devil's Advocate adversarial review of the full report |
| Day 14 | Final | Complete weighted scorecard; Recruiter Test and One-Minute Test with an external reviewer; all deployment URLs live-checked |

---

*Evaluation Plan v1.0 · Altitude & Heat Adaptation in FIFA World Cups*
*Status: Approved — applies continuously from Phase 00 through Final Evaluation on Day 14*
