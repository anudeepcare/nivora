import { ImageResponse } from "next/og";
export const alt = "AURYN — Clear research. A better next move.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "76px",
          background: "#121e36",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            letterSpacing: 6,
            color: "#8bb6ff",
          }}
        >
          AURYN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 700,
            }}
          >
            Your next move,
            <br />
            with perspective.
          </div>
          <div style={{ fontSize: 28, color: "#c3d2ea" }}>
            Business. Price. Portfolio. AURYN Pace.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#92b4ef" }}>
          auryninvest.com
        </div>
      </div>
    ),
    size,
  );
}
