// ============================================================
// SUPABASE CONFIG — fill in with YOUR project's values.
//
// Where to find these: Supabase Dashboard → your project →
// Project Settings → API. Copy "Project URL" and the
// "anon public" key (NOT the service_role key — never put that
// in client-side code).
//
// The anon key is safe to expose publicly — Supabase's real
// security boundary is Row Level Security (RLS), set up in
// SUPABASE-SETUP.md. Do not skip that step.
// ============================================================

export const supabaseConfig = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  bucket: "projects"   // Storage bucket name — create it with this exact name
};
