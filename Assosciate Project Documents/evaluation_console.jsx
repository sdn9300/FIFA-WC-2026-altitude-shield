import { useState } from "react";
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle, XCircle,
  Database, FlaskConical, Code2, Rocket, MessageSquare,
  Star, Calendar, Shield, AlertTriangle, Award
} from "lucide-react";

const C = {
  bg: '#050B18', card: '#0D1627', cardAlt: '#0A1020',
  border: '#1E2D4A', accent: '#00C896', blue: '#4361EE',
  red: '#EF4444', gold: '#F59E0B', purple: '#A855F7',
  orange: '#F97316', text: '#E8EDF5', muted: '#64748B', muted2: '#8895A7',
};

const TABS = ['Dimensions & Rubric', 'Live Scorecard', 'Statistical Validity', 'Definition of Done', 'Evaluation Calendar'];

/* ─── DIMENSIONS DATA ─────────────────────────────────── */
const DIMENSIONS = [
  { id: 'data', name: 'Data Quality & Integrity', weight: 20, color: C.blue, icon: Database,
    criteria: [
      'Completeness — 0% missing in required fields (elevation, goals, Elo)',
      'Accuracy — spot-checked elevations match known values within tolerance',
      'Consistency — team names normalised, zero duplicate (year, team, match) keys',
      'Validity — every value within plausible physical ranges',
    ]},
  { id: 'stats', name: 'Statistical Validity & Rigor', weight: 30, color: C.purple, icon: FlaskConical,
    criteria: [
      'Model family justified by an explicit overdispersion check (NB vs Poisson)',
      'Primary model (M4, GLMM) converges cleanly; VIF < 5; residuals show no pattern',
      'At least one hypothesis significant at p<0.05 AND survives all 4 sensitivity analyses',
      'Effect sizes reported with confidence intervals, not p-values alone',
      '2026 outputs framed explicitly as projections, never deterministic predictions',
    ]},
  { id: 'eng', name: 'Software Engineering Quality', weight: 20, color: C.gold, icon: Code2,
    criteria: [
      'renv::restore() succeeds on a clean checkout — full reproducibility',
      'testthat suite: 100% pass rate across unit, integration, and QA tests',
      'No secrets committed; .Renviron gitignored from the first commit',
      'CI pipeline (GitHub Actions) green on the main branch',
      'Every script numbered, single-responsibility, and documented',
    ]},
  { id: 'product', name: 'Product & Deployment Quality', weight: 15, color: C.accent, icon: Rocket,
    criteria: [
      'Next.js site: Lighthouse performance score > 90',
      'Shiny dashboard loads in under 5 seconds, all tabs functional',
      'Quarto report renders cleanly to both HTML and PDF',
      'All deployment URLs (Vercel, shinyapps.io, GitHub Pages) publicly resolve',
    ]},
  { id: 'comms', name: 'Communication & Portfolio Quality', weight: 15, color: C.orange, icon: MessageSquare,
    criteria: [
      'A non-statistician understands the headline finding in under 1 minute',
      'GitHub README engages a stranger for 3+ minutes (the "recruiter test")',
      'All 6 ADRs present and individually defensible in an interview',
      'Licence attribution complete and accurate for all 8 data sources',
    ]},
];

/* ─── STATISTICAL VALIDITY CHECKS ─────────────────────── */
const STAT_CHECKS = [
  { check: 'Overdispersion confirmed before choosing Negative Binomial', status: 'pass', detail: 'var(goals_against_2h) >> mean(...) confirmed in EDA' },
  { check: 'Random intercept for wc_year included (avoids pseudo-replication)', status: 'pass', detail: 'Matches within a tournament are not independent observations' },
  { check: 'Multicollinearity checked via VIF', status: 'pass', detail: 'All predictors VIF < 5 in M3/M4' },
  { check: 'Residual diagnostics inspected visually', status: 'pass', detail: 'No systematic pattern in plot(m4)' },
  { check: 'Altitude threshold sensitivity (800m vs 1000m)', status: 'pass', detail: 'Direction of effect unchanged at both thresholds' },
  { check: 'Group-stage-only robustness check (excludes ET distortion)', status: 'pass', detail: 'Effect holds when knockout extra-time matches removed' },
  { check: '2022 Qatar exclusion check', status: 'pass', detail: 'Core finding does not depend solely on the Qatar edition' },
  { check: 'xG outcome cross-validation (2018/22 subset)', status: 'partial', detail: 'Smaller sample (~128 rows) — directionally consistent, wider CI' },
  { check: 'Statistical power assessed honestly', status: 'partial', detail: 'Few matches above 1,500m — reported as an explicit limitation' },
  { check: 'No p-hacking — hypotheses pre-registered in Phase 0', status: 'pass', detail: 'H1–H5 locked before any model was fit' },
];

/* ─── EVALUATION CALENDAR ─────────────────────────────── */
const EVAL_CALENDAR = [
  { day: 'Day 1',  gate: 'Gate 1', evals: ['Environment reproducibility check'] },
  { day: 'Day 7',  gate: 'Gate 2', evals: ['Data completeness audit', 'Manual elevation cross-check'] },
  { day: 'Day 8',  gate: 'Gate 3', evals: ['Full testthat suite', 'Row-count integrity per join'] },
  { day: 'Day 10', gate: 'Gate 4', evals: ['Overdispersion check', 'Confound check (Elo vs h2_delta)'] },
  { day: 'Day 12', gate: 'Gate 5', evals: ['Model diagnostics', '4 sensitivity analyses', 'AIC comparison'] },
  { day: 'Day 14', gate: 'Final',  evals: ['Full scorecard evaluation', 'Recruiter 3-minute README test', 'All URLs live-checked'] },
];

/* ─── HELPERS ──────────────────────────────────────────── */
const StatusIcon = ({ status }) => {
  if (status === 'pass') return <CheckCircle2 size={15} color={C.accent} />;
  if (status === 'partial') return <AlertTriangle size={15} color={C.gold} />;
  return <XCircle size={15} color={C.red} />;
};

/* ─── DIMENSIONS VIEW ─────────────────────────────────── */
function DimensionsView() {
  const [open, setOpen] = useState(1);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>5 Evaluation Dimensions</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          Weighted to reflect what actually determines whether this project succeeds — statistical rigor carries the most weight.
        </p>
      </div>

      {/* Weight bar overview */}
      <div style={{ display: 'flex', height: 36, borderRadius: 9, overflow: 'hidden', marginBottom: 22 }}>
        {DIMENSIONS.map(d => (
          <div key={d.id} style={{ width: `${d.weight}%`, background: d.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.bg }}>{d.weight}%</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DIMENSIONS.map((d, i) => {
          const isOpen = open === i;
          return (
            <div key={d.id} onClick={() => setOpen(isOpen ? null : i)}
              style={{ background: isOpen ? `${d.color}08` : C.card,
                border: `1px solid ${isOpen ? d.color : C.border}`,
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: `${d.color}15`, border: `1px solid ${d.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <d.icon size={18} color={d.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{d.name}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                  background: `${d.color}16`, color: d.color }}>{d.weight}% of total</span>
                {isOpen ? <ChevronDown size={15} color={d.color} /> : <ChevronRight size={15} color={C.muted} />}
              </div>
              {isOpen && (
                <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${d.color}25` }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '0.6px',
                    margin: '14px 0 9px' }}>EVALUATION CRITERIA</div>
                  {d.criteria.map((c, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <Circle size={5} fill={d.color} color={d.color} style={{ marginTop: 6, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.6 }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── LIVE SCORECARD VIEW ─────────────────────────────── */
function ScorecardView() {
  const [scores, setScores] = useState({ data: 4, stats: 4, eng: 5, product: 3, comms: 4 });

  const overall = DIMENSIONS.reduce((sum, d) =>
    sum + (scores[d.id] / 5) * d.weight, 0);

  const verdict = overall >= 90 ? { label: 'PORTFOLIO READY', color: C.accent }
    : overall >= 75 ? { label: 'GOOD — MINOR REVISIONS', color: C.gold }
    : overall >= 60 ? { label: 'NEEDS WORK', color: C.orange }
    : { label: 'NOT READY', color: C.red };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Live Weighted Scorecard</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          Click a star rating (1–5) for each dimension. The overall score updates live.
        </p>
      </div>

      {/* Overall score display */}
      <div style={{ padding: '22px 24px', background: `${verdict.color}08`,
        border: `1px solid ${verdict.color}35`, borderRadius: 14, marginBottom: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700, letterSpacing: '0.8px', marginBottom: 6 }}>
            OVERALL WEIGHTED SCORE
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: verdict.color, letterSpacing: '-1px' }}>
            {overall.toFixed(1)}<span style={{ fontSize: 18, color: C.muted }}>/100</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Award size={28} color={verdict.color} />
          <span style={{ fontSize: 14, fontWeight: 800, color: verdict.color }}>{verdict.label}</span>
        </div>
      </div>

      {/* Per-dimension rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DIMENSIONS.map(d => (
          <div key={d.id} style={{ padding: '14px 18px', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: `${d.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <d.icon size={17} color={d.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{d.name}</div>
              <div style={{ fontSize: 10.5, color: C.muted }}>Weight: {d.weight}%</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n}
                  onClick={() => setScores(s => ({ ...s, [d.id]: n }))}
                  size={22} style={{ cursor: 'pointer' }}
                  fill={n <= scores[d.id] ? d.color : 'transparent'}
                  color={n <= scores[d.id] ? d.color : C.border}
                />
              ))}
            </div>
            <div style={{ width: 70, textAlign: 'right' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: d.color }}>
                {((scores[d.id] / 5) * d.weight).toFixed(1)}
              </span>
              <span style={{ fontSize: 11, color: C.muted }}> / {d.weight}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Threshold legend */}
      <div style={{ marginTop: 18, padding: '14px 18px', background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 12 }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 10 }}>
          SCORE THRESHOLDS
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { range: '90–100', label: 'Portfolio Ready',     color: C.accent },
            { range: '75–89',  label: 'Good — Minor Revisions', color: C.gold },
            { range: '60–74',  label: 'Needs Work',           color: C.orange },
            { range: '0–59',   label: 'Not Ready',            color: C.red },
          ].map(t => (
            <div key={t.label} style={{ padding: '6px 12px', borderRadius: 7,
              background: `${t.color}10`, border: `1px solid ${t.color}30`,
              fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: t.color, fontWeight: 800 }}>{t.range}</span>
              <span style={{ color: C.muted2 }}> — {t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── STATISTICAL VALIDITY VIEW ───────────────────────── */
function StatValidityView() {
  const passCount = STAT_CHECKS.filter(c => c.status === 'pass').length;
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Statistical Validity Checklist</h2>
          <p style={{ fontSize: 13, color: C.muted2 }}>The checks that separate a defensible finding from a lucky p-value.</p>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>
          {passCount}/{STAT_CHECKS.length} PASS
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STAT_CHECKS.map((c, i) => (
          <div key={i} style={{ padding: '12px 16px', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 10,
            display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <StatusIcon status={c.status} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>{c.check}</div>
              <div style={{ fontSize: 11.5, color: C.muted2 }}>{c.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, padding: '16px 18px', background: `${C.gold}08`,
        border: `1px solid ${C.gold}25`, borderRadius: 12, display: 'flex', gap: 10 }}>
        <AlertTriangle size={16} color={C.gold} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.65 }}>
          <strong style={{ color: C.gold }}>PARTIAL</strong> status is acceptable if the limitation is
          stated explicitly in the report — it becomes a failure only if it is silently omitted.
          The mission does not require every check to be a clean pass; it requires honesty about
          which ones aren't.
        </p>
      </div>
    </div>
  );
}

/* ─── DEFINITION OF DONE VIEW ──────────────────────────── */
function DoneView() {
  const [checked, setChecked] = useState({});
  const allCriteria = DIMENSIONS.flatMap(d => d.criteria.map((c, i) => ({ id: `${d.id}-${i}`, text: c, color: d.color, dim: d.name })));
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Definition of Done</h2>
          <p style={{ fontSize: 13, color: C.muted2 }}>Master checklist across all 5 dimensions. Click to mark complete.</p>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>
          {doneCount}/{allCriteria.length} DONE
        </div>
      </div>

      <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${(doneCount / allCriteria.length) * 100}%`,
          background: C.accent, transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {allCriteria.map(item => {
          const isDone = checked[item.id];
          return (
            <div key={item.id} onClick={() => setChecked(s => ({ ...s, [item.id]: !s[item.id] }))}
              style={{ padding: '11px 15px', background: isDone ? `${item.color}08` : C.card,
                border: `1px solid ${isDone ? item.color : C.border}`, borderRadius: 9,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, transition: 'all 0.15s' }}>
              {isDone
                ? <CheckCircle2 size={16} color={item.color} style={{ flexShrink: 0 }} />
                : <Circle size={16} color={C.muted} style={{ flexShrink: 0 }} />}
              <span style={{ fontSize: 12.5, color: isDone ? C.text : C.muted2,
                textDecoration: isDone ? 'line-through' : 'none', flex: 1 }}>{item.text}</span>
              <span style={{ fontSize: 9.5, color: item.color, fontWeight: 700, flexShrink: 0 }}>{item.dim.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── EVALUATION CALENDAR VIEW ─────────────────────────── */
function CalendarView() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Evaluation Calendar</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>Evaluation is continuous, not a single end-of-project event — it happens at every gate.</p>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 13, top: 14, bottom: 14, width: 2, background: C.border, zIndex: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {EVAL_CALENDAR.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: i === EVAL_CALENDAR.length - 1 ? C.accent : C.card,
                border: `2px solid ${i === EVAL_CALENDAR.length - 1 ? C.accent : C.blue}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={12} color={i === EVAL_CALENDAR.length - 1 ? C.bg : C.blue} />
              </div>
              <div style={{ flex: 1, padding: '12px 16px', background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 11 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{e.day}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: `${C.blue}16`, color: C.blue }}>{e.gate}</span>
                </div>
                {e.evals.map((ev, j) => (
                  <div key={j} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
                    <Circle size={4} fill={C.muted} color={C.muted} style={{ marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.muted2 }}>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 28px', background: C.card }}>
        <div style={{ fontSize: 10.5, color: C.accent, fontWeight: 700, letterSpacing: '1.2px', marginBottom: 6 }}>
          ⛰️ ALTITUDE & HEAT WC ANALYTICS · EVALUATION CONSOLE
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Project Evaluation Plan
        </h1>
        <p style={{ fontSize: 12.5, color: C.muted2 }}>
          5 Weighted Dimensions · Live Scorecard · Statistical Validity Audit · Definition of Done
        </p>
      </div>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 28px', background: C.card, display: 'flex', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: tab === i ? 800 : 500, whiteSpace: 'nowrap',
            color: tab === i ? C.accent : C.muted2,
            borderBottom: `2px solid ${tab === i ? C.accent : 'transparent'}`,
            marginBottom: -1, transition: 'all 0.2s' }}>{t}</button>
        ))}
      </div>
      <div style={{ padding: '32px 28px' }}>
        {tab === 0 && <DimensionsView />}
        {tab === 1 && <ScorecardView />}
        {tab === 2 && <StatValidityView />}
        {tab === 3 && <DoneView />}
        {tab === 4 && <CalendarView />}
      </div>
    </div>
  );
}
