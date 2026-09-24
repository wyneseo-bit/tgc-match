# Handoff: TCG Trade Matcher — Core Screens

## Overview
TCG Trade Matcher is a peer-to-peer trading network for trading-card-game collectors (Pokémon, One Piece, Magic, Yu-Gi-Oh!, others). Core loop: **I HAVE → I WANT → FIND MATCHES → TRADE → BUILD TRUST**. This package covers the brand/character system and 8 core screens: Landing, Matches, Match Detail, Trade Review, Completed Trade, Profile, Empty/Loading/Warning states, and Mobile Matches.

Design principle: **"Playful outside. Serious inside."** There are three layers:
- **Brand:** the mascot, used in onboarding, empty, loading and success states.
- **Product:** dark UI with selective glass.
- **Trust:** a clean fintech-style layer for identity, trade review and receipts. No glass and no animation here.

## About the Design Files
The files in this bundle are **design references built in HTML**. They are prototypes showing the intended look and behavior, **not production code to copy**. They use a custom streaming-component format (`.dc.html`) that won't work in your app. Recreate these designs in your codebase's existing stack (React/Next.js, Vue, etc.) using its established patterns. If there is no stack yet, Next.js + React + Tailwind (or CSS modules) + `lucide-react` is a good fit.

To view the designs, open `TCG Trade Matcher.dc.html` in a browser (it needs `support.js` beside it). Each artboard has an id badge (1a–1i).

## Fidelity
**High-fidelity** for colors, type, spacing, radii, layout and copy. Recreate these pixel-accurately.
**Exceptions:**
- **Card art is placeholder.** `TcgCard` draws a generic 63:88 frame. Replace it with real card scans, keeping the 63:88 aspect ratio and adding no effects over the art.
- **The mascot is a working SVG concept.** You can use it as-is for now, but it should eventually be redrawn by an illustrator.
- **All data is sample data.**

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| bg | `#0B0D12` | App background (never pure black) |
| bg-2 | `#11141C` | Sidebar, sections, large panels |
| surface | `#171B25` | Cards, inputs, secondary buttons |
| surface-2 | `#1D2330` | Hover/selected, icon circles, chips |
| canvas (outside app) | `#05060A` | Presentation only |
| indigo (primary) | `#6C63FF` | Primary CTA, active nav, selected pills, badges |
| indigo-light | `#8F88FF` | Active-nav icon, links, gradient text start |
| violet | `#A66CFF` | Secondary brand, eyebrow labels |
| violet-light | `#C79BFF` | Gradient text end |
| cyan (trust) | `#42D9E8` | Identity Verified, Verified Trade, success, "NEW" chip |
| coral | `#FF8A7A` | Mascot accents, "You give" label, notification dot |
| yellow | `#FFD866` | Rare/celebration only |
| danger | `#FF6B6B` | Destructive text (Cancel Trade) |
| text | `#F4F5F8` | Primary text |
| text-2 | `#E4E7EE` / `#C9CEDB` | Secondary strong / body-on-dark |
| text-nav | `#A3AABB` | Inactive nav, nav links |
| muted | `#8B93A7` | Metadata |
| border | `rgba(255,255,255,0.06)` | Dividers, panel borders |
| border-strong | `rgba(255,255,255,0.08–0.10)` | Pills, secondary buttons, glass |

Tints: indigo selected bg `rgba(108,99,255,0.14)` with inset ring `rgba(108,99,255,0.35)`; cyan chip bg `rgba(66,217,232,0.10–0.12)`.

### Gradients
- Primary (CTA): `linear-gradient(90deg, #6C63FF, #A66CFF)`
- Gradient text ("96% MATCH"): `linear-gradient(90deg, #8F88FF, #C79BFF)` with `background-clip:text`
- Match ring: `conic-gradient(#6C63FF 0deg, #A66CFF 345deg, #1D2330 345deg)`, where the arc length = match %
- Ambient: `radial-gradient(800px 600px at 78% 35%, rgba(108,99,255,0.20), transparent 60%)` over `#0B0D12`. Keep it subtle.
- Avatars: 135° two-stop blends of brand colors (e.g. `#6C63FF → #42D9E8`)

### Glass (product layer only)
```css
background: rgba(23,27,37,0.72);
border: 1px solid rgba(255,255,255,0.08);
backdrop-filter: blur(16px);
```
**Use on:** match cards, the "We found 12" banner, the landing hero match panel, the "Why this is a match" panel and the mobile bottom nav.
**Never use on:** trade review, receipts, forms, tables or errors.

### Typography
- **Font:** Geist (400/500/600/700), falling back to Inter. Use Geist Mono for Trade IDs, hex codes and `⌘K`.
- **Scale (size / weight / letter-spacing):**
  - Landing H1: 76 / 700 / −0.035em, line-height 1.0
  - Match headline: 48 / 700 / −0.03em
  - H2: 30 / 700 / −0.02em
  - Success H2: 36 / 700
  - Card title: 18 / 600
  - Body: 14–16 / 400, line-height 1.5–1.55
  - Meta: 12–13 / 400, color muted
- **Eyebrow:** 12 / 600, uppercase, 0.12–0.14em letter-spacing, violet
- **Label caps:** 11–12 / 600, 0.06–0.14em letter-spacing

### Spacing / Radius / Shadow
- **Spacing:** multiples of 4 and 8: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
  - App content padding: 32–48px
  - Grid gap: 20px
- **Radius:**
  - 8px: small chips
  - 10px: nav items, small buttons
  - 12px: buttons, inputs
  - 16px: cards and panels
  - 999px: pills
  - Card frame: 5% of card width
- **Shadows:**
  - Cards: `0 10px 30px rgba(0,0,0,.25–.45)`
  - Featured: `0 20px 50px rgba(108,99,255,0.18)`
  - Primary CTA: `0 10px 30px rgba(108,99,255,0.35)`
  - Input focus: `border #6C63FF80` + `0 0 0 4px rgba(108,99,255,0.1)`

### Buttons
- **Primary:** gradient, white text, 500 weight. Height 40 (sidebar), 44–48 (app) or 52 (landing). Radius 12–14.
- **Secondary:** `#171B25` with `1px rgba(255,255,255,.1)`.
- **Ghost:** text only, muted.
- **Destructive:** `#FF6B6B` text.
- **Rule:** only one gradient button per view region.

### Filter pills
34px tall, 14px horizontal padding, radius 999, 13/500.
- **Selected:** bg `#6C63FF`, white text.
- **Unselected:** bg `#171B25`, border `rgba(255,255,255,.08)`, text `#C9CEDB`.

## Components (build these as reusable)
1. **Sidebar** (240px, bg-2, right border)
   - Logo row: mascot at 28px + "Trade Matcher" 15/700 + "FOR TCG COLLECTORS" 10px caps
   - "+ Add Card" primary button
   - Nav: Discover, Collection, Wants, Matches (count badge), Trades
   - Divider, then Messages (count), Profile, Settings
   - User chip pinned to the bottom
   - Nav items: 40px tall, radius 10, 12px gap between icon (18px) and label (14/500). Active item: indigo tint bg + inset ring + `#8F88FF` icon.
2. **Icon:** Lucide, 2px stroke, round caps.
   - Mapping: compass = Discover, library = Collection, heart = Wants, sparkles = Matches, arrow-left-right = Trades, message-circle = Messages, user = Profile, sliders-vertical = Settings, badge-check = verified, map-pin = distance, shield-check = protection, truck = shipping, lock = confirm.
3. **TcgCard:** 63:88 aspect ratio, dark tone frame, name bar and art window. **In production this is just the card image** in a rounded frame.
4. **Mascot ("Card Creature"):** a card-shaped body (off-white `#F4F2FF`, 3px stroke in the primary color), a colored face window with eyes, coral cheeks and a coral dog-ear top-right, simple limbs.
   - Props: `mood` (curious, excited, thinking, searching, celebrating, concerned, sleeping); `color` (indigo `#6C63FF`, violet `#A66CFF`, cyan `#2FBFCE`, coral `#F07565`).
   - Source: `Mascot.dc.html` holds the SVG geometry per mood. Port it to a React SVG component.
5. **MatchCard** (glass, padding 20, radius 16)
   - Header: "96% MATCH" gradient text 18/700, optional "NEW" cyan chip, game name
   - Middle: two cards at 100px wide with a 34px ⇄ circle between them
   - "You give / You get" labels
   - Divider
   - Footer row: avatar 32px + name + cyan badge-check + "23 verified trades · 4.8 km" + "View Trade" button (gradient on the top match, `#1D2330` otherwise)
   - The top match gets an indigo border (`rgba(108,99,255,.45)`) and an indigo shadow.
6. **TrustStats strip:** a grid with 1px dividers. Value 20–24/600, label 12–13 muted. **Facts only, no star ratings.**
7. **Verified badge:** cyan text + badge-check icon, optionally in a pill on `rgba(66,217,232,.1)`.

## Screens
- **1a Brand sheet** (reference only): the palette plus the 7 mascot expressions and what each is used for.
- **1b Landing** (1280 wide)
  - Top nav: logo, links, Log in, Find Matches.
  - Hero grid: `1fr 620px`, padding 72/64.
  - Left column:
    - Pill "A trusted trading network for TCG collectors" with a glowing cyan dot
    - H1 "Find your next trade." and subcopy (max 500px)
    - CTAs "Find Matches" (primary) and "See How It Works" (secondary)
    - "Works with" game chips
  - Right column:
    - A faint SVG network of curved indigo lines at 28% alpha, with one highlighted indigo→cyan path to a glowing cyan node
    - Two tilted cards (±7–8°)
    - The mascot (searching, 210px)
    - A floating glass match panel (290px)
  - Below the hero: a 5-column loop strip (I have / I want / Find matches / Trade / Build trust) on bg-2.
- **1c Matches:** sidebar + top bar (search input, focused state shown, ⌘K hint, bell with coral dot).
  - Header "Your matches" + glass banner (mascot "excited", 46px: "We found 12 potential trades. 3 new since yesterday").
  - Filter pills row.
  - 3-column MatchCard grid, gap 20.
- **1d Match Detail:** breadcrumb.
  - Centered eyebrow "DISCOVERED 2 MIN AGO" + H1 "We found a match."
  - 3-column `1fr 200px 1fr`: YOU card (200px) · 160px conic ring "96% MATCH" with glow · THEM card. Each card has "You have/They have", name and set · # · grade underneath.
  - Below that, 2 columns:
    - Glass panel "Why this is a match": six cyan-check reasons in 2 columns
    - Solid panel "Trading with Wayne": Identity Verified, distance, 3-stat strip
  - Actions: Propose Trade (primary), Message Wayne (secondary), Not interested (ghost).
- **1e Trade Review** (trust layer; max-width 880, centered)
  - Stepper: Proposal ✓ · **Review** · Confirm
  - H2 "Review your trade carefully." + draft Trade ID (mono)
  - Solid panel, 3 columns `1fr 48px 1fr`: YOU GIVE (coral label) | ⇄ | YOU RECEIVE (cyan label). Each side has a 112px card + key/value rows: Set, Grade, Condition, Language, Est. value.
  - Detail rows panel: Counterparty, Protection (cyan "Trade Protected"), Method (Tracked shipping), Value difference. Each row has an optional right-aligned action link.
  - Footer: confirmation checkbox, small "thinking" mascot (40px), "Cancel Trade" (danger text) and "Confirm Trade" (primary, lock icon).
- **1f Completed Trade:** celebrating mascot (140px), "Trade Complete!", receipt panel (520px).
  - Receipt header: "TRADE #TM-82941" in mono + "Verified Trade" cyan pill
  - Both cards with ⇄ between them
  - 3-column footer: Status / Date / Receipt
  - Buttons: View Receipt, Find another match
- **1g Profile:** 120px cover with ambient gradients; the mascot sits at the cover's bottom-right, never over the stats.
  - Avatar 96px overlaps the cover by 40px (it needs z-index above the cover).
  - Name 28/700 + Identity Verified pill; meta line; Message / Propose Trade buttons.
  - 5-stat strip: 32 Verified Trades · 18 Unique Traders · 97% Completion · RM 24,800 Verified Volume · 0 Active Disputes.
  - Disclaimer line explaining that identity verification ≠ trade reputation.
  - Tabs: Available (86) · Collection (428) · Wants (37). The active tab has a 2px indigo underline.
  - 5-column collection cards, each with: card (148px), name, set · #, grade chip (mono) and an "AVAILABLE" cyan label.
  - Hover: `scale(1.02)`, indigo border, soft indigo shadow, 200ms.
- **1h States:** 4 panels with a mascot and copy:
  - Empty Wants (thinking)
  - Loading "Finding collectors who match…" (searching)
  - Empty Matches (sleeping)
  - Warning, late shipment (concerned)
- **1i Mobile Matches** (390×844)
  - Header + mascot; horizontally scrolling pills; a vertical glass MatchCard (118px cards, full-width 48px CTA); a compact row for the next match.
  - Bottom nav: 88px, glass, 5 items. The Matches item is a raised 52px gradient circle (−22px offset, indigo shadow).
  - Touch targets are ≥44px.

## Interactions & Behavior
- **Card hover** (desktop): scale 1.01–1.03, a little elevation, indigo border highlight, soft glow, 150–250ms ease. No big rotations or 3D effects.
- **Glass panels:** fade in or slide up slightly (150–250ms). Don't animate the blur.
- **Mascot:** subtle blink or glance, 300–800ms gentle ease. No constant bouncing. Loading states should resolve within about 1–2s.
- **Trade Review / Confirm:** no animation. Confirm stays disabled until the checkbox is ticked.
- **Match flow:** Matches → Match Detail → Propose Trade → Review → Confirm → Active Trade → Completed.
- **Identity verification:** prompt only when a user starts a trade, not on first visit.
- **Responsive:**
  - Tablet: the sidebar collapses and grids drop to 2 columns.
  - Mobile: bottom nav, 2-column card grids, vertical match cards, fewer decorative elements.

## State / Data (suggested)
- `User { id, name, avatar, location, games[], identityVerified, stats { verifiedTrades, uniqueTraders, completionRate, verifiedVolume, activeDisputes } }`
- `Card { id, name, set, number, game, grade, condition, language, estValue, imageUrl, availableForTrade }`
- `Match { id, score, youGive: Card, youGet: Card, counterparty: User, distanceKm, reasons[], isNew }`
- `Trade { id: "TM-xxxxx", status: draft|proposed|confirmed|shipping|completed|disputed, sides, method, protection, confirmedAt }`
- **Verified trades** are created by the platform only. Users can never add them manually.

## Assets
- **Fonts:** Geist and Geist Mono (Google Fonts, or the `geist` npm package).
- **Icons:** Lucide (`lucide-react`).
- **Mascot:** original SVG in `Mascot.dc.html`.
- **Card images:** placeholder. Use real card scans or API images.

## Files
- `TCG Trade Matcher.dc.html`: all screens (artboards 1a–1i), sample data in the logic class
- `Sidebar.dc.html`: desktop navigation
- `Mascot.dc.html`: mascot SVG with the 7 moods
- `TcgCard.dc.html`: placeholder card frame
- `Icon.dc.html`: Lucide path subset
- `support.js`: runtime needed to open the `.dc.html` files in a browser
