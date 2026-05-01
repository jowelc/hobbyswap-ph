import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy — HobbySwap PH',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: May 1, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-slate-300 text-sm leading-relaxed">

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">1. Who We Are</h2>
            <p>
              HobbySwap PH is an invite-only online trading platform for collectibles and trading cards in the Philippines. We are operated by HobbySwap PH and can be reached at{' '}
              <a href="mailto:hobbyswapph@gmail.com" className="text-blue-400 hover:text-blue-300">hobbyswapph@gmail.com</a>.
            </p>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">2. Information We Collect</h2>
            <p>When you sign in via Google or Facebook, we receive and store:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
              <li>Your name and email address</li>
              <li>Your profile photo (avatar)</li>
              <li>A unique identifier from the sign-in provider</li>
            </ul>
            <p>When you use the platform, we also store:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
              <li>Items you list for trade (photos, descriptions, pricing)</li>
              <li>Trade offers you send or receive</li>
              <li>Messages exchanged with other traders</li>
              <li>Your profile details (location, looking for, payment details)</li>
              <li>Your watchlist</li>
            </ul>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
              <li>To authenticate your identity and manage your account</li>
              <li>To display your profile to other verified traders</li>
              <li>To facilitate trade offers and messaging between users</li>
              <li>To send notifications about your trade activity</li>
              <li>To enforce our whitelist and platform rules</li>
            </ul>
            <p>We do not sell your personal information to third parties. We do not use your data for advertising.</p>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">4. Data Storage</h2>
            <p>
              Your data is stored in a secure cloud database (Neon PostgreSQL) and images are stored via Cloudinary. Both services are industry-standard and maintain their own security and privacy certifications.
            </p>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">5. Third-Party Sign-In</h2>
            <p>
              We use Google OAuth and Facebook Login for authentication. By signing in through these providers, you are also subject to their respective privacy policies:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Google Privacy Policy</a></li>
              <li><a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Meta / Facebook Privacy Policy</a></li>
            </ul>
            <p>We only request basic profile information (name, email, photo) and do not access your social media posts, friends list, or other private data.</p>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
              <li>Request access to the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and all associated data</li>
              <li>Withdraw your consent at any time by stopping use of the platform</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{' '}
              <a href="mailto:hobbyswapph@gmail.com" className="text-blue-400 hover:text-blue-300">hobbyswapph@gmail.com</a>{' '}
              or visit our{' '}
              <Link href="/data-deletion" className="text-blue-400 hover:text-blue-300">Data Deletion page</Link>.
            </p>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">7. Cookies</h2>
            <p>
              We use session cookies solely to keep you signed in. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">9. Contact</h2>
            <p>
              For any privacy-related questions or concerns, contact us at:{' '}
              <a href="mailto:hobbyswapph@gmail.com" className="text-blue-400 hover:text-blue-300">hobbyswapph@gmail.com</a>
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
