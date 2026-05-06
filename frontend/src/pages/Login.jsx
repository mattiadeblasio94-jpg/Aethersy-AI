import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ArrowRight, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const isRegister = loc.pathname === "/register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) await register(email, password, name);
      else await login(email, password);
      toast.success(isRegister ? "Account created" : "Welcome back");
      const tierParam = new URLSearchParams(window.location.search).get("tier");
      if (tierParam) nav(`/pricing?tier=${tierParam}`);
      else nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex bg-[#050505] text-white relative overflow-hidden">
      <div
        className="hidden lg:block flex-1 relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1759338245039-906f7558e743?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwyfHxkYXJrJTIwYWJzdHJhY3QlMjBtaW5pbWFsJTIwdGV4dHVyZXxlbnwwfHx8fDE3Nzc5OTg4MTh8MA&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-md">
          <div className="e360-overline text-cyan-400 mb-4">Aethersy AI · meet Lara</div>
          <h1 className="text-5xl font-bold leading-[1.05]" style={{fontFamily:'Cabinet Grotesk'}}>
            Build, launch and grow — powered by Lara.
          </h1>
          <p className="text-zinc-400 mt-4 leading-relaxed">
            Ten elite tools in one futuristic command center: research, plans, code, CRM, crypto, email,
            funnels — and Lara, your AI co-founder, also on Telegram.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="w-full max-w-md relative animate-fade-up">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg" style={{fontFamily:'Cabinet Grotesk'}}>Aethersy AI</span>
          </div>
          <h2 className="text-3xl font-bold mb-1" style={{fontFamily:'Cabinet Grotesk'}}>
            {isRegister ? "Create your account" : "Sign in to your console"}
          </h2>
          <p className="text-sm text-zinc-500 mb-8">
            {isRegister ? "Start your AI-powered entrepreneurship journey." : "Welcome back. Pick up where you left off."}
          </p>

          <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="e360-overline">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5}/>
                  <input
                    required value={name} onChange={(e) => setName(e.target.value)}
                    className="e360-input w-full pl-9" placeholder="Jane Doe"
                    data-testid="auth-name-input"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="e360-overline">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5}/>
                <input
                  required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="e360-input w-full pl-9" placeholder="founder@startup.io"
                  data-testid="auth-email-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="e360-overline">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5}/>
                <input
                  required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="e360-input w-full pl-9" placeholder="•••••••••"
                  data-testid="auth-password-input"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="e360-btn-primary w-full justify-center inline-flex items-center gap-2 disabled:opacity-60"
              data-testid="auth-submit-btn"
            >
              {loading ? "Working..." : (isRegister ? "Create account" : "Sign in")}
              <ArrowRight className="w-4 h-4" strokeWidth={2}/>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-zinc-600">
            <div className="flex-1 h-px bg-white/10"/>
            <span>OR</span>
            <div className="flex-1 h-px bg-white/10"/>
          </div>

          <button
            type="button" onClick={googleSignIn}
            className="w-full inline-flex items-center justify-center gap-3 py-2.5 rounded-md bg-white text-black font-semibold hover:bg-zinc-100 transition-colors"
            data-testid="auth-google-btn"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-sm text-zinc-500 text-center">
            {isRegister ? (
              <>Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300" data-testid="auth-switch-link">Sign in</Link></>
            ) : (
              <>Don't have one? <Link to="/register" className="text-cyan-400 hover:text-cyan-300" data-testid="auth-switch-link">Create account</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
