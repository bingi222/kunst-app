import React, { useMemo, useState } from "react";
import { getPasswordStrength } from "../../utils/format";

export default function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [errorText, setErrorText] = useState("");

  const isRegister = mode === "register";
  const registerPasswordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const submitAuth = async (event) => {
    event.preventDefault();
    const payload = { username, password, displayName, email, marketingConsent };
    const error = await (isRegister ? onRegister(payload) : onLogin(payload));
    if (error) {
      setErrorText(error);
      return;
    }
    setErrorText("");
    setPassword("");
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submitAuth}>
        <h1 className="auth-title">KUNST Login</h1>
        <p className="auth-subtitle">{isRegister ? "Neues Konto anlegen" : "Mit Profil anmelden"}</p>

        {isRegister && (
          <label className="form-field">
            <span>Anzeigename</span>
            <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="z. B. Mia Art" />
          </label>
        )}
        {isRegister && (
          <label className="form-field">
            <span>E-Mail (erforderlich)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@beispiel.de"
              autoComplete="email"
              required={isRegister}
            />
          </label>
        )}

        <label className="form-field">
          <span>Username</span>
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="z. B. bingi" autoComplete="username" />
        </label>

        <label className="form-field">
          <span>Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "Mindestens 6 Zeichen" : "Dein Passwort"}
          />
        </label>
        {isRegister && <p style={{ marginTop: "-2px", marginBottom: "10px", color: registerPasswordStrength.color, fontSize: "12px" }}>Passwortstaerke: {registerPasswordStrength.label}</p>}
        {isRegister && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px", fontSize: "12px", color: "#aaaaaa" }}>
            <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(Boolean(event.target.checked))} style={{ marginTop: "2px" }} />
            <span>Ich moechte Produkt-News und Werbe-E-Mails erhalten. Meine E-Mail wird fuer Verifizierung und Marketing genutzt.</span>
          </label>
        )}
        {errorText && <p style={{ color: "#aaaaaa", marginBottom: "12px" }}>{errorText}</p>}

        <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
          {isRegister ? "Registrieren" : "Anmelden"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setErrorText("");
          }}
          style={{ marginTop: "10px", background: "transparent", border: "none", color: "#aaaaaa", textDecoration: "underline", cursor: "pointer" }}
        >
          {isRegister ? "Schon ein Konto? Jetzt anmelden" : "Noch kein Konto? Jetzt registrieren"}
        </button>

        <p style={{ marginBottom: 0, marginTop: "16px", color: "#aaaaaa", fontSize: "12px" }}>
          Demo-Login: Username <b>bingi</b>, Passwort <b>kunst123</b>
        </p>
      </form>
    </div>
  );
}
