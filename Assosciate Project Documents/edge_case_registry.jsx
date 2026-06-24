import { useState } from "react";
import {
  ChevronRight, ChevronDown, AlertOctagon, AlertTriangle,
  Info, CheckCircle2, Database, Mountain, Users, Plane,
  Terminal, Rocket, Search, Filter
} from "lucide-react";

const C = {
  bg: '#050B18', card: '#0D1627', cardAlt: '#0A1020',
  border: '#1E2D4A', accent: '#00C896', blue: '#4361EE',
  red: '#EF4444', gold: '#F59E0B', purple: '#A855F7',
  orange: '#F97316', text: '#E8EDF5', muted: '#64748B', muted2: '#8895A7',
};

const SEV_COLOR = { CRITICAL: C.red, HIGH: C.gold, MEDIUM: C.orange, LOW: C.accent };

const CATEGORIES = [
  { id: 'match', name: 'Match & Goal Data', icon: Database, color: C.blue, cases: [
    { id: 'EC-01', sev: 'CRITICAL', name: 'Stoppage-time goal misclassification',
      desc: '"45+2" parsed as minute 2 instead of minute 47 — silently relabels a 2nd-half goal as 1st-half.',
      handle: 'Regex must capture the BASE minute before "+", not the stoppage offset: str_extract(x, "^\\\\d+") on the pre-plus segment, not the full string.' },
    { id: 'EC-02', sev: 'HIGH', name: 'Own goals attributed to wrong team',
      desc: 'FBref marks own goals as "(OG)" — the goal counts FOR the opposing team, not the scorer\'s own team.',
      handle: 'Explicit parsing branch: if goal_note contains "(OG)", flip the for/against team assignment before aggregating.' },
    { id: 'EC-03', sev: 'CRITICAL', name: 'Extra-time goals counted as "2nd half"',
      desc: 'Knockout matches can run to 120 minutes. A goal in minute 95 is neither truly "1st" nor "2nd" half in the same sense as regular time.',
      handle: 'Create a separate goals_extra_time bucket. Exclude ET entirely from the primary h2_delta outcome; group-stage-only sensitivity check avoids this completely.' },
    { id: 'EC-04', sev: 'CRITICAL', name: 'Penalty shootout goals leaking into counts',
      desc: 'Shootout "goals" are a different FBref table section entirely and must never enter goals_against_2h.',
      handle: 'Explicitly scope the scraper to the "Score" event table only; shootout results live in a separate penalty_shootout table — never merge the two.' },
    { id: 'EC-05', sev: 'MEDIUM', name: '0–0 draws break the proportion metric',
      desc: 'prop_goals_2h = goals_against_2h / total_goals divides by zero when a match ends 0–0.',
      handle: 'if_else(total_goals > 0, goals_against_2h/total_goals, NA_real_) — never silently produce NaN or Inf.' },
    { id: 'EC-06', sev: 'LOW', name: 'Historical replayed knockout matches (1934, 1954)',
      desc: 'A handful of pre-1970 tied knockout matches were replayed entirely rather than going to extra time/penalties.',
      handle: 'Treat the replay as the canonical match; document the original tied match as excluded from the dataset with a one-line note in the data dictionary.' },
    { id: 'EC-07', sev: 'MEDIUM', name: 'FBref table layout differs across eras',
      desc: 'Pre-1990 tournament pages on FBref have a noticeably different HTML table structure than 2010+ pages.',
      handle: 'Write a year-conditional parsing branch; test the scraper against one known year from each structural era before running the full historical pull.' },
  ]},
  { id: 'venue', name: 'Venue & Climate', icon: Mountain, color: C.gold, cases: [
    { id: 'EC-08', sev: 'CRITICAL', name: 'Indoor / climate-controlled stadiums invalidate heat data',
      desc: 'Lusail (cooling tech), AT&T Stadium and Mercedes-Benz Stadium (retractable roofs, frequently closed), SoFi Stadium (covered canopy) — ambient outdoor weather does not reflect pitch-level conditions.',
      handle: 'Add is_climate_controlled flag per venue. Run the heat hypothesis (H2) both WITH and WITHOUT these venues — report both, since including them silently dilutes a true heat effect.' },
    { id: 'EC-09', sev: 'HIGH', name: 'Day vs night kickoff temperature mismatch',
      desc: 'Meteostat returns a DAILY average. A 9pm kickoff at 22°C and a 1pm kickoff at 38°C on the same date get an identical avg_temp_c value.',
      handle: 'Where available, prefer hourly Meteostat data filtered to actual kickoff time ±2 hours. If unavailable, document this as an explicit measurement-error limitation in the report.' },
    { id: 'EC-12', sev: 'CRITICAL', name: '2022 Qatar ran Nov–Dec, not June–July',
      desc: 'A hardcoded "always pull June–July" assumption silently fetches the wrong season\'s weather for the only winter World Cup in history.',
      handle: 'Explicit lookup table mapping wc_year → actual tournament months; Qatar 2022 maps to months c(11,12), every other year maps to c(6,7) (or c(5,6) for 2002).' },
    { id: 'EC-10', sev: 'MEDIUM', name: 'City name geocoding ambiguity',
      desc: '"Guadalajara" resolves to both Mexico and Spain; "Toledo" resolves to both Ohio and Spain — geocoders can silently pick the wrong continent.',
      handle: 'Always pass full "stadium, city, country" string to the geocoder, never city alone; manually verify the returned country matches the expected one.' },
    { id: 'EC-11', sev: 'LOW', name: 'SRTM satellite elevation resolution error',
      desc: 'Open-Elevation uses 90m-resolution satellite data — fine for mountains, imprecise for a single stadium footprint in dense urban terrain.',
      handle: 'Manual cross-check against Wikipedia/official stadium specs for every venue above 500m before accepting the API value.' },
    { id: 'EC-13', sev: 'LOW', name: 'Multiple stadiums in the same host city',
      desc: 'Mexico City alone has hosted matches at both Estadio Azteca and other venues across different tournaments — joining on city name alone can attach the wrong elevation.',
      handle: 'Always join on (venue_stadium, wc_year), never on city alone, even though stadium-level elevation rarely differs meaningfully within one city.' },
    { id: 'EC-14', sev: 'MEDIUM', name: 'Stadium renamed between tournaments (sponsorship)',
      desc: 'The same physical stadium can carry a different commercial name in 2014 versus 2022 listings, breaking simple string-match joins.',
      handle: 'Maintain a canonical_venue_id independent of the display name; build the alias mapping once in data/manual/venue_aliases.csv.' },
  ]},
  { id: 'team', name: 'Team Identity & Strength', icon: Users, color: C.purple, cases: [
    { id: 'EC-15', sev: 'CRITICAL', name: 'Defunct nations break every join',
      desc: '"West Germany", "Soviet Union", "Yugoslavia", "Czechoslovakia" appear in historical FBref/Kaggle data but have no modern Elo or FIFA ranking record under that name.',
      handle: 'Build team_name_lookup.csv mapping every historical name to either its modern successor code or a frozen historical code, applied BEFORE any join — never after.' },
    { id: 'EC-16', sev: 'MEDIUM', name: 'First-time qualifiers with no Elo history',
      desc: 'A nation appearing in its first-ever World Cup has no prior international match history to compute a meaningful pre-tournament Elo rating.',
      handle: 'Impute using the confederation-average Elo for that nation\'s region and era, flagged with an is_imputed_elo column — never silently leave as a true 0 or NA that breaks scaling.' },
    { id: 'EC-17', sev: 'LOW', name: 'FIFA-suspended or banned teams',
      desc: 'Russia (2022 ban), apartheid-era South Africa exclusion, and similar suspensions mean some nation-years are legitimately absent, not missing data.',
      handle: 'No fix needed — document as a known and correct absence in the data dictionary, distinct from a pipeline failure.' },
    { id: 'EC-18', sev: 'MEDIUM', name: 'Co-hosts qualify automatically',
      desc: 'Host nations skip the qualifying campaign entirely, so their pre-tournament form may be less battle-tested than a team that fought through qualifiers.',
      handle: 'Add an is_host flag as a covariate; check whether host status independently predicts performance before concluding altitude/heat alone explain a pattern.' },
    { id: 'EC-19', sev: 'LOW', name: 'Mid-tournament managerial change',
      desc: 'A coaching change between a team\'s matches is not reflected in the static pre-tournament Elo rating used as a quality control.',
      handle: 'Accepted limitation — document in the report rather than attempting in-tournament dynamic Elo updates, which is out of scope.' },
  ]},
  { id: 'model', name: 'Rest, Travel & Modelling', icon: Plane, color: C.red, cases: [
    { id: 'EC-20', sev: 'CRITICAL', name: 'First match of tournament has no rest_days reference',
      desc: 'There is no "previous match" to subtract a date from for a team\'s opening fixture.',
      handle: 'Use -1 as an explicit sentinel value, never NA — and document it in the data dictionary so it is never mistaken for missing data downstream.' },
    { id: 'EC-21', sev: 'MEDIUM', name: 'Qatar 2022: all venues within ~60km',
      desc: 'travel_km collapses to near-zero for the entire 2022 tournament, confounding "no travel fatigue" with "this was a structurally unusual edition."',
      handle: 'Run a sensitivity analysis excluding 2022 entirely to confirm the core finding does not depend on this single, geographically compressed tournament.' },
    { id: 'EC-23', sev: 'HIGH', name: 'Singular fit / convergence failure in GLMM',
      desc: 'With only 6–8 distinct wc_year levels, lme4 can produce a singular fit warning for the random intercept variance.',
      handle: 'If singular, simplify: drop the random slope (keep only random intercept), or fall back to a fixed wc_year effect with a documented trade-off in ADR-04.' },
    { id: 'EC-24', sev: 'HIGH', name: 'Elevation and temperature are negatively correlated',
      desc: 'Mexico City (2,240m) is mild, not hot. Gulf-region venues are low-elevation but extremely hot. This near-orthogonality can destabilise the interaction term in M5.',
      handle: 'Check VIF specifically on the elevation×temperature interaction term; if unstable, report main effects separately and treat the interaction model as exploratory only.' },
    { id: 'EC-25', sev: 'MEDIUM', name: 'Outlier blowout matches skew the NB fit',
      desc: 'A 7–1 scoreline contributes disproportionate leverage to a Negative Binomial model fit on ~512 rows.',
      handle: 'Run a sensitivity check excluding matches above the 97.5th percentile of total goals; confirm the altitude/heat coefficient direction is unchanged.' },
    { id: 'EC-26', sev: 'LOW', name: 'Same two teams meeting twice in one tournament',
      desc: 'Extremely rare, but a group-stage and later knockout rematch between identical opponents could violate uniqueness assumptions if match_id is built carelessly.',
      handle: 'Always include the match date in match_id construction, never just the team pair, guaranteeing uniqueness even for a rematch.' },
  ]},
  { id: 'pipeline', name: 'Pipeline & Engineering', icon: Terminal, color: C.orange, cases: [
    { id: 'EC-27', sev: 'HIGH', name: 'API timeout or null response mid-pipeline',
      desc: 'Open-Elevation or Meteostat occasionally returns a 503 or an empty result body for a valid coordinate.',
      handle: 'Wrap every API call in tryCatch(); on failure, log the specific (lat,lon) or (venue,date) key to a retry queue rather than silently inserting NA and moving on.' },
    { id: 'EC-28', sev: 'CRITICAL', name: 'FBref IP block mid-scrape',
      desc: 'A scrape interrupted at year 5 of 8 should never require restarting from year 1.',
      handle: 'Checkpoint after every tournament year completes — write to disk immediately. On re-run, skip any year whose cache file already exists.' },
    { id: 'EC-29', sev: 'MEDIUM', name: 'Encoding issues in accented names',
      desc: '"Côte d\'Ivoire" and "São Paulo" can silently corrupt to mangled characters if file I/O is not UTF-8 throughout.',
      handle: 'Force encoding = "UTF-8" explicitly on every readr::read_csv() and write_csv() call — never rely on the system locale default.' },
    { id: 'EC-30', sev: 'LOW', name: 'Kaggle dataset silently updated post-download',
      desc: 'A dataset maintainer pushing a revision after the initial download could change row counts or column names mid-project.',
      handle: 'Pin and record the dataset version/download date in the data dictionary; never re-download mid-sprint without re-validating the schema.' },
    { id: 'EC-31', sev: 'MEDIUM', name: 'StatsBomb JSON schema differs 2018 vs 2022',
      desc: 'Minor field-naming differences exist between StatsBomb\'s 2018 and 2022 World Cup event data exports.',
      handle: 'Write a version-aware parsing branch and unit-test it against one known match from each tournament before running the full extraction.' },
    { id: 'EC-32', sev: 'MEDIUM', name: 'Non-idempotent scrape creates duplicate cache rows',
      desc: 'Re-running a scraping script without a check-before-write guard can append duplicate rows to an existing cache file.',
      handle: 'Always check if(file.exists(cache_path)) and read+deduplicate before writing, or write to a fresh temp file and atomically replace.' },
  ]},
  { id: '2026', name: '2026 Extrapolation Risks', icon: Rocket, color: C.accent, cases: [
    { id: 'EC-33', sev: 'CRITICAL', name: '48-team, 104-match format is structurally unseen',
      desc: 'Every model in this project is trained on the 32-team, 64-match era. 2026 introduces a fundamentally larger and differently structured tournament.',
      handle: 'State this extrapolation risk explicitly and prominently in both the report and the website — 2026 outputs are projections under a structural assumption that may not hold.' },
    { id: 'EC-34', sev: 'HIGH', name: 'New "Round of 32" stage is an unseen factor level',
      desc: 'predict() on a categorical "stage" variable will error or silently misbehave if it encounters a factor level that did not exist in the training data.',
      handle: 'Map the new Round of 32 stage to the nearest structural equivalent (Round of 16 in the historical bracket) for prediction purposes, with this mapping documented as an explicit modelling choice.' },
    { id: 'EC-35', sev: 'CRITICAL', name: '2026 indoor stadiums need the same flag as EC-08',
      desc: 'AT&T Stadium, Mercedes-Benz Stadium, and SoFi Stadium are 2026 venues where naive outdoor weather data would misrepresent actual pitch conditions.',
      handle: 'Apply the is_climate_controlled flag prospectively to the 2026 venue table; either exclude these venues from the heat risk ranking or annotate them as "controlled — lower realised risk than ambient data suggests."' },
    { id: 'EC-36', sev: 'LOW', name: 'Three co-host nations auto-qualify for 2026',
      desc: 'USA, Canada, and Mexico all qualify automatically as hosts, the same structural pattern flagged in EC-18.',
      handle: 'Apply the same is_host covariate logic prospectively; no new handling required beyond what EC-18 already established.' },
    { id: 'EC-37', sev: 'LOW', name: 'Several 2026 cities have no World Cup historical record',
      desc: 'Cities like Kansas City or Atlanta have no prior World Cup match to anchor expectations, unlike Mexico City or Johannesburg.',
      handle: 'Elevation and climate data are independently obtainable regardless of WC history — the model only requires venue-level environmental data, not historical WC attendance at that exact city.' },
  ]},
];

const ALL_CASES = CATEGORIES.flatMap(c => c.cases.map(ec => ({ ...ec, cat: c.name, catColor: c.color })));

function SeverityBadge({ sev }) {
  const color = SEV_COLOR[sev];
  const Icon = sev === 'CRITICAL' ? AlertOctagon : sev === 'HIGH' ? AlertTriangle : sev === 'MEDIUM' ? Info : CheckCircle2;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800,
      padding: '2px 8px', borderRadius: 5, background: `${color}16`, color, border: `1px solid ${color}30` }}>
      <Icon size={10} /> {sev}
    </span>
  );
}

function CategoryView({ category }) {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {category.cases.map((ec, i) => {
        const isOpen = open === i;
        const color = SEV_COLOR[ec.sev];
        return (
          <div key={ec.id} onClick={() => setOpen(isOpen ? null : i)}
            style={{ background: isOpen ? `${color}07` : C.card,
              border: `1px solid ${isOpen ? color : C.border}`,
              borderRadius: 12, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s' }}>
            <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800,
                color: category.color, width: 48, flexShrink: 0 }}>{ec.id}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>{ec.name}</span>
              <SeverityBadge sev={ec.sev} />
              {isOpen ? <ChevronDown size={15} color={color} /> : <ChevronRight size={15} color={C.muted} />}
            </div>
            {isOpen && (
              <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${color}22` }}>
                <div style={{ marginTop: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 6 }}>
                    WHAT CAN GO WRONG
                  </div>
                  <p style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.65 }}>{ec.desc}</p>
                </div>
                <div style={{ padding: '11px 14px', background: `${C.accent}08`,
                  border: `1px solid ${C.accent}25`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: '0.6px', marginBottom: 6 }}>
                    HANDLING STRATEGY
                  </div>
                  <p style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.65 }}>{ec.handle}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [filterSev, setFilterSev] = useState('ALL');

  const sevCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  ALL_CASES.forEach(c => sevCounts[c.sev]++);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 28px', background: C.card }}>
        <div style={{ fontSize: 10.5, color: C.accent, fontWeight: 700, letterSpacing: '1.2px', marginBottom: 6 }}>
          ⛰️ ALTITUDE & HEAT WC ANALYTICS · EDGE CASE REGISTRY
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
              Edge Case Plan — {ALL_CASES.length} Catalogued Scenarios
            </h1>
            <p style={{ fontSize: 12.5, color: C.muted2 }}>
              6 categories · Severity-ranked · Each with explicit handling strategy
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(sevCounts).map(([sev, n]) => (
              <span key={sev} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700,
                background: `${SEV_COLOR[sev]}14`, color: SEV_COLOR[sev],
                border: `1px solid ${SEV_COLOR[sev]}28`, borderRadius: 6 }}>
                {n} {sev}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 28px', background: C.card,
        display: 'flex', overflowX: 'auto' }}>
        {CATEGORIES.map((cat, i) => (
          <button key={cat.id} onClick={() => setTab(i)} style={{
            padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: tab === i ? 800 : 500, whiteSpace: 'nowrap',
            color: tab === i ? cat.color : C.muted2,
            borderBottom: `2px solid ${tab === i ? cat.color : 'transparent'}`,
            marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            <cat.icon size={13} />
            {cat.name}
            <span style={{ fontSize: 10, opacity: 0.7 }}>({cat.cases.length})</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '32px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CATEGORIES[tab].icon size={18} color={CATEGORIES[tab].color} />
          <h2 style={{ fontSize: 18, fontWeight: 900 }}>{CATEGORIES[tab].name}</h2>
        </div>
        <CategoryView category={CATEGORIES[tab]} />
      </div>
    </div>
  );
}
