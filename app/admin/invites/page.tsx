"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type InviteCode = {
  id: string;
  code: string;
  is_active: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part(4)}-${part(4)}`;
}

export default function AdminInvitesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || !["admin"].includes(profile.role)) { router.push("/home"); return; }
      const { data } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false });
      setCodes(data || []);
    }
    load();
  }, [router]);

  async function generateCodes() {
    setGenerating(true);
    const supabase = createClient();
    const newCodes = Array.from({ length: quantity }, () => ({ code: generateCode(), is_active: true }));
    const { data } = await supabase.from("invite_codes").insert(newCodes).select("*");
    if (data) setCodes((prev) => [...data, ...prev]);
    setGenerating(false);
  }

  async function toggleCode(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("invite_codes").update({ is_active: !current }).eq("id", id);
    setCodes((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !current } : c));
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const active = codes.filter((c) => c.is_active && !c.used_by).length;
  const used = codes.filter((c) => c.used_by).length;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1E1E35]">
        <a href="/home">
          <h1 className="text-xl font-bold cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            FADERWARS
          </h1>
        </a>
        <a href="/admin" className="text-[#8888AA] text-xs hover:text-[#F5F5F5] transition-colors" style={{ fontFamily: "var(--font-inter)" }}>← Admin Panel</a>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#F5F5F5]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Invite Codes</h2>
            <div className="flex gap-4 mt-2">
              <span className="text-[#22C55E] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{active} available</span>
              <span className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{used} used</span>
              <span className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{codes.length} total</span>
            </div>
          </div>

          {/* Generate */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[#8888AA] text-xs" style={{ fontFamily: "var(--font-inter)" }}>Quantity</label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-16 px-3 py-2 rounded-lg bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm text-center outline-none focus:border-[#BF5FFF] transition-colors"
                style={{ fontFamily: "var(--font-jetbrains-mono)" }}
              />
            </div>
            <button
              onClick={generateCodes}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
              style={{ fontFamily: "var(--font-inter)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", boxShadow: "0 0 16px rgba(191,95,255,0.3)" }}
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Codes list */}
        <div className="flex flex-col gap-2">
          {codes.map((code, i) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="rounded-xl border border-[#1E1E35] px-5 py-3.5 flex items-center justify-between"
              style={{ background: "rgba(15,15,26,0.7)" }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="text-sm font-bold tracking-widest"
                  style={{ fontFamily: "var(--font-jetbrains-mono)", color: code.used_by ? "#8888AA" : "#F5F5F5" }}
                >
                  {code.code}
                </span>
                {code.used_by && (
                  <span className="text-xs text-[#8888AA]" style={{ fontFamily: "var(--font-inter)" }}>
                    Used {code.used_at ? new Date(code.used_at).toLocaleDateString() : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!code.used_by && (
                  <button
                    onClick={() => copyCode(code.code)}
                    className="px-3 py-1 rounded-lg border border-[#1E1E35] text-xs transition-all hover:border-[#BF5FFF]"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", color: copied === code.code ? "#22C55E" : "#8888AA" }}
                  >
                    {copied === code.code ? "Copied!" : "Copy"}
                  </button>
                )}
                <button
                  onClick={() => toggleCode(code.id, code.is_active)}
                  disabled={!!code.used_by}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    color: code.used_by ? "#8888AA" : code.is_active ? "#22C55E" : "#F97316",
                    background: code.used_by ? "#1E1E3540" : code.is_active ? "#22C55E20" : "#F9731620",
                    border: `1px solid ${code.used_by ? "#1E1E35" : code.is_active ? "#22C55E40" : "#F9731640"}`,
                  }}
                >
                  {code.used_by ? "Used" : code.is_active ? "Active" : "Revoked"}
                </button>
              </div>
            </motion.div>
          ))}
          {codes.length === 0 && (
            <div className="text-center py-16 text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
              No invite codes yet. Generate some above.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
