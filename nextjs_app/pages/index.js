// pages/index.js
import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [threshold, setThreshold] = useState(1000);

  return (
    <div className="container">
      <Head>
        <title>WC 2026 Altitude & Heat Analysis</title>
        <meta name="description" content="Altitude & heat impact on World Cup 2026" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="main">
        <h1 className="title">WC 2026 – Altitude & Heat</h1>
        <p className="description">
          Explore how elevation and temperature affect second‑half goal differentials.
        </p>
        <div className="slider">
          <label htmlFor="threshold">Altitude threshold (m): {threshold}</label>
          <input
            id="threshold"
            type="range"
            min="500"
            max="2000"
            step="100"
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
          />
        </div>
        <section className="report">
          <iframe src="/report.html" title="Quarto Report" style={{ width: "100%", height: "800px", border: "none" }} />
        </section>
      </main>
    </div>
  );
}
