"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type StemSet = {
  id: string;
  title: string;
  artist_name: string;
  spotify_url: string | null;
  soundcloud_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  stems_download_url: string | null;
  available_in: string[];
  is_active: boolean;
  is_featured: boolean;
};

const EMPTY: Omit<StemSet, "id"> = {
  title: "",
  artist_name: "",
  spotify_url: "",
  soundcloud_url: "",
  youtube_url: "",
  instagram_url: "",
  stems_download_url: "",
  available_in: ["pit"],
  is_active: false,
  is_featured: false,
};

export default function AdminStemsPage() {
  const router = useRouter();
  const [stems, setStems] = useState<StemSet[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signin"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || !["admin", "moderator"].includes(profile.role)) { router.push("/home"); return; }
      const { data } = await supabase.from("stem_sets").select("*").order("created_at", { ascending: false });
      setStems(data || []);
    }
    load();
  }, [router]);

  async function save() {
    setError("");
    if (!form.title || !form.artist_name) return setError("Title and artist are required.");
    setSaving(true);
    const supabase = createClient();

    if (editingId) {
      await supabase.from("stem_sets").update(form).eq("id", editingId);
      setStems((prev) => prev.map((s) => s.id === editingId ? { ...s, ...form } : s));
    } else {
      const { data } = await supabase.from("stem_sets").insert(form).select("*").single();
      if (data) setStems((prev) => [data, ...prev]);
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("stem_sets").update({ is_active: !current }).eq("id", id);
    setStems((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  }

  function startEdit(stem: StemSet) {
    setForm({ ...stem });
    setEditingId(stem.id);
    setShowForm(true);
  }

  function Field({ label, field, placeholder }: { label: string; field: keyof typeof EMPTY; placeholder?: string }) {
    return (
      <div>
        <label className="block text-xs text-[#8888AA] mb-1.5 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{label}</label>
        <input
          type="text"
          value={(form[field] as string) || ""}
          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl bg-[#07070F] border border-[#1E1E35] text-[#F5F5F5] text-sm outline-none focus:border-[#BF5FFF] transition-colors"
          style={{ fontFamily: "var(--font-inter)" }}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#BF5FFF 1px, transparent 1px), linear-gradient(90deg, #BF5FFF 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1E1E35]">
        <a href="/admin">
          <h1 className="text-xl font-bold cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            FADERWARS
          </h1>
        </a>
        <a href="/admin" className="text-[#8888AA] text-xs hover:text-[#F5F5F5] transition-colors" style={{ fontFamily: "var(--font-inter)" }}>← Admin Panel</a>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#F5F5F5]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Stem Sets</h2>
            <p className="text-[#8888AA] text-sm mt-1" style={{ fontFamily: "var(--font-inter)" }}>{stems.length} total</p>
          </div>
          <button
            onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
            style={{ fontFamily: "var(--font-inter)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)", boxShadow: "0 0 16px rgba(191,95,255,0.3)" }}
          >
            + Add Stem Set
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#BF5FFF] p-6 mb-8"
            style={{ background: "rgba(15,15,26,0.9)", boxShadow: "0 0 24px rgba(191,95,255,0.1)" }}
          >
            <h3 className="text-[#F5F5F5] font-semibold mb-5" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {editingId ? "Edit Stem Set" : "New Stem Set"}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Track Title *" field="title" placeholder="Track name" />
              <Field label="Artist Name *" field="artist_name" placeholder="Artist" />
              <Field label="Stems Download URL" field="stems_download_url" placeholder="https://drive.google.com/..." />
              <Field label="Spotify URL" field="spotify_url" placeholder="https://open.spotify.com/..." />
              <Field label="SoundCloud URL" field="soundcloud_url" placeholder="https://soundcloud.com/..." />
              <Field label="YouTube URL" field="youtube_url" placeholder="https://youtube.com/..." />
              <Field label="Instagram URL" field="instagram_url" placeholder="https://instagram.com/..." />
            </div>

            {/* Available in */}
            <div className="mb-4">
              <label className="block text-xs text-[#8888AA] mb-2 tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Available In</label>
              <div className="flex gap-3">
                {["pit", "arena", "war_room"].map((section) => (
                  <button
                    key={section}
                    onClick={() => setForm((f) => ({
                      ...f,
                      available_in: f.available_in.includes(section)
                        ? f.available_in.filter((s) => s !== section)
                        : [...f.available_in, section],
                    }))}
                    className="px-3 py-1.5 rounded-lg border text-xs transition-all"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      borderColor: form.available_in.includes(section) ? "#BF5FFF" : "#1E1E35",
                      color: form.available_in.includes(section) ? "#BF5FFF" : "#8888AA",
                      background: form.available_in.includes(section) ? "rgba(191,95,255,0.1)" : "transparent",
                    }}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6 mb-5">
              {[
                { key: "is_active" as const, label: "Active" },
                { key: "is_featured" as const, label: "Featured" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                  className="flex items-center gap-2 text-sm"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  <div
                    className="w-10 h-5 rounded-full transition-all relative"
                    style={{ background: form[key] ? "#BF5FFF" : "#1E1E35" }}
                  >
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form[key] ? "calc(100% - 1.25rem)" : "0.125rem" }} />
                  </div>
                  <span className="text-[#8888AA]">{label}</span>
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                style={{ fontFamily: "var(--font-inter)", background: "linear-gradient(135deg, #BF5FFF, #C084FC)" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY); }}
                className="px-6 py-2.5 rounded-xl border border-[#1E1E35] text-[#8888AA] text-sm hover:text-[#F5F5F5] transition-all"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* List */}
        <div className="flex flex-col gap-3">
          {stems.map((stem, i) => (
            <motion.div
              key={stem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-[#1E1E35] px-6 py-4 flex items-center justify-between"
              style={{ background: "rgba(15,15,26,0.7)" }}
            >
              <div>
                <p className="text-[#F5F5F5] font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {stem.title}
                </p>
                <p className="text-[#8888AA] text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)" }}>
                  {stem.artist_name} · {stem.available_in.join(", ")}
                  {stem.stems_download_url ? " · ✓ stems" : " · ⚠ no stems"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(stem.id, stem.is_active)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    color: stem.is_active ? "#22C55E" : "#8888AA",
                    background: stem.is_active ? "#22C55E20" : "#1E1E3540",
                    border: `1px solid ${stem.is_active ? "#22C55E40" : "#1E1E35"}`,
                  }}
                >
                  {stem.is_active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => startEdit(stem)}
                  className="px-3 py-1 rounded-lg border border-[#1E1E35] text-[#8888AA] text-xs hover:border-[#BF5FFF] hover:text-[#F5F5F5] transition-all"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Edit
                </button>
              </div>
            </motion.div>
          ))}
          {stems.length === 0 && (
            <div className="text-center py-16 text-[#8888AA] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
              No stem sets yet. Add one above.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
