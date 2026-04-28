"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

type Battle = {
  id: string;
  mode: "chill" | "standard" | "rush";
  status: string;
  ends_at: string | null;
  stem_sets: { title: string; artist_name: string; spotify_url?: string; stems_download_url?: string } | null;
};

type Participant = {
  user_id: string;
  status: string;
  profiles: { username: string; level: number } | null;
};

const MODE_COLORS = { chill: "#22C55E", standard: "#BF5FFF", rush: "#F97316" };

function Countdown({ endsAt, onExpire }: { endsAt: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [warning, setWarning] = useState(false);
  const notified = useRef(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00"); onExpire(); return; }

      if (diff <= 5 * 60 * 1000 && !notified.current) {
        notified.current = true;
        setWarning(true);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("FaderWars", { body: "5 minutes left — submit your mix!" });
        }
        setTimeout(() => setWarning(false), 8000);
      }

      const h = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setTimeLeft(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  return (
    <div className="flex flex-col items-center">
      <p className="text-[#8888AA] text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
        Time Remaining
      </p>
      <div
        className="text-5xl font-bold tabular-nums transition-colors"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          color: warning ? "#F97316" : "#F5F5F5",
          textShadow: warning ? "0 0 20px rgba(249,115,22,0.6)" : "none",
        }}
      >
        {timeLeft}
      </div>
      <AnimatePresence>
        {warning && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[#F97316] text-xs mt-2"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            ⚠ 5 minutes left — submit your mix now!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BattleLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const battleId = params.id as string;

  const [battle, setBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [isParticipant, setIsParticipant] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }
      setUserId(user.id);

      const { data: b } = await supabase
        .from("battles")
        .select("id, mode, status, ends_at, stem_sets(title, artist_name, spotify_url, stems_download_url)")
        .eq("id", battleId)
        .single();

      if (!b) { router.push("/pit"); return; }
      setBattle(b as unknown as Battle);

      if (b.ends_at && new Date(b.ends_at).getTime() < Date.now()) setExpired(true);

      const { data: parts } = await supabase
        .from("battle_participants")
        .select("user_id, status, profiles(username, level)")
        .eq("battle_id", battleId);

      setParticipants((parts || []) as unknown as Participant[]);

      const joined = (parts || []).some((p) => p.user_id === user.id);
      setIsParticipant(joined);

      const { data: sub } = await supabase
        .from("mix_submissions")
        .select("id")
        .eq("battle_id", battleId)
        .eq("user_id", user.id)
        .single();

      setHasSubmitted(!!sub);
      setLoading(false);
    }
    load();
  }, [battleId, router]);

  async function joinBattle() {
    const supabase = createClient();
    await supabase.from("battle_participants").insert({
      battle_id: battleId,
      user_id: userId,
      status: "joined",
    });
    setIsParticipant(true);
    setParticipants((prev) => [...prev, { user_id: userId, status: "joined", profiles: null }]);
  }

  async function submitMix(file: File) {
    setUploadError("");
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File too large. Maximum 20MB.");
      return;
    }
    if (!file.type.includes("mp3") && !file.name.endsWith(".mp3")) {
      setUploadError("Only MP3 files are accepted.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `mixes/${battleId}/${userId}_${Date.now()}.mp3`;

    const { error: uploadErr } = await supabase.storage
      .from("mixes")
      .upload(path, file);

    if (uploadErr) {
      setUploadError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    await supabase.from("mix_submissions").insert({
      battle_id: battleId,
      user_id: userId,
      storage_path: path,
      file_size_mb: +(file.size / (1024 * 1024)).toFixed(2),
    });

    await supabase
      .from("battle_participants")
      .update({ status: "submitted" })
      .eq("battle_id", battleId)
      .eq("user_id", userId);

    setHasSubmitted(true);
    setUploading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Loading battle...</p>
      </main>
    );
  }

  if (!battle) return null;

  const modeColor = MODE_COLORS[battle.mode];
  const submittedCount = participants.filter((p) => p.status === "submitted").length;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.05] blur-[140px] pointer-events-none" style={{ background: modeColor }} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1E1E35]">
        <a href="/pit">
          <h1 className="text-xl font-bold cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            FADERWARS
          </h1>
        </a>
        <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains-mono)", color: modeColor, background: `${modeColor}20`, border: `1px solid ${modeColor}40` }}>
          {battle.mode} · The Pit
        </span>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 grid grid-cols-3 gap-8">
        {/* Left — track info + countdown */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Track card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#1E1E35] p-6"
            style={{ background: "rgba(15,15,26,0.7)" }}
          >
            <p className="text-[#8888AA] text-xs tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>You&apos;re mixing</p>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-0.5" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {battle.stem_sets?.title || "Unknown Track"}
            </h2>
            <p className="text-[#8888AA] text-sm mb-4" style={{ fontFamily: "var(--font-inter)" }}>
              by {battle.stem_sets?.artist_name || "Unknown Artist"}
            </p>
            {battle.stem_sets?.stems_download_url ? (
              <a
                href={battle.stem_sets.stems_download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1E1E35] text-[#8888AA] text-xs font-semibold hover:border-[#BF5FFF] hover:text-[#F5F5F5] transition-all"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                ↓ Download Stems
              </a>
            ) : (
              <span className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-inter)" }}>
                Stems download not available yet.
              </span>
            )}
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[#1E1E35] p-8 flex items-center justify-center"
            style={{ background: "rgba(15,15,26,0.7)" }}
          >
            {expired ? (
              <p className="text-[#F97316] font-semibold" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Battle ended</p>
            ) : battle.ends_at ? (
              <Countdown endsAt={battle.ends_at} onExpire={() => setExpired(true)} />
            ) : (
              <p className="text-[#8888AA]" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>—</p>
            )}
          </motion.div>

          {/* Submit mix */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[#1E1E35] p-6"
            style={{ background: "rgba(15,15,26,0.7)" }}
          >
            <h3 className="text-[#F5F5F5] font-semibold mb-1" style={{ fontFamily: "var(--font-space-grotesk)" }}>Submit Your Mix</h3>
            <p className="text-[#8888AA] text-xs mb-5" style={{ fontFamily: "var(--font-inter)" }}>MP3 only · max 20MB</p>

            {!isParticipant ? (
              <button
                onClick={joinBattle}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all"
                style={{ fontFamily: "var(--font-inter)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", boxShadow: "0 0 20px rgba(191,95,255,0.3)" }}
              >
                Join Battle
              </button>
            ) : hasSubmitted ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#22C55E] bg-[#22C55E10]">
                <span className="text-[#22C55E] text-lg">✓</span>
                <p className="text-[#22C55E] text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Mix submitted! Waiting for others.</p>
              </div>
            ) : expired ? (
              <div className="px-4 py-3 rounded-xl border border-[#F97316] bg-[#F9731610]">
                <p className="text-[#F97316] text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Time&apos;s up — submission closed.</p>
              </div>
            ) : (
              <>
                <input ref={fileRef} type="file" accept=".mp3,audio/mpeg" className="hidden" onChange={(e) => e.target.files?.[0] && submitMix(e.target.files[0])} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                  style={{ fontFamily: "var(--font-inter)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", boxShadow: "0 0 20px rgba(191,95,255,0.3)" }}
                >
                  {uploading ? "Uploading..." : "Upload Mix"}
                </button>
                {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
              </>
            )}
          </motion.div>
        </div>

        {/* Right — players */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[#1E1E35] p-6 h-fit"
          style={{ background: "rgba(15,15,26,0.7)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#F5F5F5] text-sm font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>Players</h3>
            <span className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
              {submittedCount}/{participants.length} submitted
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(7,7,15,0.5)" }}>
                <div>
                  <p className="text-[#F5F5F5] text-xs font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                    {p.profiles?.username || "Player"}
                  </p>
                  <p className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                    LVL {p.profiles?.level || 1}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    color: p.status === "submitted" ? "#22C55E" : "#8888AA",
                    background: p.status === "submitted" ? "#22C55E20" : "#1E1E35",
                  }}
                >
                  {p.status === "submitted" ? "✓ done" : "mixing..."}
                </span>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-[#8888AA] text-xs text-center py-4" style={{ fontFamily: "var(--font-inter)" }}>
                No players yet.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
