"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Battle = {
  id: string;
  mode: "chill" | "standard" | "rush";
  status: string;
  ends_at: string | null;
  max_players: number;
  stem_sets: { title: string; artist_name: string } | null;
  participant_count: number;
};

const MODE_COLORS = {
  chill: "#22C55E",
  standard: "#BF5FFF",
  rush: "#F97316",
};

const MODE_DURATION = {
  chill: "3h",
  standard: "1h",
  rush: "35min",
};

function TimeLeft({ endsAt }: { endsAt: string | null }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    if (!endsAt) { setLeft("—"); return; }
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return <span>{left}</span>;
}

export default function PitPage() {
  const router = useRouter();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }

      const { data } = await supabase
        .from("battles")
        .select(`id, mode, status, ends_at, max_players, stem_sets(title, artist_name)`)
        .eq("section", "pit")
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false });

      const battles = await Promise.all((data || []).map(async (b) => {
        const { count } = await supabase
          .from("battle_participants")
          .select("*", { count: "exact", head: true })
          .eq("battle_id", b.id);
        return { ...b, participant_count: count || 0 };
      }));

      setBattles(battles as Battle[]);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen relative overflow-hidden">
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
        <a href="/home">
          <h1
            className="text-xl font-bold cursor-pointer"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FADERWARS
          </h1>
        </a>
        <div className="flex items-center gap-6">
          <a href="/pit" className="text-[#F5F5F5] text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>The Pit</a>
          <a href="/leaderboard" className="text-[#8888AA] text-sm hover:text-[#F5F5F5] transition-colors" style={{ fontFamily: "var(--font-inter)" }}>Leaderboard</a>
          <a href="/profile" className="text-[#8888AA] text-sm hover:text-[#F5F5F5] transition-colors" style={{ fontFamily: "var(--font-inter)" }}>Profile</a>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-[#8888AA] text-xs tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
              Unranked
            </p>
            <h2 className="text-4xl font-bold text-[#F5F5F5]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              The Pit
            </h2>
          </div>
          <button
            onClick={() => router.push("/pit/new")}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{
              fontFamily: "var(--font-inter)",
              background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
              boxShadow: "0 0 20px rgba(191,95,255,0.3)",
            }}
          >
            + New Battle
          </button>
        </motion.div>

        {/* Battles list */}
        {loading ? (
          <div className="text-[#8888AA] text-sm text-center py-20" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
            Loading battles...
          </div>
        ) : battles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-[#1E1E35] p-20 flex flex-col items-center text-center"
            style={{ background: "rgba(15,15,26,0.6)" }}
          >
            <div className="text-5xl mb-4 opacity-40">🎚️</div>
            <p className="text-[#F5F5F5] text-sm font-semibold mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              No active battles
            </p>
            <p className="text-[#8888AA] text-xs mb-6" style={{ fontFamily: "var(--font-inter)" }}>
              Be the first to start one.
            </p>
            <button
              onClick={() => router.push("/pit/new")}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{
                fontFamily: "var(--font-inter)",
                background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                boxShadow: "0 0 16px rgba(191,95,255,0.25)",
              }}
            >
              Start a Battle
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {battles.map((battle, i) => (
              <motion.div
                key={battle.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/pit/${battle.id}`)}
                className="rounded-2xl border border-[#1E1E35] p-6 flex items-center justify-between cursor-pointer transition-all hover:border-[#BF5FFF] hover:shadow-[0_0_20px_rgba(191,95,255,0.1)]"
                style={{ background: "rgba(15,15,26,0.7)" }}
              >
                <div className="flex items-center gap-5">
                  {/* Mode badge */}
                  <div
                    className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      color: MODE_COLORS[battle.mode],
                      background: `${MODE_COLORS[battle.mode]}18`,
                      border: `1px solid ${MODE_COLORS[battle.mode]}40`,
                    }}
                  >
                    {battle.mode}
                  </div>
                  <div>
                    <p className="text-[#F5F5F5] text-sm font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {battle.stem_sets?.title || "Unknown Track"} — {battle.stem_sets?.artist_name || "Unknown Artist"}
                    </p>
                    <p className="text-[#8888AA] text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)" }}>
                      {battle.participant_count} / {battle.max_players} players
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[#8888AA] text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)" }}>Time left</p>
                    <p className="text-[#F5F5F5] text-sm font-semibold" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                      <TimeLeft endsAt={battle.ends_at} />
                    </p>
                  </div>
                  <div
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{
                      fontFamily: "var(--font-inter)",
                      background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                    }}
                  >
                    Join
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
