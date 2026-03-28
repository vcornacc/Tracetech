export default function Home() {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <p className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
          Next.js + Supabase + Vercel
        </p>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Trace Platform starter configurato
          </h1>
          <p className="text-slate-300">
            Questa app e pronta per autenticazione, database e deploy continuo.
          </p>
        </div>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <h2 className="text-lg font-semibold">Stato ambiente</h2>
          <p className="text-sm text-slate-300">
            {hasSupabaseEnv
              ? "Variabili Supabase trovate: puoi iniziare a collegare query e auth."
              : "Mancano le variabili Supabase. Copia .env.local.example in .env.local e compila i valori."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Prossimi passi</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
            <li>Apri la pagina smoke test e verifica login, profile e projects.</li>
            <li>Controlla l'endpoint /api/supabase-health per la salute del database.</li>
            <li>Collega il repository su Vercel e replica le env in produzione.</li>
          </ol>
        </section>

        <div className="flex flex-col gap-3 text-sm font-medium sm:flex-row">
          <a
            className="inline-flex items-center justify-center rounded-lg bg-cyan-400 px-4 py-2 text-slate-950 transition hover:bg-cyan-300"
            href="/smoke-test"
          >
            Apri smoke test
          </a>
          <a
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-slate-950 transition hover:bg-emerald-400"
            href="https://supabase.com/dashboard/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Crea progetto Supabase
          </a>
          <a
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 transition hover:border-slate-500"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Collega su Vercel
          </a>
          <a
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 transition hover:border-slate-500"
            href="/api/supabase-health"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apri health check JSON
          </a>
        </div>
      </main>
    </div>
  );
}
