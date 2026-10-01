import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, EnvelopeSimple, SealCheck, UserFocus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { HeroBinders } from "@/components/landing/HeroBinders";
import { LoopTabs } from "@/components/landing/LoopTabs";
import { NetworkScene } from "@/components/landing/NetworkScene";
import { Avatar } from "@/components/Collector";
import { Logo } from "@/components/Logo";
import { MatchCard } from "@/components/MatchCard";
import { Pocket } from "@/components/Pocket";
import { Reveal } from "@/components/Reveal";
import { ButtonLink } from "@/components/ui";
import { DEMO_CARDS, DEMO_COLLECTOR } from "@/lib/demo";

const COMING_SOON_GAMES = ["One Piece", "Magic: The Gathering", "Yu-Gi-Oh!"];

const REASONS = [
  "They have 1 card from your want list",
  "They want 1 card you'd trade",
  "Both cards meet the condition asked for",
  "Their identity is verified",
];

const side = (c: (typeof DEMO_CARDS)[keyof typeof DEMO_CARDS]) => ({
  name: c.name,
  setName: c.set_name,
  cardNumber: c.card_number,
  imageUrl: c.image_url,
});

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // A brand-new collector with an empty binder starts with onboarding.
    const [{ count: haves }, { count: wants }] = await Promise.all([
      supabase.from("collection").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("wants").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    redirect(!haves && !wants ? "/onboarding" : "/matches");
  }

  const marquee = Object.values(DEMO_CARDS);

  return (
    <div className="room min-h-dvh overflow-x-clip">
      {/* Nav */}
      <div className="sticky top-3 z-40 px-3 md:top-4 md:px-6">
        <nav
          aria-label="Main"
          className="glass mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-full pl-4 pr-2 md:pl-6"
        >
          <Logo />
          <div className="hidden items-center gap-1 text-sm text-fg-2 md:flex">
            <a href="#how" className="rounded-full px-4 py-2 hover:bg-white/5 hover:text-fg">
              How it works
            </a>
            <a href="#trust" className="rounded-full px-4 py-2 hover:bg-white/5 hover:text-fg">
              Trust
            </a>
            <Link href="/characters" className="rounded-full px-4 py-2 hover:bg-white/5 hover:text-fg">
              Meet Pocket
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/login" className="hidden h-11 items-center rounded-full px-4 text-sm text-fg-2 hover:text-fg sm:inline-flex">
              Log in
            </Link>
            <ButtonLink href="/signup">Find matches</ButtonLink>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-16 pt-12 md:px-8 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[0.8fr_1.2fr] lg:gap-10 lg:pb-12 lg:pt-8">
        <div>
          <h1 className="font-display text-5xl font-bold leading-[0.98] tracking-[-0.035em] [font-stretch:92%] md:text-7xl">
            Find your next trade.
          </h1>
          <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-fg-2">
            List what you have and what you want. We find the collectors you can trade with, and show who you can trust.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/signup" size="lg">
              Find matches
            </ButtonLink>
            <ButtonLink href="#how" variant="secondary" size="lg">
              See how it works
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-muted sm:hidden">
            Already collecting here?{" "}
            <Link href="/login" className="font-medium text-pear">
              Log in
            </Link>
          </p>
        </div>
        <HeroBinders />
      </section>

      {/* Games strip: the one marquee */}
      <section aria-label="Supported games" className="border-y border-line bg-cover/60 py-8">
        <p className="mx-auto max-w-6xl px-4 text-center text-sm text-muted md:px-8">
          Pokémon today. {COMING_SOON_GAMES.join(", ")} coming soon. One network for every binder.
        </p>
        <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
            {[...marquee, ...marquee].map((c, i) => (
              <div key={i} className="relative aspect-[63/88] w-24 shrink-0 overflow-hidden rounded-[5%/3.5%] md:w-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image_url}
                  alt={i < marquee.length ? c.name : ""}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 md:px-8 md:py-32">
        <Reveal>
          <h2 className="max-w-[18ch] font-display text-4xl font-bold tracking-tight md:text-5xl">
            Your binder, connected to everyone else&apos;s.
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-12">
          <LoopTabs />
        </Reveal>
      </section>

      {/* Why this is a match */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-8 md:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_440px] lg:gap-20">
          <Reveal>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">You&apos;ll always know why.</h2>
            <p className="mt-4 max-w-[46ch] text-lg text-fg-2">
              A score means nothing without reasons. Every match shows exactly what lined up.
            </p>
            <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {REASONS.map((r) => (
                <li key={r} className="flex items-center gap-3 text-fg">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-pear/15 text-pear">
                    <Check size={13} weight="bold" aria-hidden />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <MatchCard
              id="demo"
              href="/signup"
              score={96}
              isNew
              youGive={[side(DEMO_CARDS.charizardEx)]}
              youGet={[side(DEMO_CARDS.umbreon)]}
              counterpartId={DEMO_COLLECTOR.id}
              counterpartName={DEMO_COLLECTOR.name}
              counterpartVerified
              counterpartLocation={DEMO_COLLECTOR.location}
              featured
              linkProfile={false}
            />
          </Reveal>
        </div>
      </section>

      {/* Trust: the serious inside */}
      <section id="trust" className="scroll-mt-24 border-t border-line bg-cover/50">
        <div className="mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-32">
          <Reveal>
            <h2 className="max-w-[20ch] font-display text-4xl font-bold tracking-tight md:text-5xl">
              Playful on the outside. Serious where it counts.
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg text-fg-2">
              When valuable cards change hands, the interface gets quiet and factual. No stars, no guesswork.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 lg:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col rounded-xl bg-page p-5 ring-1 ring-inset ring-line md:p-8">
                <h3 className="font-display text-2xl font-semibold tracking-tight">Identity, shown plainly.</h3>
                <p className="mt-2 max-w-[44ch] text-fg-2">
                  Identity Verified confirms who someone is. It&apos;s never mixed up with a rating of how they trade.
                </p>
                <div className="mt-8 flex items-center gap-4 rounded-lg bg-page-2 p-4 ring-1 ring-inset ring-line-2">
                  <Avatar seed={DEMO_COLLECTOR.id} verified size={48} />
                  <div className="min-w-0">
                    <div className="font-medium text-fg">{DEMO_COLLECTOR.name}</div>
                    <div className="inline-flex items-center gap-1.5 text-sm font-medium text-seal">
                      <SealCheck size={16} weight="fill" aria-hidden /> Identity Verified
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative h-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgb(108_182_255/0.1),transparent_60%)] p-5 ring-1 ring-inset ring-seal/20 md:p-8">
                <div className="flex items-start gap-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-2xl font-semibold tracking-tight">You decide who reaches you.</h3>
                    <ul className="mt-5 space-y-3 text-fg-2">
                      <li className="flex items-start gap-3">
                        <EnvelopeSimple size={20} weight="fill" className="mt-0.5 shrink-0 text-seal" aria-hidden />
                        Contact details stay hidden until you reveal them on a match
                      </li>
                      <li className="flex items-start gap-3">
                        <UserFocus size={20} weight="fill" className="mt-0.5 shrink-0 text-seal" aria-hidden />
                        Matches only form when both collectors have something the other wants
                      </li>
                    </ul>
                  </div>
                  <Pocket expression="concerned" size={84} className="hidden shrink-0 sm:block" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center md:px-8 md:py-32">
        <Reveal>
          <NetworkScene />
          <h2 className="mx-auto mt-6 max-w-[22ch] font-display text-4xl font-bold tracking-tight md:text-5xl">
            Don&apos;t search for trades. Let the network find them for you.
          </h2>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/signup" size="lg">
              Find matches
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <a href="#how" className="hover:text-fg">How it works</a>
            <a href="#trust" className="hover:text-fg">Trust</a>
            <Link href="/characters" className="hover:text-fg">Meet Pocket</Link>
            <Link href="/login" className="hover:text-fg">Log in</Link>
          </nav>
          <p className="max-w-[40ch] text-xs text-muted">
            Card images belong to their publishers. Trade Matcher is not affiliated with any TCG publisher.
          </p>
        </div>
      </footer>
    </div>
  );
}
