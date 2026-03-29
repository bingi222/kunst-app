import React from "react";
import SafeImage from "../common/SafeImage";

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(0, 0, 0, 0.56), rgba(0, 0, 0, 0.1) 62%)",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 260ms ease",
};

const PostCard = React.memo(function PostCard({ post, postRef, isHighlighted, styles, onOpenDetail }) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  return (
    <article
      className="fade-in gallery-item"
      ref={postRef}
      data-testid={`post-${post.id}`}
      style={{
        ...styles.card,
        border: isHighlighted ? "1px solid #3a3a3a" : styles.card.border,
        boxShadow: isHighlighted ? "0 0 0 1px rgba(255, 255, 255, 0.14)" : styles.card.boxShadow,
      }}
    >
      <div className={`artwork-thumb${isImageLoaded ? " is-loaded" : ""}`}>
        <SafeImage
          src={post.images[0]}
          alt={`Artwork von ${post.user}`}
          onLoad={() => setIsImageLoaded(true)}
          onClick={() => onOpenDetail?.(post)}
          className="artwork-image"
          style={styles.image}
        />
        <div className="artwork-overlay" style={overlayStyle} />
      </div>
    </article>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
