"use client";

import { SignIn } from "@clerk/nextjs";
import { WifiOff } from "lucide-react";
import { safeColor } from "@/lib/theme";

/** Sign in or create an account (one combined flow), painted in the app's color. */
export function AuthScreen({ color, online }: { color?: string; online: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-bg">
      <div className="safe-top safe-bottom flex w-full max-w-md flex-col items-center px-4">
        <div className="pb-6 pt-12 text-center">
          <p className="font-display text-[32px] font-semibold tracking-tight">
            Tu<span className="text-brand-500">Org</span>
          </p>
          <p className="mt-1 text-sm text-muted">Tu calendario, guardado en tu cuenta</p>
        </div>
        {online ? (
          <SignIn
            routing="hash"
            withSignUp
            appearance={{
              variables: { colorPrimary: safeColor(color), borderRadius: "0.75rem", fontFamily: "var(--font-inter)" },
              elements: { cardBox: { boxShadow: "0 8px 30px rgba(0,0,0,0.06)" } },
            }}
          />
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3 text-center text-muted">
            <WifiOff size={28} />
            <p>Necesitás conexión a internet para iniciar sesión por primera vez.</p>
          </div>
        )}
      </div>
    </div>
  );
}
