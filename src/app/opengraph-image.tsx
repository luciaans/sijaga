import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SIJAGA — Sistem Kedisiplinan Santri Pondok Pesantren Al-Jihad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const emblem = await readFile(join(process.cwd(), "public", "al-jihad-emblem.png"), "base64");
const emblemSrc = `data:image/png;base64,${emblem}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "64px",
          position: "relative",
          overflow: "hidden",
          color: "#f5fff9",
          background: "linear-gradient(135deg, #062b22 0%, #07513c 58%, #0c6b4d 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -220,
            width: 570,
            height: 570,
            borderRadius: 285,
            border: "2px solid rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -30,
            bottom: -320,
            width: 520,
            height: 520,
            borderRadius: 260,
            background: "rgba(255,255,255,0.04)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 250,
            height: 250,
            flexShrink: 0,
            borderRadius: 48,
            background: "#f4fff8",
            boxShadow: "0 24px 70px rgba(0,0,0,0.2)",
          }}
        >
          <img src={emblemSrc} width={210} height={210} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 56, maxWidth: 760 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "11px 19px",
              border: "1px solid rgba(255,255,255,0.24)",
              borderRadius: 999,
              color: "#b9efd1",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            PONDOK PESANTREN AL-JIHAD
          </div>
          <div style={{ marginTop: 24, fontSize: 88, fontWeight: 800, letterSpacing: 2, lineHeight: 1 }}>
            SIJAGA
          </div>
          <div style={{ marginTop: 18, color: "#d6f5e4", fontSize: 31, fontWeight: 600 }}>
            Sistem Kedisiplinan Santri
          </div>
          <div style={{ marginTop: 15, color: "#b7ddca", fontSize: 23, lineHeight: 1.4 }}>
            Catat dan tinjau laporan kedisiplinan dalam satu aplikasi.
          </div>
          <div style={{ marginTop: 34, color: "#8fd9b3", fontSize: 20, fontWeight: 600 }}>
            sijaga-ponpes-al-jihad.web.id
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
