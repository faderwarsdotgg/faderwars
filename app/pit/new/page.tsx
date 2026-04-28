"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type StemSet = { id: string; title: string; artist_name: string };
type Mode = "chill" | "standard" | "rush";

const MODES: { value: Mode; label: string; duration: string; xp: string; color: string }[] = [
  { value: "chill", label: "Chill", duration: "3 hours", xp: "100 XP", color: "#22C55E" },
  { value: "standard", label: "Standard", duration: "1 hour", xp: "150 XP", color: "#BF5FFF" },
  { value: "rush", label: "Rush", duration: "35 min", xp: "200 XP", color: "#F97316" },
];

const MODE_DURATION_MS: Record<Mode, number> = {
  chill: 3 * 60 * 60 * 1000,
  standard: 60 * 60 * 1000,
  rush: 35 * 60 * 1000,
};

export default function NewBattlePage() {
  const router = useRouter();
  const [stems, setStems] = useState<StemSet[]>([]);
  const [selectedStem, setSelectedStem] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<Mode>("standard");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }

      const { data } = await supabase
        .from("stem_sets")
        .select("id, title, artist_name")
        .eq("is_active", true)
        .order("title");

      setStems(data || []);
    }
    load();
  }, [router]);

  async function createBattle() {
    setError("");
    if (!selectedStem) return setError("Please select a stem set.");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/signin"); return; }

    const now = Date.now();
    const endsAt = new Date(now + MODE_DURATION_MS[selectedMode]).toISOString();

    const { data: battle, error: battleError } = await supabase
      .from("battles")
      .insert({
        mode: selectedMode,
        section: "pit",
        stem_set_id: selectedStem,
        status: "active",
        started_at: new Date(now).toISOString(),
        ends_at: endsAt,
        max_players: maxPlayers,
      })
      .select("id")
      .single();

    if (battleError || !battle) {
      setError("Failed to create battle. Please try again.");
      setLoading(false);
      return;
    }

    await supabase.from("battle_participants").insert({
      battle_id: battle.id,
      user_id: user.id,
      status: "joined",
    });

    router.push(`/pit/${battle.id}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BF5FFF] opacity-[0.05] blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div
          className="rounded-2xl border border-[#1E1E35] p-8"
          style={{ background: "rgba(15,15,26,0.85)", backdropFilter: "blur(16px)" }}
        >
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/pit")}
              className="text-[#8888AA] text-xs mb-4 hover:text-[#F5F5F5] transition-colors flex items-center gap-1"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              ← Back to The Pit
            </button>
            <h2 className="text-2xl font-bold text-[#F5F5F5]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              New Battle
            </h2>
            <p className="text-[#8888AA] text-sm mt-1" style={{ fontFamily: "var(--font-inter)" }}>
              Set up your unranked match.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {/* Mode selection */}
            <div>
              <label className="block text-xs text-[#8888AA] mb-3 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                Mode
              </label>
              <div className="flex flex-col gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMode(m.value)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
                    style={{
                      background: selectedMode === m.value ? `${m.color}10` : "rgba(7,7,15,0.6)",
                      borderColor: selectedMode === m.value ? m.color : "#1E1E35",
                      boxShadow: selectedMode === m.value ? `0 0 14px ${m.color}20` : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded"
                        style={{ fontFamily: "var(--font-jetbrains-mono)", color: m.color, background: `${m.color}20` }}
                      >
                        {m.label}
                      </span>
                      <span className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-inter)" }}>
                        {m.duration}
                      </span>
                    </div>
                    <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-jetbrains-mono)", color: m.color }}>
                      {m.xp}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stem set */}
            <div>
              <label className="block text-xs text-[#8888AA] mb-3 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                Stems
              </label>
              {stems.length === 0 ? (
                <div
                  className="px-4 py-3 rounded-xl border border-[#1E1E35] text-[#8888AA] text-xs"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  No stem sets available yet. Admin needs to add some first.
                </div>
              ) : (
                <select
                  value={selectedStem}
                  onChange={(e) => setSelectedStem(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  <option value="">Select a track...</option>
                  {stems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {s.artist_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Max players */}
            <div>
              <label className="block text-xs text-[#8888AA] mb-3 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                Max Players — <span style={{ color: "#BF5FFF" }}>{maxPlayers}</span>
              </label>
              <input
                type="range"
                min={2}
                max={8}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-[#BF5FFF]"
              />
              <div className="flex justify-between text-[#8888AA] text-xs mt-1" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                <span>2</span><span>8</span>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={createBattle}
              disabled={loading || !selectedStem}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40"
              style={{
                fontFamily: "var(--font-inter)",
                background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                boxShadow: "0 0 20px rgba(191,95,255,0.3)",
              }}
            >
              {loading ? "Creating..." : "Start Battle"}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
