import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gbpkbnlrgkygitiogicm.supabase.co",
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ valid: false, error: "No code provided." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .select("id, is_active, used_by, expires_at")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !data) return NextResponse.json({ valid: false, error: "Invalid invite code." });
  if (!data.is_active) return NextResponse.json({ valid: false, error: "This invite code is no longer active." });
  if (data.used_by) return NextResponse.json({ valid: false, error: "This invite code has already been used." });
  if (data.expires_at && new Date(data.expires_at) < new Date())
    return NextResponse.json({ valid: false, error: "This invite code has expired." });

  return NextResponse.json({ valid: true });
}
