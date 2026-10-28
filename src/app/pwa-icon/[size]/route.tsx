import { renderIcon } from "@/lib/icon";
import { initialOf, safeColor } from "@/lib/theme";

const SIZES = [96, 180, 192, 512];

/** App icon with the user's initial and color: /pwa-icon/192?l=R&c=cf5682 */
export async function GET(req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  const n = Number(size);
  const params = new URL(req.url).searchParams;
  return renderIcon(SIZES.includes(n) ? n : 192, initialOf(params.get("l") ?? ""), safeColor(params.get("c")), {
    "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
  });
}
