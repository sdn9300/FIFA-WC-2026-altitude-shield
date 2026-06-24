import { useState } from "react";
import {
  Mountain, Target, Shield, Radio, AlertTriangle, CheckCircle2,
  Circle, ChevronRight, ChevronDown, Flag, Crosshair, Activity,
  Database, BarChart2, Rocket, Clock, Eye, Zap
} from "lucide-react";

/* ─── TOKENS ──────────────────────────────────────────── */
const C = {
  bg: '#050B18', card: '#0D1627', cardAlt: '#0A1020',
  border: '#1E2D4A', borderHover: '#2D4470',
  accent: '#00C896', blue: '#4361EE', red: '#EF4444',
  gold: '#F59E0B', purple: '#A855F7', orange: '#F97316',
  text: '#E8EDF5', muted: '#64748B', muted2: '#8895A7',
};

const TABS = ['Briefing', 'Phases', 'Risk Matrix', 'Timeline', 'Decision Gates'];

/* ─── DATA: OBJECTIVES ───────────────────────────────── */
const OBJECTIVES = {
  primary: [
    'Build reproducible R pipeline ingesting 8 data sources into one master table',
    'Fit GLMM Negative Binomial model quantifying altitude/heat effect on 2nd-half goals',
    'Produce statistically defensible answer to H1 (altitude effect) with p-value + effect size',
    'Generate 2026 venue risk rankings for all 16 host cities',
  ],
  secondary: [
    'Test H2–H5 (heat, interaction, rest, adaptation immunity hypotheses)',
    'Deploy interactive Shiny dashboard for live model exploration',
    'Ship production Next.js portfolio website on Vercel',
    'Render full Quarto analytical report (HTML + PDF)',
  ],
  stretch: [
    'Extend robustness check to 1974–2022 (13 tournaments)',
    'Build team-specific vulnerability calculator for 2026',
    'Publish LinkedIn launch post + GitHub topics for discoverability',
  ],
};

/* ─── DATA: MISSION PHASES ───────────────────────────── */
const PHASES = [
  { code: 'PHASE 0', name: 'RECONNAISSANCE',  days: 'Day 1',     color: C.muted2,
    objective: 'Lock research questions, hypotheses, and schema contract before any data is touched.',
    deliverable: 'PRD + 5 formal hypotheses + locked column schema',
    tasks: ['Define H1–H5 with statistical formulation', 'Lock unit of analysis (team × match)', 'Freeze schema contract — 28 columns'],
    exit: 'Schema contract signed off. No further changes permitted without a new ADR.',
    status: 'COMPLETE' },
  { code: 'PHASE 1', name: 'STAGING',          days: 'Day 1',     color: C.blue,
    objective: 'Stand up the reproducible environment — nothing is collected until the environment is locked.',
    deliverable: 'renv.lock + folder scaffold + GitHub repo initialised',
    tasks: ['renv::init() + install 24 packages', 'Create canonical folder structure', 'Git init + first commit', 'Dockerfile drafted'],
    exit: '00_run_all.R exists (even if empty) and renv::restore() succeeds on a clean checkout.',
    status: 'COMPLETE' },
  { code: 'PHASE 2', name: 'COLLECTION',       days: 'Days 2–7',  color: C.purple,
    objective: 'Extract raw data from all 8 sources without transformation. Cache everything immediately.',
    deliverable: '6 interim CSVs: matches, xG, venues, elevation, climate, team quality',
    tasks: ['Scrape FBref (rate-limited, 3s delay)', 'Pull StatsBomb xG JSON (2018/22)', 'Geocode venues via OSM', 'Query Open-Elevation API', 'Query Meteostat API', 'Download Elo + FIFA rank CSVs'],
    exit: 'All 6 interim files exist with 0% missing in required columns. Manual elevation cross-check complete for all venues >500m.',
    status: 'ACTIVE' },
  { code: 'PHASE 3', name: 'FUSION',           days: 'Day 8',     color: C.gold,
    objective: 'Join all 6 interim sources into the single master table. Highest-risk phase — silent join failures hide here.',
    deliverable: 'team_match_master.csv — ~512 rows × 28 columns',
    tasks: ['Normalise team names via lookup table', 'Sequential left_joins with row-count assertions', 'Compute rest_days + travel_km', 'Run full testthat data integrity suite'],
    exit: 'nrow(master) == 512 confirmed after every join. All testthat checks pass green.',
    status: 'STANDBY' },
  { code: 'PHASE 4', name: 'ANALYSIS',         days: 'Days 9–10', color: C.orange,
    objective: 'Understand the data before any modelling claim is made. Every modelling choice must be EDA-justified.',
    deliverable: 'Quarto EDA report (HTML) + engineered analytical dataset',
    tasks: ['Render distributions, confound checks, correlation matrix', 'Engineer log_elevation, heat_stress_idx, scaled controls', 'Confirm overdispersion → justifies Negative Binomial'],
    exit: 'EDA report answers all 6 EDA questions from the schema contract. Feature set frozen.',
    status: 'STANDBY' },
  { code: 'PHASE 5', name: 'ENGAGEMENT',       days: 'Days 11–12',color: C.red,
    objective: 'Fire the full model sequence M1→M5. Extract the answer to the mission question.',
    deliverable: '5 fitted models + coefficient tables + 2026 venue risk scores',
    tasks: ['Fit M1 baseline → M5 interaction model', 'Run 4 sensitivity analyses', 'Diagnostics: VIF, residuals, AIC comparison', 'predict() onto 2026 venue conditions'],
    exit: 'Primary model (M4) converges cleanly. At least one hypothesis significant at p<0.05. Sensitivity checks confirm robustness.',
    status: 'STANDBY' },
  { code: 'PHASE 6', name: 'EXTRACTION',       days: 'Days 13–14',color: C.accent,
    objective: 'Package every output for public consumption and portfolio defence.',
    deliverable: 'Live Vercel site + Shiny dashboard + public GitHub repo + Quarto report',
    tasks: ['6 publication charts exported', 'Shiny app deployed to shinyapps.io', 'Next.js site deployed to Vercel', 'README + ADRs + LinkedIn post published'],
    exit: 'All 4 URLs resolve publicly. GitHub README readable in <3 minutes by a stranger.',
    status: 'STANDBY' },
];

/* ─── DATA: RISK REGISTER ─────────────────────────────── */
const RISKS = [
  { id: 'R1', name: 'FBref rate-limit / IP block',          likelihood: 4, impact: 3, phase: 'Collection',
    mitigation: 'Sys.sleep(3) between every request, mandatory. Cache each tournament year immediately to disk. Budget 45 min for full scrape.',
    contingency: 'Fall back to Kaggle CSV datasets (evangower/fifa-world-cup) — slightly less detail but unblocks the pipeline same day.' },
  { id: 'R2', name: 'Silent NA rows from team-name mismatch', likelihood: 4, impact: 5, phase: 'Fusion',
    mitigation: 'Build team_name_lookup.csv up front ("West Germany"→"GER"). Assert nrow(master)==512 after every single left_join — not just at the end.',
    contingency: 'If row count balloons, binary-search the join chain by re-running joins one at a time until the offending join is isolated.' },
  { id: 'R3', name: 'Meteostat key / 2022 Qatar date anomaly', likelihood: 3, impact: 3, phase: 'Collection',
    mitigation: 'Store METEOSTAT_KEY in .Renviron, never in code. Explicitly hardcode Nov–Dec window for 2022 (Qatar WC ran Nov 20–Dec 18, not June–July).',
    contingency: 'If Meteostat free tier is exhausted, fall back to NOAA GHCN-Daily historical archive for the same coordinates.' },
  { id: 'R4', name: 'Open-Elevation inaccuracy (urban SRTM)',  likelihood: 2, impact: 2, phase: 'Collection',
    mitigation: 'Manually cross-check every elevation >500m against Wikipedia / official stadium specs before accepting into the dataset.',
    contingency: 'Use Google Elevation API as a secondary source for any venue with a >5% discrepancy.' },
  { id: 'R5', name: 'Low statistical power (few altitude matches)', likelihood: 4, impact: 4, phase: 'Analysis',
    mitigation: 'Extend robustness sample to 1974–2022 (13 tournaments) as a secondary check. Report confidence intervals, not just p-values.',
    contingency: 'If power remains too low, reframe H1 as a descriptive effect-size finding rather than a confirmatory hypothesis test, and say so explicitly.' },
  { id: 'R6', name: '14-day timeline overrun',                 likelihood: 3, impact: 4, phase: 'All',
    mitigation: 'Minimum Viable Scope defined up front: if behind schedule by Day 9, drop the StatsBomb xG sub-study first — it is the most removable component.',
    contingency: 'Ship the Quarto report and GitHub repo even without the Shiny dashboard or website; those are extractable as a fast-follow.' },
  { id: 'R7', name: 'Model overfitting / spurious significance', likelihood: 2, impact: 5, phase: 'Engagement',
    mitigation: 'Run all 4 sensitivity analyses before reporting any result. Use random intercept for wc_year to avoid pseudo-replication.',
    contingency: 'Frame all 2026 outputs explicitly as "projections under historical patterns," never as guaranteed predictions.' },
  { id: 'R8', name: 'Scope creep (player tracking, injuries…)', likelihood: 3, impact: 3, phase: 'All',
    mitigation: 'Phase 0 schema contract is locked and version-controlled. Any new variable requires a new ADR before it enters the pipeline.',
    contingency: 'Park scope-creep ideas in a docs/future_work.md file — visible, but not blocking the current mission.' },
  { id: 'R9', name: 'StatsBomb 300MB parse / memory load',     likelihood: 2, impact: 2, phase: 'Collection',
    mitigation: 'Use Parallel=TRUE in free_allevents(). Extract only shot/xG fields immediately; discard full event object from memory.',
    contingency: 'Process StatsBomb data one match at a time via a loop with incremental disk writes if memory becomes a bottleneck.' },
  { id: 'R10', name: 'Vercel / shinyapps.io deploy failure',   likelihood: 2, impact: 3, phase: 'Extraction',
    mitigation: 'Test npm run build locally before every push. Deploy Shiny to a staging app name first, verify, then promote.',
    contingency: 'GitHub Pages is the fallback static host for the Next.js site if Vercel deployment is blocked for any reason.' },
];

const riskScore = (r) => r.likelihood * r.impact;
const riskColor = (score) => {
  if (score >= 16) return C.red;
  if (score >= 9)  return C.gold;
  if (score >= 4)  return C.orange;
  return C.accent;
};

/* ─── DATA: TIMELINE (mapped to phases) ───────────────── */
const TIMELINE_PHASES = [
  { name: 'Recon',      start: 1,  end: 1,  color: C.muted2 },
  { name: 'Staging',    start: 1,  end: 1,  color: C.blue   },
  { name: 'Collection', start: 2,  end: 7,  color: C.purple },
  { name: 'Fusion',     start: 8,  end: 8,  color: C.gold   },
  { name: 'Analysis',   start: 9,  end: 10, color: C.orange },
  { name: 'Engagement', start: 11, end: 12, color: C.red    },
  { name: 'Extraction', start: 13, end: 14, color: C.accent },
];

/* ─── DATA: DECISION GATES ─────────────────────────────── */
const GATES = [
  { gate: 'GATE 1', between: 'Staging → Collection', color: C.blue,
    criteria: ['renv::restore() succeeds on clean checkout', '00_run_all.R sources without error (even if empty steps)', 'GitHub repo has first commit'],
    noGo: 'If renv fails to restore, do not proceed — fix dependency conflicts first. Collection scripts assume a working environment.' },
  { gate: 'GATE 2', between: 'Collection → Fusion', color: C.purple,
    criteria: ['All 6 interim CSVs exist on disk', '0% missing in elevation_m and goal columns', 'Manual elevation cross-check signed off for venues >500m'],
    noGo: 'If any interim file is missing required columns, do not begin joins — a join on incomplete data produces undetectable downstream errors.' },
  { gate: 'GATE 3', between: 'Fusion → Analysis', color: C.gold,
    criteria: ['nrow(master) == 512 (±tolerance for 1994 52-game format)', 'testthat::test_dir("tests/") returns 0 failures', 'Goal totals reconcile against FBref scorelines'],
    noGo: 'If row count is wrong, STOP. Do not patch with manual row deletion — find and fix the join key mismatch.' },
  { gate: 'GATE 4', between: 'Analysis → Engagement', color: C.orange,
    criteria: ['EDA confirms overdispersion (justifies NB over Poisson)', 'Feature set frozen — no new engineered variables after this gate', 'Confound checks (Elo vs h2_delta) documented'],
    noGo: 'If overdispersion is not confirmed, revisit model family choice — do not default to Negative Binomial without justification.' },
  { gate: 'GATE 5', between: 'Engagement → Extraction', color: C.red,
    criteria: ['M4 (primary model) converges without warnings', 'At least 1 of H1–H5 significant at p<0.05', 'All 4 sensitivity analyses completed and documented'],
    noGo: 'If the model does not converge, simplify the random effects structure before adding more fixed effects.' },
];

/* ─── SHARED UI HELPERS ────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    COMPLETE: { color: C.accent, icon: CheckCircle2 },
    ACTIVE:   { color: C.gold,   icon: Activity },
    STANDBY:  { color: C.muted,  icon: Circle },
  };
  const { color, icon: Icon } = map[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 5, fontSize: 10.5, fontWeight: 700,
      background: `${color}16`, color, border: `1px solid ${color}30` }}>
      <Icon size={11} /> {status}
    </span>
  );
};

/* ─── BRIEFING VIEW ────────────────────────────────────── */
function BriefingView() {
  const [openObj, setOpenObj] = useState('primary');
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Mission statement */}
      <div style={{ padding: '22px 24px', background: `${C.accent}08`,
        border: `1px solid ${C.accent}30`, borderRadius: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Crosshair size={15} color={C.accent} />
          <span style={{ fontSize: 10.5, color: C.accent, fontWeight: 800, letterSpacing: '1px' }}>
            MISSION STATEMENT
          </span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>
          Build and deploy a statistically rigorous, fully reproducible analytics pipeline
          that determines whether altitude, heat, and humidity measurably degrade football
          performance at the FIFA World Cup — and use those findings to produce an actionable
          environmental risk assessment for all 16 venues of the 2026 tournament — within a
          14-day execution window.
        </p>
      </div>

      {/* Commander's intent + context */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div style={{ padding: '18px 20px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Eye size={14} color={C.blue} />
            <span style={{ fontSize: 10.5, color: C.blue, fontWeight: 800, letterSpacing: '0.8px' }}>
              COMMANDER'S INTENT
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.muted2, lineHeight: 1.7 }}>
            Success is not "a model ran." Success is a defensible answer to one question —
            does the environment show up in the scoreline — that survives sensitivity testing,
            is communicated clearly to a non-statistician, and is packaged well enough that
            a hiring manager spends three minutes reading the README instead of thirty seconds.
          </p>
        </div>
        <div style={{ padding: '18px 20px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Radio size={14} color={C.gold} />
            <span style={{ fontSize: 10.5, color: C.gold, fontWeight: 800, letterSpacing: '0.8px' }}>
              STRATEGIC CONTEXT
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.muted2, lineHeight: 1.7 }}>
            FIFA World Cup 2026 spans Mexico City (2,240m) to coastal Miami — the widest
            environmental range in tournament history. No existing public analysis quantifies
            this risk at scale. The window to publish ahead of the tournament is now.
          </p>
        </div>
      </div>

      {/* Objectives */}
      <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 800,
        letterSpacing: '1px', marginBottom: 12 }}>MISSION OBJECTIVES</div>

      {[
        { key: 'primary',   label: 'PRIMARY — Must Achieve',   color: C.red,    items: OBJECTIVES.primary   },
        { key: 'secondary', label: 'SECONDARY — Should Achieve', color: C.gold, items: OBJECTIVES.secondary },
        { key: 'stretch',   label: 'STRETCH — Could Achieve',  color: C.accent, items: OBJECTIVES.stretch   },
      ].map(group => {
        const isOpen = openObj === group.key;
        return (
          <div key={group.key} onClick={() => setOpenObj(isOpen ? null : group.key)}
            style={{ marginBottom: 8, border: `1px solid ${isOpen ? group.color : C.border}`,
              borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
              background: isOpen ? `${group.color}07` : C.card, transition: 'all 0.2s' }}>
            <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Flag size={14} color={group.color} />
              <span style={{ fontSize: 13, fontWeight: 800, flex: 1, color: group.color }}>{group.label}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{group.items.length} items</span>
              {isOpen ? <ChevronDown size={15} color={group.color} /> : <ChevronRight size={15} color={C.muted} />}
            </div>
            {isOpen && (
              <div style={{ padding: '4px 18px 16px' }}>
                {group.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: 9, alignItems: 'flex-start',
                    padding: '7px 0', borderTop: j > 0 ? `1px solid ${C.border}` : 'none' }}>
                    <Target size={13} color={group.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── PHASES VIEW ──────────────────────────────────────── */
function PhasesView() {
  const [open, setOpen] = useState(2);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>7 Mission Phases</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          Sequential execution — each phase gates the next. Click to expand tasks and exit criteria.
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Vertical connector line */}
        <div style={{ position: 'absolute', left: 23, top: 24, bottom: 24,
          width: 2, background: C.border, zIndex: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PHASES.map((phase, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 14 }}>
                {/* Node */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: phase.status === 'COMPLETE' ? phase.color : C.bg,
                  border: `2px solid ${phase.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {phase.status === 'COMPLETE'
                    ? <CheckCircle2 size={20} color={C.bg} />
                    : <span style={{ fontSize: 12, fontWeight: 900, color: phase.color,
                        fontFamily: 'monospace' }}>{i}</span>}
                </div>

                {/* Card */}
                <div onClick={() => setOpen(isOpen ? null : i)} style={{ flex: 1,
                  background: isOpen ? `${phase.color}08` : C.card,
                  border: `1px solid ${isOpen ? phase.color : C.border}`,
                  borderRadius: 12, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s' }}>

                  <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 9.5, color: phase.color, fontWeight: 800,
                          letterSpacing: '0.6px', fontFamily: 'monospace' }}>{phase.code}</span>
                        <span style={{ fontSize: 10, color: C.muted }}>· {phase.days}</span>
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 800 }}>{phase.name}</div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <StatusBadge status={phase.status} />
                    {isOpen ? <ChevronDown size={15} color={phase.color} /> : <ChevronRight size={15} color={C.muted} />}
                  </div>

                  {isOpen && (
                    <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${phase.color}25` }}>
                      <p style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.65,
                        margin: '14px 0 12px' }}>{phase.objective}</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700,
                            letterSpacing: '0.6px', marginBottom: 7 }}>TASKS</div>
                          {phase.tasks.map((t, j) => (
                            <div key={j} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                              <div style={{ width: 4, height: 4, borderRadius: '50%',
                                background: phase.color, marginTop: 6, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: C.muted2 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700,
                            letterSpacing: '0.6px', marginBottom: 7 }}>DELIVERABLE</div>
                          <div style={{ padding: '8px 11px', background: C.bg,
                            border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12,
                            color: C.text, marginBottom: 10, fontFamily: 'monospace' }}>
                            {phase.deliverable}
                          </div>
                          <div style={{ fontSize: 10, color: phase.color, fontWeight: 700,
                            letterSpacing: '0.6px', marginBottom: 6 }}>EXIT CRITERIA</div>
                          <div style={{ fontSize: 12, color: C.muted2, lineHeight: 1.6 }}>{phase.exit}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── RISK MATRIX VIEW ─────────────────────────────────── */
function RiskMatrixView() {
  const [selected, setSelected] = useState(RISKS[1]); // default to R2 (highest severity)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Risk Register & Matrix</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          10 identified risks plotted by likelihood × impact. Click a risk in the list to see mitigation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

        {/* Matrix grid */}
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700,
            letterSpacing: '0.6px', marginBottom: 10, textAlign: 'center' }}>
            LIKELIHOOD × IMPACT
          </div>
          <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto' }}>
            {/* Grid background */}
            <div style={{ position: 'absolute', inset: 0,
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(5, 1fr)', gap: 2 }}>
              {Array.from({ length: 25 }).map((_, idx) => {
                const row = Math.floor(idx / 5); // 0 = top = likelihood 5
                const col = idx % 5;              // 0 = left = impact 1
                const likelihood = 5 - row;
                const impact = col + 1;
                const score = likelihood * impact;
                return (
                  <div key={idx} style={{ background: `${riskColor(score)}10`,
                    border: `1px solid ${C.border}`, borderRadius: 3 }} />
                );
              })}
            </div>
            {/* Risk dots */}
            {RISKS.map(r => {
              const x = ((r.impact - 1) / 4) * 100;
              const y = ((5 - r.likelihood) / 4) * 100;
              const isSel = selected.id === r.id;
              return (
                <div key={r.id} onClick={() => setSelected(r)}
                  title={r.name}
                  style={{ position: 'absolute',
                    left: `${x}%`, top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: isSel ? 26 : 20, height: isSel ? 26 : 20,
                    borderRadius: '50%', cursor: 'pointer',
                    background: riskColor(riskScore(r)),
                    border: `2px solid ${isSel ? '#fff' : C.bg}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 900, color: C.bg,
                    boxShadow: isSel ? `0 0 0 4px ${riskColor(riskScore(r))}35` : 'none',
                    transition: 'all 0.15s', zIndex: isSel ? 2 : 1 }}>
                  {r.id.replace('R', '')}
                </div>
              );
            })}
            {/* Axis labels */}
            <div style={{ position: 'absolute', left: -16, top: '50%',
              transform: 'translateY(-50%) rotate(-90deg)', fontSize: 9.5,
              color: C.muted, fontWeight: 700, letterSpacing: '0.5px' }}>LIKELIHOOD →</div>
            <div style={{ position: 'absolute', bottom: -18, left: '50%',
              transform: 'translateX(-50%)', fontSize: 9.5,
              color: C.muted, fontWeight: 700, letterSpacing: '0.5px' }}>IMPACT →</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 30 }}>
            {[
              { label: 'Critical', color: C.red    },
              { label: 'High',     color: C.gold   },
              { label: 'Medium',   color: C.orange },
              { label: 'Low',      color: C.accent },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 10.5, color: C.muted2 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk list + detail */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16,
            maxHeight: 210, overflowY: 'auto' }}>
            {[...RISKS].sort((a,b) => riskScore(b) - riskScore(a)).map(r => {
              const isSel = selected.id === r.id;
              const col = riskColor(riskScore(r));
              return (
                <div key={r.id} onClick={() => setSelected(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    background: isSel ? `${col}10` : 'transparent',
                    border: `1px solid ${isSel ? col : 'transparent'}` }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: `${col}20`, color: col, fontSize: 9.5, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.id.replace('R','')}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                    {riskScore(r)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected risk detail */}
          <div style={{ padding: '16px 18px', background: `${riskColor(riskScore(selected))}08`,
            border: `1px solid ${riskColor(riskScore(selected))}35`, borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={15} color={riskColor(riskScore(selected))} />
              <span style={{ fontSize: 13.5, fontWeight: 800 }}>{selected.name}</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                background: `${C.blue}16`, color: C.blue, marginLeft: 'auto' }}>
                {selected.phase}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: C.muted }}>
                Likelihood: <strong style={{ color: C.text }}>{selected.likelihood}/5</strong>
              </span>
              <span style={{ fontSize: 11, color: C.muted }}>
                Impact: <strong style={{ color: C.text }}>{selected.impact}/5</strong>
              </span>
              <span style={{ fontSize: 11, color: C.muted }}>
                Score: <strong style={{ color: riskColor(riskScore(selected)) }}>{riskScore(selected)}/25</strong>
              </span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700,
                letterSpacing: '0.5px', marginBottom: 5 }}>MITIGATION</div>
              <p style={{ fontSize: 12, color: C.muted2, lineHeight: 1.6 }}>{selected.mitigation}</p>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 700,
                letterSpacing: '0.5px', marginBottom: 5 }}>CONTINGENCY (PLAN B)</div>
              <p style={{ fontSize: 12, color: C.muted2, lineHeight: 1.6 }}>{selected.contingency}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TIMELINE VIEW ────────────────────────────────────── */
function TimelineView() {
  const totalDays = 14;
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>14-Day Mission Timeline</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>Phase durations mapped across the full execution window.</p>
      </div>

      {/* Day ruler */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
        gap: 2, marginBottom: 6, paddingLeft: 110 }}>
        {Array.from({ length: totalDays }).map((_, i) => (
          <div key={i} style={{ fontSize: 9.5, color: C.muted, textAlign: 'center', fontFamily: 'monospace' }}>
            D{i + 1}
          </div>
        ))}
      </div>

      {/* Gantt rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {TIMELINE_PHASES.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 102, fontSize: 11.5, fontWeight: 700, color: p.color,
              flexShrink: 0, textAlign: 'right' }}>{p.name}</div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
              gap: 2, height: 26 }}>
              {Array.from({ length: totalDays }).map((_, d) => {
                const day = d + 1;
                const active = day >= p.start && day <= p.end;
                return (
                  <div key={d} style={{ borderRadius: 4,
                    background: active ? p.color : `${C.border}50`,
                    opacity: active ? 1 : 0.4 }} />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Gate markers */}
      <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Gate 1 → Day 1',  color: C.blue   },
          { label: 'Gate 2 → Day 7',  color: C.purple },
          { label: 'Gate 3 → Day 8',  color: C.gold   },
          { label: 'Gate 4 → Day 10', color: C.orange },
          { label: 'Gate 5 → Day 12', color: C.red    },
        ].map(g => (
          <div key={g.label} style={{ padding: '6px 12px', borderRadius: 7,
            background: `${g.color}10`, border: `1px solid ${g.color}30`,
            fontSize: 11, fontWeight: 700, color: g.color, display: 'flex',
            alignItems: 'center', gap: 6 }}>
            <Shield size={11} /> {g.label}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '16px 18px', background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Zap size={14} color={C.gold} />
          <span style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: '0.6px' }}>
            CRITICAL PATH
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.7 }}>
          Collection (Days 2–7) is the longest phase and the one most exposed to external failure
          (API rate limits, scraping blocks). Any slippage here compresses Fusion and Analysis.
          If Collection runs long, the Minimum Viable Scope fallback (R6 in the Risk Register)
          activates: drop the StatsBomb xG sub-study and proceed with goals-only outcomes.
        </p>
      </div>
    </div>
  );
}

/* ─── DECISION GATES VIEW ──────────────────────────────── */
function GatesView() {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Go / No-Go Decision Gates</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          5 checkpoints. Do not proceed past a gate until every criterion is met.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GATES.map((gate, i) => {
          const isOpen = open === i;
          return (
            <div key={i} onClick={() => setOpen(isOpen ? null : i)}
              style={{ background: isOpen ? `${gate.color}08` : C.card,
                border: `1px solid ${isOpen ? gate.color : C.border}`,
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <Shield size={20} color={gate.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: gate.color, fontWeight: 800,
                    letterSpacing: '0.6px', marginBottom: 2 }}>{gate.gate}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{gate.between}</div>
                </div>
                {isOpen ? <ChevronDown size={15} color={gate.color} /> : <ChevronRight size={15} color={C.muted} />}
              </div>
              {isOpen && (
                <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${gate.color}25` }}>
                  <div style={{ marginTop: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: C.accent, fontWeight: 700,
                      letterSpacing: '0.6px', marginBottom: 8 }}>GO CRITERIA (all required)</div>
                    {gate.criteria.map((c, j) => (
                      <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <CheckCircle2 size={14} color={C.accent} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: C.muted2 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 14px', background: `${C.red}08`,
                    border: `1px solid ${C.red}25`, borderRadius: 8,
                    display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle size={13} color={C.red} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.muted2, lineHeight: 1.6 }}>
                      <strong style={{ color: C.red }}>NO-GO ACTION: </strong>{gate.noGo}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── APP ROOT ─────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 28px', background: C.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Mountain size={14} color={C.accent} />
          <span style={{ fontSize: 10.5, color: C.accent, fontWeight: 700, letterSpacing: '1.2px' }}>
            OPERATION ALTITUDE SHIELD · MISSION CONTROL
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
              FIFA World Cup Environmental Stress Analytics — Mission Plan
            </h1>
            <p style={{ fontSize: 12.5, color: C.muted2 }}>
              14-Day Execution Window · 7 Phases · 10 Tracked Risks · 5 Decision Gates
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700,
              background: `${C.gold}14`, color: C.gold, border: `1px solid ${C.gold}28`,
              borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Activity size={11} /> PHASE 2 ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 28px',
        background: C.card, display: 'flex' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '12px 18px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 800 : 500,
            color: tab === i ? C.accent : C.muted2,
            borderBottom: `2px solid ${tab === i ? C.accent : 'transparent'}`,
            marginBottom: -1, transition: 'all 0.2s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '32px 28px' }}>
        {tab === 0 && <BriefingView />}
        {tab === 1 && <PhasesView />}
        {tab === 2 && <RiskMatrixView />}
        {tab === 3 && <TimelineView />}
        {tab === 4 && <GatesView />}
      </div>
    </div>
  );
}
