"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

type Result = {
  submission_id: string;
  username: string;
  level: number;
  average_score: number;
  vote_count: number;
  storage_path: string;
  audioUrl?: string;
  tags: { label: string; type: string; count: number }[];
  written_feedbacks: string[];
};

export default function RevealPage() {
  const router = useRouter();
  const params = useParams();
  const battleId = params.id as string;
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }

      const { data: subs } = await supabase
        .from("mix_submissions")
        .select("id, user_id, storage_path, profiles(username, level)")
        .eq("battle_id", battleId);

      const results: Result[] = await Promise.all((subs || []).map(async (sub) => {
        const { data: votes } = await supabase
          .from("votes")
          .select("score, written_feedback")
          .eq("mix_submission_id", sub.id);

        const { data: voteTags } = await supabase
          .from("vote_tags")
          .select("feedback_tags(label, type), votes!inner(mix_submission_id)")
          .eq("votes.mix_submission_id", sub.id);

        const tagCounts: Record<string, { label: string; type: string; count: number }> = {};
        (voteTags || []).forEach((vt: any) => {
          const tag = vt.feedback_tags;
          if (!tag) return;
          if (!tagCounts[tag.label]) tagCounts[tag.label] = { label: tag.label, type: tag.type, count: 0 };
          tagCounts[tag.label].count++;
        });

        const scores = (votes || []).map((v) => v.score);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        const { data: urlData } = await supabase.storage.from("mixes").createSignedUrl(sub.storage_path, 3600);
        const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;

        return {
          submission_id: sub.id,
          username: (profile as any)?.username || "Unknown",
          level: (profile as any)?.level || 1,
          average_score: Math.round(avg * 10) / 10,
          vote_count: scores.length,
          storage_path: sub.storage_path,
          audioUrl: urlData?.signedUrl,
          tags: Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 6),
          written_feedbacks: (votes || []).map((v) => v.written_feedback).filter(Boolean) as string[],
        };
      }));

      results.sort((a, b) => b.average_score - a.average_score);
      setResults(results);
      setLoading(false);
    }
    load();
  }, [battleId, router]);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Loading results...</p>
    </main>
  );

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[#BF5FFF] opacity-[0.05] blur-[150px] pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1E1E35]">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          FADERWARS
        </h1>
        <a href="/pit" className="text-[#8888AA] text-xs hover:text-[#F5F5F5] transition-colors" style={{ fontFamily: "var(--font-inter)" }}>
          Back to The Pit
        </a>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="text-[#8888AA] text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Battle Complete</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Results
          </h2>
        </motion.div>

        <div className="flex flex-col gap-5">
          {results.map((result, i) => (
            <motion.div
              key={result.submission_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border p-6"
              style={{
                background: i === 0 ? "rgba(191,95,255,0.07)" : "rgba(15,15,26,0.8)",
                borderColor: i === 0 ? "#BF5FFF" : "#1E1E35",
                boxShadow: i === 0 ? "0 0 30px rgba(191,95,255,0.15)" : "none",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[i] || `#${i + 1}`}</span>
                  <div>
                    <p className="text-[#F5F5F5] font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {result.username}
                    </p>
                    <p className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                      LVL {result.level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-3xl font-bold"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {result.average_score.toFixed(1)}
                  </p>
                  <p className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                    {result.vote_count} vote{result.vote_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Audio */}
              {result.audioUrl && (
                <audio controls className="w-full mb-4" style={{ accentColor: "#BF5FFF" }}>
                  <source src={result.audioUrl} type="audio/mpeg" />
                </audio>
              )}

              {/* Tags */}
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className="px-2.5 py-1 rounded-lg text-xs"
                      style={{
                        fontFamily: "var(--font-inter)",
                        color: tag.type === "strength" ? "#22C55E" : "#EF4444",
                        background: tag.type === "strength" ? "#22C55E15" : "#EF444415",
                        border: `1px solid ${tag.type === "strength" ? "#22C55E40" : "#EF444440"}`,
                      }}
                    >
                      {tag.label} ×{tag.count}
                    </span>
                  ))}
                </div>
              )}

              {/* Written feedback */}
              {result.written_feedbacks.length > 0 && (
                <div className="flex flex-col gap-2">
                  {result.written_feedbacks.map((fb, j) => (
                    <p key={j} className="text-[#8888AA] text-xs px-3 py-2 rounded-lg border border-[#1E1E35]" style={{ fontFamily: "var(--font-inter)", background: "rgba(7,7,15,0.5)" }}>
                      &ldquo;{fb}&rdquo;
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 text-center">
          <button
            onClick={() => router.push("/pit/new")}
            className="px-8 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all"
            style={{ fontFamily: "var(--font-inter)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", boxShadow: "0 0 20px rgba(191,95,255,0.3)" }}
          >
            Start Another Battle
          </button>
        </motion.div>
      </div>
    </main>
  );
}
