import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xs">
                HS
              </div>
              <span className="text-white font-black">HobbySwap <span className="text-blue-400">PH</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Trade hobbies. Build trust. The Philippines&apos; premier collectible trading platform.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Marketplace</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span className="hover:text-white cursor-pointer transition-colors">Basketball Cards</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Pokemon Cards</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Watches</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Sneakers</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Trust & Safety</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span className="hover:text-white cursor-pointer transition-colors">Verification Process</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Escrow Service</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Trade Guidelines</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Report a User</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2024 HobbySwap PH. All rights reserved. Made with ♥ in the Philippines.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>🇵🇭 Philippines</span>
            <span>·</span>
            <span>Trusted by 1,000+ collectors</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
