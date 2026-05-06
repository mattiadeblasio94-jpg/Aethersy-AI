import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Loader2 } from "lucide-react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const nav = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const hash = window.location.hash || "";
    const sessionId = new URLSearchParams(hash.replace(/^#/, "")).get("session_id");
    if (!sessionId) {
      nav("/login", { replace: true });
      return;
    }
    (async () => {
      try {
        const r = await api.post("/auth/google/callback", { session_id: sessionId });
        localStorage.setItem("e360_token", r.data.token);
        localStorage.setItem("e360_user", JSON.stringify(r.data.user));
        // Clean the hash and redirect
        window.history.replaceState(null, "", "/dashboard");
        window.location.href = "/dashboard";
      } catch (e) {
        nav("/login?error=google", { replace: true });
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" strokeWidth={1.5}/>
        <div className="text-sm text-zinc-400">Signing you in with Google...</div>
      </div>
    </div>
  );
}
