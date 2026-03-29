import React from "react";
import SafeImage from "../common/SafeImage";
import { formatRelativeTime } from "../../utils/format";

export default function CommentPanel({
  comments,
  isLoading,
  errorText,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  isSubmitting,
  styles,
}) {
  const currentLength = commentText.length;
  const trimmedLength = commentText.trim().length;
  const canSubmit = trimmedLength > 0 && trimmedLength <= 300 && !isSubmitting;

  return (
    <div
      style={{
        borderTop: "1px solid #2a2a2a",
        padding: "12px 14px 14px",
        background: "#1a1a1a",
      }}
    >
      {isLoading ? (
        <p style={{ marginTop: 0, marginBottom: "10px", color: "#aaaaaa", fontSize: "13px" }}>
          Kommentare werden geladen...
        </p>
      ) : comments.length === 0 ? (
        <p style={{ marginTop: 0, marginBottom: "10px", color: "#aaaaaa", fontSize: "13px" }}>
          Noch keine Kommentare.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginBottom: "10px" }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <SafeImage
                src={comment.userAvatar}
                alt={`${comment.userName} Avatar`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: "#222222",
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.35 }}>
                  <strong>{comment.userName}</strong>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", lineHeight: 1.35 }}>{comment.text}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#aaaaaa" }}>
                  {formatRelativeTime(comment.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {errorText && <p style={{ marginTop: 0, marginBottom: "8px", color: "#aaaaaa", fontSize: "12px" }}>{errorText}</p>}

      <label style={{ display: "block", marginBottom: "8px" }}>
        <span style={{ display: "block", marginBottom: "6px", fontSize: "12px", opacity: 0.85 }}>
          Kommentar schreiben
        </span>
        <textarea
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Schreibe einen Kommentar..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            color: "rgba(255, 255, 255, 0.9)",
            padding: "10px 12px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </label>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", color: "#aaaaaa" }}>{currentLength}/300</span>
        <button
          type="button"
          onClick={onSubmitComment}
          disabled={!canSubmit}
          style={{
            ...styles.secondaryBtn,
            minWidth: "110px",
            opacity: canSubmit ? 1 : 0.55,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {isSubmitting ? "Senden..." : "Senden"}
        </button>
      </div>
    </div>
  );
}
