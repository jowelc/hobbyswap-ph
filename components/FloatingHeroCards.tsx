'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// ── One Piece styled Luffy card ───────────────────────────────────────────────

function OnePieceCard() {
  return (
    <div className="relative aspect-[5/7] w-full rounded-xl overflow-hidden shadow-inner"
      style={{ background: 'linear-gradient(160deg, #7f1d1d 0%, #991b1b 30%, #b91c1c 55%, #78350f 100%)' }}>

      {/* Gold border frame */}
      <div className="absolute inset-[2px] rounded-[10px] ring-1 ring-yellow-400/50 pointer-events-none" />

      {/* Top header */}
      <div className="absolute top-0 inset-x-0 px-2 py-1 flex items-center justify-between"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }}>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400 ring-1 ring-yellow-300/60" />
          <span className="text-[7px] font-black text-yellow-200 tracking-[0.15em] uppercase">Leader</span>
        </div>
        <span className="text-[9px] font-black text-yellow-300 tabular-nums">5000</span>
      </div>

      {/* Crew tag */}
      <div className="absolute top-5 inset-x-0 flex justify-center">
        <span className="text-[6px] font-bold text-yellow-100/70 tracking-widest uppercase bg-black/25 px-1.5 py-0.5 rounded-sm">
          Straw Hat Pirates
        </span>
      </div>

      {/* Art area — Luffy photo */}
      <div className="absolute inset-0">
        <Image src="/luffy.jpg" alt="Luffy" fill className="object-cover object-top" sizes="192px" unoptimized />
      </div>

      {/* Shine sweep overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/10 via-transparent to-transparent pointer-events-none" />
      {/* Bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* Bottom info bar */}
      <div className="absolute bottom-0 inset-x-0 px-2 pb-2 pt-1">
        <div className="flex items-center justify-between mb-[2px]">
          <span className="text-[7px] font-black text-yellow-400 tracking-widest uppercase">One Piece</span>
          <span className="text-[6px] text-yellow-100/50 font-semibold">OP-01</span>
        </div>
        <p className="text-[9px] font-black text-white leading-none tracking-wide">Monkey D. Luffy</p>
        <p className="text-[6px] text-yellow-200/60 leading-none mt-[3px] font-semibold">⚡ 5000 &nbsp;·&nbsp; ❤️ 5</p>
      </div>
    </div>
  );
}

// ── LeBron James styled card ─────────────────────────────────────────────────

function LeBronCard() {
  return (
    <div
      className="relative aspect-[5/7] w-full rounded-xl overflow-hidden shadow-inner"
      style={{ background: 'linear-gradient(155deg, #0f1a2e 0%, #1a2f4e 35%, #1e3a5f 60%, #0a1628 100%)' }}
    >
      {/* Gold exquisite shimmer border */}
      <div className="absolute inset-[2px] rounded-[10px] ring-1 ring-yellow-400/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/8 via-transparent to-yellow-600/5 pointer-events-none rounded-xl" />

      {/* Top header */}
      <div
        className="absolute top-0 inset-x-0 px-2 py-1 flex items-center justify-between"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}
      >
        <span className="text-[7px] font-black text-yellow-400 tracking-[0.15em] uppercase">Exquisite</span>
        <span className="text-[7px] font-bold text-white/60 tracking-wider">2003-04</span>
      </div>

      {/* Art area — LeBron photo */}
      <div className="absolute inset-0">
        <Image src="/lebron.jpg" alt="LeBron James" fill className="object-cover object-top" sizes="192px" unoptimized />
      </div>

      {/* Bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 px-2 pb-2 pt-1">
        <div className="flex items-center justify-between mb-[2px]">
          <span className="text-[7px] font-black text-yellow-400 tracking-widest uppercase">Upper Deck</span>
          <span className="text-[6px] text-yellow-300/50 font-semibold">RC</span>
        </div>
        <p className="text-[9px] font-black text-white leading-none tracking-wide">LeBron James</p>
        <p className="text-[6px] text-yellow-200/60 leading-none mt-[3px] font-semibold">Cleveland Cavaliers</p>
      </div>
    </div>
  );
}

// ── Reusable image card with fallback ────────────────────────────────────────

function CardImage({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  const [errored, setErrored] = useState(false);
  const fallback = '/card-placeholder-front.svg';

  return (
    <div className="relative aspect-[5/7] w-full bg-slate-800 rounded-xl overflow-hidden">
      <Image
        src={errored ? fallback : src}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
        sizes="192px"
        onError={() => setErrored(true)}
      />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-6 pb-1.5 px-2">
        <span className="text-[9px] font-black text-white/80 tracking-widest uppercase">{label}</span>
      </div>
    </div>
  );
}

// ── Card definitions ─────────────────────────────────────────────────────────

const LEFT_CARDS = [
  {
    type: 'image' as const,
    src: 'https://images.pokemontcg.io/base1/4.png',
    alt: 'Charizard Pokemon Card',
    label: 'POKEMON',
    rotate: '-rotate-12',
    top: '4%',
    offset: -24,
  },
  {
    type: 'lebron' as const,
    src: '',
    alt: 'LeBron James Card',
    label: 'NBA',
    rotate: '-rotate-6',
    top: '42%',
    offset: -12,
  },
];

const RIGHT_CARDS = [
  {
    type: 'onepiece' as const,
    src: '',
    alt: 'One Piece Card',
    label: 'ONE PIECE',
    rotate: 'rotate-12',
    top: '4%',
    offset: -24,
  },
  {
    type: 'image' as const,
    src: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
    alt: 'Dark Magician Yu-Gi-Oh Card',
    label: 'YU-GI-OH',
    rotate: 'rotate-6',
    top: '42%',
    offset: -12,
  },
];

// ── Parallax wrapper ─────────────────────────────────────────────────────────

type CardDef = typeof LEFT_CARDS[number] | typeof RIGHT_CARDS[number];

function ParallaxCard({
  card,
  side,
}: {
  card: CardDef;
  side: 'left' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      if (!ref.current) return;
      ref.current.style.transform = `translateY(${window.scrollY * 0.18 + card.offset}px)`;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [card.offset]);

  const position =
    side === 'left'
      ? 'right-2 xl:right-3 2xl:right-4'
      : 'left-2 xl:left-3 2xl:left-4';

  return (
    <div
      ref={ref}
      className={`absolute ${position} w-36 xl:w-40 2xl:w-48 will-change-transform`}
      style={{ top: card.top }}
    >
      <div
        className={`${card.rotate} shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/20 hover:scale-105 transition-transform duration-300`}
      >
        {card.type === 'onepiece' ? (
          <OnePieceCard />
        ) : card.type === 'lebron' ? (
          <LeBronCard />
        ) : (
          <CardImage src={card.src} alt={card.alt} label={card.label} />
        )}
      </div>
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

export default function FloatingHeroCards() {
  return (
    <>
      <div className="hidden xl:block absolute inset-y-0 left-0 w-64 2xl:w-80 pointer-events-none overflow-hidden">
        {LEFT_CARDS.map((card) => (
          <ParallaxCard key={card.alt} card={card} side="left" />
        ))}
      </div>

      <div className="hidden xl:block absolute inset-y-0 right-0 w-64 2xl:w-80 pointer-events-none overflow-hidden">
        {RIGHT_CARDS.map((card) => (
          <ParallaxCard key={card.alt} card={card} side="right" />
        ))}
      </div>
    </>
  );
}
