import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About Us — HobbySwap PH',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar showSearch={false} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Our Story</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">About HobbySwap PH</h1>
          <p className="text-sm text-slate-500">Built by a collector, for collectors.</p>
        </div>

        <div className="space-y-6">
          {/* Founder card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                JC
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Jowel Castañeda</h2>
                <p className="text-sm text-blue-400 font-medium mb-3">Founder & Developer</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  HobbySwap PH was born out of a passion for collecting and a frustration with the lack of a
                  safe, trusted platform for trading collectibles in the Philippines. As a collector himself,
                  Jowel built HobbySwap PH to give fellow hobbyists a home — a place where deals are done
                  with trust, transparency, and community.
                </p>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-white">Our Mission</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              HobbySwap PH is the Philippines&apos; invite-only trading platform for collectibles — basketball
              cards, Pokémon, One Piece, and more. We keep the community tight-knit and trusted by vetting
              every member before they can trade.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every feature — from verified tiers to the escrow service — exists to protect collectors and
              make every trade a good one.
            </p>
          </div>

          {/* Connect */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-white mb-4">Connect with the Founder</h2>
            <a
              href="https://www.facebook.com/JowelCastaneda6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 hover:border-[#1877F2]/50 text-[#60a5fa] px-5 py-3 rounded-xl transition-all font-semibold text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              facebook.com/JowelCastaneda6
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
