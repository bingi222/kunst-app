import React from "react";

export function HeartIcon({ active }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", width: 22, height: 22 }}
      aria-hidden="true"
    >
      <path d="M20.8 5.6c-1.5-1.5-3.9-1.5-5.4 0L12 9l-3.4-3.4c-1.5-1.5-3.9-1.5-5.4 0a3.82 3.82 0 0 0 0 5.4L12 19.8l8.8-8.8a3.82 3.82 0 0 0 0-5.4z" />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", width: 22, height: 22 }}
      aria-hidden="true"
    >
      <path d="M21 14a4 4 0 0 1-4 4H9l-4 3v-3a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", width: 18, height: 18 }}
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
