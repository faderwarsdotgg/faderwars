"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

type Tag = { id: string; label: string; type: "strength" | "weakness" };
type Submission = { id: string; user_id: string; storage_path: string; audioUrl?: string };

export default function VotePage() {
  const router = useRouter();
  const params = useParams();
  const battleId = params.id as string;

  const [userId, setUserId] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [writtenFeedback, setWrittenFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }
      setUserId(user.id);

      const { data: subs } = await supabase
        .from("mix_submissions")
        .select("id, user_id, storage_path")
        .eq("battle_id", battleId)
        .neq("user_id", user.id);

      const { data: tagsData } = await supabase
        .from("feedback_tags")
        .select("*")
        .order("display_order");

      const { data: existingVotes } = await supabase
        .from("votes")
        .select("id")
        .eq("battle_id", battleId)
        .eq("voter_id", user.id);

      if (existingVotes && existingVotes.length >= (subs?.length || 0) && (subs?.length || 0) > 0) {
        setAlreadyVoted(true);
        setLoading(false);
        return;
      }

      const subsWithUrls = await Promise.all((subs || []).map(async (sub) => {
        const { data } = await supabase.storage.from("mixes").createSignedUrl(sub.storage_path, 3600);
        return { ...sub, audioUrl: data?.signedUrl };
      }));

      setSubmissions(subsWithUrls);
      setTags(tagsData || []);
      setLoading(false);
    }
    load();
  }, [battleId, router]);

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function submitVote() {
    if (score === 0) return;
    if (selectedTags.length < 3) return;
    if (score < 5 && !writtenFeedback.trim()) return;

    setSubmitting(true);
    const supabase = createClient();
    const current = submissions[currentIndex];

    const { data: vote } = await supabase.from("votes").insert({
      battle_id: battleId,
      voter_id: userId,
      mix_submission_id: current.id,
      score,
      written_feedback: writtenFeedback.trim() || null,
    }).select("id").single();

    if (vote) {
      await supabase.from("vote_tags").insert(
        selectedTags.map((tag_id) => ({ vote_id: vote.id, tag_id }))
      );
    }

    if (currentIndex + 1 >= submissions.length) {
      await supabase.from("battles").update({ status: "completed" }).eq("id", battleId);
      router.push(`/pit/${battleId}/reveal`);
    } else {
      setCurrentIndex((i) => i + 1);
      setScore(0);
      setSelectedTags([]);
      setWrittenFeedback("");
      if (audioRef.current) audioRef.current.load();
    }
    setSubmitting(false);
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Loading mixes...</p>
    </main>
  );

  if (alreadyVoted) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#F5F5F5] text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>You&apos;ve already voted.</p>
        <button onClick={() => router.push(`/pit/${battleId}/reveal`)} className="text-[#BF5FFF] text-sm hover:underline" style={{ fontFamily: "var(--font-inter)" }}>
          View Reveal →
        </button>
      </div>
    </main>
  );

  if (submissions.length === 0) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#F5F5F5] font-semibold mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>No mixes to vote on.</p>
        <a href="/pit" className="text-[#BF5FFF] text-sm hover:underline" style={{ fontFamily: "var(--font-inter)" }}>Back to The Pit</a>
      </div>
    </main>
  );

  const current = submissions[currentIndex];
  const strengths = tags.filter((t) => t.type === "strength");
  const weaknesses = tags.filter((t) => t.type === "weakness");
  const canSubmit = score > 0 && selectedTags.length >= 3 && (score >= 5 || writtenFeedback.trim().length > 0);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#BF5FFF] opacity-[0.04] blur-[140px] pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1E1E35]">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          FADERWARS
        </h1>
        <span className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
          Mix {currentIndex + 1} of {submissions.length}
        </span>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-8 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            {/* Audio player */}
            <div className="rounded-2xl border border-[#1E1E35] p-6" style={{ background: "rgba(15,15,26,0.8)" }}>
              <p className="text-[#8888AA] text-xs tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                Mix #{currentIndex + 1} — Anonymous
              </p>
              {current.audioUrl ? (
                <audio ref={audioRef} controls className="w-full" style={{ accentColor: "#BF5FFF" }}>
                  <source src={current.audioUrl} type="audio/mpeg" />
                </audio>
              ) : (
                <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>Audio unavailable.</p>
              )}
            </div>

            {/* Score */}
            <div className="rounded-2xl border border-[#1E1E35] p-6" style={{ background: "rgba(15,15,26,0.8)" }}>
              <p className="text-[#8888AA] text-xs tracking-widest uppercase mb-4" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                Score
              </p>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      background: score === n ? "linear-gradient(135deg, #BF5FFF, #C084FC)" : "rgba(7,7,15,0.8)",
                      border: score === n ? "1px solid #BF5FFF" : "1px solid #1E1E35",
                      color: score === n ? "#fff" : "#8888AA",
                      boxShadow: score === n ? "0 0 12px rgba(191,95,255,0.4)" : "none",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {score > 0 && score < 5 && (
                <p className="text-[#F97316] text-xs mt-3" style={{ fontFamily: "var(--font-inter)" }}>
                  Score below 5 requires written feedback.
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-[#1E1E35] p-6" style={{ background: "rgba(15,15,26,0.8)" }}>
              <p className="text-[#8888AA] text-xs tracking-widest uppercase mb-4" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                Feedback — select at least 3
              </p>
              <div className="mb-4">
                <p className="text-[#22C55E] text-xs mb-2" style={{ fontFamily: "var(--font-inter)" }}>Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {strengths.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        fontFamily: "var(--font-inter)",
                        background: selectedTags.includes(tag.id) ? "#22C55E20" : "rgba(7,7,15,0.6)",
                        border: `1px solid ${selectedTags.includes(tag.id) ? "#22C55E" : "#1E1E35"}`,
                        color: selectedTags.includes(tag.id) ? "#22C55E" : "#8888AA",
                      }}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-red-400 text-xs mb-2" style={{ fontFamily: "var(--font-inter)" }}>Weaknesses</p>
                <div className="flex flex-wrap gap-2">
                  {weaknesses.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        fontFamily: "var(--font-inter)",
                        background: selectedTags.includes(tag.id) ? "#EF444420" : "rgba(7,7,15,0.6)",
                        border: `1px solid ${selectedTags.includes(tag.id) ? "#EF4444" : "#1E1E35"}`,
                        color: selectedTags.includes(tag.id) ? "#EF4444" : "#8888AA",
                      }}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Written feedback */}
            <div className="rounded-2xl border border-[#1E1E35] p-6" style={{ background: "rgba(15,15,26,0.8)" }}>
              <div className="flex justify-between mb-2">
                <p className="text-[#8888AA] text-xs tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  Written Feedback {score < 5 && score > 0 ? "(required)" : "(optional)"}
                </p>
                <span className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  {writtenFeedback.length}/300
                </span>
              </div>
              <textarea
                value={writtenFeedback}
                onChange={(e) => setWrittenFeedback(e.target.value.slice(0, 300))}
                placeholder="Share your thoughts on this mix..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors resize-none"
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={submitVote}
              disabled={!canSubmit || submitting}
              className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{
                fontFamily: "var(--font-inter)",
                background: "linear-gradient(135deg, #BF5FFF, #C084FC)",
                boxShadow: canSubmit ? "0 0 24px rgba(191,95,255,0.35)" : "none",
              }}
            >
              {submitting ? "Submitting..." : currentIndex + 1 < submissions.length ? `Submit & Next Mix →` : "Submit & See Results"}
            </button>

            {selectedTags.length < 3 && (
              <p className="text-center text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-inter)" }}>
                Select at least {3 - selectedTags.length} more tag{3 - selectedTags.length !== 1 ? "s" : ""} to continue.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
