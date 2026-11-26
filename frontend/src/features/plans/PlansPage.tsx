export default function Page() {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">04A / 04B</p>
        <h1 className="font-display text-2xl font-bold">Trening</h1>
      </header>
      <div className="card flex min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-inner bg-primary/10 text-2xl">🚧</span>
        <p className="font-medium">W budowie</p>
        <p className="max-w-xs text-sm text-ink-dim">
          Szablony treningowe, edytor dni oraz aktywna sesja i logowanie serii.
        </p>
      </div>
    </section>
  )
}
