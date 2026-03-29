import React, { useEffect, useMemo, useState } from "react";
import SafeImage from "../common/SafeImage";
import { createAvatarFromName, readFileAsDataUrl } from "../../utils/helpers";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  color: "rgba(255, 255, 255, 0.9)",
  padding: "10px 12px",
};

export default function ProfilePage({ data, onBack, isOwnProfile, onSaveProfile, onChangePassword, styles, getPasswordStrength }) {
  const [displayName, setDisplayName] = useState(data?.user || "");
  const [bio, setBio] = useState(data?.bio || "");
  const [avatar, setAvatar] = useState(data?.avatar || "");
  const [successText, setSuccessText] = useState("");
  const [profileErrorText, setProfileErrorText] = useState("");
  const [avatarFileError, setAvatarFileError] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrorText, setPasswordErrorText] = useState("");
  const [passwordSuccessText, setPasswordSuccessText] = useState("");

  useEffect(() => {
    setDisplayName(data?.user || "");
    setBio(data?.bio || "");
    setAvatar(data?.avatar || "");
    setSuccessText("");
    setProfileErrorText("");
    setAvatarFileError("");
    setAvatarFileName("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordErrorText("");
    setPasswordSuccessText("");
  }, [data]);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword, getPasswordStrength]);

  if (!data) {
    return (
      <div style={{ padding: "24px" }}>
        <p>Kein Profil ausgewaehlt.</p>
      </div>
    );
  }

  const canSaveOwnProfile = displayName.trim().length >= 2;
  const canChangePassword =
    currentPassword.trim().length > 0 && newPassword.trim().length > 0 && confirmPassword.trim().length > 0;

  return (
    <section style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 16px 28px" }}>
      <div style={{ marginBottom: "12px" }}>
        <button type="button" onClick={onBack} style={styles.secondaryBtn}>
          ← Zurueck
        </button>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <SafeImage
          src={data.avatar}
          alt={`${data.user} Avatar`}
          style={{ width: 86, height: 86, borderRadius: "50%", objectFit: "cover", background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
        <h2 style={{ marginBottom: "6px" }}>{data.user}</h2>
        <p style={{ marginTop: 0, opacity: 0.8 }}>{data.bio}</p>
      </div>

      {isOwnProfile && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px",
            border: "1px solid #2a2a2a",
            borderRadius: "18px",
            background: "#1a1a1a",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Profil bearbeiten</h3>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Anzeigename</span>
            <input
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                if (successText) {
                  setSuccessText("");
                }
              }}
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Bio</span>
            <textarea
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                if (successText) {
                  setSuccessText("");
                }
              }}
              rows={3}
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </label>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Avatar URL (optional)</span>
            <input
              value={avatar}
              onChange={(event) => {
                setAvatar(event.target.value);
                if (successText) {
                  setSuccessText("");
                }
                if (profileErrorText) {
                  setProfileErrorText("");
                }
                if (avatarFileError) {
                  setAvatarFileError("");
                }
              }}
              placeholder="https://..."
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Profilbild Datei</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                setAvatarFileError("");
                setProfileErrorText("");
                setSuccessText("");
                if (!file.type.startsWith("image/")) {
                  setAvatarFileError("Bitte nur Bilddateien auswaehlen.");
                  event.target.value = "";
                  return;
                }
                if (file.size > 2 * 1024 * 1024) {
                  setAvatarFileError("Datei ist zu gross. Maximal 2 MB erlaubt.");
                  event.target.value = "";
                  return;
                }
                try {
                  const dataUrl = await readFileAsDataUrl(file);
                  setAvatar(dataUrl);
                  setAvatarFileName(file.name);
                } catch (error) {
                  setAvatarFileError("Datei konnte nicht gelesen werden.");
                } finally {
                  event.target.value = "";
                }
              }}
              style={fieldStyle}
            />
          </label>
          {avatarFileName && <p style={{ marginTop: "-2px", color: "#aaaaaa", fontSize: "12px" }}>Ausgewaehlt: {avatarFileName}</p>}
          {avatarFileError && <p style={{ color: "#aaaaaa", marginTop: "-2px" }}>{avatarFileError}</p>}

          <button
            type="button"
            onClick={async () => {
              if (!canSaveOwnProfile) {
                return;
              }
              const nextName = displayName.trim();
              const nextBio = bio.trim();
              const nextAvatar = avatar.trim() || createAvatarFromName(nextName);
              const error = await onSaveProfile({
                displayName: nextName,
                bio: nextBio,
                avatar: nextAvatar,
              });
              if (error) {
                setProfileErrorText(error);
                setSuccessText("");
                return;
              }
              setProfileErrorText("");
              setSuccessText("Profil gespeichert.");
            }}
            disabled={!canSaveOwnProfile}
            style={{ ...styles.primaryBtn, width: "100%", opacity: canSaveOwnProfile ? 1 : 0.6 }}
          >
            Aenderungen speichern
          </button>
          {profileErrorText && <p style={{ color: "#aaaaaa", marginBottom: 0 }}>{profileErrorText}</p>}
          {successText && <p style={{ color: "rgba(255, 255, 255, 0.9)", marginBottom: 0 }}>{successText}</p>}

          <hr style={{ borderColor: "#2a2a2a", margin: "16px 0" }} />

          <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Passwort aendern</h4>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Aktuelles Passwort</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Aktuelles Passwort"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  if (passwordErrorText) {
                    setPasswordErrorText("");
                  }
                  if (passwordSuccessText) {
                    setPasswordSuccessText("");
                  }
                }}
                style={{ ...fieldStyle, flex: 1 }}
              />
              <button type="button" onClick={() => setShowCurrentPassword((previous) => !previous)} style={styles.secondaryBtn}>
                {showCurrentPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
          </label>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Neues Passwort</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Neues Passwort"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  if (passwordErrorText) {
                    setPasswordErrorText("");
                  }
                  if (passwordSuccessText) {
                    setPasswordSuccessText("");
                  }
                }}
                style={{ ...fieldStyle, flex: 1 }}
              />
              <button type="button" onClick={() => setShowNewPassword((previous) => !previous)} style={styles.secondaryBtn}>
                {showNewPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
          </label>
          <p style={{ marginTop: "-4px", marginBottom: "12px", color: passwordStrength.color, fontSize: "12px" }}>
            Passwortstaerke: {passwordStrength.label}
          </p>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Neues Passwort bestaetigen</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Neues Passwort bestaetigen"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (passwordErrorText) {
                    setPasswordErrorText("");
                  }
                  if (passwordSuccessText) {
                    setPasswordSuccessText("");
                  }
                }}
                style={{ ...fieldStyle, flex: 1 }}
              />
              <button type="button" onClick={() => setShowConfirmPassword((previous) => !previous)} style={styles.secondaryBtn}>
                {showConfirmPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
          </label>
          <button
            type="button"
            onClick={async () => {
              const error = await onChangePassword({
                currentPassword,
                newPassword,
                confirmPassword,
              });
              if (error) {
                setPasswordErrorText(error);
                setPasswordSuccessText("");
                return;
              }
              setPasswordErrorText("");
              setPasswordSuccessText("Passwort wurde aktualisiert.");
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            disabled={!canChangePassword}
            style={{ ...styles.primaryBtn, width: "100%", opacity: canChangePassword ? 1 : 0.6 }}
          >
            Passwort aktualisieren
          </button>
          {passwordErrorText && <p style={{ color: "#aaaaaa", marginBottom: 0 }}>{passwordErrorText}</p>}
          {passwordSuccessText && <p style={{ color: "rgba(255, 255, 255, 0.9)", marginBottom: 0 }}>{passwordSuccessText}</p>}
        </div>
      )}

      <div style={{ marginTop: "8px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "12px" }}>{isOwnProfile ? "Deine Werke" : "Werke"}</h3>
        {data.images.length === 0 ? (
          <div style={{ border: "1px dashed #3a3a3a", borderRadius: "12px", padding: "16px", color: "#aaaaaa" }}>
            {isOwnProfile ? "Du hast noch nichts hochgeladen." : "Noch keine hochgeladenen Bilder."}
          </div>
        ) : (
          <div className="feed-grid-balanced">
            {data.images.map((image, index) => (
              <article key={`${data.id}-profile-${index}`} className="gallery-item">
                <div className="artwork-thumb is-loaded">
                  <SafeImage
                    src={image}
                    alt={`Werk ${index + 1} von ${data.user}`}
                    className="artwork-image"
                    style={{ width: "100%", height: "auto", objectFit: "cover", background: "#1a1a1a" }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
