import React from "react";
import SafeImage from "../common/SafeImage";
import { CommentIcon, HeartIcon } from "../common/Icons";
import CommentPanel from "./CommentPanel";

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(3, 6, 12, 0.78), rgba(3, 6, 12, 0.1) 58%)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "10px",
  padding: "14px",
  color: "#f3f4f6",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 260ms ease",
};

const PostCard = React.memo(function PostCard({
  post,
  currentUserId,
  onOpenProfile,
  onDeletePost,
  liked,
  onToggleLike,
  postRef,
  isHighlighted,
  comments,
  isCommentsOpen,
  onToggleComments,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  isCommentsLoading,
  isCommentSubmitting,
  commentErrorText,
  styles,
}) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const commentsAriaLabel = isHighlighted
    ? `${isCommentsOpen ? "Kommentare ausblenden" : "Kommentare anzeigen"} (Ausgewahlter Beitrag)`
    : isCommentsOpen
      ? "Kommentare ausblenden"
      : "Kommentare anzeigen";

  return (
    <article
      className="fade-in"
      ref={postRef}
      data-testid={`post-${post.id}`}
      style={{
        ...styles.card,
        border: isHighlighted ? "1px solid #8b5cf6" : styles.card.border,
        boxShadow: isHighlighted ? "0 0 0 1px rgba(139, 92, 246, 0.45)" : styles.card.boxShadow,
      }}
    >
      <div className={`artwork-thumb${isImageLoaded ? " is-loaded" : ""}`}>
        <SafeImage
          src={post.images[0]}
          alt={`Artwork von ${post.user}`}
          onDoubleClick={() => onToggleLike(post.id)}
          onLoad={() => setIsImageLoaded(true)}
          className="artwork-image"
          style={styles.image}
        />
        <div className="artwork-overlay" style={overlayStyle}>
          <button
            type="button"
            onClick={() => onOpenProfile(post)}
            style={{
              ...styles.iconBtn,
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.01em",
              textShadow: "0 1px 10px rgba(0, 0, 0, 0.5)",
            }}
          >
            {post.user}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => onToggleLike(post.id)}
              style={{
                ...styles.iconBtn,
                width: "32px",
                height: "32px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(11, 16, 25, 0.62)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
              }}
              aria-label="Like umschalten"
            >
              <HeartIcon active={liked} />
            </button>
            <button
              type="button"
              onClick={() => onToggleComments(post.id)}
              style={{
                ...styles.iconBtn,
                width: "32px",
                height: "32px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(11, 16, 25, 0.62)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
              }}
              aria-label={commentsAriaLabel}
            >
              <CommentIcon />
            </button>
            {String(post.ownerId || "") === String(currentUserId || "") && (
              <button
                type="button"
                onClick={() => onDeletePost(post.id)}
                style={{
                  ...styles.iconBtn,
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(80, 20, 20, 0.62)",
                  border: "1px solid rgba(252, 165, 165, 0.38)",
                  color: "#fecaca",
                  fontSize: "15px",
                }}
                aria-label="Beitrag loeschen"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {isCommentsOpen && (
        <CommentPanel
          comments={comments}
          isLoading={isCommentsLoading}
          errorText={commentErrorText}
          commentText={commentText}
          onCommentTextChange={(value) => onCommentTextChange(post.id, value)}
          onSubmitComment={() => onSubmitComment(post.id)}
          isSubmitting={isCommentSubmitting}
          styles={styles}
        />
      )}
    </article>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
