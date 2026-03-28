"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

type StatusTone = "neutral" | "success" | "error";

const statusStyles: Record<StatusTone, string> = {
  neutral: "border-slate-700 bg-slate-900/70 text-slate-200",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

export default function SmokeTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Trace Test User");
  const [projectName, setProjectName] = useState("Smoke Test Project");
  const [status, setStatus] = useState<{ tone: StatusTone; text: string }>({
    tone: "neutral",
    text: "Compila email e password, poi esegui i test dal browser.",
  });
  const [profileJson, setProfileJson] = useState<string>("");
  const [projectsJson, setProjectsJson] = useState<string>("");
  const [busyAction, setBusyAction] = useState<string>("");

  async function runAction(actionLabel: string, action: () => Promise<void>) {
    setBusyAction(actionLabel);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore sconosciuto";
      setStatus({ tone: "error", text: message });
    } finally {
      setBusyAction("");
    }
  }

  async function signUp() {
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }

    setStatus({
      tone: "success",
      text: "Sign up inviato. Se non e richiesta conferma email, puoi gia procedere con Sign in.",
    });
  }

  async function signIn() {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setStatus({ tone: "success", text: "Login riuscito." });
  }

  async function loadProfile() {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("Nessun utente autenticato. Esegui prima Sign in.");
    }

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name, company, role, created_at")
      .eq("id", user.id)
      .single();

    if (error) {
      throw error;
    }

    setProfileJson(JSON.stringify(data, null, 2));
    setStatus({ tone: "success", text: "Profilo caricato con successo." });
  }

  async function createProject() {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("Nessun utente autenticato. Esegui prima Sign in.");
    }

    const { error } = await supabaseClient.from("projects").insert({
      owner_id: user.id,
      name: projectName,
      status: "draft",
      metadata: { createdBy: "smoke-test-page" },
    });

    if (error) {
      throw error;
    }

    setStatus({ tone: "success", text: "Progetto creato correttamente." });
  }

  async function listProjects() {
    const { data, error } = await supabaseClient
      .from("projects")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    setProjectsJson(JSON.stringify(data, null, 2));
    setStatus({ tone: "success", text: "Query projects eseguita correttamente." });
  }

  async function signOut() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    setStatus({ tone: "success", text: "Logout riuscito." });
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="space-y-3">
          <p className="inline-flex w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-200">
            Smoke Test Supabase
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Verifica auth e query direttamente dal browser
          </h1>
          <p className="text-slate-300">
            Questa pagina serve solo a confermare che login, profilo e query sui progetti funzionano davvero nell&apos;app.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Email di test</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition focus:border-cyan-400"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="test@example.com"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Password di test</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition focus:border-cyan-400"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Almeno 6 caratteri"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Nome completo</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition focus:border-cyan-400"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Nome progetto di test</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition focus:border-cyan-400"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
          </label>
        </section>

        <section className="flex flex-wrap gap-3 text-sm font-medium">
          <button
            className="rounded-lg bg-cyan-400 px-4 py-2 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(busyAction)}
            onClick={() => runAction("signup", signUp)}
          >
            {busyAction === "signup" ? "Attendi..." : "1. Sign up"}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(busyAction)}
            onClick={() => runAction("signin", signIn)}
          >
            {busyAction === "signin" ? "Attendi..." : "2. Sign in"}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(busyAction)}
            onClick={() => runAction("profile", loadProfile)}
          >
            {busyAction === "profile" ? "Attendi..." : "3. Carica profile"}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(busyAction)}
            onClick={() => runAction("create-project", createProject)}
          >
            {busyAction === "create-project" ? "Attendi..." : "4. Crea project"}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(busyAction)}
            onClick={() => runAction("list-projects", listProjects)}
          >
            {busyAction === "list-projects" ? "Attendi..." : "5. Lista projects"}
          </button>
          <button
            className="rounded-lg border border-rose-500/40 px-4 py-2 text-rose-200 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(busyAction)}
            onClick={() => runAction("signout", signOut)}
          >
            {busyAction === "signout" ? "Attendi..." : "6. Sign out"}
          </button>
        </section>

        <section className={`rounded-xl border p-4 text-sm ${statusStyles[status.tone]}`}>
          {status.text}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="mb-3 text-lg font-semibold">Profile result</h2>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
              {profileJson || "Nessun dato caricato ancora."}
            </pre>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="mb-3 text-lg font-semibold">Projects result</h2>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
              {projectsJson || "Nessun dato caricato ancora."}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}