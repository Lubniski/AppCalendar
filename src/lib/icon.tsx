import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { iconGradient } from "./theme";

// Pacifico (SIL Open Font License): a bold script initial for the app icon.
const pacifico = readFileSync(join(process.cwd(), "src/assets/pacifico.woff"));

export function renderIcon(size: number, letter = "R", color?: string, headers?: Record<string, string>) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: iconGradient(color ?? ""),
          color: "white",
          fontFamily: "Pacifico",
          fontSize: size * 0.6,
          // Pacifico sits high in its line box; nudge it down to look centered.
          paddingTop: size * 0.04,
        }}
      >
        {letter}
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Pacifico", data: pacifico, weight: 400, style: "normal" }],
      headers,
    },
  );
}
