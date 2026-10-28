"use client";

import { useLayoutEffect } from "react";
import { appName, iconUrl, manifestUrl, safeColor, themeVars, type Profile } from "./theme";

function setHead(selector: string, attr: string, value: string, create: () => HTMLElement) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * Paints the app in the user's color and points the page title, manifest and
 * home-screen icon at their name, so "Add to Home Screen" picks them up.
 */
export function useApplyProfile(profile: Profile | null) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(themeVars(safeColor(profile?.color)))) root.style.setProperty(k, v);

    const name = appName(profile);
    document.title = name;
    const meta = (n: string) => () => Object.assign(document.createElement("meta"), { name: n });
    const link = (rel: string) => () => Object.assign(document.createElement("link"), { rel });
    setHead('meta[name="apple-mobile-web-app-title"]', "content", name, meta("apple-mobile-web-app-title"));
    setHead('meta[name="theme-color"]', "content", themeVars(safeColor(profile?.color))["--bg"], meta("theme-color"));
    setHead('link[rel="manifest"]', "href", manifestUrl(profile), link("manifest"));
    setHead('link[rel="apple-touch-icon"]', "href", iconUrl(profile, 180), link("apple-touch-icon"));
  }, [profile]);
}
