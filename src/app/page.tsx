import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, BadgeCheck, MapPin, ArrowLeftRight, Library, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/Mascot";
import { TcgCard } from "@/components/TcgCard";

const ACTIVE_GAME = "Pokémon";
const COMING_SOON_GAMES = ["One Piece", "Magic: The Gathering", "Yu-Gi-Oh!"];

const LOOP = [
  { n: "01", icon: Library, color: "var(--color-indigo-light)", title: "I have", desc: "Add the cards you're willing to trade." },
  { n: "02", icon: Heart, color: "var(--color-coral)", title: "I want", desc: "List the cards you're hunting for." },
  { n: "03", icon: Sparkles, color: "var(--color-violet)", title: "Find matches", desc: "The network finds two-way trades for you." },
  { n: "04", icon: ArrowLeftRight, color: "var(--color-indigo-light)", title: "Trade", desc: "Propose, confirm, ship or meet up." },
  { n: "05", icon: BadgeCheck, color: "var(--color-cyan)", title: "Build trust", desc: "Every trade gets a verified Trade ID." },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/matches");
  }

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-8">
      <div
        className="w-full max-w-[1280px] overflow-hidden rounded-card"
        style={{
          background:
            "radial-gradient(800px 600px at 78% 35%, rgba(108,99,255,0.20), transparent 60%), radial-gradient(600px 400px at 95% 80%, rgba(66,217,232,0.07), transparent 60%), var(--color-bg)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Top nav */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-5 sm:px-10 md:px-16">
          <div className="flex min-w-0 items-center gap-2.5">
            <Mascot mood="curious" size={30} color="indigo" className="flex-none" />
            <span className="whitespace-nowrap text-base font-bold tracking-tight">
              <span className="hidden sm:inline">TCG </span>Trade Matcher
            </span>
          </div>
          <div className="hidden gap-8 text-sm md:flex" style={{ color: "var(--color-text-nav)" }}>
            <a href="#how-it-works" className="hover:text-text">
              How it works
            </a>
            <span>Games</span>
            <span>Trust &amp; Safety</span>
            <span>Community</span>
          </div>
          <div className="flex flex-none items-center gap-2">
            <Link
              href="/login"
              className="hidden h-10 items-center whitespace-nowrap px-4 text-sm sm:flex"
              style={{ color: "var(--color-text-2-body)" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="gradient-primary flex h-10 items-center whitespace-nowrap rounded-btn px-3.5 text-sm font-medium text-white sm:px-4.5"
            >
              Find Matches
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 items-center gap-6 px-6 py-14 sm:px-10 md:px-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_620px]">
          <div className="flex flex-col gap-7">
            <span
              className="glass flex w-fit items-center gap-2 rounded-pill py-1.5 pl-2 pr-3 text-[13px]"
              style={{ color: "var(--color-text-2-body)" }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "var(--color-cyan)", boxShadow: "0 0 10px var(--color-cyan)" }}
              />
              A trusted trading network for TCG collectors
            </span>

            <h1 className="text-5xl font-bold leading-[1.0] tracking-tight sm:text-6xl lg:text-[76px] lg:leading-[1.0] lg:tracking-[-0.035em]">
              Find your
              <br />
              next trade.
            </h1>

            <p
              className="max-w-[500px] text-lg leading-relaxed"
              style={{ color: "var(--color-text-nav)" }}
            >
              Tell us what you have and what you want. We&apos;ll find the collectors
              you can trade with — and help you know who you can trust.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="gradient-primary flex h-13 items-center gap-2 rounded-btn px-6 text-base font-medium text-white"
                style={{ boxShadow: "var(--shadow-cta)" }}
              >
                <Sparkles size={18} strokeWidth={2} />
                Find Matches
              </Link>
              <a
                href="#how-it-works"
                className="flex h-13 items-center rounded-btn border border-border-strong px-6 text-base font-medium"
                style={{ background: "var(--color-surface)", color: "var(--color-text-2)" }}
              >
                See How It Works
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-muted)" }}
              >
                Works with
              </span>
              <span
                className="rounded-pill px-3 py-1.5 text-[13px]"
                style={{ color: "var(--color-text-2-body)", border: "1px solid var(--color-border-strong)", background: "var(--color-bg-2)" }}
              >
                {ACTIVE_GAME}
              </span>
              {COMING_SOON_GAMES.map((g) => (
                <span
                  key={g}
                  className="rounded-pill px-3 py-1.5 text-[13px] opacity-40"
                  style={{ color: "var(--color-text-2-body)", border: "1px solid var(--color-border-strong)", background: "var(--color-bg-2)" }}
                >
                  {g} · soon
                </span>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden h-[560px] lg:block">
            <svg viewBox="0 0 620 560" width={620} height={560} className="absolute inset-0">
              <g stroke="rgba(143,136,255,0.28)" fill="none" strokeWidth={1.2}>
                <path d="M190 330 C 260 250, 330 210, 430 170" />
                <path d="M190 330 C 120 250, 90 180, 70 110" />
                <path d="M190 330 C 260 400, 380 440, 520 440" />
                <path d="M70 110 C 160 70, 260 60, 330 70" />
                <path d="M430 170 C 470 250, 520 320, 520 440" />
                <path d="M60 470 C 100 420, 140 380, 190 330" />
              </g>
              <path
                d="M190 330 C 260 250, 330 210, 430 170"
                stroke="url(#landingLineGradient)"
                fill="none"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="landingLineGradient" x1="0" x2="1">
                  <stop offset="0" stopColor="#6C63FF" />
                  <stop offset="1" stopColor="#42D9E8" />
                </linearGradient>
              </defs>
              <g fill="#6C63FF">
                <circle cx={70} cy={110} r={4} opacity={0.6} />
                <circle cx={330} cy={70} r={3} opacity={0.5} />
                <circle cx={520} cy={440} r={4} opacity={0.6} />
                <circle cx={60} cy={470} r={3} opacity={0.5} />
              </g>
              <circle cx={430} cy={170} r={7} fill="#42D9E8" />
              <circle cx={430} cy={170} r={16} fill="none" stroke="#42D9E8" opacity={0.35} />
            </svg>

            <div className="absolute left-9 top-15 -rotate-[8deg]">
              <TcgCard width={112} name="Mew ex" code="205" tone="violet" alt="Mew ex" />
            </div>
            <div className="absolute left-[470px] top-75 rotate-[7deg]">
              <TcgCard width={104} name="Blue-Eyes" code="001" tone="cyan" alt="Blue-Eyes" />
            </div>
            <div className="absolute left-20 top-[250px]">
              <Mascot mood="searching" size={210} color="indigo" />
            </div>

            <div
              className="glass absolute left-75 top-10 flex w-[290px] flex-col gap-4 rounded-card p-5"
              style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,99,255,0.15)" }}
            >
              <div className="flex items-center justify-between">
                <span className="gradient-text text-[22px] font-bold tracking-tight">
                  96% MATCH
                </span>
                <span
                  className="rounded-pill px-2 py-1 text-[11px] font-semibold"
                  style={{ color: "var(--color-cyan)", background: "var(--color-cyan-tint)" }}
                >
                  NEW
                </span>
              </div>
              <div className="flex items-center justify-between">
                <TcgCard width={92} name="Charizard ex" code="223" tone="coral" alt="Charizard ex" />
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong"
                  style={{ background: "var(--color-surface-2)" }}
                >
                  <ArrowLeftRight size={16} strokeWidth={2} color="var(--color-text-2-body)" />
                </div>
                <TcgCard width={92} name="Umbreon VMAX" code="215" tone="indigo" alt="Umbreon VMAX" />
              </div>
              <div className="flex flex-col gap-1.5 text-[13px]">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: "var(--color-cyan)" }}>
                  <BadgeCheck size={14} strokeWidth={2} />
                  Identity Verified
                </span>
                <span className="flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                  <MapPin size={13} strokeWidth={2} />
                  4.8 km away
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loop strip */}
        <div
          id="how-it-works"
          className="mx-6 mb-10 grid grid-cols-1 rounded-card sm:grid-cols-2 sm:px-0 md:mx-16 lg:grid-cols-5"
          style={{ background: "var(--color-bg-2)", border: "1px solid var(--color-border)" }}
        >
          {LOOP.map((step, i) => (
            <div
              key={step.n}
              className="flex flex-col gap-2.5 p-6"
              style={{ borderRight: i < LOOP.length - 1 ? "1px solid var(--color-border)" : "none" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-indigo-light)" }}>
                  {step.n}
                </span>
                <step.icon size={16} strokeWidth={2} color={step.color} />
              </div>
              <span className="text-[15px] font-semibold">{step.title}</span>
              <span className="text-[13px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                {step.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
