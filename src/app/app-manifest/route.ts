import { cookies } from "next/headers";
import { PROFILE_COOKIE, appName, iconUrl, profileFromCookie, safeColor, type Profile } from "@/lib/theme";

/**
 * Web app manifest with the user's name and color: /app-manifest?n=Romi&c=cf5682.
 * Without a query string it uses the profile cookie, so the installed app is
 * named "<Name>Org" with the right icon however Safari fetches it.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const fromQuery = params.has("n");
  const profile: Profile = fromQuery
    ? { name: params.get("n") ?? "", color: safeColor(params.get("c")) }
    : (profileFromCookie((await cookies()).get(PROFILE_COOKIE)?.value) ?? { name: "", color: safeColor(null) });
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
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": fromQuery ? "public, max-age=3600" : "private, no-cache",
      },
    },
  );
}
