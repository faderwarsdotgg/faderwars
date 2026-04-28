"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!data || !["admin", "moderator"].includes(data.role)) {
        router.push("/home");
        return;
      }
      setChecking(false);
    }
    check();
  }, [router]);

  if (checking) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Checking access...</p>
    </main>
  );

  const cards = [
    { label: "Stem Sets", description: "Add, edit and activate stem sets", href: "/admin/stems", icon: "🎵" },
    { label: "Invite Codes", description: "Generate and manage beta invites", href: "/admin/invites", icon: "🔑" },
    { label: "Users", description: "View, ban or manage players", href: "/admin/users", icon: "👥" },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#BF5FFF] opacity-[0.04] blur-[140px] pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1E1E35]">
        <a href="/home">
          <h1 className="text-xl font-bold cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            FADERWARS
          </h1>
        </a>
        <span className="text-xs px-3 py-1 rounded-full border border-[#BF5FFF] text-[#BF5FFF]" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
          ADMIN PANEL
        </span>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h2 className="text-3xl font-bold text-[#F5F5F5]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Admin Panel</h2>
          <p className="text-[#8888AA] text-sm mt-1" style={{ fontFamily: "var(--font-inter)" }}>Manage FaderWars platform.</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <motion.a
              key={card.href}
              href={card.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-[#1E1E35] p-6 flex flex-col gap-3 cursor-pointer hover:border-[#BF5FFF] transition-all hover:shadow-[0_0_20px_rgba(191,95,255,0.1)]"
              style={{ background: "rgba(15,15,26,0.7)" }}
            >
              <span className="text-3xl">{card.icon}</span>
              <div>
                <p className="text-[#F5F5F5] font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>{card.label}</p>
                <p className="text-[#8888AA] text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)" }}>{card.description}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </main>
  );
}
