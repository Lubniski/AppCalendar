import { cookies } from "next/headers";
import { renderIcon } from "@/lib/icon";
import { PROFILE_COOKIE, initialOf, profileFromCookie, safeColor } from "@/lib/theme";

const SIZES = [96, 180, 192, 512];

/**
 * App icon with the user's initial and color: /pwa-icon/192?l=R&c=cf5682.
 * Without a query string it uses the profile cookie (what Safari requests from
 * the page's apple-touch-icon when adding to the home screen).
 */
export async function GET(req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  const n = SIZES.includes(Number(size)) ? Number(size) : 192;
  const params = new URL(req.url).searchParams;
  if (params.has("l")) {
    return renderIcon(n, initialOf(params.get("l") ?? ""), safeColor(params.get("c")), {
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
    });
  }
  const profile = profileFromCookie((await cookies()).get(PROFILE_COOKIE)?.value);
  return renderIcon(n, initialOf(profile?.name ?? ""), safeColor(profile?.color), {
    "Cache-Control": "private, no-cache",
  });
}
