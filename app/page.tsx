"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#BF5FFF] opacity-[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-[#C084FC] opacity-[0.05] blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Logo wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1
            className="text-7xl font-bold tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              background: "linear-gradient(135deg, #BF5FFF 0%, #C084FC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FADERWARS
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="text-[#8888AA] text-lg mb-12 tracking-wide"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          The competitive mix battle platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex gap-4"
        >
          <button
            onClick={() => router.push("/auth/signup")}
            className="px-8 py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: "var(--font-inter)",
              background: "linear-gradient(135deg, #BF5FFF 0%, #C084FC 100%)",
              boxShadow: "0 0 24px rgba(191, 95, 255, 0.35)",
            }}
          >
            Enter with Invite
          </button>
          <button
            onClick={() => router.push("/auth/signin")}
            className="px-8 py-3 rounded-xl text-[#8888AA] font-semibold text-sm tracking-wide border border-[#1E1E35] transition-all duration-200 hover:border-[#BF5FFF] hover:text-[#F5F5F5]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Sign In
          </button>
        </motion.div>

        {/* Closed Beta badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 px-4 py-1.5 rounded-full border border-[#1E1E35] text-[#8888AA] text-xs tracking-widest uppercase"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          Closed Beta
        </motion.div>
      </div>
    </main>
  );
}
