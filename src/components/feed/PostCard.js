import React from "react";
import SafeImage from "../common/SafeImage";
import { CommentIcon, HeartIcon } from "../common/Icons";
import CommentPanel from "./CommentPanel";

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.06) 56%)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "8px",
  padding: "12px",
  color: "#f3f4f6",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 180ms ease",
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
  commentCount,
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
  const commentsAriaLabel = isHighlighted
    ? `${isCommentsOpen ? "Kommentare ausblenden" : "Kommentare anzeigen"} (Ausgewahlter Beitrag)`
    : isCommentsOpen
      ? "Kommentare ausblenden"
      : "Kommentare anzeigen";

  return (
    <article
      ref={postRef}
      data-testid={`post-${post.id}`}
      style={{
        ...styles.card,
        border: isHighlighted ? "1px solid #8b5cf6" : styles.card.border,
        boxShadow: isHighlighted ? "0 0 0 1px rgba(139, 92, 246, 0.45)" : styles.card.boxShadow,
      }}
    >
      <button
        type="button"
        onClick={() => onOpenProfile(post)}
        style={{
          ...styles.iconBtn,
          width: "100%",
          textAlign: "left",
          padding: "14px 16px 12px",
          fontWeight: 700,
          fontSize: "14px",
        }}
      >
        {post.user}
      </button>
      {String(post.ownerId || "") === String(currentUserId || "") && (
        <div style={{ padding: "0 16px 12px" }}>
          <button
            type="button"
            onClick={() => onDeletePost(post.id)}
            style={{
              ...styles.iconBtn,
              fontSize: "12px",
              textDecoration: "underline",
              color: "#fca5a5",
            }}
            aria-label="Beitrag loeschen"
          >
            Beitrag loeschen
          </button>
        </div>
      )}

      <div style={styles.imageGrid}>
        {post.images.map((image, index) => (
          <div key={`${post.id}-${index}`} className="artwork-thumb" style={{ position: "relative", overflow: "hidden" }}>
            <SafeImage
              src={image}
              alt={`Artwork ${index + 1} von ${post.user}`}
              onDoubleClick={() => onToggleLike(post.id)}
              style={styles.image}
            />
            <div className="artwork-overlay" data-image-overlay style={overlayStyle}>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>{post.user}</span>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>{liked ? "Geliked" : `${Number(commentCount) || 0} Kommentare`}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "18px", padding: "12px 16px" }}>
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          style={styles.iconBtn}
          aria-label="Like umschalten"
        >
          <HeartIcon active={liked} />
        </button>
        <button
          type="button"
          onClick={() => onToggleComments(post.id)}
          style={styles.iconBtn}
          aria-label={commentsAriaLabel}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <CommentIcon />
            <span style={{ fontSize: "12px", fontWeight: 700 }}>{commentCount}</span>
          </span>
        </button>
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
