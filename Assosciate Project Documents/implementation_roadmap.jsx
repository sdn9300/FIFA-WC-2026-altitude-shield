import { useState } from "react";
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle, Code2,
  Database, Mountain, CloudRain, Plane, TrendingUp, GitMerge,
  FlaskConical, Rocket, Terminal, Shield, Package
} from "lucide-react";

const C = {
  bg: '#050B18', card: '#0D1627', cardAlt: '#0A1020',
  border: '#1E2D4A', accent: '#00C896', blue: '#4361EE',
  red: '#EF4444', gold: '#F59E0B', purple: '#A855F7',
  orange: '#F97316', text: '#E8EDF5', muted: '#64748B', muted2: '#8895A7',
};

const TABS = ['Phases', 'Code Library', 'Testing & QA', 'CI/CD & Deploy'];

/* ─── PHASES DATA ─────────────────────────────────────── */
const PHASES = [
  { n: '00', name: 'Environment & Scaffold', days: 'Day 1', color: C.muted2, icon: Terminal,
    tasks: ['renv::init() + lockfile', 'Install 24 R packages', 'Folder structure: data/raw, interim, final', 'Dockerfile (rocker/rstudio:4.3.0)', 'GitHub Actions CI skeleton', 'README + AGENT_GUIDE.md'],
    deliverable: 'Reproducible R environment + GitHub repo',
    validation: 'renv::restore() succeeds on a clean checkout' },
  { n: '01', name: 'Match Data Collection', days: 'Days 2–3', color: C.blue, icon: Database,
    tasks: ['get_match_urls() + get_match_results() via worldfootballR, 2002–2022', 'Kaggle CSV ingestion as cross-check', 'StatsBombR pull for 2018/2022 xG', 'Parse goal-time strings → 1H/2H classification'],
    deliverable: 'matches_raw.csv + goals_df (goals by half)',
    validation: 'Sum of goals_for_1h + goals_for_2h == official FT score for every match' },
  { n: '02', name: 'Venue & Geospatial Data', days: 'Days 4–5', color: C.gold, icon: Mountain,
    tasks: ['Compile stadium list (Wikipedia + FIFA 2026 manual)', 'tidygeocoder::geocode() via OSM Nominatim', 'Open-Elevation API lookup per lat/lon', 'Cache coords + elevations to avoid re-querying'],
    deliverable: 'venues.csv — venue, lat, lon, elevation_m',
    validation: 'Mexico City ≈2240m, London ≈10–15m, Johannesburg ≈1750m' },
  { n: '03', name: 'Climate Data Collection', days: 'Days 5–6', color: C.orange, icon: CloudRain,
    tasks: ['Meteostat JSON API call per venue + WC year window', 'Handle 2022 Qatar Nov–Dec exception explicitly', 'Cache by (venue, date) to respect 500 calls/month free tier', 'Join match date → climate row'],
    deliverable: 'venues_climate.csv — temp_c, humidity_pct by venue/year',
    validation: 'Temperature in [-10, 50]°C, humidity in [0, 100]%' },
  { n: '04', name: 'Travel, Rest & Team Strength', days: 'Days 6–7', color: C.purple, icon: Plane,
    tasks: ['rest_days via lag(date) per team within tournament', 'travel_km via geosphere::distHaversine()', 'Elo rating lookup at tournament start date', 'Altitude adaptation flag from capital city elevation'],
    deliverable: 'team_schedule.csv — rest_days, travel_km, elo_diff, adapted_flag',
    validation: 'distHaversine(0°,0° → 0°,1°) ≈ 111 km sanity check passes' },
  { n: '05', name: 'Master Table Assembly', days: 'Day 8', color: C.red, icon: GitMerge,
    tasks: ['Sequential left_joins: matches + venues + climate + elo + adaptation', 'Row-count assertion after every individual join', 'Full testthat QA suite execution', 'Schema type enforcement (int/num/date/logical)'],
    deliverable: 'team_match_master.csv — ~512 rows × schema-locked columns',
    validation: 'Zero NA in required keys; no duplicate (year, match_id, team)' },
  { n: '06', name: 'Statistical Modelling & EDA', days: 'Days 9–11', color: C.accent, icon: TrendingUp,
    tasks: ['Quarto EDA: distributions, confound checks, correlations', 'Overdispersion check → justify glm.nb() over Poisson', 'Fit M1→M5 model sequence with lme4/MASS', '4 sensitivity analyses + diagnostics (VIF, residuals, AIC)'],
    deliverable: 'EDA report + 5 fitted model objects (.rds)',
    validation: 'M4 (GLMM) converges; ≥1 hypothesis significant at p<0.05' },
  { n: '07', name: 'Reporting, Dashboard & Deploy', days: 'Days 12–14', color: '#22D3EE', icon: Rocket,
    tasks: ['Render full Quarto report (HTML + PDF)', 'Build + deploy Shiny dashboard to shinyapps.io', 'Build + deploy Next.js site to Vercel', 'Finalise README, ADRs, GitHub Actions CI green'],
    deliverable: 'Live report + dashboard + website + public GitHub repo',
    validation: 'All 4 URLs publicly resolve; CI pipeline passes on main' },
];

/* ─── CODE LIBRARY DATA ───────────────────────────────── */
const CODE_SNIPPETS = [
  { cat: 'Match Scraping', color: C.blue, icon: Database, lang: 'r',
    code: `library(worldfootballR)

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
# Sys.sleep(3) between calls — FBref rate-limits aggressively` },
  { cat: 'Goal Half Parsing', color: C.blue, icon: Database, lang: 'r',
    code: `library(dplyr); library(stringr)

goals_df <- matches_tbl %>%
  separate_rows(goal_times, sep = ";") %>%
  mutate(
    minute = as.integer(str_extract(goal_times, "\\\\d+")),
    half   = ifelse(minute <= 45, "1H", "2H")
  ) %>%
  group_by(year, match_id, team) %>%
  summarize(
    goals_for_1h = sum(half=="1H" & team==home_team),
    goals_for_2h = sum(half=="2H" & team==home_team),
    goals_against_1h = sum(half=="1H" & team==away_team),
    goals_against_2h = sum(half=="2H" & team==away_team)
  )` },
  { cat: 'Geocoding', color: C.gold, icon: Mountain, lang: 'r',
    code: `library(tidygeocoder)

stadiums <- tibble(venue = ..., city = ..., country = ...)

coords <- stadiums %>%
  geocode(
    address = paste(venue, city, country),
    method = "osm",
    full_results = FALSE
  )
# Check for NA results — retry with city name only if stadium fails` },
  { cat: 'Elevation API', color: C.gold, icon: Mountain, lang: 'r',
    code: `library(httr2)

elev_req <- request("https://api.open-elevation.com/api/v1/lookup") %>%
  req_url_query(locations = paste(lat, lon, sep = ","))

elev_json <- elev_req %>% req_perform() %>% resp_body_json()
elevation <- elev_json$results$elevation
# Free tier: 1,000 req/month. Sys.sleep(1) between calls. Cache by lat,lon.` },
  { cat: 'Weather API', color: C.orange, icon: CloudRain, lang: 'r',
    code: `base_url <- "https://meteostat.p.rapidapi.com/point/daily"

weather_json <- request(base_url) %>%
  req_headers(
    "x-rapidapi-host" = "meteostat.p.rapidapi.com",
    "x-rapidapi-key"  = Sys.getenv("METEOSTAT_KEY")
  ) %>%
  req_url_query(lat=stad_lat, lon=stad_lon,
                start="YYYY-MM-01", end="YYYY-MM-31") %>%
  req_perform() %>% resp_body_json()

weather_df <- tibble(date = weather_json$data$date,
                      temp_c = weather_json$data$tavg,
                      rh_pct = weather_json$data$rhum)
# 2022 Qatar WC ran Nov–Dec, NOT June–July. Hardcode this exception.` },
  { cat: 'Travel Distance', color: C.purple, icon: Plane, lang: 'r',
    code: `library(geosphere)

team_schedule <- team_schedule %>%
  arrange(date) %>%
  mutate(prev_lat = lag(venue_lat), prev_lon = lag(venue_lon)) %>%
  mutate(travel_km = distHaversine(
    cbind(prev_lon, prev_lat),
    cbind(venue_lon, venue_lat)
  ) / 1000)
# distHaversine returns METERS — always divide by 1000` },
  { cat: 'Rest Days', color: C.purple, icon: Plane, lang: 'r',
    code: `team_schedule <- team_schedule %>%
  group_by(team, wc_year) %>%
  arrange(date) %>%
  mutate(
    rest_days = as.integer(date - lag(date)),
    rest_days = if_else(is.na(rest_days), -1L, rest_days)
  ) %>%
  ungroup()
# -1 is a sentinel for "first match" — not a true NA` },
  { cat: 'Master Join', color: C.red, icon: GitMerge, lang: 'r',
    code: `master <- matches_clean %>%
  left_join(venues_climate,     by = c("wc_year","venue_city"))
stopifnot(nrow(master) == 512)   # ← assert after THIS join

master <- master %>%
  left_join(team_quality, by = c("wc_year","team"))
stopifnot(nrow(master) == 512)   # ← assert after THIS join too

master <- master %>%
  left_join(team_quality, by = c("wc_year","opponent"="team"),
            suffix = c("", "_opp"))
stopifnot(nrow(master) == 512)   # ← never wait until the end to check` },
  { cat: 'Primary Model', color: C.accent, icon: TrendingUp, lang: 'r',
    code: `library(lme4); library(lmerTest)

m4 <- glmer.nb(
  goals_against_2h ~ log_elevation + avg_temp_c +
    elo_diff_scaled + is_altitude_team +
    rest_days_clean + log_travel_km +
    (1 | wc_year),
  data = master
)
summary(m4)
car::vif(m4)   # All values should be < 5` },
];

/* ─── TESTING DATA ────────────────────────────────────── */
const TESTS = [
  { group: 'Unit Tests', color: C.blue, items: [
    { name: 'parse_goal_times("45+2") → "1H"',  code: 'expect_equal(classify_half(47, base=45), "H1")' },
    { name: 'distHaversine known distance',      code: 'expect_equal(round(dist/1000), 111)  # 1° lat ≈ 111km' },
    { name: 'Team name normalisation',           code: 'expect_equal(normalise_team("West Germany"), "GER")' },
  ]},
  { group: 'Integration Tests', color: C.purple, items: [
    { name: 'Goal sums match official scores',   code: 'expect_equal(sum(goals_for_1h, goals_for_2h), ft_score)' },
    { name: 'No duplicate (match_id, team) keys', code: 'expect_equal(sum(duplicated(master[c("match_id","team")])), 0)' },
    { name: 'Elevation/weather merge succeeded',  code: 'expect_equal(sum(is.na(master$elevation_m)), 0)' },
  ]},
  { group: 'Data Quality (QA) Rules', color: C.gold, items: [
    { name: 'No missing keys',                    code: 'expect_equal(sum(is.na(master$team)), 0)' },
    { name: 'Humidity in valid range',             code: 'expect_true(all(between(master$humidity, 0, 100)))' },
    { name: 'Elevation non-negative',              code: 'expect_true(all(master$elevation_m >= 0, na.rm=TRUE))' },
    { name: 'Temperature plausible',                code: 'expect_true(all(between(master$temp_c, -10, 50)))' },
  ]},
];

/* ─── HELPERS ──────────────────────────────────────────── */
const Pill = ({ children, color }) => (
  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
    background: `${color}16`, color, border: `1px solid ${color}28` }}>{children}</span>
);

const CodeBlock = ({ code, color }) => (
  <pre style={{ background: C.bg, border: `1px solid ${color}25`, borderRadius: 9,
    padding: '13px 15px', fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace",
    color: C.muted2, overflowX: 'auto', lineHeight: 1.65, margin: 0 }}>
    <code>{code}</code>
  </pre>
);

/* ─── PHASES VIEW ─────────────────────────────────────── */
function PhasesView() {
  const [open, setOpen] = useState(1);
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>8-Phase Implementation Plan</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>Phase 00 through 07 — strict sequential dependency. Click to expand.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PHASES.map((p, i) => {
          const isOpen = open === i;
          return (
            <div key={i} onClick={() => setOpen(isOpen ? null : i)}
              style={{ background: isOpen ? `${p.color}08` : C.card,
                border: `1px solid ${isOpen ? p.color : C.border}`,
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s' }}>
              <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: `${p.color}15`, border: `1px solid ${p.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p.icon size={18} color={p.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 9.5, color: p.color, fontWeight: 800,
                      fontFamily: 'monospace' }}>PHASE {p.n}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>· {p.days}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                </div>
                {isOpen ? <ChevronDown size={15} color={p.color} /> : <ChevronRight size={15} color={C.muted} />}
              </div>
              {isOpen && (
                <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${p.color}25` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, paddingTop: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 8 }}>TASKS</div>
                      {p.tasks.map((t, j) => (
                        <div key={j} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                          <Circle size={5} color={p.color} style={{ marginTop: 6, flexShrink: 0 }} fill={p.color} />
                          <span style={{ fontSize: 12, color: C.muted2 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 8 }}>DELIVERABLE</div>
                      <div style={{ padding: '9px 12px', background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: 8, fontSize: 11.5, fontFamily: 'monospace', color: C.text, marginBottom: 12 }}>
                        {p.deliverable}
                      </div>
                      <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 8 }}>VALIDATION</div>
                      <div style={{ fontSize: 12, color: C.muted2, lineHeight: 1.6 }}>{p.validation}</div>
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

/* ─── CODE LIBRARY VIEW ───────────────────────────────── */
function CodeLibraryView() {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Implementation Code Library</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>Copy-paste reference snippets for every pipeline component.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {CODE_SNIPPETS.map((s, i) => {
            const isOpen = open === i;
            return (
              <div key={i} onClick={() => setOpen(i)}
                style={{ padding: '10px 13px', borderRadius: 9, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 9,
                  background: isOpen ? `${s.color}10` : 'transparent',
                  border: `1px solid ${isOpen ? s.color : 'transparent'}` }}>
                <s.icon size={15} color={s.color} />
                <span style={{ fontSize: 12.5, fontWeight: isOpen ? 700 : 500,
                  color: isOpen ? C.text : C.muted2 }}>{s.cat}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Code2 size={14} color={CODE_SNIPPETS[open].color} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>{CODE_SNIPPETS[open].cat}</span>
            <Pill color={CODE_SNIPPETS[open].color}>{CODE_SNIPPETS[open].lang.toUpperCase()}</Pill>
          </div>
          <CodeBlock code={CODE_SNIPPETS[open].code} color={CODE_SNIPPETS[open].color} />
        </div>
      </div>
    </div>
  );
}

/* ─── TESTING VIEW ────────────────────────────────────── */
function TestingView() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Testing & QA Strategy</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>3 categories, run via testthat after every pipeline phase.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {TESTS.map((group, i) => (
          <div key={i} style={{ border: `1px solid ${group.color}30`, borderRadius: 12,
            background: `${group.color}06`, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FlaskConical size={15} color={group.color} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: group.color }}>{group.group}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map((item, j) => (
                <div key={j} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12,
                  padding: '8px 0', borderTop: j > 0 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <CheckCircle2 size={13} color={group.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.muted2 }}>{item.name}</span>
                  </div>
                  <code style={{ fontSize: 11, fontFamily: 'monospace', color: C.text,
                    background: C.bg, padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}` }}>
                    {item.code}
                  </code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DEPLOY VIEW ─────────────────────────────────────── */
function DeployView() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>CI/CD & Deployment</h2>
        <p style={{ fontSize: 13, color: C.muted2 }}>Reproducibility infrastructure and deployment targets.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={{ padding: '16px 18px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Package size={14} color={C.blue} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.blue }}>Dockerfile</span>
          </div>
          <CodeBlock color={C.blue} code={`FROM rocker/rstudio:4.3.0
WORKDIR /home/rstudio/project
COPY renv.lock ./
RUN R -e "install.packages('renv');
          renv::restore()"
COPY . .
CMD ["Rscript", "scripts/run_all.R"]`} />
        </div>
        <div style={{ padding: '16px 18px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Shield size={14} color={C.purple} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.purple }}>GitHub Actions CI</span>
          </div>
          <CodeBlock color={C.purple} code={`on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: r-lib/actions/setup-r@v2
      - uses: r-lib/actions/
            setup-r-dependencies@v2
      - run: Rscript -e 'renv::restore()'
      - run: Rscript -e 'devtools::test()'`} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 10 }}>
          DEPLOYMENT TARGETS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { name: 'R Pipeline',   target: 'GitHub + Docker',  color: C.blue   },
            { name: 'Quarto Report',target: 'GitHub Pages',     color: C.purple },
            { name: 'Shiny App',    target: 'shinyapps.io',     color: C.gold   },
            { name: 'Next.js Site', target: 'Vercel CDN',       color: C.accent },
          ].map(d => (
            <div key={d.name} style={{ padding: '12px 14px', background: C.bg,
              border: `1px solid ${d.color}30`, borderRadius: 9, textAlign: 'center' }}>
              <Rocket size={16} color={d.color} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{d.name}</div>
              <div style={{ fontSize: 10.5, color: d.color }}>{d.target}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 18px', background: `${C.gold}08`,
        border: `1px solid ${C.gold}25`, borderRadius: 12 }}>
        <div style={{ fontSize: 10.5, color: C.gold, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 10 }}>
          LICENCE COMPLIANCE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { src: 'FBref',        lic: 'Personal use only' },
            { src: 'StatsBomb',    lic: 'CC BY-NC-SA 4.0'   },
            { src: 'Open-Elevation', lic: 'GPLv2, free <1k/mo' },
            { src: 'Meteostat',    lic: 'Free <500 calls/mo' },
            { src: 'Elo Ratings',  lic: 'Public, cite source' },
            { src: 'Wikipedia',    lic: 'CC BY-SA' },
          ].map(l => (
            <div key={l.src} style={{ padding: '8px 11px', background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 7 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700 }}>{l.src}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{l.lic}</div>
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
          ⛰️ ALTITUDE & HEAT WC ANALYTICS
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Phase-Wise Implementation Plan
        </h1>
        <p style={{ fontSize: 12.5, color: C.muted2 }}>
          8 Phases · Full Code Library · Testing Strategy · CI/CD & Deployment
        </p>
      </div>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 28px', background: C.card, display: 'flex' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '12px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === i ? 800 : 500,
            color: tab === i ? C.accent : C.muted2,
            borderBottom: `2px solid ${tab === i ? C.accent : 'transparent'}`,
            marginBottom: -1, transition: 'all 0.2s' }}>{t}</button>
        ))}
      </div>
      <div style={{ padding: '32px 28px' }}>
        {tab === 0 && <PhasesView />}
        {tab === 1 && <CodeLibraryView />}
        {tab === 2 && <TestingView />}
        {tab === 3 && <DeployView />}
      </div>
    </div>
  );
}
