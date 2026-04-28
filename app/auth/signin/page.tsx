"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("Invalid email or password.");
    router.push("/home");
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background */}
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
        <div
          className="rounded-2xl border border-[#1E1E35] p-8"
          style={{ background: "rgba(15,15,26,0.85)", backdropFilter: "blur(16px)" }}
        >
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
              Welcome back.
            </p>
          </div>

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
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors"
                style={{ fontFamily: "var(--font-inter)" }}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={signIn}
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
              style={{
                fontFamily: "var(--font-inter)",
                background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                boxShadow: "0 0 20px rgba(191,95,255,0.3)",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <p className="text-center text-[#8888AA] text-xs mt-6" style={{ fontFamily: "var(--font-inter)" }}>
            New to FaderWars?{" "}
            <a href="/auth/signup" className="text-[#BF5FFF] hover:underline">
              Sign up with your invite code
            </a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
