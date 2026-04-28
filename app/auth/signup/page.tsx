"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Step = "invite" | "account" | "check-email";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("invite");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function validateInvite() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, is_active, used_by, expires_at")
      .eq("code", inviteCode.trim().toUpperCase())
      .single();

    setLoading(false);

    if (error || !data) return setError("Invalid invite code.");
    if (!data.is_active) return setError("This invite code is no longer active.");
    if (data.used_by) return setError("This invite code has already been used.");
    if (data.expires_at && new Date(data.expires_at) < new Date())
      return setError("This invite code has expired.");

    setStep("account");
  }

  async function signUp() {
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { invite_code: inviteCode.trim().toUpperCase() },
      },
    });

    setLoading(false);
    if (error) return setError(error.message);
    setStep("check-email");
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BF5FFF] opacity-[0.06] blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl border border-[#1E1E35] p-8"
          style={{ background: "rgba(15,15,26,0.85)", backdropFilter: "blur(16px)" }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h2
              className="text-2xl font-bold mb-1"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              FADERWARS
            </h2>
            <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
              {step === "invite" && "Enter your invite code to join the beta."}
              {step === "account" && "Create your account."}
              {step === "check-email" && "One more step."}
            </p>
          </div>

          {/* Step indicator — hidden on check-email */}
          {step !== "check-email" && (
            <div className="flex gap-2 mb-8">
              {(["invite", "account"] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className="h-0.5 flex-1 rounded-full transition-all duration-300"
                  style={{ background: i <= ["invite", "account"].indexOf(step) ? "#BF5FFF" : "#1E1E35" }}
                />
              ))}
            </div>
          )}

          {step === "invite" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#8888AA] mb-2 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors tracking-widest"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                  onKeyDown={(e) => e.key === "Enter" && validateInvite()}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={validateInvite}
                disabled={loading || !inviteCode}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                  boxShadow: "0 0 20px rgba(191,95,255,0.3)",
                }}
              >
                {loading ? "Checking..." : "Continue"}
              </button>
            </div>
          )}

          {step === "account" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#8888AA] mb-2 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </div>
              <div>
                <label className="block text-xs text-[#8888AA] mb-2 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                  onKeyDown={(e) => e.key === "Enter" && signUp()}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={signUp}
                disabled={loading || !email || password.length < 8}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                  boxShadow: "0 0 20px rgba(191,95,255,0.3)",
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
              <button
                onClick={() => { setStep("invite"); setError(""); }}
                className="text-[#8888AA] text-xs text-center hover:text-[#F5F5F5] transition-colors"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                ← Back
              </button>
            </div>
          )}

          {step === "check-email" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="text-4xl" style={{ filter: "drop-shadow(0 0 12px #BF5FFF)" }}>✉️</div>
              <p className="text-[#F5F5F5] text-sm font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Check your email
              </p>
              <p className="text-[#8888AA] text-xs leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
                We sent a confirmation link to <span className="text-[#F5F5F5]">{email}</span>.<br />
                Click the link to activate your account, then sign in.
              </p>
              <a
                href="/auth/signin"
                className="mt-2 w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-all duration-200 hover:opacity-90 block"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                  boxShadow: "0 0 20px rgba(191,95,255,0.3)",
                }}
              >
                Go to Sign In
              </a>
            </div>
          )}

          {/* Sign in link */}
          {step !== "check-email" && (
            <p className="text-center text-[#8888AA] text-xs mt-6" style={{ fontFamily: "var(--font-inter)" }}>
              Already have an account?{" "}
              <a href="/auth/signin" className="text-[#BF5FFF] hover:underline">
                Sign in
              </a>
            </p>
          )}
        </div>
      </motion.div>
    </main>
  );
}
