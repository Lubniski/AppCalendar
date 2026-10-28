"use client";

import dynamic from "next/dynamic";

// Everything lives in localStorage for now, so render only in the browser.
const RomiApp = dynamic(() => import("@/components/RomiApp"), { ssr: false });

export default function Home() {
  return <RomiApp />;
}
