"use client";

export default function IntroVideo({ onFinish }: { onFinish: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000 }}>
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <button
        onClick={onFinish}
        style={{
          position: "absolute",
          top: 24,
          right: 20,
          padding: "8px 16px",
          borderRadius: 20,
          background: "rgba(0,0,0,0.4)",
          border: "none",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Skip
      </button>
    </div>
  );
}
