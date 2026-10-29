import {
  ArrowRight,
  BarChart3,
  Dumbbell,
  Flame,
  HeartPulse,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Utensils,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Dumbbell,
    eyebrow: 'TRENUJ MĄDRZE',
    title: 'Zapisuj serie i bij rekordy.',
    copy: 'Wpisuj ciężary i powtórzenia w kilka sekund. Śledź historię i wiedz dokładnie, co załadować na sztangę na następnym treningu.',
    accent: 'bg-lime-300 text-zinc-950',
  },
  {
    icon: Utensils,
    eyebrow: 'JEDZ ŚWIADOMIE',
    title: 'Kontrola kalorii bez zbędnego zamieszania.',
    copy: 'Dziel makro, sprawdzaj posiłki w szybkiej bazie produktów i trzymaj miskę pod kontrolą.',
    accent: 'bg-orange-300 text-zinc-950',
  },
  {
    icon: BarChart3,
    eyebrow: 'OBSERWUJ POSTĘPY',
    title: 'Wyciskaj więcej z tygodnia na tydzień.',
    copy: 'Jasne wykresy i czytelne podsumowania. Zobacz czarno na białym, jak budujesz formę.',
    accent: 'bg-sky-300 text-zinc-950',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f6f1] text-zinc-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10" aria-label="Nawigacja główna">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Pompa strona główna">
          <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-lime-300"><Dumbbell aria-hidden="true" /></span>
          <span className="text-xl">pompa<span className="text-lime-500">.</span></span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
          <a href="#features" className="transition hover:text-zinc-950">Dlaczego Pompa</a>
          <a href="#method" className="transition hover:text-zinc-950">Jak to działa</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden px-3 py-2 text-sm font-medium text-zinc-700 sm:inline-block">Zaloguj się</Link>
          <Link to="/register" className="rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Rozpocznij za darmo <ArrowRight className="ml-1 inline" size={15} aria-hidden="true" /></Link>
          <button className="grid size-10 place-items-center rounded-full border border-zinc-200 md:hidden" aria-label="Otwórz menu"><Menu size={18} /></button>
        </div>
      </nav>

      <section id="top" className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600"><Sparkles size={13} className="text-lime-500" aria-hidden="true" /> Silniejsi każdego dnia</div>
          <h1 className="max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">Silniejsi każdego dnia.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-zinc-600">Trening i dieta dopasowane do Twojego dnia. Jedna prosta aplikacja do śledzenia serii, posiłków i progresu. Bez zbędnego klikania – tylko konkretne wyniki.</p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link to="/register" className="group inline-flex items-center rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-950/10 transition hover:-translate-y-0.5">Stwórz plan <ArrowRight size={16} className="ml-2 transition group-hover:translate-x-1" aria-hidden="true" /></Link>
            <a href="#method" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-zinc-700"><span className="grid size-8 place-items-center rounded-full border border-zinc-300 bg-white"><Play size={13} fill="currentColor" aria-hidden="true" /></span> Zobacz jak to działa</a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
          <div className="absolute -right-8 -top-10 size-40 rounded-full bg-lime-300/60 blur-3xl" />
          <div className="absolute -bottom-8 -left-10 size-48 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="relative rounded-[2rem] bg-zinc-950 p-3 shadow-2xl shadow-zinc-900/20 sm:p-4">
            <div className="rounded-[1.4rem] bg-[#20221e] p-5 text-white sm:p-7">
              <div className="flex items-center justify-between"><div><p className="text-xs text-zinc-400">PONIEDZIAŁEK, PAŹDZIERNIK 28</p><h2 className="mt-1 text-xl font-medium">Dzień dobry, Alex</h2></div><div className="grid size-10 place-items-center rounded-full bg-zinc-700 text-lime-300"><HeartPulse size={19} /></div></div>
              <div className="mt-7 grid grid-cols-[1fr_1.2fr] gap-3">
                <div className="rounded-2xl bg-lime-300 p-4 text-zinc-950"><Target size={18} /><p className="mt-8 text-3xl font-semibold">72%</p><p className="mt-1 text-xs font-medium">dzienny cel</p><div className="mt-4 h-1.5 rounded-full bg-zinc-950/15"><div className="h-full w-[72%] rounded-full bg-zinc-950" /></div></div>
                <div className="rounded-2xl bg-zinc-800 p-4"><div className="flex items-center justify-between"><p className="text-xs text-zinc-400">AKTYWNOŚĆ TYGODNIOWA</p><BarChart3 size={16} className="text-lime-300" /></div><div className="mt-5 flex h-20 items-end justify-between gap-2">{[42, 61, 34, 76, 53, 88, 66].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={index === 5 ? 'w-full rounded-t-md bg-lime-300' : 'w-full rounded-t-md bg-zinc-600'} style={{ height: `${height}%` }} /><span className="text-[9px] text-zinc-500">{['P','W','Ś','C','P','S','N'][index]}</span></div>)}</div></div>
              </div>
              <div className="mt-3 rounded-2xl bg-zinc-800 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-300 text-zinc-950"><Flame size={17} /></span><div><p className="text-sm font-medium">Dzisiejszy trening</p><p className="text-xs text-zinc-400">Góra ciała</p></div></div><ChevronRight size={18} className="text-zinc-500" /></div></div>
              <div className="mt-5 flex items-center justify-between text-xs text-zinc-500"><span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-lime-300" /> Twoje dane są bezpieczne</span><span>POMPA</span></div>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-3 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3 pr-5 shadow-xl sm:-right-8"><div className="grid size-10 place-items-center rounded-xl bg-orange-100 text-orange-600"><Flame size={19} /></div><div><p className="text-xs text-zinc-500">Spalone kalorie</p><p className="font-semibold">486 kcal <span className="text-xs font-normal text-lime-600">+18%</span></p></div></div>
        </div>
      </section>

      <section id="features" className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="mx-auto max-w-7xl"><div className="mt-12 grid gap-5 md:grid-cols-3">{features.map((feature) => { const Icon = feature.icon; return <article key={feature.title} className="rounded-3xl border border-zinc-200 bg-[#fafbf8] p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/5"><div className={`grid size-12 place-items-center rounded-2xl ${feature.accent}`}><Icon size={21} aria-hidden="true" /></div><p className="mt-10 text-[11px] font-bold tracking-[0.18em] text-zinc-500">{feature.eyebrow}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{feature.title}</h3><p className="mt-3 leading-7 text-zinc-600">{feature.copy}</p></article> })}</div></div></section>

      <section id="method" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-28"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-600">Prosty proces, stały progres</p><h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Formę buduje się powtarzalnością.</h2><p className="mt-5 max-w-md leading-7 text-zinc-600">Pompa daje Ci proste narzędzie do codziennej rutyny.</p></div><div className="grid gap-3 sm:grid-cols-3">{[['01','Ustal cel','Powiedz nam, co chcesz osiągnąć.'],['02','Odpal plan','Dostajesz czysty układ dopasowany do Twoich możliwości.'],['03','Notuj i rośnij','Śledź postępy i patrz, jak rosną liczby.']].map(([number,title,copy]) => <div key={number} className="rounded-3xl bg-zinc-950 p-6 text-white"><span className="text-sm font-semibold text-lime-300">{number}</span><h3 className="mt-14 text-xl font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p></div>)}</div></section>

      <section id="start" className="mx-5 mb-8 rounded-[2rem] bg-lime-300 px-6 py-16 sm:mx-8 sm:px-12 lg:mx-10 lg:px-20"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-center"><div><h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Czas na Twój ruch.</h2><p className="mt-3 max-w-xl text-lg text-zinc-800">Zbuduj darmowe konto i zacznij prostsze śledzenie treningu już dziś.</p></div><Link to="/register" className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Utwórz darmowe konto <ArrowRight size={16} className="ml-2" aria-hidden="true" /></Link></div></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-8 pt-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><p classclassName="flex items-center gap-2 font-medium text-zinc-800"><span className="grid size-6 place-items-center rounded-md bg-zinc-950 text-lime-300"><Dumbbell size={12} /></span> pompa.</p><p>© 2025 Pompa. Zbudowane dla Ciebie.</p><div className="flex gap-5"><a href="#privacy" className="hover:text-zinc-950">Prywatność</a><a href="#terms" className="hover:text-zinc-950">Regulamin</a></div></footer>
    </main>
  )
}
