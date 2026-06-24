"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
  BarChart, Bar, Cell, ScatterChart, Scatter, ReferenceLine, ZAxis
} from "recharts";
import {
  Mountain, Thermometer, AlertTriangle, ChevronRight, ChevronDown,
  Activity, Database, Settings, Globe, Target, Wind, Clock, Shield, Play
} from "lucide-react";
import { loadMatchData, MatchData } from "../utils/data";

const C = {
  bg: '#050B18', card: '#0D1627', cardAlt: '#0A1020',
  border: '#1E2D4A', borderLight: '#253450',
  accent: '#00C896', blue: '#4361EE', red: '#EF4444',
  gold: '#F59E0B', purple: '#A855F7', orange: '#F97316',
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
  { city: "Miami",        elev: 3,    risk: 58, flag: "🇺🇸", cat: "MEDIUM",   cc: C.orange },
  { city: "Dallas",       elev: 183,  risk: 51, flag: "🇺🇸", cat: "MEDIUM",   cc: C.orange },
  { city: "Kansas City",  elev: 320,  risk: 42, flag: "🇺🇸", cat: "MEDIUM",   cc: C.orange },
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

export default function Home() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [activeHyp, setActiveHyp] = useState(null);
  const [hoveredVenue, setHoveredVenue] = useState(null);
  // Collapsible side panel state
  const [showPanel, setShowPanel] = useState(false);
  const [yearFilter, setYearFilter] = useState("All Years");
  const [restFilter, setRestFilter] = useState("All Profiles");

  // Dynamic data loading
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [altFilter, setAltFilter] = useState(500);

  useEffect(() => {
    loadMatchData().then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  // Filter implementation
  const getFilteredMatches = (matchList: any[]) => {
    return matchList.filter(m => {
      // Year filter
      if (yearFilter !== "All Years" && String(m.year) !== yearFilter) {
        return false;
      }
      // Rest Days filter
      if (restFilter === "Short Rest (≤ 3 days)" && (m.rest_days === null || m.rest_days > 3)) {
        return false;
      }
      if (restFilter === "Normal Rest (4+ days)" && (m.rest_days !== null && m.rest_days < 4)) {
        return false;
      }
      return true;
    });
  };

  const filteredMatches = getFilteredMatches(matches);

  // Filtered/Processed statistics based on threshold and other active filters
  const highAltMatches = filteredMatches.filter(m => (m.elevation_m || 0) > altFilter);
  const avgHighAlt2H = highAltMatches.length 
    ? (highAltMatches.reduce((acc, m) => acc + (m.goals_against_2h || 0), 0) / highAltMatches.length).toFixed(2)
    : "0.00";
  const lowAltMatches = filteredMatches.filter(m => (m.elevation_m || 0) <= altFilter);
  const avgLowAlt2H = lowAltMatches.length
    ? (lowAltMatches.reduce((acc, m) => acc + (m.goals_against_2h || 0), 0) / lowAltMatches.length).toFixed(2)
    : "0.00";

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
              <span style={{ color: C.text }}> &amp; Heat</span>
            </span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>WC Analytics</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {(["Overview", "Analytics", "2026 Risk", "Pipeline"] as const).map(tab => (
            <button key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ padding: "6px 13px", fontSize: 12.5, 
                color: activeTab === tab ? C.accent : C.muted2,
                background: "transparent", border: "none", cursor: "pointer", borderRadius: 6,
                fontWeight: 600, transition: "color 0.2s" }}>
              {tab}
            </button>
          ))}

        </div>
      </nav>

      {/* ─── COLLAPSIBLE RIGHT-SIDE PANEL ─── */}
      <div style={{
        position: "fixed",
        top: 0,
        right: showPanel ? 0 : -320,
        width: 320,
        height: "100vh",
        background: "rgba(10, 20, 40, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderLeft: `1px solid ${C.border}`,
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
        zIndex: 999,
        transition: "right 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        padding: "80px 24px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.5px" }}>Control Panel</h3>
          <button onClick={() => setShowPanel(false)} style={{ background: "transparent", border: "none", color: C.muted2, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: 0 }} />

        {/* Altitude Filter */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Altitude Threshold</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{altFilter}m</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2500" 
            step="100" 
            value={altFilter}
            onChange={(e) => setAltFilter(Number(e.target.value))}
            style={{ width: "100%", accentColor: C.accent, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
            <span>Sea level</span>
            <span>1,000m</span>
            <span>2,500m</span>
          </div>
        </div>



        {/* Rest Days Filter */}
        <div>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>REST DAYS</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["All Profiles", "Short Rest (≤ 3 days)", "Normal Rest (4+ days)"].map((r) => (
              <label 
                key={r} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  fontSize: 12.5, 
                  color: restFilter === r ? C.text : C.muted2, 
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                <input 
                  type="radio" 
                  name="restFilterGroup"
                  checked={restFilter === r} 
                  onChange={() => setRestFilter(r)}
                  style={{ accentColor: C.accent, cursor: "pointer" }} 
                />
                {r}
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "Overview" && (
        <>
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
                <button onClick={() => setActiveTab("Analytics")} style={{ padding: "12px 24px", background: C.accent, color: "#000",
                  border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>
                  Explore Live Data →
                </button>
                <button onClick={() => setActiveTab("2026 Risk")} style={{ padding: "12px 24px", background: "transparent", color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 8, fontWeight: 600,
                  cursor: "pointer", fontSize: 13.5 }}>
                  View 2026 Risk Map
                </button>
              </div>

              <div style={{ display: "flex", gap: 0, marginTop: 38, paddingTop: 28,
                borderTop: `1px solid ${C.border}` }}>
                {[
                  { num: matches.length > 0 ? `${matches.length}+` : "512+",  label: "Team-match observations" },
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

              {/* ---------- Altitude & Performance Profile (continuous) ---------- */}
              {/* 1️⃣ Bin matches by altitude and compute average 2‑half goals */}
              {(() => {
                const binSize = 100; // 100 m bins
                const bins: Record<number, { sum: number; cnt: number }> = {};
                matches.forEach(m => {
                  const bin = Math.floor((m.elevation_m ?? 0) / binSize) * binSize;
                  if (!bins[bin]) bins[bin] = { sum: 0, cnt: 0 };
                  bins[bin].sum += m.goals_against_2h ?? 0;
                  bins[bin].cnt += 1;
                });
                const chartData = Object.entries(bins)
                  .map(([altStr, v]) => ({
                    altitude: Number(altStr),
                    avgGoals2H: v.cnt ? +(v.sum / v.cnt).toFixed(2) : 0,
                  }))
                  .sort((a, b) => a.altitude - b.altitude);
                return (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="altitude" tick={{ fill: C.muted, fontSize: 10 }} label={{ value: "Altitude (m)", offset: -5, fill: C.muted }} />
                      <YAxis tick={{ fill: C.muted, fontSize: 10 }} label={{ value: "Avg 2H Goals", angle: -90, position: "insideLeft", fill: C.muted }} />
                      <Tooltip
                        contentStyle={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                        formatter={v => [`${v} goals`, "Avg 2‑Half Goals"]}
                      />
                      <Line type="monotone" dataKey="avgGoals2H" stroke={C.accent} strokeWidth={3}
                        dot={{ r: 3, fill: C.accent }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}


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
                    style={{ padding: "14px 16px",
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
                    { label: "Primary scope",    val: "2002 – 2022" },
                    { label: "Team-match rows",  val: matches.length > 0 ? `${matches.length} observations` : "Loading..." },
                    { label: "xG subset",        val: "2018 – 2022" },
                    { label: "Model family",     val: "GLMM · NB"   },
                    { label: "WC editions",      val: "6 tournaments"},
                    { label: "Key outcome",      val: "2nd Half Goals" },
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
        </>
      )}
      {/* ─── ANALYTICS TAB ─── */}
      {activeTab === "Analytics" && (
        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}>Live Environmental Explorer</h2>
              <p style={{ color: C.muted2, fontSize: 14 }}>Filter historical World Cup statistics using environmental benchmarks.</p>
            </div>
            
            <button onClick={() => setShowPanel(true)} style={{ padding: "8px 16px", fontSize: 12.5, background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              ⚙️ Open Filters
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 30 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <span style={{ fontSize: 11, color: C.muted2 }}>HIGH ALTITUDE MATCHES ({altFilter}m+)</span>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.red, marginTop: 4 }}>{highAltMatches.length}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <span style={{ fontSize: 11, color: C.muted2 }}>AVG 2H GOALS (HIGH ALTITUDE)</span>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.accent, marginTop: 4 }}>{avgHighAlt2H}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <span style={{ fontSize: 11, color: C.muted2 }}>AVG 2H GOALS (LOW ALTITUDE)</span>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.blue, marginTop: 4 }}>{avgLowAlt2H}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 15 }}>Altitude &amp; Performance Profile</h3>
              {loading ? (
                <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading metrics...</div>
              ) : (
                (() => {
                  const binSize = 100;
                  const bins: Record<number, { sum: number; cnt: number }> = {};
                  filteredMatches
                    .filter(m => m.elevation_m !== null && m.elevation_m !== undefined)
                    .forEach(m => {
                      const bin = Math.floor(m.elevation_m / binSize) * binSize;
                      if (!bins[bin]) bins[bin] = { sum: 0, cnt: 0 };
                      bins[bin].sum += m.goals_against_2h || 0;
                      bins[bin].cnt += 1;
                    });

                  const binnedData = Object.entries(bins)
                    .map(([altStr, v]) => ({
                      elevation: Number(altStr),
                      avgGoals2H: v.cnt ? +(v.sum / v.cnt).toFixed(2) : 0,
                      matchCount: v.cnt,
                    }))
                    .sort((a, b) => a.elevation - b.elevation);

                  return (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={binnedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis 
                          type="number" 
                          dataKey="elevation" 
                          name="Altitude" 
                          unit="m" 
                          stroke={C.muted} 
                          tick={{ fontSize: 10 }}
                          domain={[0, 'auto']} 
                        />
                        <YAxis 
                          type="number" 
                          dataKey="avgGoals2H" 
                          name="Avg 2H Goals" 
                          stroke={C.muted} 
                          tick={{ fontSize: 10 }} 
                          domain={[0, 'auto']}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
                                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>
                                    Altitude Bin: {data.elevation}m – {data.elevation + binSize}m
                                  </div>
                                  <div style={{ color: C.muted2 }}>Avg 2H Goals Conceded: <span style={{ color: C.accent, fontWeight: 600 }}>{data.avgGoals2H}</span></div>
                                  <div style={{ color: C.muted2 }}>Sample Size: <span style={{ color: C.blue, fontWeight: 600 }}>{data.matchCount} matches</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avgGoals2H" 
                          stroke={C.accent} 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: C.accent, strokeWidth: 1 }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()
              )}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 15 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Dataset Highlights</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Highest Venue", val: "Mexico City (2,240m)" },
                  { label: "Highest Avg Temp", val: "33.2°C (Qatar 2022)" },
                  { label: "Elevation Outliers", val: "Denver, Toluca, Johannesburg" },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: C.muted }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 2 }}>{item.val}</div>
                  </div>
                ))}
              </div>

              <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "10px 0" }} />

              <h4 style={{ fontSize: 13, fontWeight: 800, color: C.accent, letterSpacing: "0.5px" }}>METHODOLOGY EXPLAINED</h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: C.muted2, lineHeight: 1.5 }}>
                <div>
                  <strong style={{ color: C.text, display: "block" }}>1. Altitude Binning (100m Bins)</strong>
                  Matches are grouped into 100m elevation intervals (e.g., 0-100m, 100-200m) to visualize the average trend and reduce individual match outlier noise.
                </div>
                <div>
                  <strong style={{ color: C.text, display: "block" }}>2. Trend Lines &amp; Data Density</strong>
                  Each node on the line represents the arithmetic mean of second-half goals for matches within that specific elevation bin under the current filter criteria.
                </div>
                <div>
                  <strong style={{ color: C.text, display: "block" }}>3. Second-Half Goals Metric</strong>
                  Why focus on 2nd-half goals? Sports physiologists map environmental stress (depleted oxygen, dehydration) to late-game fatigue, causing defensive positioning failures and higher concessions in final periods.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 2026 RISK TAB ─── */}
      {activeTab === "2026 Risk" && (
        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px", marginBottom: 10 }}>2026 Host Venue Projections</h2>
            <p style={{ color: C.muted2, fontSize: 14, maxWidth: 600, margin: "0 auto" }}>
              Projected environmental stress metrics mapping elevation and historical temperature risk benchmarks across the three host nations.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 960, margin: "0 auto" }}>
            {venues2026.map((v) => (
              <div key={v.city}
                onMouseEnter={() => setHoveredVenue(v.city)}
                onMouseLeave={() => setHoveredVenue(null)}
                style={{ background: hoveredVenue === v.city ? `${v.cc}0A` : C.card,
                  border: `1px solid ${hoveredVenue === v.city ? v.cc : C.border}`,
                  borderRadius: 14, padding: "20px 24px",
                  display: "flex", gap: 15, alignItems: "center",
                  cursor: "pointer", transition: "all 0.2s" }}>
                <span style={{ fontSize: 30, flexShrink: 0 }}>{v.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>{v.city}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: `${v.cc}18`, color: v.cc, border: `1px solid ${v.cc}35` }}>
                      {v.cat}
                    </span>
                  </div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${v.risk}%`, background: v.cc, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted2 }}>
                    <span>Elevation: {v.elev}m</span>
                    <span style={{ fontWeight: 800, color: v.cc }}>Risk Factor: {v.risk}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Risk Factor Methodology ── */}
          <div style={{ marginTop: 56 }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                padding: "5px 14px", background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, marginBottom: 16 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, display: "inline-block" }} />
                <span style={{ fontSize: 10.5, color: C.red, fontWeight: 700, letterSpacing: "0.8px" }}>METHODOLOGY</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.8px", marginBottom: 10 }}>
                How the Risk Score is Calculated
              </h3>
              <p style={{ fontSize: 14, color: C.muted2, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
                Each venue's risk score is a composite index derived from three physiological stress factors,
                weighted by their statistical significance in the GLMM model fitted on 2002–2022 World Cup data.
              </p>
            </div>

            {/* Three factor cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
              {[
                {
                  emoji: "⛰️", label: "Altitude", weight: 30, color: C.red,
                  borderColor: "rgba(239,68,68,0.3)", bgColor: "rgba(239,68,68,0.06)",
                  score: "normalised from 0 m (sea level) to 2,240 m (Mexico City)",
                  detail: "Atmospheric O₂ drops ~3% per 300 m. Above 1,000 m, aerobic energy systems are measurably taxed by the 60th minute. The GLMM slope confirms elevation independently predicts more 2nd-half goals conceded — even after controlling for team strength and temperature.",
                  badge: "GLMM Confirmed"
                },
                {
                  emoji: "🌡️", label: "Heat Index", weight: 40, color: C.gold,
                  borderColor: "rgba(245,158,11,0.3)", bgColor: "rgba(245,158,11,0.06)",
                  score: "derived from historical wet-bulb temperature during tournament months",
                  detail: "Wet-bulb temperature >28°C triggers core body temperature elevation after ~60 min of high-intensity exercise. Heat receives the highest weight because it showed the strongest independent effect on offensive output reduction across all six tournaments studied.",
                  badge: "Highest Predictor"
                },
                {
                  emoji: "⏱️", label: "Rest Days", weight: 30, color: C.blue,
                  borderColor: "rgba(67,97,238,0.3)", bgColor: "rgba(67,97,238,0.06)",
                  score: "median days between matches at group stage per team",
                  detail: "≤3 rest days between matches significantly amplifies altitude and heat penalties — confirmed by a statistically significant interaction term in sensitivity runs. Teams with short rest at high-altitude venues show the steepest 2nd-half defensive deterioration.",
                  badge: "Interaction Effect"
                }
              ].map(f => (
                <div key={f.label} style={{
                  background: f.bgColor, border: `1px solid ${f.borderColor}`,
                  borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 26 }}>{f.emoji}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: f.color }}>{f.label}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.5px", marginTop: 1 }}>
                          {f.badge.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 22, fontWeight: 900, color: f.color,
                      padding: "4px 12px", borderRadius: 10,
                      border: `1px solid ${f.borderColor}`, background: "rgba(255,255,255,0.04)"
                    }}>
                      {f.weight}%
                    </div>
                  </div>
                  <div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${f.weight * 2.5}%`, background: f.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 5, fontStyle: "italic" }}>
                      Score: {f.score}
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.muted2, lineHeight: 1.65, margin: 0 }}>{f.detail}</p>
                </div>
              ))}
            </div>

            {/* Formula card */}
            <div style={{
              background: "rgba(0,200,150,0.05)", border: "1px solid rgba(0,200,150,0.22)",
              borderRadius: 16, padding: "28px 32px", marginBottom: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: 18 }}>🧮</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.accent, letterSpacing: "0.5px" }}>COMPOSITE FORMULA</span>
              </div>
              <code style={{
                display: "block", fontSize: 17, fontWeight: 800, fontFamily: "monospace",
                color: C.text, background: "rgba(255,255,255,0.04)",
                padding: "12px 20px", borderRadius: 10, border: `1px solid ${C.border}`,
                letterSpacing: "0.3px", marginBottom: 20
              }}>
                Risk = (Altitude × 0.30) + (Heat × 0.40) + (Rest × 0.30)
              </code>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[
                  { term: "Altitude", range: "0 m → 2,240 m", mapped: "0 → 100", color: C.red },
                  { term: "Heat Index", range: "18°C → 38°C wet-bulb", mapped: "0 → 100", color: C.gold },
                  { term: "Rest Days", range: "7 days → 2 days", mapped: "0 → 100", color: C.blue },
                ].map(t => (
                  <div key={t.term} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.color, marginBottom: 5 }}>{t.term}</div>
                    <div style={{ fontSize: 11, color: C.muted2, marginBottom: 2 }}>Range: {t.range}</div>
                    <div style={{ fontSize: 11, color: C.muted2 }}>Mapped to: <span style={{ color: C.text, fontWeight: 700 }}>{t.mapped}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier legend */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.5px", marginBottom: 14 }}>RISK TIER THRESHOLDS</div>
              <div style={{ height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 10,
                background: `linear-gradient(to right, ${C.accent} 0%, ${C.orange} 40%, ${C.gold} 60%, ${C.red} 100%)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                {[
                  { label: "LOW",      range: "< 40",  color: C.accent },
                  { label: "MEDIUM",   range: "40–59", color: C.orange },
                  { label: "HIGH",     range: "60–79", color: C.gold   },
                  { label: "CRITICAL", range: "≥ 80",  color: C.red    },
                ].map(t => (
                  <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{t.range}</span>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 11.5, color: C.muted, lineHeight: 1.6 }}>
                ⚠️&nbsp;<strong style={{ color: C.muted2 }}>Research outputs only.</strong> These projections reflect 2002–2022 historical
                patterns extrapolated to 2026 venue conditions. They are not medical advice. Actual match outcomes
                depend on squad adaptation, training protocols, and scheduling decisions by FIFA and team staff.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── PIPELINE TAB ─── */}
      {activeTab === "Pipeline" && (
        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>5-Stage Statistical Pipeline</h2>
            <p style={{ color: C.muted2, fontSize: 14, marginTop: 10 }}>Rigorous engineering from raw data to final predictive evaluations.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800, margin: "0 auto" }}>
            {pipeline.map((p, idx) => (
              <div key={idx} style={{ display: "flex", gap: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(67,97,238,0.1)", border: `1px solid ${C.blue}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <p.icon size={22} color={C.blue} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: C.accent, fontFamily: "monospace" }}>STAGE {p.step}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>{p.label}</h3>
                  </div>
                  <p style={{ fontSize: 13.5, color: C.muted2, lineHeight: 1.6, whiteSpace: "pre-line" }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 28px", marginTop: "auto" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 5 }}>
              ⛰️ Altitude &amp; Heat Adaptation in FIFA World Cups (1930–2026)
            </div>
            <div style={{ fontSize: 11.5, color: C.muted }}>
              ©️ Soumyadeep Nath
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
