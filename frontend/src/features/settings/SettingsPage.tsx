/**
 * Ustawienia
 * Scaffold placeholder (ticket 01). Implemented in 07.
 * Profil, pomiary ciała, sesje, zmiana hasła, eksport i usunięcie konta.
 */
export default function Page() {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">07</p>
        <h1 className="font-display text-2xl font-bold">Ustawienia</h1>
      </header>
      <div className="card flex min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-inner bg-primary/10 text-2xl">🚧</span>
        <p className="font-medium">W budowie</p>
        <p className="max-w-xs text-sm text-ink-dim">
          Profil, pomiary ciała, sesje, zmiana hasła, eksport i usunięcie konta.
        </p>
      </div>
    </section>
  )
}
