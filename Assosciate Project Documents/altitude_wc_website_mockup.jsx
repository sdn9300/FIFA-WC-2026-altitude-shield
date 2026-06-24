import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import {
  Mountain, Thermometer, AlertTriangle, ChevronRight,
  Activity, Database, Settings, Globe, Target, Wind, Clock
} from "lucide-react";

const C = {
  bg: '#050B18', card: '#0D1627', cardAlt: '#0A1020',
  border: '#1E2D4A', borderLight: '#253450',
  accent: '#00C896', blue: '#4361EE', red: '#EF4444',
  gold: '#F59E0B', purple: '#A855F7',
  text: '#E8EDF5', muted: '#64748B', muted2: '#8895A7'
};

const altitudeCurve = [
  { m: "0m", pct: 0 },
  { m: "500m", pct: 2.5 },
  { m: "1000m", pct: 6 },
  { m: "1500m", pct: 9.5 },
  { m: "2000m", pct: 13 },
  { m: "2240m", pct: 14.8 },
];

const venues2026 = [
  { city: "Mexico City",  elev: 2240, risk: 92, flag: "🇲🇽", cat: "CRITICAL", cc: C.red    },
  { city: "Guadalajara",  elev: 1566, risk: 71, flag: "🇲🇽", cat: "HIGH",     cc: C.gold   },
  { city: "Denver",       elev: 1609, risk: 69, flag: "🇺🇸", cat: "HIGH",     cc: C.gold   },
  { city: "Miami",        elev: 3,    risk: 58, flag: "🇺🇸", cat: "MEDIUM",   cc: '#F97316'},
  { city: "Dallas",       elev: 183,  risk: 51, flag: "🇺🇸", cat: "MEDIUM",   cc: '#F97316'},
  { city: "Kansas City",  elev: 320,  risk: 42, flag: "🇺🇸", cat: "MEDIUM",   cc: '#F97316'},
  { city: "Atlanta",      elev: 298,  risk: 38, flag: "🇺🇸", cat: "LOW",      cc: C.accent },
  { city: "Seattle",      elev: 8,    risk: 21, flag: "🇺🇸", cat: "LOW",      cc: C.accent },
];

const hypotheses = [
  { id:"H1", title:"Altitude Effect",    desc:"Elevation > 1,000m → more 2nd-half goals conceded",         icon: Mountain,    color: C.red    },
  { id:"H2", title:"Heat Stress",        desc:"Temp > 28°C reduces offensive output measurably",            icon: Thermometer, color: C.gold   },
  { id:"H3", title:"Combined Stress",    desc:"Altitude × heat interaction is super-additive",              icon: Activity,    color: C.purple },
  { id:"H4", title:"Rest Amplification", desc:"≤3 rest days magnifies environmental fatigue penalties",     icon: Clock,       color: C.blue   },
  { id:"H5", title:"Altitude Immunity",  desc:"High-altitude native teams resist 2nd-half deterioration",  icon: Globe,       color: C.accent },
];

const pipeline = [
  { step:"01", label:"Data Ingestion",      desc:"FBref · StatsBomb\nElo · Meteostat\nOpen-Elevation",        icon: Database    },
  { step:"02", label:"Feature Engineering", desc:"Elevation · Heat Index\nRest Days · Travel (km)\nAdapt. flag", icon: Settings   },
  { step:"03", label:"EDA",                 desc:"Distributions\nCorrelations\nConfound checks",              icon: Activity    },
  { step:"04", label:"GLMM Modelling",      desc:"Negative Binomial\nMixed Effects\nSensitivity runs",        icon: Mountain    },
  { step:"05", label:"2026 Predictions",    desc:"Venue risk matrix\nTeam vulnerability\nFatigue profiles",   icon: Target      },
];

const researchQuestions = [
  { q: "Does altitude increase 2nd-half goal concessions?",          icon: Mountain,    color: C.red    },
  { q: "Does heat reduce offensive productivity in elite football?",  icon: Thermometer, color: C.gold   },
  { q: "Does travel burden compound environmental fatigue?",          icon: Wind,        color: C.blue   },
  { q: "Do shorter rest periods amplify venue stress effects?",       icon: Clock,       color: C.purple },
  { q: "Are altitude-native teams physiologically immune?",           icon: Globe,       color: C.accent },
  { q: "Which 2026 venues pose the highest environmental risk?",      icon: AlertTriangle,color:C.gold   },
];

export default function App() {
  const [activeHyp, setActiveHyp] = useState(null);
  const [hoveredVenue, setHoveredVenue] = useState(null);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflowX: "hidden", lineHeight: 1.5 }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{ background: "rgba(5,11,24,0.96)", borderBottom: `1px solid ${C.border}`,
        padding: "0 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 62,
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 22 }}>⛰️</span>
          <div>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.3px" }}>
              <span style={{ color: C.accent }}>Altitude</span>
              <span style={{ color: C.muted2 }}> & Heat</span>
            </span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>WC Analytics</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {["Research", "Data", "Analysis", "2026 Risk", "Report"].map(item => (
            <button key={item} style={{ padding: "6px 13px", fontSize: 12.5, color: C.muted2,
              background: "transparent", border: "none", cursor: "pointer", borderRadius: 6,
              fontWeight: 500 }}>
              {item}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: C.border, margin: "0 8px" }} />
          <button style={{ padding: "7px 18px", fontSize: 12.5, background: C.accent,
            color: "#000", border: "none", borderRadius: 7, fontWeight: 700, cursor: "pointer" }}>
            Dashboard →
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "76px 28px 60px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

        {/* Left copy */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 13px", background: "rgba(0,200,150,0.09)",
            border: `1px solid rgba(0,200,150,0.25)`, borderRadius: 20, marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, display: "inline-block" }} />
            <span style={{ fontSize: 10.5, color: C.accent, fontWeight: 700, letterSpacing: "0.8px" }}>
              FIFA WORLD CUP 2026 · ENVIRONMENTAL ANALYTICS
            </span>
          </div>

          <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.08,
            marginBottom: 20, letterSpacing: "-2px" }}>
            Does Altitude &amp; Heat<br />
            <span style={{ background: `linear-gradient(125deg, ${C.accent} 0%, ${C.blue} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text" }}>
              Decide World Cups?
            </span>
          </h1>

          <p style={{ fontSize: 15, color: C.muted2, lineHeight: 1.78, marginBottom: 32, maxWidth: 470 }}>
            A large-scale statistical investigation into how altitude, extreme heat, humidity,
            and travel fatigue shape team performance across <strong style={{ color: C.text }}>
            92 years of FIFA World Cup data</strong> — with direct predictive insights for 2026.
          </p>

          <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
            <button style={{ padding: "12px 24px", background: C.accent, color: "#000",
              border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>
              Explore the Analysis →
            </button>
            <button style={{ padding: "12px 24px", background: "transparent", color: C.text,
              border: `1px solid ${C.border}`, borderRadius: 8, fontWeight: 600,
              cursor: "pointer", fontSize: 13.5 }}>
              View 2026 Risk Map
            </button>
          </div>

          <div style={{ display: "flex", gap: 0, marginTop: 38, paddingTop: 28,
            borderTop: `1px solid ${C.border}` }}>
            {[
              { num: "512+",  label: "Team-match observations" },
              { num: "1930",  label: "Historical data coverage" },
              { num: "2026",  label: "Predictive target year"  },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1,
                borderRight: i < 2 ? `1px solid ${C.border}` : "none",
                paddingRight: i < 2 ? 24 : 0,
                paddingLeft: i > 0 ? 24 : 0 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.accent,
                  letterSpacing: "-1px" }}>{s.num}</div>
                <div style={{ fontSize: 11.5, color: C.muted2, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: VO₂max chart card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 18, padding: "24px 24px 20px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, color: C.muted2, letterSpacing: "0.6px",
              fontWeight: 600, marginBottom: 4 }}>PHYSIOLOGICAL IMPACT MODEL</div>
            <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.3px" }}>
              VO₂max Reduction by Venue Altitude
            </div>
          </div>

          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={altitudeCurve} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.red} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="m" tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 18]} />
              <Tooltip
                contentStyle={{ background: C.cardAlt, border: `1px solid ${C.border}`,
                  borderRadius: 8, fontSize: 12 }}
                formatter={v => [`${v}%`, "VO₂max Reduction"]}
              />
              <Area type="monotone" dataKey="pct" stroke={C.red}
                strokeWidth={2.5} fill="url(#altGrad)" />
            </AreaChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", gap: 10, marginTop: 14, padding: "11px 14px",
            background: "rgba(239,68,68,0.07)", border: `1px solid rgba(239,68,68,0.2)`,
            borderRadius: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={14} color={C.red} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.muted2, lineHeight: 1.6 }}>
              At Mexico City (2,240m): ~15% VO₂max reduction — equivalent to removing one
              lung's worth of oxygen delivery from every outfield player.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
            {[
              { val: "~15%", label: "Mexico City", color: C.red  },
              { val: "~9%",  label: "Denver",      color: C.gold },
              { val: "0%",   label: "Sea Level",   color: C.accent },
            ].map(s => (
              <div key={s.label} style={{ padding: "9px 12px",
                background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`,
                textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { val: "2,240m", label: "Peak WC Elevation",       sub: "Mexico City · 2026 host",    color: C.red,    icon: Mountain    },
            { val: "~15%",   label: "VO₂max Reduction",        sub: "At Mexico City conditions",  color: C.gold,   icon: Activity    },
            { val: "16",     label: "2026 Host Venues",         sub: "USA · Canada · Mexico",      color: C.blue,   icon: Globe       },
            { val: "3",      label: "Critical-Risk Venues",     sub: "Elevation > 1,000m (2026)",  color: C.accent, icon: AlertTriangle },
          ].map((s, i) => (
            <div key={i} style={{ padding: "18px 22px",
              borderRight: i < 3 ? `1px solid ${C.border}` : "none",
              display: "flex", gap: 13, alignItems: "center" }}>
              <s.icon size={27} color={s.color} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color,
                  letterSpacing: "-0.5px" }}>{s.val}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 1 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RESEARCH SECTION ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto",
        padding: "76px 28px 60px", display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr", gap: 64 }}>

        {/* Left: Research narrative */}
        <div>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700,
            letterSpacing: "1px", marginBottom: 14 }}>THE RESEARCH GAP</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px",
            marginBottom: 20, lineHeight: 1.15 }}>
            Football Analytics Has<br />Ignored the Environment
          </h2>
          <p style={{ color: C.muted2, lineHeight: 1.8, marginBottom: 16, fontSize: 14.5 }}>
            Decades of sports physiology research confirm that altitude reduces oxygen delivery,
            heat impairs cardiovascular efficiency, and humidity blocks heat dissipation. Yet
            mainstream football analytics — xG models, Elo ratings, possession metrics — treats
            every venue as <em>thermodynamically identical</em>.
          </p>
          <p style={{ color: C.muted2, lineHeight: 1.8, marginBottom: 26, fontSize: 14.5 }}>
            FIFA World Cup 2026 changes the stakes permanently. With venues spanning
            sea-level Boston, high-humidity Miami, and 2,240m Mexico City,
            environmental diversity has never been higher in World Cup history.
            This is the first large-scale empirical framework quantifying these
            effects across 92 years of World Cup data.
          </p>

          <div style={{ padding: "18px 22px", background: "rgba(0,200,150,0.06)",
            border: `1px solid rgba(0,200,150,0.2)`, borderRadius: 12, marginBottom: 28 }}>
            <div style={{ fontSize: 10.5, color: C.accent, fontWeight: 700,
              letterSpacing: "0.8px", marginBottom: 9 }}>CORE RESEARCH QUESTION</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.65,
              fontStyle: "italic", color: C.text }}>
              "Does playing at altitude or in extreme heat cause teams to concede
              significantly more goals in the second half of World Cup matches,
              after controlling for team quality, rest days, and travel distance?"
            </div>
          </div>

          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700,
            letterSpacing: "0.8px", marginBottom: 14 }}>SIX RESEARCH QUESTIONS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {researchQuestions.map((rq, i) => (
              <div key={i} style={{ padding: "12px 14px", background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 10,
                display: "flex", gap: 10, alignItems: "flex-start" }}>
                <rq.icon size={15} color={rq.color} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.muted2, lineHeight: 1.55 }}>{rq.q}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Hypotheses */}
        <div>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700,
            letterSpacing: "1px", marginBottom: 20 }}>5 TESTABLE HYPOTHESES</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hypotheses.map(h => (
              <div key={h.id}
                onClick={() => setActiveHyp(activeHyp === h.id ? null : h.id)}
                style={{ padding: "14px 16px", background: C.card,
                  border: `1px solid ${activeHyp === h.id ? h.color : C.border}`,
                  borderRadius: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 13,
                  transition: "border-color 0.2s, background 0.2s",
                  background: activeHyp === h.id ? `${h.color}0A` : C.card }}>
                <div style={{ width: 36, height: 36, borderRadius: 9,
                  background: `${h.color}14`, border: `1px solid ${h.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <h.icon size={18} color={h.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: h.color,
                      fontFamily: "monospace", letterSpacing: "0.5px",
                      padding: "1px 5px", background: `${h.color}15`, borderRadius: 3 }}>
                      {h.id}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>{h.title}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.muted2 }}>{h.desc}</div>
                </div>
                <ChevronRight size={15} color={C.muted}
                  style={{ transform: activeHyp === h.id ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s", flexShrink: 0 }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, padding: "15px 18px",
            background: "rgba(67,97,238,0.07)", border: `1px solid rgba(67,97,238,0.2)`,
            borderRadius: 11 }}>
            <div style={{ fontSize: 10.5, color: C.blue, fontWeight: 700,
              letterSpacing: "0.7px", marginBottom: 12 }}>ANALYTICAL SCOPE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Primary scope",    val: "1994 – 2022" },
                { label: "Team-match rows",  val: "~512 obs."   },
                { label: "xG subset",        val: "2018 – 2022" },
                { label: "Model family",     val: "GLMM · NB"   },
                { label: "WC editions",      val: "8 tournaments"},
                { label: "Key outcome",      val: "h2_delta"    },
              ].map(item => (
                <div key={item.label} style={{ padding: "8px 10px",
                  background: C.bg, borderRadius: 7, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2026 VENUE RISK ─── */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`, padding: "64px 28px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", background: "rgba(245,158,11,0.1)",
              border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 20, marginBottom: 16 }}>
              <span style={{ fontSize: 10.5, color: C.gold, fontWeight: 700, letterSpacing: "0.8px" }}>
                FIFA WORLD CUP 2026 · VENUE RISK PROJECTIONS
              </span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px", marginBottom: 10 }}>
              Environmental Risk Rankings
            </h2>
            <p style={{ color: C.muted2, fontSize: 13.5, maxWidth: 520, margin: "0 auto" }}>
              Predicted physiological stress index (0–100) based on elevation, historical
              June temperature, and humidity for each 2026 host city.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10, maxWidth: 860, margin: "0 auto" }}>
            {venues2026.map((v) => (
              <div key={v.city}
                onMouseEnter={() => setHoveredVenue(v.city)}
                onMouseLeave={() => setHoveredVenue(null)}
                style={{ background: hoveredVenue === v.city ? `${v.cc}0A` : C.bg,
                  border: `1px solid ${hoveredVenue === v.city ? v.cc : C.border}`,
                  borderRadius: 13, padding: "15px 18px",
                  display: "flex", gap: 13, alignItems: "center",
                  cursor: "pointer", transition: "all 0.2s" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{v.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{v.city}</span>
                    <span style={{ fontSize: 10, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 4,
                      background: `${v.cc}18`, color: v.cc,
                      border: `1px solid ${v.cc}35`, letterSpacing: "0.3px" }}>
                      {v.cat}
                    </span>
                  </div>
                  <div style={{ height: 6, background: C.border,
                    borderRadius: 3, overflow: "hidden", marginBottom: 7 }}>
                    <div style={{ height: "100%", width: `${v.risk}%`,
                      background: `linear-gradient(90deg, ${v.cc}, ${v.cc}BB)`,
                      borderRadius: 3, transition: "width 0.8s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, color: C.muted }}>{v.elev}m elevation</span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: v.cc }}>
                      Risk: {v.risk}/100
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button style={{ padding: "12px 30px", background: C.gold, color: "#000",
              border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>
              View Full 2026 Analysis + Risk Map →
            </button>
          </div>
        </div>
      </section>

      {/* ─── METHODOLOGY PIPELINE ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "76px 28px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700,
            letterSpacing: "1px", marginBottom: 12 }}>HOW IT'S BUILT</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>
            5-Stage Research Pipeline
          </h2>
          <p style={{ color: C.muted2, fontSize: 13.5, marginTop: 10 }}>
            From raw match data to 2026 venue risk projections — fully reproducible in R.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 24, left: "10%", right: "10%",
            height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, ${C.border}, transparent)`,
            zIndex: 0 }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, position: "relative", zIndex: 1 }}>
            {pipeline.map((p, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: 12,
                  background: "rgba(67,97,238,0.1)", border: `1px solid ${C.blue}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 15px",
                  boxShadow: `0 0 20px rgba(67,97,238,0.15)` }}>
                  <p.icon size={22} color={C.blue} />
                </div>
                <div style={{ fontSize: 10, color: C.accent, fontWeight: 800,
                  fontFamily: "monospace", marginBottom: 6, letterSpacing: "0.5px" }}>{p.step}</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 7 }}>{p.label}</div>
                <div style={{ fontSize: 11.5, color: C.muted2, lineHeight: 1.6,
                  whiteSpace: "pre-line" }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`,
        padding: "40px 28px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600,
            letterSpacing: "1px", marginBottom: 20 }}>BUILT WITH</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "R 4.3+",          color: C.blue   },
              { label: "worldfootballR",  color: C.blue   },
              { label: "StatsBombR",      color: C.blue   },
              { label: "lme4 · MASS",     color: C.blue   },
              { label: "Quarto",          color: C.accent },
              { label: "Shiny",           color: C.accent },
              { label: "Next.js 14",      color: C.text   },
              { label: "Tailwind CSS",    color: C.text   },
              { label: "Recharts",        color: C.text   },
              { label: "Vercel",          color: C.muted2 },
            ].map(t => (
              <span key={t.label} style={{ padding: "6px 14px",
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 7, fontSize: 12.5, color: t.color, fontWeight: 500 }}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 28px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 5 }}>
              ⛰️ Altitude &amp; Heat Adaptation in FIFA World Cups (1930–2026)
            </div>
            <div style={{ fontSize: 11.5, color: C.muted }}>
              By Soumyadeep · IIT Roorkee Executive PG in Data Science &amp; AI
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>Data Licences</div>
            <div style={{ fontSize: 11, color: C.muted2 }}>
              FBref (personal use) · StatsBomb (CC BY-NC-SA 4.0) · Meteostat (CC BY 4.0) · Open-Elevation (MIT)
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
