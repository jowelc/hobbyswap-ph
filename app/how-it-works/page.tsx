import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const STEPS = [
  {
    number: '01',
    icon: '🔐',
    title: 'Request Access',
    desc: 'HobbySwap PH is an invite-only platform. Apply to join and get verified as a trusted collector before you can list or trade.',
  },
  {
    number: '02',
    icon: '📸',
    title: 'List Your Cards',
    desc: 'Upload front and back photos of your card. Our AI auto-identifies the card name, grade, and estimated value — saving you time.',
  },
  {
    number: '03',
    icon: '🔍',
    title: 'Browse & Discover',
    desc: 'Filter listings by category, condition, location, and trade preference. Find exactly the cards you\'re looking for from verified traders across the Philippines.',
  },
  {
    number: '04',
    icon: '🤝',
    title: 'Make a Trade Offer',
    desc: 'Select cards from your inventory to offer in exchange. Add a cash difference if needed. Send your offer with a message directly to the trader.',
  },
  {
    number: '05',
    icon: '💬',
    title: 'Coordinate the Trade',
    desc: 'Use the built-in messaging to align on shipping, meetup, or payment details. All traders display their GCash or bank info on their profile.',
  },
  {
    number: '06',
    icon: '🎉',
    title: 'Complete the Trade',
    desc: 'Receive your cards and mark the trade complete. Build your reputation as a trusted trader in the HobbySwap PH community.',
  },
];

const FEATURES = [
  { icon: '🛡️', title: 'Verified Traders Only', desc: 'Every member goes through an approval process. No random sellers — only trusted collectors.' },
  { icon: '🤖', title: 'AI-Assisted Listings', desc: 'Upload a photo and let our AI fill in the card details, condition, and estimated market value.' },
  { icon: '💰', title: 'Trade + Cash Offers', desc: 'Not an even swap? Add a cash difference to balance the trade — GCash or bank transfer accepted.' },
  { icon: '📍', title: 'Philippines-First', desc: 'Built specifically for Filipino collectors. Locations, shipping, and payment methods are all PH-native.' },
  { icon: '🔔', title: 'Real-Time Notifications', desc: 'Get notified the moment someone sends you a trade offer so you never miss an opportunity.' },
  { icon: '📦', title: 'Multi-Card Trades', desc: 'Bundle multiple cards on either side of the trade. Swap your entire Charizard set for a single PSA 10.' },
];

const FAQS = [
  {
    q: 'Is HobbySwap PH free to use?',
    a: 'Yes — listing items and making trade offers are completely free. There are no transaction fees.',
  },
  {
    q: 'How do I get access?',
    a: 'HobbySwap PH is currently invite-only. Reach out to an existing member or follow our social media for open-access announcements.',
  },
  {
    q: 'What types of collectibles can I trade?',
    a: 'Primarily trading cards — Pokémon, NBA, sports cards, MTG, One Piece, and more. Any card collectible is welcome.',
  },
  {
    q: 'How does shipping work?',
    a: 'Traders coordinate shipping, meetups, or Lalamove delivery between themselves. HobbySwap PH provides the platform to connect — the logistics are up to you and your trade partner.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'GCash, Maya, BDO, BPI, and most Philippine banks. Traders list their preferred payment method on their profile.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. We use Google Sign-In for authentication — we never store your password. Your personal details are only visible to verified traders on the platform.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative border-b border-slate-800/60 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:44px_44px] opacity-20 pointer-events-none" />
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-7">
            <span>🇵🇭</span> HobbySwap PH — About the Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-5">
            Trade Cards.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              The Right Way.
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            HobbySwap PH is the Philippines&apos; trusted invite-only marketplace for trading cards and collectibles. Watch the video below to see how it works, then jump in.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/#listings" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/40">
              Browse Listings <span aria-hidden>→</span>
            </Link>
            <Link href="/profile" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl transition-colors">
              Post an Item
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1">

        {/* ── Video Tutorial ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Video Tutorial</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">See it in action</h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-lg mx-auto">
              A quick walkthrough of the full trading flow — from listing your first card to completing a trade.
            </p>
          </div>

          {/* Video embed — replace the src with your YouTube embed URL */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400">
              {/* Placeholder — swap iframe below when video is ready */}
              <div className="w-16 h-16 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-300 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">Tutorial video coming soon</p>
              <p className="text-xs text-slate-600 max-w-xs text-center">
                Replace this placeholder with an &lt;iframe&gt; pointing to your YouTube or Vimeo embed URL.
              </p>
            </div>
            {/*
              When your video is ready, remove the placeholder above and uncomment:
              <iframe
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                title="HobbySwap PH Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            */}
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="border-t border-slate-800/60 bg-slate-900/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">Step by step</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">How trading works</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {STEPS.map((step) => (
                <div key={step.number} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl group-hover:border-blue-500/40 transition-colors">
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-600 tracking-widest">{step.number}</span>
                        <h3 className="text-sm font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">Platform features</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Built for Filipino collectors</h2>
              <p className="text-slate-400 mt-3 text-sm max-w-lg mx-auto">
                Every feature is designed around the way collectors in the Philippines actually trade.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4 p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-colors">
                  <div className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t border-slate-800/60 bg-slate-900/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Common questions</h2>
            </div>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.q} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl px-5 py-4">
                  <p className="text-sm font-bold text-white mb-1.5">{faq.q}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-3xl mb-6">
              🤝
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to start trading?</h2>
            <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-md mx-auto">
              Browse active listings from verified Filipino collectors, or sign in to list your own cards.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/#listings" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-900/40">
                Browse Listings <span aria-hidden>→</span>
              </Link>
              <Link href="/profile" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold px-7 py-3.5 rounded-xl transition-colors">
                My Profile
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
