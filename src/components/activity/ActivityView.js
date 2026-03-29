import React from "react";
import SafeImage from "../common/SafeImage";
import { buildNotificationMessage, formatRelativeTime } from "../../utils/format";

export default function ActivityView({
  notifications,
  isLoading,
  errorText,
  onReload,
  onMarkAllRead,
  canMarkAllRead,
  showUndoMarkAll,
  onUndoMarkAll,
  onMarkRead,
  onOpenPost,
  onBack,
  styles,
}) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <section style={{ maxWidth: 1080, margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <button type="button" onClick={onBack} style={styles.secondaryBtn}>
          Zurueck
        </button>
        <button type="button" onClick={onMarkAllRead} disabled={!canMarkAllRead} style={styles.primaryBtn}>
          Alle als gelesen markieren
        </button>
      </div>

      {showUndoMarkAll && (
        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            padding: "10px 12px",
            marginBottom: "10px",
            background: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#aaaaaa" }}>Alle Benachrichtigungen wurden als gelesen markiert.</p>
          <button type="button" onClick={onUndoMarkAll} style={{ ...styles.iconBtn, fontSize: "12px", textDecoration: "underline" }}>
            Rueckgaengig
          </button>
        </div>
      )}

      <h2 style={{ marginTop: 0 }}>Aktivitaet</h2>
      {errorText && (
        <div
          style={{
            border: "1px dashed #3a3a3a",
            borderRadius: "10px",
            padding: "12px",
            color: "#aaaaaa",
            marginBottom: "10px",
          }}
        >
          <p style={{ marginTop: 0, marginBottom: "8px" }}>{errorText}</p>
          <button type="button" onClick={onReload} style={{ ...styles.iconBtn, fontSize: "12px", textDecoration: "underline" }}>
            Erneut versuchen
          </button>
        </div>
      )}

      {isLoading ? (
        <div style={{ border: "1px dashed #3a3a3a", borderRadius: "10px", padding: "18px", color: "#aaaaaa" }}>Aktivitaet wird geladen...</div>
      ) : notifications.length === 0 ? (
        <div style={{ border: "1px dashed #3a3a3a", borderRadius: "10px", padding: "18px", color: "#aaaaaa" }}>Noch keine Benachrichtigungen.</div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {unreadCount === 0 && (
            <p style={{ margin: 0, fontSize: "12px", color: "#aaaaaa" }}>
              Keine ungelesenen Benachrichtigungen.
            </p>
          )}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                padding: "12px",
                background: notification.read ? "#1a1a1a" : "#222222",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <SafeImage
                  src={notification.actorAvatar}
                  alt={`${notification.actorName || "User"} Avatar`}
                  style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", background: "#1a1a1a", flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.4 }}>
                    <strong>{notification.actorName || "Jemand"}</strong> {buildNotificationMessage(notification)}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#aaaaaa" }}>{formatRelativeTime(notification.createdAt)}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                    {Number.isFinite(Number(notification.postId)) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenPost) {
                            onOpenPost(notification);
                          }
                        }}
                        style={{ ...styles.iconBtn, fontSize: "12px", textDecoration: "underline" }}
                      >
                        Zum Beitrag
                      </button>
                    )}
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(notification.id)}
                        style={{ ...styles.iconBtn, fontSize: "12px", textDecoration: "underline" }}
                      >
                        Als gelesen markieren
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
