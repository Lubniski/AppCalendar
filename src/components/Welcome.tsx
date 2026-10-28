"use client";

import { useState } from "react";
import { DEFAULT_COLOR, cleanName, type Profile } from "@/lib/theme";
import { ProfileEditor } from "./ProfileEditor";
import { primaryBtn } from "./Sheet";

type Props = {
  initialName: string;
  onDone: (p: Profile) => void;
  onPreview: (p: Profile) => void;
};

/** After creating an account: pick a name and a color before seeing the calendar. */
export function Welcome({ initialName, onDone, onPreview }: Props) {
  const [profile, setProfile] = useState<Profile>({ name: initialName, color: DEFAULT_COLOR });
  const ready = cleanName(profile.name).length > 0;

  const change = (p: Profile) => {
    setProfile(p);
    onPreview(p);
  };

  return (
    <div className="anim-fade fixed inset-0 z-50 flex justify-center overflow-y-auto bg-surface">
      <form
        className="safe-top safe-bottom flex w-full max-w-md flex-col px-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onDone({ ...profile, name: cleanName(profile.name) });
        }}
      >
        <div className="pb-6 pt-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Hola</h1>
          <p className="mt-2 text-muted">Armemos tu calendario. Contame cómo te llamás y elegí tu color.</p>
        </div>
        <ProfileEditor profile={profile} onChange={change} autoFocus={!initialName} />
        <div className="flex-1" />
        <button className={`${primaryBtn} mb-4 mt-8 disabled:opacity-40`} disabled={!ready}>
          Empezar
        </button>
      </form>
    </div>
  );
}
