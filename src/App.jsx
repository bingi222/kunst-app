import React, { useState } from "react";

export default function App() {
  const [title, setTitle] = useState("Kunst App — Live Preview");
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header>
        <h1>{title}</h1>
        <p className="subtitle">Ändere Text oder Code — HMR aktualisiert sofort.</p>
      </header>

      <main>
        <section className="controls">
          <label>
            Titel bearbeiten:
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Titel bearbeiten"
            />
          </label>

          <div className="counter">
            <button onClick={() => setCount((c) => c - 1)} aria-label="Minus">
              −
            </button>
            <span className="count">{count}</span>
            <button onClick={() => setCount((c) => c + 1)} aria-label="Plus">
              +
            </button>
          </div>
        </section>

        <section className="preview">
          <h2>Live‑Vorschau</h2>
          <p>Alles, was du an diesem Code änderst, wird sofort im Browser sichtbar — kein manueller Reload nötig.</p>
        </section>
      </main>

      <footer>
        <small>Vite + React — Hot Module Replacement (HMR)</small>
      </footer>
    </div>
  );
}
