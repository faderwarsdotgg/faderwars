"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Profile = {
  username: string;
  level: number;
  xp: number;
  role: string;
};

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("username, level, xp, role")
        .eq("id", user.id)
        .single();

      if (!data) { router.push("/onboarding"); return; }
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#BF5FFF] opacity-[0.04] blur-[140px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1E1E35]">
        <h1
          className="text-xl font-bold"
          style={{
            fontFamily: "var(--font-space-grotesk)",
            background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          FADERWARS
        </h1>
        <div className="flex items-center gap-6">
          <span className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
            The Pit
          </span>
          <span className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
            Leaderboard
          </span>
          <span className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
            Profile
          </span>
          <button
            onClick={signOut}
            className="px-4 py-1.5 rounded-lg border border-[#1E1E35] text-[#8888AA] text-xs hover:border-[#BF5FFF] hover:text-[#F5F5F5] transition-all"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-[#8888AA] text-sm mb-1" style={{ fontFamily: "var(--font-inter)" }}>
            Welcome back,
          </p>
          <h2
            className="text-4xl font-bold"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {profile?.username}
          </h2>
          <div className="flex items-center gap-4 mt-3">
            <span
              className="text-[#8888AA] text-xs px-3 py-1 rounded-full border border-[#1E1E35]"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              LVL {profile?.level}
            </span>
            <span
              className="text-[#8888AA] text-xs"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              {profile?.xp} XP
            </span>
            {profile?.role === "admin" && (
              <span
                className="text-xs px-3 py-1 rounded-full border border-[#BF5FFF] text-[#BF5FFF]"
                style={{ fontFamily: "var(--font-jetbrains-mono)" }}
              >
                ADMIN
              </span>
            )}
          </div>
        </motion.div>

        {/* Battles section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-lg font-semibold text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Active Battles
            </h3>
            <button
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{
                fontFamily: "var(--font-inter)",
                background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                boxShadow: "0 0 16px rgba(191,95,255,0.3)",
              }}
            >
              + New Battle
            </button>
          </div>

          {/* Empty state */}
          <div
            className="rounded-2xl border border-[#1E1E35] p-16 flex flex-col items-center text-center"
            style={{ background: "rgba(15,15,26,0.6)" }}
          >
            <div className="text-4xl mb-4 opacity-50">🎚️</div>
            <p className="text-[#F5F5F5] text-sm font-semibold mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              No active battles yet
            </p>
            <p className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-inter)" }}>
              Be the first to start one.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
