import { appName, iconUrl, safeColor } from "@/lib/theme";

/** Web app manifest with the user's name and color: /app-manifest?n=Romi&c=cf5682 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const profile = { name: params.get("n") ?? "", color: safeColor(params.get("c")) };
  const name = appName(profile);
  return Response.json(
    {
      name,
      short_name: name,
      description: "Calendario con recordatorios según prioridad y dificultad",
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: profile.color,
      icons: [
        { src: iconUrl(profile, 192), sizes: "192x192", type: "image/png" },
        { src: iconUrl(profile, 512), sizes: "512x512", type: "image/png" },
        { src: iconUrl(profile, 512), sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } },
  );
}
