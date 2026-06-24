import { useState } from "react";
import {
  Database, Server, Globe, BarChart2, FileText,
  AlertTriangle, CheckCircle, ArrowRight, ChevronDown,
  ChevronRight, Layers, GitBranch, Shield, Zap, Clock,
  Activity, Target, Code, Box
} from "lucide-react";

/* ─── DESIGN TOKENS ───────────────────────────────────── */
const C = {
  bg: '#050B18', card: '#0D1627', cardAlt: '#0A1020',
  border: '#1E2D4A', borderHover: '#2D4470',
  accent: '#00C896', blue: '#4361EE', red: '#EF4444',
  gold: '#F59E0B', purple: '#A855F7', orange: '#F97316',
  text: '#E8EDF5', muted: '#64748B', muted2: '#8895A7',
};
const TABS = ['System Architecture', 'ETL Pipeline', 'Data Schema', '14-Day Sprint', 'ADRs'];

/* ─── DATA ────────────────────────────────────────────── */
const LAYERS = [
  { label: 'DATA SOURCES', color: C.blue, icon: Globe, components: [
    { name: 'FBref',           tag: 'Scrape',   desc: 'Match results 1930–2022'    },
    { name: 'StatsBomb',       tag: 'JSON',     desc: 'xG event data 2018/22'      },
    { name: 'Kaggle',          tag: 'CSV',      desc: 'Backup match datasets'      },
    { name: 'Open-Elevation',  tag: 'API',      desc: 'Stadium altitude lookup'    },
    { name: 'Meteostat',       tag: 'API',      desc: 'Historical weather API'     },
    { name: 'Elo Ratings',     tag: 'CSV',      desc: 'Team strength data'         },
    { name: 'Wikipedia',       tag: 'Scrape',   desc: 'Stadiums + capital elevs.'  },
    { name: 'FIFA 2026',       tag: 'Manual',   desc: 'Official 2026 venues'       },
  ]},
  { label: 'ETL LAYER (R Scripts)', color: C.purple, icon: Server, components: [
    { name: '01_scrape_matches.R',   tag: 'worldfootballR', desc: 'FBref results + half-time scores' },
    { name: '02_get_venues.R',       tag: 'rvest',          desc: 'Wikipedia stadium list'           },
    { name: '03_get_elevation.R',    tag: 'httr + Open-Elev', desc: 'Lat/lon → elevation metres'    },
    { name: '04_get_weather.R',      tag: 'Meteostat API',  desc: 'June-July temp + humidity'       },
    { name: '05_get_team_quality.R', tag: 'readr',          desc: 'Elo ratings + FIFA rank'         },
    { name: '06_integrate_data.R',   tag: 'dplyr + geosphere', desc: 'Master join + derived vars'   },
  ]},
  { label: 'STORAGE LAYER', color: C.gold, icon: Database, components: [
    { name: 'data/raw/',      tag: 'Source',   desc: 'Never edited — source of truth'     },
    { name: 'data/interim/',  tag: 'Cleaned',  desc: 'Single-source cleaned files'        },
    { name: 'data/final/',    tag: 'Master',   desc: 'team_match_master.csv (~512 rows)'  },
    { name: 'models/',        tag: '.rds',     desc: 'Saved model objects'                },
    { name: 'outputs/',       tag: 'Charts',   desc: 'PNG/SVG figure exports'             },
  ]},
  { label: 'ANALYTICS LAYER', color: C.accent, icon: BarChart2, components: [
    { name: '07_eda.Rmd',       tag: 'Quarto',   desc: 'Exploratory analysis report'      },
    { name: '08_features.R',    tag: 'dplyr',    desc: 'Feature engineering pipeline'     },
    { name: '09_models.R',      tag: 'lme4+MASS',desc: 'GLMM Neg. Binomial M1–M5'        },
    { name: '10_viz.R',         tag: 'ggplot2',  desc: '6 publication-quality charts'     },
    { name: '11_predict_2026.R',tag: 'predict()',desc: '2026 venue risk scores'           },
  ]},
  { label: 'OUTPUT LAYER', color: C.orange, icon: FileText, components: [
    { name: 'Quarto Report',    tag: 'HTML/PDF', desc: 'Full analytical report'          },
    { name: 'Shiny Dashboard',  tag: 'shinyapps.io', desc: 'Interactive model explorer'  },
    { name: 'Next.js Website',  tag: 'Vercel',   desc: 'Portfolio + research site'       },
    { name: 'GitHub Repository',tag: 'Public',   desc: 'Reproducible codebase'           },
  ]},
];

const ETL_STEPS = [
  { n:'01', name:'Match Data Extraction',    color: C.blue,
    inputs:  ['FBref World Cup pages', 'Kaggle WC CSVs'],
    outputs: ['data/raw/fbref/matches_YYYY.csv'],
    fns:     ['worldfootballR::get_match_results()', 'rvest::html_table()', 'Sys.sleep(3)'],
    notes:   'Cache every year immediately. Sys.sleep(3) mandatory. Total: ~35 min.',
    risk:'HIGH', riskMsg:'FBref rate-limits aggressively' },
  { n:'02', name:'xG Event Extraction',       color: C.purple,
    inputs:  ['StatsBomb open-data JSON (2018, 2022)'],
    outputs: ['data/raw/statsbomb/xg_by_half_2018.csv', 'xg_by_half_2022.csv'],
    fns:     ['StatsBombR::FreeCompetitions()', 'free_allevents(Parallel=TRUE)', 'dplyr::filter(type.name=="Shot")'],
    notes:   '~300MB download. Run once and cache. CC BY-NC-SA 4.0 licence.',
    risk:'LOW', riskMsg:'Free, no rate limit' },
  { n:'03', name:'Venue Geocoding',           color: C.gold,
    inputs:  ['Wikipedia stadium table', 'FIFA 2026 manual CSV'],
    outputs: ['data/interim/venues_geocoded.csv'],
    fns:     ['tidygeocoder::geocode(method="osm")', 'rvest::html_nodes("table.wikitable")'],
    notes:   'OSM Nominatim: free, no key. Manual verify ambiguous historical venues.',
    risk:'MEDIUM', riskMsg:'Geocoding accuracy for pre-1990 stadiums' },
  { n:'04', name:'Elevation Lookup',          color: C.orange,
    inputs:  ['venues_geocoded.csv (lat, lon)'],
    outputs: ['data/interim/venues_elevation.csv'],
    fns:     ['httr::GET("api.open-elevation.com/api/v1/lookup")', 'jsonlite::fromJSON()', 'Sys.sleep(0.5)'],
    notes:   'Free API, no key. SRTM 90m resolution. Manual cross-check all >500m.',
    risk:'LOW', riskMsg:'Reliable SRTM satellite data' },
  { n:'05', name:'Historical Weather',        color: C.accent,
    inputs:  ['venues_geocoded.csv', 'WC year + month dates'],
    outputs: ['data/interim/venues_climate.csv'],
    fns:     ['httr::GET("meteostat.p.rapidapi.com/point/monthly")', 'purrr::map2_dfr()', 'Sys.getenv("METEOSTAT_KEY")'],
    notes:   '⚠️ 2022 Qatar WC = Nov–Dec (not June–July!). Store key in .Renviron.',
    risk:'MEDIUM', riskMsg:'API key required; 2022 dates are unusual' },
  { n:'06', name:'Team Quality Data',         color: '#A855F7',
    inputs:  ['eloratings.net CSV', 'Kaggle FIFA rankings CSV'],
    outputs: ['data/interim/elo_ratings.csv', 'data/interim/fifa_rankings.csv'],
    fns:     ['readr::read_csv()', 'dplyr::filter(date <= start_date)', 'purrr::map_dbl()'],
    notes:   'FIFA rankings only from 1993. Elo available from 1872. Use Elo as primary control.',
    risk:'LOW', riskMsg:'Static CSV downloads — no scraping needed' },
  { n:'07', name:'Master Integration',        color: C.red,
    inputs:  ['matches_clean.csv', 'venues_climate.csv', 'elo_ratings.csv'],
    outputs: ['data/final/team_match_master.csv'],
    fns:     ['dplyr::left_join()', 'geosphere::distHaversine()', 'lubridate::as.Date()', 'log1p()'],
    notes:   '🔴 CRITICAL JOIN: team name mismatches → silent NA rows. Validate row count after.',
    risk:'HIGH', riskMsg:'Silent NA rows from name mismatches are invisible without validation' },
];

const SCHEMA_GROUPS = [
  { label: 'Identifiers', color: C.blue, cols: [
    { name:'wc_year',         type:'INT',  key:true,  desc:'e.g. 2022' },
    { name:'match_id',        type:'CHR',  key:true,  desc:'"2022_ARG_FRA_Final"' },
    { name:'match_date',      type:'DATE', key:false, desc:'actual match date' },
    { name:'stage',           type:'CHR',  key:false, desc:'"Group"|"R16"|"QF"|"SF"|"Final"' },
    { name:'team',            type:'CHR',  key:true,  desc:'FIFA 3-letter code' },
    { name:'opponent',        type:'CHR',  key:false, desc:'FIFA 3-letter code' },
  ]},
  { label: 'Venue & Climate', color: C.gold, cols: [
    { name:'venue_city',      type:'CHR',  key:false, desc:'e.g. "Lusail"' },
    { name:'elevation_m',     type:'NUM',  key:false, desc:'metres ASL (Open-Elevation API)' },
    { name:'log_elevation',   type:'NUM',  key:false, desc:'log1p(elevation_m) — model input' },
    { name:'is_high_alt',     type:'BOOL', key:false, desc:'elevation_m > 1,000m' },
    { name:'avg_temp_c',      type:'NUM',  key:false, desc:'June–July mean °C (Meteostat)' },
    { name:'avg_humidity_pct',type:'NUM',  key:false, desc:'June–July mean %' },
    { name:'heat_stress_idx', type:'NUM',  key:false, desc:'temp_c × (humidity/100)' },
  ]},
  { label: 'Match Outcomes ★', color: C.accent, cols: [
    { name:'goals_for_1h',     type:'INT', key:false, desc:'goals scored, 1st half' },
    { name:'goals_for_2h',     type:'INT', key:false, desc:'goals scored, 2nd half' },
    { name:'goals_against_1h', type:'INT', key:false, desc:'goals conceded, 1st half' },
    { name:'goals_against_2h', type:'INT', key:false, desc:'★ PRIMARY OUTCOME — model target' },
    { name:'h2_delta',         type:'NUM', key:false, desc:'goals_against_2h − goals_against_1h' },
    { name:'xg_against_2h',   type:'NUM', key:false, desc:'xG conceded 2H (2018/22 only; NA prior)' },
  ]},
  { label: 'Team Quality Controls', color: C.purple, cols: [
    { name:'team_elo_pre',    type:'NUM', key:false, desc:'Elo at tournament start date' },
    { name:'opp_elo_pre',     type:'NUM', key:false, desc:'Opponent Elo' },
    { name:'elo_diff',        type:'NUM', key:false, desc:'team_elo − opp_elo' },
    { name:'elo_diff_scaled', type:'NUM', key:false, desc:'z-scored elo_diff (model input)' },
    { name:'team_fifa_rank',  type:'INT', key:false, desc:'June FIFA rank (1994+ only; NA earlier)' },
  ]},
  { label: 'Fatigue Controls', color: C.orange, cols: [
    { name:'rest_days',       type:'INT', key:false, desc:'days since last WC match (−1 = first)' },
    { name:'is_first_match',  type:'BOOL',key:false, desc:'rest_days == −1' },
    { name:'travel_km',       type:'NUM', key:false, desc:'Haversine from previous venue' },
    { name:'log_travel_km',   type:'NUM', key:false, desc:'log1p(travel_km) — model input' },
    { name:'opp_rest_days',   type:'INT', key:false, desc:'opponent rest days' },
  ]},
  { label: 'Adaptation Flags', color: C.red, cols: [
    { name:'team_origin_elev_m', type:'NUM',  key:false, desc:'home capital elevation (Wikipedia)' },
    { name:'is_altitude_team',   type:'BOOL', key:false, desc:'team_origin_elev_m > 1,000' },
    { name:'altitude_matchup',   type:'CHR',  key:false, desc:'"Alt vs Sea"|"Both Alt"|"Both Sea"' },
  ]},
];

const SPRINT = [
  { d:'1',  task:'Setup & Scaffold',        cat:'Setup',     items:['Git init + renv','Folder structure','README','Dockerfile','AGENT_GUIDE.md'] },
  { d:'2',  task:'FBref Match Data',        cat:'ETL',       items:['worldfootballR scrape 2002–2022','Save per-year CSVs','Validate row counts'] },
  { d:'3',  task:'StatsBomb xG Data',       cat:'ETL',       items:['StatsBombR FreeCompetitions','Extract xG per half','2018 & 2022 only'] },
  { d:'4',  task:'Parse Goal Halves',       cat:'ETL',       items:['Split goal minute strings','H1/H2 classification','Wide format pivot'] },
  { d:'5',  task:'Venue Geocoding',         cat:'ETL',       items:['Wikipedia rvest scrape','tidygeocoder OSM','Validate coordinates'] },
  { d:'6',  task:'Elevation + Weather',     cat:'ETL',       items:['Open-Elevation API calls','Meteostat API pull','Cache both results'] },
  { d:'7',  task:'Team Quality + 2026',     cat:'ETL',       items:['Elo CSV download','FIFA rankings Kaggle','2026 venues manual CSV'] },
  { d:'8',  task:'Master Integration',      cat:'ETL',       items:['All left_joins','Rest days + travel km','testthat validation suite'] },
  { d:'9',  task:'EDA Quarto Report',       cat:'Analysis',  items:['Distributions + correlations','Confound checks','Render to HTML'] },
  { d:'10', task:'Feature Engineering',     cat:'Analysis',  items:['log_elevation','heat_stress_idx','Adaptation flags','Scaled vars'] },
  { d:'11', task:'Statistical Models',      cat:'Modelling', items:['Models M1–M5','GLMM Negative Binomial','Sensitivity analyses'] },
  { d:'12', task:'2026 Predictions',        cat:'Modelling', items:['predict() on 2026 venues','Risk matrix chart','Team vulnerability'] },
  { d:'13', task:'Visualisations + Report', cat:'Output',    items:['6 publication charts','Full Quarto report','Coefficient plots'] },
  { d:'14', task:'Deploy Everything',       cat:'Output',    items:['Shiny → shinyapps.io','Next.js → Vercel','GitHub public + README'] },
];

const CAT_COLORS = {
  Setup:    C.muted2, ETL: C.blue, Analysis: C.purple,
  Modelling: C.gold,  Output: C.accent,
};

const ADRS = [
  { id:'ADR-01', title:'Scope: 1994–2022 as primary dataset', status:'ACCEPTED', color: C.accent,
    decision:'Use 1994–2022 as the core analysis window (8 WC editions). FIFA Rankings available from 1993; goal minute data is reliably structured from 1994 onward in FBref. Consistent coverage of all needed variables.',
    alternatives:'Full 1930–2022 (rejected: pre-1994 data lacks FIFA rank, has inconsistent goal minute records); 2002–2022 (rejected: loses 1994/1998 USA + France editions which have altitude venues).' },
  { id:'ADR-02', title:'Negative Binomial over Poisson regression', status:'ACCEPTED', color: C.blue,
    decision:'Use Negative Binomial family in GLMM because goals_against_2h shows overdispersion (variance >> mean in EDA). Poisson assumes var=mean, which produces underestimated standard errors and inflated significance — false positives.',
    alternatives:'Poisson GLM (rejected: overdispersion violates assumption); Linear LMM (rejected: count outcome, non-normal residuals); Beta regression (rejected: proportion outcome loses zero-concession information).' },
  { id:'ADR-03', title:'1,000m as the altitude threshold', status:'ACCEPTED', color: C.gold,
    decision:'Binary threshold at 1,000m based on Wehrlin & Hallén (2006): VO₂max reduction becomes clinically meaningful (~6%) above this elevation. FIFA restricts competitive matches above 2,500m. Sensitivity check at 800m confirms core results are robust.',
    alternatives:'2,000m threshold (rejected: only Mexico City qualifies, insufficient statistical power); 500m (rejected: physiological effect below meaningful detection threshold).' },
  { id:'ADR-04', title:'Random intercept for wc_year in GLMM', status:'ACCEPTED', color: C.purple,
    decision:'Matches within the same WC edition are not independent — they share refereeing styles, ball technology, rule interpretations, and macroeconomic conditions. Ignoring this clustering inflates false positive rates (Type I error). Random intercept accounts for tournament-level baseline differences.',
    alternatives:'Fixed year effects (rejected: wastes degrees of freedom with only 8 levels; multicollinear with some venue variables); No year control (rejected: Simpson\'s Paradox risk — 2014 Brazil trend dominates).' },
  { id:'ADR-05', title:'R as primary language (not Python)', status:'ACCEPTED', color: C.orange,
    decision:'worldfootballR, tidygeocoder, lme4, Quarto, and Shiny all have superior R implementations with no Python equivalent at the same maturity level. Statistical modelling ecosystem in R (lme4, MASS, broom.mixed) is battle-tested for this class of mixed-effects count models.',
    alternatives:'Python (rejected: statsmodels GLMM less mature than lme4; no worldfootballR equivalent; mixed effects count models less supported); R + Python hybrid (rejected: adds environment complexity for minimal gain).' },
  { id:'ADR-06', title:'Flat CSV files over a database', status:'ACCEPTED', color: C.muted2,
    decision:'Dataset is ~512 rows × 30 columns. SQLite or PostgreSQL adds engineering complexity (connection management, schema migrations, ORM layer) with zero performance benefit. Flat CSVs are version-controllable via Git, human-inspectable, and trivially portable.',
    alternatives:'SQLite (rejected: overkill for dataset size; adds dependency); PostgreSQL (rejected: deployment complexity, requires running server); Arrow/Parquet (rejected: marginal benefit for this data scale).' },
];

/* ─── HELPER COMPONENTS ──────────────────────────────── */
const Tag = ({ label, color }) => (
  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px',
    background: `${color}16`, color, border: `1px solid ${color}28`,
    borderRadius: 4, letterSpacing: '0.3px', flexShrink: 0 }}>
    {label}
  </span>
);

const SectionLabel = ({ children, color }) => (
  <div style={{ fontSize: 10.5, color, fontWeight: 800,
    letterSpacing: '1px', marginBottom: 14 }}>
    {children}
  </div>
);

/* ─── ARCHITECTURE VIEW ─────────────────────────────── */
function ArchitectureView() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing:'-0.5px', marginBottom: 6 }}>
          5-Layer System Architecture
        </h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          Click any layer to expand components. Data flows top-to-bottom through all 5 layers.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LAYERS.map((layer, i) => {
          const isExp = expanded === i;
          return (
            <div key={i}>
              {/* Layer header */}
              <div
                onClick={() => setExpanded(isExp ? null : i)}
                style={{ display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px', background: C.card,
                  border: `1px solid ${isExp ? layer.color : C.border}`,
                  borderRadius: isExp ? '12px 12px 0 0' : 12,
                  cursor: 'pointer', marginBottom: isExp ? 0 : 6,
                  transition: 'border-color 0.2s',
                  background: isExp ? `${layer.color}0A` : C.card }}>
                <div style={{ width: 36, height: 36, borderRadius: 9,
                  background: `${layer.color}15`, border: `1px solid ${layer.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <layer.icon size={18} color={layer.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: layer.color,
                    letterSpacing: '0.8px', marginBottom: 2 }}>LAYER {i + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{layer.label}</div>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginRight: 8 }}>
                  {layer.components.length} components
                </div>
                {isExp
                  ? <ChevronDown size={16} color={layer.color} />
                  : <ChevronRight size={16} color={C.muted} />}
              </div>

              {/* Expanded components */}
              {isExp && (
                <div style={{ padding: '16px 20px', background: `${layer.color}05`,
                  border: `1px solid ${layer.color}`, borderTop: 'none',
                  borderRadius: '0 0 12px 12px', marginBottom: 6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {layer.components.map((comp, j) => (
                      <div key={j} style={{ padding: '10px 12px', background: C.card,
                        border: `1px solid ${C.border}`, borderRadius: 9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                          <Tag label={comp.tag} color={layer.color} />
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>{comp.name}</div>
                        <div style={{ fontSize: 11, color: C.muted2, lineHeight: 1.5 }}>{comp.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connector arrow (not after last layer) */}
              {i < LAYERS.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <div style={{ width: 1, height: 8, background: C.border }} />
                    <ArrowRight size={14} color={C.muted} style={{ transform: 'rotate(90deg)' }} />
                    <div style={{ width: 1, height: 4, background: C.border }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 28, padding: '16px 20px', background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 12 }}>
        <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700,
          letterSpacing: '0.8px', marginBottom: 12 }}>DEPLOYMENT TARGETS</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'R Scripts',      where: 'Local / GitHub',   color: C.blue   },
            { label: 'Quarto Report',  where: 'GitHub Pages',     color: C.purple },
            { label: 'Shiny App',      where: 'shinyapps.io',     color: C.gold   },
            { label: 'Next.js Site',   where: 'Vercel CDN',       color: C.accent },
            { label: 'Docker Image',   where: 'rocker/rstudio',   color: C.orange },
          ].map(d => (
            <div key={d.label} style={{ padding: '7px 12px', background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8,
              display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{d.label}</span>
              <span style={{ fontSize: 11, color: C.muted }}>→ {d.where}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ETL PIPELINE VIEW ─────────────────────────────── */
function ETLView() {
  const [active, setActive] = useState(null);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
          ETL Pipeline — 7 Steps
        </h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          Click a step to see full details. Steps 01–06 produce interim files; Step 07 produces the master dataset.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ETL_STEPS.map((step, i) => {
          const isAct = active === i;
          return (
            <div key={i} onClick={() => setActive(isAct ? null : i)}
              style={{ background: isAct ? `${step.color}08` : C.card,
                border: `1px solid ${isAct ? step.color : C.border}`,
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                transition: 'all 0.2s' }}>

              {/* Step header */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: `${step.color}15`, border: `1px solid ${step.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: step.color,
                    fontFamily: 'monospace' }}>{step.n}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 3 }}>{step.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {step.inputs.map((inp, j) => (
                      <Tag key={j} label={inp} color={C.blue} />
                    ))}
                    <span style={{ color: C.muted, fontSize: 11 }}>→</span>
                    {step.outputs.map((out, j) => (
                      <Tag key={j} label={out} color={step.color} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px',
                    borderRadius: 5, background: step.risk === 'HIGH' ? `${C.red}18` : step.risk === 'MEDIUM' ? `${C.gold}18` : `${C.accent}18`,
                    color: step.risk === 'HIGH' ? C.red : step.risk === 'MEDIUM' ? C.gold : C.accent,
                    border: `1px solid ${step.risk === 'HIGH' ? C.red : step.risk === 'MEDIUM' ? C.gold : C.accent}30` }}>
                    {step.risk}
                  </span>
                  {isAct ? <ChevronDown size={15} color={step.color} /> : <ChevronRight size={15} color={C.muted} />}
                </div>
              </div>

              {/* Expanded detail */}
              {isAct && (
                <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${step.color}25` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 14 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700,
                        letterSpacing: '0.6px', marginBottom: 8 }}>KEY R FUNCTIONS</div>
                      {step.fns.map((fn, j) => (
                        <div key={j} style={{ padding: '5px 10px', background: C.bg,
                          border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 5,
                          fontFamily: 'monospace', fontSize: 11.5, color: step.color }}>
                          {fn}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700,
                        letterSpacing: '0.6px', marginBottom: 8 }}>IMPLEMENTATION NOTES</div>
                      <div style={{ padding: '12px 14px', background: C.bg,
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        fontSize: 13, color: C.muted2, lineHeight: 1.65 }}>
                        {step.notes}
                      </div>
                      <div style={{ marginTop: 10, padding: '8px 12px',
                        background: step.risk === 'HIGH' ? `${C.red}09` : `${C.gold}09`,
                        border: `1px solid ${step.risk === 'HIGH' ? C.red : C.gold}28`,
                        borderRadius: 7, fontSize: 12, color: step.risk === 'HIGH' ? C.red : C.gold,
                        display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                        <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span>{step.riskMsg}</span>
                      </div>
                    </div>
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

/* ─── SCHEMA VIEW ────────────────────────────────────── */
function SchemaView() {
  const [openGroup, setOpenGroup] = useState(0);
  const totalCols = SCHEMA_GROUPS.reduce((s, g) => s + g.cols.length, 0);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
          Master Dataset Schema
        </h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C.muted2 }}>
            Table: <code style={{ color: C.accent, fontFamily: 'monospace' }}>team_match_master</code>
          </span>
          <Tag label={`${totalCols} columns`} color={C.accent} />
          <Tag label="~512 rows (1994–2022)" color={C.blue} />
          <Tag label="1 row = 1 team × 1 match" color={C.gold} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SCHEMA_GROUPS.map((group, i) => {
          const isOpen = openGroup === i;
          return (
            <div key={i} style={{ border: `1px solid ${isOpen ? group.color : C.border}`,
              borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <div onClick={() => setOpenGroup(isOpen ? null : i)}
                style={{ padding: '13px 18px', display: 'flex', alignItems: 'center',
                  gap: 12, cursor: 'pointer',
                  background: isOpen ? `${group.color}08` : C.card }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%',
                  background: group.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 800, flex: 1 }}>{group.label}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{group.cols.length} columns</span>
                {isOpen
                  ? <ChevronDown size={15} color={group.color} />
                  : <ChevronRight size={15} color={C.muted} />}
              </div>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${group.color}30` }}>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 70px 40px 1fr',
                    padding: '8px 18px', background: `${group.color}06`,
                    fontSize: 10.5, color: C.muted, fontWeight: 700, letterSpacing: '0.5px' }}>
                    <span>COLUMN NAME</span>
                    <span>TYPE</span>
                    <span>KEY</span>
                    <span>DESCRIPTION</span>
                  </div>
                  {group.cols.map((col, j) => (
                    <div key={j} style={{ display: 'grid',
                      gridTemplateColumns: '180px 70px 40px 1fr',
                      padding: '9px 18px', borderTop: `1px solid ${C.border}`,
                      background: j % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12.5,
                        fontWeight: 700, color: group.color }}>{col.name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11,
                        color: C.muted2, background: `${C.border}80`,
                        padding: '2px 6px', borderRadius: 4, display: 'inline-block',
                        width: 'fit-content' }}>{col.type}</span>
                      <span style={{ fontSize: 13 }}>{col.key ? '🔑' : ''}</span>
                      <span style={{ fontSize: 12.5, color: C.muted2,
                        fontStyle: col.name.includes('★') ? 'italic' : 'normal' }}>
                        {col.desc}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Missing value policy */}
      <div style={{ marginTop: 20, padding: '16px 20px', background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 12 }}>
        <div style={{ fontSize: 10.5, color: C.gold, fontWeight: 700,
          letterSpacing: '0.8px', marginBottom: 12 }}>EXPECTED MISSING VALUE POLICY</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { col: 'xg_* columns',     pct: '~75% NA', reason: 'StatsBomb only covers 2018/2022 — CORRECT', ok: true },
            { col: 'team_fifa_rank',   pct: '<10% NA',  reason: 'Some teams unranked in 1994 — ACCEPTABLE', ok: true },
            { col: 'rest_days = −1',   pct: '~12%',     reason: 'First match of tournament — CORRECT', ok: true },
            { col: 'elevation_m',      pct: '0% NA',    reason: 'REQUIRED — pipeline fails if any missing', ok: false },
            { col: 'goals_against_2h', pct: '0% NA',    reason: 'REQUIRED — this is the outcome variable', ok: false },
            { col: 'team_elo_pre',     pct: '<5% NA',   reason: 'Impute via linear interpolation if needed', ok: true },
          ].map(item => (
            <div key={item.col} style={{ padding: '9px 12px', background: C.bg,
              border: `1px solid ${item.ok ? C.border : `${C.red}40`}`,
              borderRadius: 8 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                color: item.ok ? C.muted2 : C.red, marginBottom: 4 }}>{item.col}</div>
              <div style={{ fontSize: 13, fontWeight: 800,
                color: item.ok ? C.gold : C.red, marginBottom: 3 }}>{item.pct}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{item.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SPRINT VIEW ────────────────────────────────────── */
function SprintView() {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
          14-Day Sprint Plan
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(CAT_COLORS).map(([cat, col]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', background: `${col}14`,
              border: `1px solid ${col}30`, borderRadius: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: col }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {SPRINT.map((day, i) => {
          const col = CAT_COLORS[day.cat];
          const isHov = hovered === i;
          return (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ background: isHov ? `${col}10` : C.card,
                border: `1px solid ${isHov ? col : C.border}`,
                borderRadius: 10, padding: '10px 11px',
                cursor: 'default', transition: 'all 0.2s', minHeight: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: col,
                  fontFamily: 'monospace', letterSpacing: '-1px' }}>{day.d}</span>
                <span style={{ fontSize: 8.5, fontWeight: 700, padding: '1px 5px',
                  background: `${col}18`, color: col, borderRadius: 3,
                  letterSpacing: '0.3px' }}>{day.cat.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 7,
                lineHeight: 1.35, color: isHov ? C.text : C.text }}>{day.task}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {day.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%',
                      background: col, flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontSize: 10.5, color: C.muted2, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase bar */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 6fr 2fr 2fr', gap: 4 }}>
        {[
          { label: 'Day 1\nSetup',     span: 1, color: C.muted2 },
          { label: 'Days 2–8: ETL Pipeline → Master Dataset', span: 6, color: C.blue },
          { label: 'Days 9–12\nAnalysis & Models', span: 2, color: C.purple },
          { label: 'Days 13–14\nOutput & Deploy', span: 2, color: C.accent },
        ].map((phase, i) => (
          <div key={i} style={{ padding: '8px 12px', background: `${phase.color}12`,
            border: `1px solid ${phase.color}30`, borderRadius: 7, textAlign: 'center' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: phase.color,
              whiteSpace: 'pre-line', lineHeight: 1.4 }}>{phase.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ADR VIEW ───────────────────────────────────────── */
function ADRView() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
          Architecture Decision Records
        </h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>
          6 ADRs documenting all major technical decisions and their rationale.
          Every decision you'll be asked about in a portfolio review.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ADRS.map((adr, i) => {
          const isOpen = open === i;
          return (
            <div key={i} onClick={() => setOpen(isOpen ? null : i)}
              style={{ background: isOpen ? `${adr.color}07` : C.card,
                border: `1px solid ${isOpen ? adr.color : C.border}`,
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                transition: 'all 0.2s' }}>
              <div style={{ padding: '15px 18px', display: 'flex',
                alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9,
                  background: `${adr.color}14`, border: `1px solid ${adr.color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 900, color: adr.color,
                    fontFamily: 'monospace' }}>{adr.id.split('-')[1]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: adr.color, fontWeight: 700,
                    letterSpacing: '0.6px', marginBottom: 3 }}>{adr.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{adr.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px',
                    background: `${C.accent}16`, color: C.accent,
                    border: `1px solid ${C.accent}28`, borderRadius: 4 }}>
                    {adr.status}
                  </span>
                  {isOpen
                    ? <ChevronDown size={15} color={adr.color} />
                    : <ChevronRight size={15} color={C.muted} />}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 18px 18px',
                  borderTop: `1px solid ${adr.color}25` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: C.accent, fontWeight: 700,
                        letterSpacing: '0.6px', marginBottom: 8 }}>DECISION</div>
                      <div style={{ padding: '12px 14px', background: `${C.accent}07`,
                        border: `1px solid ${C.accent}20`, borderRadius: 9,
                        fontSize: 13, color: C.muted2, lineHeight: 1.7 }}>
                        {adr.decision}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, color: C.red, fontWeight: 700,
                        letterSpacing: '0.6px', marginBottom: 8 }}>ALTERNATIVES REJECTED</div>
                      <div style={{ padding: '12px 14px', background: `${C.red}07`,
                        border: `1px solid ${C.red}20`, borderRadius: 9,
                        fontSize: 13, color: C.muted2, lineHeight: 1.7 }}>
                        {adr.alternatives}
                      </div>
                    </div>
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

/* ─── APP ROOT ───────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`,
        padding: '20px 28px', background: C.card }}>
        <div style={{ fontSize: 10.5, color: C.accent, fontWeight: 700,
          letterSpacing: '1.2px', marginBottom: 5 }}>
          ⛰️ ALTITUDE & HEAT · FIFA WORLD CUP ANALYTICS
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
              System Architecture Document
            </h1>
            <p style={{ fontSize: 12.5, color: C.muted2 }}>
              R Pipeline · ETL Design · Data Schema · 14-Day Sprint · ADRs · Deployment
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Version 1.0', color: C.accent },
              { label: 'Status: Approved', color: C.blue },
              { label: 'R + Next.js + Shiny', color: C.gold },
            ].map(b => (
              <span key={b.label} style={{ padding: '4px 10px', fontSize: 11,
                fontWeight: 700, background: `${b.color}14`, color: b.color,
                border: `1px solid ${b.color}28`, borderRadius: 6 }}>{b.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', background: C.card, display: 'flex' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '12px 18px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13,
            fontWeight: tab === i ? 800 : 500,
            color: tab === i ? C.accent : C.muted2,
            borderBottom: `2px solid ${tab === i ? C.accent : 'transparent'}`,
            marginBottom: -1, transition: 'all 0.2s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '32px 28px', overflowY: 'auto' }}>
        {tab === 0 && <ArchitectureView />}
        {tab === 1 && <ETLView />}
        {tab === 2 && <SchemaView />}
        {tab === 3 && <SprintView />}
        {tab === 4 && <ADRView />}
      </div>
    </div>
  );
}
