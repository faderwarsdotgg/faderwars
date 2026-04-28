"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const LEVELS = [
  { value: "beginner", label: "Beginner", description: "Just getting started with mixing." },
  { value: "hobbyist", label: "Hobbyist", description: "Mix for fun, learning the craft." },
  { value: "semi_pro", label: "Semi-Pro", description: "Serious about mixing, some experience." },
  { value: "professional", label: "Professional", description: "Mixing is your career." },
];

type Step = "username" | "level" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [instagram, setInstagram] = useState("");
  const [level, setLevel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkUsername() {
    setError("");
    if (username.length < 3) return setError("Username must be at least 3 characters.");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return setError("Only letters, numbers and underscores.");
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();
    setLoading(false);
    if (data) return setError("Username already taken.");
    setStep("level");
  }

  async function finish() {
    setError("");
    if (!level) return setError("Please select your experience level.");
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/signin"); return; }

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      username,
      instagram: instagram.replace("@", "") || null,
      self_assessment: level,
      role: "user",
    });

    setLoading(false);
    if (error) return setError(error.message);
    setStep("done");
    setTimeout(() => router.push("/home"), 1800);
  }

  const steps: Step[] = ["username", "level"];
  const stepIndex = steps.indexOf(step);

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
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
          <AnimatePresence mode="wait">
            {step === "done" ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8 gap-4"
              >
                <div
                  className="text-5xl mb-2"
                  style={{ filter: "drop-shadow(0 0 16px #BF5FFF)" }}
                >
                  🎚️
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Welcome to the War, {username}.
                </h2>
                <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                  Entering the arena...
                </p>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                {/* Header */}
                <div className="mb-6 text-center">
                  <h2
                    className="text-2xl font-bold mb-1"
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Set Up Your Profile
                  </h2>
                  <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                    {step === "username" ? "Choose your identity." : "How would you describe yourself?"}
                  </p>
                </div>

                {/* Progress */}
                <div className="flex gap-2 mb-8">
                  {steps.map((s, i) => (
                    <div
                      key={s}
                      className="h-0.5 flex-1 rounded-full transition-all duration-300"
                      style={{ background: i <= stepIndex ? "#BF5FFF" : "#1E1E35" }}
                    />
                  ))}
                </div>

                {step === "username" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs text-[#8888AA] mb-2 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your_username"
                        maxLength={24}
                        className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors"
                        style={{ fontFamily: "var(--font-inter)" }}
                        onKeyDown={(e) => e.key === "Enter" && checkUsername()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8888AA] mb-2 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                        Instagram <span className="normal-case text-[#8888AA]">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@yourhandle"
                        className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors"
                        style={{ fontFamily: "var(--font-inter)" }}
                      />
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <button
                      onClick={checkUsername}
                      disabled={loading || !username}
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

                {step === "level" && (
                  <div className="flex flex-col gap-3">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLevel(l.value)}
                        className="w-full px-4 py-4 rounded-xl border text-left transition-all duration-200"
                        style={{
                          background: level === l.value ? "rgba(191,95,255,0.1)" : "rgba(7,7,15,0.6)",
                          borderColor: level === l.value ? "#BF5FFF" : "#1E1E35",
                          boxShadow: level === l.value ? "0 0 16px rgba(191,95,255,0.2)" : "none",
                        }}
                      >
                        <p className="text-[#F5F5F5] text-sm font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                          {l.label}
                        </p>
                        <p className="text-[#8888AA] text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)" }}>
                          {l.description}
                        </p>
                      </button>
                    ))}
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <button
                      onClick={finish}
                      disabled={loading || !level}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 mt-2"
                      style={{
                        fontFamily: "var(--font-inter)",
                        background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                        boxShadow: "0 0 20px rgba(191,95,255,0.3)",
                      }}
                    >
                      {loading ? "Setting up..." : "Enter FaderWars"}
                    </button>
                    <button
                      onClick={() => { setStep("username"); setError(""); }}
                      className="text-[#8888AA] text-xs text-center hover:text-[#F5F5F5] transition-colors"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      ← Back
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
