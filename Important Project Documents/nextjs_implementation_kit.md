# 🏗️ Next.js Implementation Kit
## Altitude & Heat Adaptation — FIFA World Cup Analytics Website
### Complete copy-paste code for every file

---

## QUICK START

```bash
# 1. Create the project
npx create-next-app@latest altitude-heat-wc \
  --typescript --tailwind --eslint --app --src-dir=false \
  --import-alias="@/*"

cd altitude-heat-wc

# 2. Install dependencies
npm install recharts lucide-react framer-motion react-leaflet leaflet
npm install @types/leaflet
npm install class-variance-authority clsx tailwind-merge

# 3. Install shadcn/ui
npx shadcn-ui@latest init

# 4. Start dev server
npm run dev
```

---

## FILE 1 — `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       "#050B18",
        card:     "#0D1627",
        border:   "#1E2D4A",
        accent:   "#00C896",
        blue:     "#4361EE",
        risk:     "#EF4444",
        gold:     "#F59E0B",
        purple:   "#A855F7",
        primary:  "#E8EDF5",
        muted:    "#64748B",
        muted2:   "#8895A7",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "display": ["44px", { lineHeight: "1.06", letterSpacing: "-2px", fontWeight: "900" }],
        "h2":      ["32px", { lineHeight: "1.12", letterSpacing: "-1px", fontWeight: "900" }],
        "h3":      ["20px", { lineHeight: "1.3",  letterSpacing: "-0.5px", fontWeight: "700" }],
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "count-up":   "countUp 1s ease forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #00C896 0%, #4361EE 100%)",
        "gradient-gold":   "linear-gradient(135deg, #F59E0B 0%, #E08900 100%)",
        "grid-dark": "radial-gradient(circle, #1E2D4A 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## FILE 2 — `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

:root {
  --bg:      #050B18;
  --card:    #0D1627;
  --border:  #1E2D4A;
  --accent:  #00C896;
  --blue:    #4361EE;
  --red:     #EF4444;
  --gold:    #F59E0B;
  --text:    #E8EDF5;
  --muted:   #64748B;
  --muted2:  #8895A7;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html, body {
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar */
::-webkit-scrollbar        { width: 6px; }
::-webkit-scrollbar-track  { background: var(--bg); }
::-webkit-scrollbar-thumb  { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }

/* Selection */
::selection { background: rgba(0, 200, 150, 0.3); color: var(--text); }

/* Gradient text utility */
.gradient-text {
  background: linear-gradient(125deg, var(--accent) 20%, var(--blue) 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Glass card */
.glass {
  background: rgba(13, 22, 39, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
}

/* Dot grid background */
.dot-grid {
  background-image: radial-gradient(circle, #1E2D4A 1px, transparent 1px);
  background-size: 32px 32px;
}
```

---

## FILE 3 — `lib/tokens.ts`

```typescript
// Design tokens & shared constants

export const C = {
  bg:      '#050B18',
  card:    '#0D1627',
  cardAlt: '#0A1020',
  border:  '#1E2D4A',
  accent:  '#00C896',
  blue:    '#4361EE',
  red:     '#EF4444',
  gold:    '#F59E0B',
  orange:  '#F97316',
  purple:  '#A855F7',
  text:    '#E8EDF5',
  muted:   '#64748B',
  muted2:  '#8895A7',
} as const;

export type RiskCategory = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export const riskColor = (cat: RiskCategory): string => {
  const map: Record<RiskCategory, string> = {
    CRITICAL: C.red,
    HIGH:     C.gold,
    MEDIUM:   C.orange,
    LOW:      C.accent,
  };
  return map[cat];
};

export const riskFromScore = (score: number): RiskCategory => {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
};
```

---

## FILE 4 — `lib/types.ts`

```typescript
// All TypeScript interfaces for project data

export interface Venue2026 {
  city:      string;
  country:   string;
  stadium:   string;
  flag:      string;
  elevation: number;        // metres
  lat:       number;
  lon:       number;
  avgTempC:  number;        // June avg temperature
  avgHumidity: number;      // June avg %
  riskScore: number;        // 0–100 computed
  category:  'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ModelCoefficient {
  term:      string;        // Variable name
  estimate:  number;        // Log-scale coefficient
  std_error: number;
  statistic: number;
  p_value:   number;
  conf_low:  number;
  conf_high: number;
  significant: boolean;     // p_value < 0.05
}

export interface H2DeltaByCategory {
  category:   string;       // "Sea Level" | "Mid Altitude" | "High Altitude"
  mean_delta: number;       // Mean (goals_against_2h - goals_against_1h)
  ci_low:     number;
  ci_high:    number;
  n:          number;       // sample size
}

export interface HistoricalVenue {
  wc_year:    number;
  city:       string;
  country:    string;
  elevation:  number;
  avg_temp_c: number;
  n_matches:  number;
}

export interface TeamMatchRow {
  wc_year:          number;
  team:             string;
  opponent:         string;
  venue_city:       string;
  elevation_m:      number;
  avg_temp_c:       number;
  goals_against_1h: number;
  goals_against_2h: number;
  h2_delta:         number;
  team_elo_pre:     number;
  opp_elo_pre:      number;
  rest_days:        number;
  travel_km:        number;
  is_altitude_team: boolean;
}
```

---

## FILE 5 — `data/venues_2026.json`

```json
[
  {
    "city": "Mexico City",
    "country": "Mexico",
    "stadium": "Estadio Azteca",
    "flag": "🇲🇽",
    "elevation": 2240,
    "lat": 19.303,
    "lon": -99.150,
    "avgTempC": 18,
    "avgHumidity": 52,
    "riskScore": 92,
    "category": "CRITICAL"
  },
  {
    "city": "Guadalajara",
    "country": "Mexico",
    "stadium": "Estadio Akron",
    "flag": "🇲🇽",
    "elevation": 1566,
    "lat": 20.680,
    "lon": -103.465,
    "avgTempC": 22,
    "avgHumidity": 48,
    "riskScore": 71,
    "category": "HIGH"
  },
  {
    "city": "Denver",
    "country": "USA",
    "stadium": "Empower Field at Mile High",
    "flag": "🇺🇸",
    "elevation": 1609,
    "lat": 39.744,
    "lon": -105.020,
    "avgTempC": 27,
    "avgHumidity": 38,
    "riskScore": 69,
    "category": "HIGH"
  },
  {
    "city": "Miami",
    "country": "USA",
    "stadium": "Hard Rock Stadium",
    "flag": "🇺🇸",
    "elevation": 3,
    "lat": 25.958,
    "lon": -80.239,
    "avgTempC": 32,
    "avgHumidity": 74,
    "riskScore": 58,
    "category": "MEDIUM"
  },
  {
    "city": "Dallas",
    "country": "USA",
    "stadium": "AT&T Stadium",
    "flag": "🇺🇸",
    "elevation": 183,
    "lat": 32.748,
    "lon": -97.093,
    "avgTempC": 34,
    "avgHumidity": 55,
    "riskScore": 51,
    "category": "MEDIUM"
  },
  {
    "city": "Kansas City",
    "country": "USA",
    "stadium": "Arrowhead Stadium",
    "flag": "🇺🇸",
    "elevation": 320,
    "lat": 39.049,
    "lon": -94.484,
    "avgTempC": 30,
    "avgHumidity": 62,
    "riskScore": 42,
    "category": "MEDIUM"
  },
  {
    "city": "Atlanta",
    "country": "USA",
    "stadium": "Mercedes-Benz Stadium",
    "flag": "🇺🇸",
    "elevation": 298,
    "lat": 33.755,
    "lon": -84.401,
    "avgTempC": 29,
    "avgHumidity": 68,
    "riskScore": 38,
    "category": "LOW"
  },
  {
    "city": "Houston",
    "country": "USA",
    "stadium": "NRG Stadium",
    "flag": "🇺🇸",
    "elevation": 24,
    "lat": 29.685,
    "lon": -95.411,
    "avgTempC": 35,
    "avgHumidity": 71,
    "riskScore": 36,
    "category": "LOW"
  },
  {
    "city": "Los Angeles",
    "country": "USA",
    "stadium": "SoFi Stadium",
    "flag": "🇺🇸",
    "elevation": 82,
    "lat": 33.953,
    "lon": -118.339,
    "avgTempC": 24,
    "avgHumidity": 70,
    "riskScore": 29,
    "category": "LOW"
  },
  {
    "city": "San Francisco",
    "country": "USA",
    "stadium": "Levi's Stadium",
    "flag": "🇺🇸",
    "elevation": 14,
    "lat": 37.403,
    "lon": -121.970,
    "avgTempC": 19,
    "avgHumidity": 75,
    "riskScore": 25,
    "category": "LOW"
  },
  {
    "city": "Philadelphia",
    "country": "USA",
    "stadium": "Lincoln Financial Field",
    "flag": "🇺🇸",
    "elevation": 12,
    "lat": 39.901,
    "lon": -75.168,
    "avgTempC": 27,
    "avgHumidity": 66,
    "riskScore": 24,
    "category": "LOW"
  },
  {
    "city": "Boston",
    "country": "USA",
    "stadium": "Gillette Stadium",
    "flag": "🇺🇸",
    "elevation": 40,
    "lat": 42.091,
    "lon": -71.264,
    "avgTempC": 23,
    "avgHumidity": 64,
    "riskScore": 22,
    "category": "LOW"
  },
  {
    "city": "Seattle",
    "country": "USA",
    "stadium": "Lumen Field",
    "flag": "🇺🇸",
    "elevation": 8,
    "lat": 47.595,
    "lon": -122.332,
    "avgTempC": 19,
    "avgHumidity": 60,
    "riskScore": 21,
    "category": "LOW"
  },
  {
    "city": "New York/NJ",
    "country": "USA",
    "stadium": "MetLife Stadium",
    "flag": "🇺🇸",
    "elevation": 8,
    "lat": 40.814,
    "lon": -74.075,
    "avgTempC": 25,
    "avgHumidity": 65,
    "riskScore": 20,
    "category": "LOW"
  },
  {
    "city": "Toronto",
    "country": "Canada",
    "stadium": "BMO Field",
    "flag": "🇨🇦",
    "elevation": 112,
    "lat": 43.633,
    "lon": -79.418,
    "avgTempC": 22,
    "avgHumidity": 63,
    "riskScore": 19,
    "category": "LOW"
  },
  {
    "city": "Vancouver",
    "country": "Canada",
    "stadium": "BC Place",
    "flag": "🇨🇦",
    "elevation": 4,
    "lat": 49.277,
    "lon": -123.112,
    "avgTempC": 18,
    "avgHumidity": 64,
    "riskScore": 15,
    "category": "LOW"
  }
]
```

---

## FILE 6 — `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Altitude & Heat · FIFA World Cup Analytics",
  description:
    "A large-scale statistical investigation into how altitude, heat, humidity, and travel fatigue shape team performance across 92 years of World Cup data — with 2026 venue risk predictions.",
  keywords: [
    "FIFA World Cup", "altitude", "sports analytics", "football analytics",
    "data science", "Mexico City", "Denver", "2026 World Cup"
  ],
  openGraph: {
    title: "Does Altitude & Heat Decide World Cups?",
    description: "Statistical analysis of environmental stressors in FIFA World Cups (1930–2026)",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIFA World Cup · Altitude & Heat Analytics",
    description: "Which 2026 venues pose the highest physiological risk?",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-primary antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

---

## FILE 7 — `components/layout/Navbar.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mountain } from "lucide-react";

const NAV_LINKS = [
  { label: "Research",  href: "/research"      },
  { label: "Data",      href: "/data"           },
  { label: "Analysis",  href: "/analysis"       },
  { label: "2026 Risk", href: "/venues/2026"    },
  { label: "Report",    href: "/report"         },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-border transition-all duration-300 ${
        scrolled
          ? "bg-bg/95 backdrop-blur-xl shadow-lg"
          : "bg-bg/80 backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center text-base">
            ⛰️
          </div>
          <div>
            <span className="font-black text-sm tracking-tight">
              <span className="text-accent">Altitude</span>
              <span className="text-muted2"> & </span>
              <span className="text-primary">Heat</span>
            </span>
            <div className="text-[10px] text-muted tracking-wide">WC Analytics · 1930–2026</div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm text-muted2 hover:text-primary rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
            >
              {link.label}
            </Link>
          ))}
          <div className="w-px h-5 bg-border mx-2" />
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-bold text-black bg-accent hover:bg-accent/90 rounded-lg transition-all duration-200 shadow-lg shadow-accent/20"
          >
            Dashboard →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-muted2 hover:text-primary"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2.5 text-sm text-muted2 hover:text-primary rounded-lg hover:bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="block px-3 py-2.5 text-sm font-bold text-black bg-accent rounded-lg text-center"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard →
          </Link>
        </div>
      )}
    </nav>
  );
}
```

---

## FILE 8 — `components/layout/Footer.tsx`

```tsx
import Link from "next/link";

const LICENCES = [
  { name: "FBref",       licence: "Personal use only"   },
  { name: "StatsBomb",   licence: "CC BY-NC-SA 4.0"     },
  { name: "Meteostat",   licence: "CC BY 4.0"           },
  { name: "Open-Elev.",  licence: "MIT"                  },
  { name: "Elo Ratings", licence: "Non-commercial"      },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <div className="text-sm font-black mb-2">
              ⛰️ <span className="text-accent">Altitude</span> & Heat Analytics
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Quantifying the impact of environmental stressors on FIFA World Cup performance (1930–2026). Portfolio research project.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-xs text-muted font-bold tracking-wider mb-3">PAGES</div>
            <div className="space-y-2">
              {[
                { label: "Research & Methodology", href: "/research" },
                { label: "Data Sources",            href: "/data"     },
                { label: "Statistical Analysis",    href: "/analysis" },
                { label: "2026 Risk Matrix",        href: "/venues/2026" },
                { label: "Shiny Dashboard",         href: "/dashboard" },
              ].map(l => (
                <Link key={l.href} href={l.href} className="block text-xs text-muted2 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Licences */}
          <div>
            <div className="text-xs text-muted font-bold tracking-wider mb-3">DATA LICENCES</div>
            <div className="space-y-2">
              {LICENCES.map(l => (
                <div key={l.name} className="flex justify-between items-center">
                  <span className="text-xs text-muted2">{l.name}</span>
                  <span className="text-xs text-muted font-mono">{l.licence}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-xs text-muted">
            Built by <span className="text-muted2 font-semibold">Soumyadeep</span> ·
            IIT Roorkee Executive PG in Data Science & AI
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
               className="text-xs text-muted hover:text-accent transition-colors">GitHub</a>
            <a href="/report" className="text-xs text-muted hover:text-accent transition-colors">
              Full Report (PDF)
            </a>
            <a href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
              Shiny Dashboard
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## FILE 9 — `components/charts/VO2maxCurve.tsx`

```tsx
"use client";

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { C } from "@/lib/tokens";

const data = [
  { m: "0m",    pct: 0    },
  { m: "500m",  pct: 2.5  },
  { m: "1000m", pct: 6    },
  { m: "1500m", pct: 9.5  },
  { m: "2000m", pct: 13   },
  { m: "2240m", pct: 14.8 },
];

interface Props {
  height?: number;
}

export function VO2maxCurve({ height = 200 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="vo2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.red} stopOpacity={0.35} />
            <stop offset="95%" stopColor={C.red} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
        <XAxis
          dataKey="m"
          tick={{ fill: C.muted, fontSize: 11 }}
        />
        <YAxis
          tick={{ fill: C.muted, fontSize: 11 }}
          tickFormatter={(v: number) => `${v}%`}
          domain={[0, 18]}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: C.cardAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 12,
            padding: "10px 14px",
          }}
          formatter={(v: number) => [`${v}%`, "VO₂max Reduction"]}
          labelFormatter={(v: string) => `Altitude: ${v}`}
        />
        <Area
          type="monotone"
          dataKey="pct"
          stroke={C.red}
          strokeWidth={2.5}
          fill="url(#vo2Grad)"
          dot={{ fill: C.red, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: C.red, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

---

## FILE 10 — `components/ui/VenueCard.tsx`

```tsx
"use client";

import { useState } from "react";
import type { Venue2026 } from "@/lib/types";
import { riskColor } from "@/lib/tokens";
import { MapPin } from "lucide-react";

interface Props {
  venue: Venue2026;
  showDetails?: boolean;
}

export function VenueCard({ venue, showDetails = false }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = riskColor(venue.category);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-xl p-4 transition-all duration-200 cursor-pointer"
      style={{
        background:   hovered ? `${color}08` : "#050B18",
        border:       `1px solid ${hovered ? color : "#1E2D4A"}`,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{venue.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold truncate">{venue.city}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ml-2"
              style={{
                background: `${color}18`,
                color:       color,
                border:     `1px solid ${color}30`,
              }}
            >
              {venue.category}
            </span>
          </div>

          {/* Risk bar */}
          <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${venue.riskScore}%`, background: color }}
            />
          </div>

          <div className="flex justify-between">
            <span className="text-xs text-muted">{venue.elevation}m elevation</span>
            <span className="text-xs font-bold" style={{ color }}>
              Risk: {venue.riskScore}/100
            </span>
          </div>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-muted">Avg. Temp (June)</div>
                <div className="text-xs font-bold text-primary">{venue.avgTempC}°C</div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Humidity</div>
                <div className="text-xs font-bold text-primary">{venue.avgHumidity}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Stadium</div>
                <div className="text-[11px] font-medium text-muted2 truncate">{venue.stadium}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Country</div>
                <div className="text-xs font-bold text-primary">{venue.country}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## FILE 11 — `app/page.tsx` (Landing Page — Imports Components)

```tsx
import { HeroSection }       from "@/components/sections/HeroSection";
import { StatsBar }           from "@/components/sections/StatsBar";
import { ResearchSection }    from "@/components/sections/ResearchSection";
import { VenueRiskSection }   from "@/components/sections/VenueRiskSection";
import { PipelineSection }    from "@/components/sections/PipelineSection";
import { TechStackSection }   from "@/components/sections/TechStackSection";
import venues2026Data         from "@/data/venues_2026.json";
import type { Venue2026 }     from "@/lib/types";

export default function HomePage() {
  const venues = venues2026Data as Venue2026[];

  return (
    <>
      <HeroSection />
      <StatsBar />
      <ResearchSection />
      <VenueRiskSection venues={venues} />
      <PipelineSection />
      <TechStackSection />
    </>
  );
}
```

---

## FILE 12 — `components/sections/StatsBar.tsx`

```tsx
import { Mountain, Activity, Globe, AlertTriangle } from "lucide-react";

const STATS = [
  {
    val:   "2,240m",
    label: "Peak WC Venue",
    sub:   "Mexico City · 2026",
    color: "#EF4444",
    Icon:  Mountain,
  },
  {
    val:   "~15%",
    label: "VO₂max Reduction",
    sub:   "At Mexico City altitude",
    color: "#F59E0B",
    Icon:  Activity,
  },
  {
    val:   "16 Venues",
    label: "2026 Host Cities",
    sub:   "USA · Canada · Mexico",
    color: "#4361EE",
    Icon:  Globe,
  },
  {
    val:   "3 Critical",
    label: "High-Risk 2026 Venues",
    sub:   "Elevation > 1,000m",
    color: "#00C896",
    Icon:  AlertTriangle,
  },
];

export function StatsBar() {
  return (
    <div className="bg-card border-y border-border">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={i}
            className={`py-5 px-6 flex gap-3.5 items-center ${
              i < STATS.length - 1 ? "border-r border-border" : ""
            }`}
          >
            <s.Icon size={26} color={s.color} strokeWidth={1.5} />
            <div>
              <div className="text-xl font-black leading-none" style={{ color: s.color }}>
                {s.val}
              </div>
              <div className="text-xs font-bold text-primary mt-1">{s.label}</div>
              <div className="text-[10.5px] text-muted mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## FILE 13 — `app/venues/2026/page.tsx`

```tsx
import type { Metadata } from "next";
import { VenueCard }    from "@/components/ui/VenueCard";
import venues2026Data   from "@/data/venues_2026.json";
import type { Venue2026 } from "@/lib/types";

export const metadata: Metadata = {
  title: "2026 Venue Risk Matrix · FIFA World Cup Analytics",
  description: "Environmental risk rankings for all 16 FIFA World Cup 2026 host venues.",
};

export default function Venues2026Page() {
  const venues = venues2026Data as Venue2026[];
  const sorted = [...venues].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-bold text-gold tracking-wide mb-5">
          FIFA WORLD CUP 2026 · ALL 16 HOST VENUES
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">
          Environmental Risk Matrix
        </h1>
        <p className="text-muted2 max-w-xl mx-auto text-sm leading-relaxed">
          Predicted physiological stress index (0–100) for every 2026 host city,
          based on elevation, historical June temperature, and humidity.
          Derived from GLMM Negative Binomial model trained on 1994–2022 World Cup data.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-12">
        {[
          { cat: "CRITICAL", count: venues.filter(v => v.category === "CRITICAL").length, color: "#EF4444" },
          { cat: "HIGH",     count: venues.filter(v => v.category === "HIGH").length,     color: "#F59E0B" },
          { cat: "MEDIUM",   count: venues.filter(v => v.category === "MEDIUM").length,   color: "#F97316" },
          { cat: "LOW",      count: venues.filter(v => v.category === "LOW").length,       color: "#00C896" },
        ].map(s => (
          <div key={s.cat} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs font-bold mt-1" style={{ color: s.color }}>{s.cat}</div>
            <div className="text-[10px] text-muted mt-0.5">venues</div>
          </div>
        ))}
      </div>

      {/* Venue grid (all 16) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map(venue => (
          <VenueCard key={venue.city} venue={venue} showDetails={true} />
        ))}
      </div>

      {/* Shiny Dashboard CTA */}
      <div className="mt-12 p-6 bg-card border border-border rounded-2xl text-center">
        <div className="text-sm font-bold mb-2">Want to explore this interactively?</div>
        <p className="text-xs text-muted2 mb-5 max-w-md mx-auto">
          The Shiny dashboard lets you adjust the altitude threshold, filter by team,
          and see confidence intervals around each risk estimate.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-accent text-black font-bold text-sm rounded-lg hover:bg-accent/90 transition-colors"
        >
          Open Shiny Dashboard →
        </a>
      </div>
    </div>
  );
}
```

---

## FILE 14 — R → JSON Data Bridge Script

```r
# scripts/export_for_website.R
# Run this after completing your R analysis.
# Exports all model outputs as JSON files for Next.js to consume.

library(tidyverse)
library(jsonlite)
library(broom.mixed)

# Paths
MASTER <- "data/final/team_match_analytical.csv"
OUT    <- "website/data/"           # relative to Next.js project root
dir.create(OUT, showWarnings = FALSE, recursive = TRUE)

master <- read_csv(MASTER)

# ── 1. h2_delta by altitude category ─────────────────────────────
h2_by_cat <- master %>%
  filter(!is.na(h2_delta)) %>%
  group_by(alt_category) %>%
  summarise(
    mean_delta = round(mean(h2_delta), 3),
    ci_low     = round(mean(h2_delta) - 1.96 * sd(h2_delta) / sqrt(n()), 3),
    ci_high    = round(mean(h2_delta) + 1.96 * sd(h2_delta) / sqrt(n()), 3),
    n          = n(),
    .groups    = "drop"
  ) %>%
  rename(category = alt_category)

write_json(h2_by_cat, paste0(OUT, "h2_delta_by_category.json"),
           pretty = TRUE, auto_unbox = TRUE)

# ── 2. Model coefficients (from Model 4 — GLMM NB) ──────────────
m4 <- readRDS("models/m4_glmm_nb.rds")  # save your model: saveRDS(m4, ...)

coef_df <- broom.mixed::tidy(m4, conf.int = TRUE, effects = "fixed") %>%
  filter(term != "(Intercept)") %>%
  mutate(
    significant = p.value < 0.05,
    across(where(is.numeric), ~ round(.x, 4))
  ) %>%
  rename(
    std_error = std.error,
    p_value   = p.value,
    conf_low  = conf.low,
    conf_high = conf.high
  ) %>%
  select(term, estimate, std_error, statistic, p_value,
         conf_low, conf_high, significant)

write_json(coef_df, paste0(OUT, "model_coefficients.json"),
           pretty = TRUE, auto_unbox = TRUE)

# ── 3. Historical venue summary ──────────────────────────────────
venue_summary <- master %>%
  distinct(wc_year, venue_city, elevation_m, avg_temp_c, avg_humidity_pct) %>%
  group_by(wc_year, venue_city) %>%
  slice(1) %>%
  ungroup() %>%
  rename(
    elevation  = elevation_m,
    temp_c     = avg_temp_c,
    humidity   = avg_humidity_pct
  ) %>%
  arrange(wc_year, desc(elevation))

write_json(venue_summary, paste0(OUT, "venues_historical.json"),
           pretty = TRUE, auto_unbox = TRUE)

# ── 4. EDA key stats ────────────────────────────────────────────
eda_stats <- list(
  total_observations = nrow(master),
  wc_years           = sort(unique(master$wc_year)),
  n_high_altitude    = sum(master$is_high_alt, na.rm = TRUE),
  pct_high_altitude  = round(mean(master$is_high_alt, na.rm = TRUE) * 100, 1),
  mean_h2_delta_sea  = round(mean(master$h2_delta[!master$is_high_alt], na.rm = TRUE), 3),
  mean_h2_delta_alt  = round(mean(master$h2_delta[master$is_high_alt],  na.rm = TRUE), 3),
  max_elevation      = max(master$elevation_m, na.rm = TRUE),
  max_temp           = max(master$avg_temp_c,  na.rm = TRUE)
)

write_json(eda_stats, paste0(OUT, "eda_stats.json"),
           pretty = TRUE, auto_unbox = TRUE)

message("✅ All JSON files exported to ", OUT)
message("Copy these files to your Next.js /data/ directory before building.")
```

---

## FILE 15 — `vercel.json` (Deployment Config)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options",        "value": "DENY"              },
        { "key": "X-Content-Type-Options",  "value": "nosniff"           },
        { "key": "Referrer-Policy",         "value": "strict-origin"     }
      ]
    }
  ]
}
```

---

## DEPLOYMENT CHECKLIST

```
PRE-DEPLOY
  [ ] npm run build  → 0 TypeScript errors
  [ ] npm run lint   → 0 ESLint errors  
  [ ] All /data/*.json files populated with real R outputs
  [ ] og-image.png created (1200×630px)
  [ ] All page routes tested locally

VERCEL DEPLOY
  [ ] Push to GitHub: main branch
  [ ] Connect repo to Vercel (one-click)
  [ ] Verify all pages load on preview URL
  [ ] Set custom domain (optional)

POST-DEPLOY
  [ ] Deploy Shiny app to shinyapps.io
  [ ] Update /dashboard page with shinyapps.io URL
  [ ] Render Quarto report → upload to /report route
  [ ] Submit to GitHub Pages for Quarto report (optional)
  [ ] Update GitHub README with live website URL
  [ ] LinkedIn post with risk matrix screenshot
```

---

*Next.js Implementation Kit v1.0 · Altitude & Heat WC Analytics*
