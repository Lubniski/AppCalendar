import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esUY } from "@clerk/localizations";
import { Fraunces, Inter, Pacifico } from "next/font/google";
import { appName, iconUrl, manifestUrl } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

// Name, icon and manifest are personalized on the client once the profile loads.
export const metadata: Metadata = {
  title: appName(null),
  description: "Calendario con recordatorios según prioridad y dificultad",
  manifest: manifestUrl(null),
  icons: { apple: iconUrl(null, 180) },
  appleWebApp: {
    title: appName(null),
    capable: true,
    statusBarStyle: "default",
  },
};

// Clerk's sign-in titles use the internal app name; use our own wording instead.
const clerkLocalization = {
  ...esUY,
  signIn: {
    ...esUY.signIn,
    start: {
      ...esUY.signIn?.start,
      title: "Iniciá sesión",
      titleCombined: "Entrá a tu calendario",
      subtitle: "Usá tu cuenta para ver tus eventos",
      subtitleCombined: "Iniciá sesión o creá tu cuenta",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable} ${pacifico.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <ClerkProvider localization={clerkLocalization}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
