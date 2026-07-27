"use client";

import { useEffect, useState } from "react";
import { getStoredToken, setStoredToken } from "@/lib/client-api";

export function TokenBar() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
      <span className="text-white/60">توكن الأدمن (من DASHBOARD_ADMIN_TOKEN):</span>
      <input
        type="password"
        value={token}
        onChange={(e) => {
          setToken(e.target.value);
          setSaved(false);
        }}
        placeholder="الصق التوكن هنا"
        className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-white outline-none focus:border-primary"
        dir="ltr"
      />
      <button
        onClick={() => {
          setStoredToken(token);
          setSaved(true);
        }}
        className="rounded-lg bg-primary px-4 py-1.5 font-semibold text-black hover:brightness-110"
      >
        {saved ? "اتحفظ ✓" : "حفظ"}
      </button>
    </div>
  );
}
