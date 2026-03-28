import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const [{ count: profilesCount, error: profilesError }, { count: projectsCount, error: projectsError }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
    ]);

    if (profilesError || projectsError) {
      return NextResponse.json(
        {
          ok: false,
          profilesError: profilesError?.message ?? null,
          projectsError: projectsError?.message ?? null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      profilesCount: profilesCount ?? 0,
      projectsCount: projectsCount ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}