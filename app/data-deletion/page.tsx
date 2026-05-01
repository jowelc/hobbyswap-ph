import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Data Deletion — HobbySwap PH',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2">Account</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Data Deletion Request</h1>
          <p className="text-sm text-slate-500">Your data, your control.</p>
        </div>

        <div className="space-y-6">

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">What data we hold about you</h2>
            <ul className="text-sm text-slate-400 list-disc list-inside space-y-1 ml-2">
              <li>Your name, email address, and profile photo (from Google or Facebook sign-in)</li>
              <li>Items you listed for trade</li>
              <li>Trade offers sent and received</li>
              <li>Messages with other traders</li>
              <li>Profile details (location, payment info, looking-for preferences)</li>
              <li>Your watchlist</li>
            </ul>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">How to request deletion</h2>
            <p className="text-sm text-slate-400">
              To permanently delete your account and all associated data from HobbySwap PH, send an email to:
            </p>
            <a
              href="mailto:hobbyswapph@gmail.com?subject=Data%20Deletion%20Request&body=Please%20delete%20my%20HobbySwap%20PH%20account%20and%20all%20associated%20data.%0A%0AEmail%20address%20linked%20to%20my%20account%3A%20"
              className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email hobbyswapph@gmail.com
            </a>
            <p className="text-xs text-slate-500">
              Include the email address linked to your account. We will process your request within 7 business days and confirm once your data has been deleted.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">What happens after deletion</h2>
            <ul className="text-sm text-slate-400 list-disc list-inside space-y-1 ml-2">
              <li>Your account and profile will be permanently removed</li>
              <li>All your listed items will be deleted</li>
              <li>Your messages and trade offers will be deleted</li>
              <li>Your data will be removed from our database within 30 days</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">Revoking Facebook access</h2>
            <p className="text-sm text-slate-400">
              If you signed in with Facebook, you can also revoke HobbySwap PH&apos;s access directly from your Facebook settings:
            </p>
            <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1 ml-2">
              <li>Go to Facebook → Settings → Security and Login</li>
              <li>Click <span className="text-white font-medium">Apps and Websites</span></li>
              <li>Find <span className="text-white font-medium">HobbySwap PH</span> and click Remove</li>
            </ol>
            <p className="text-xs text-slate-500">
              Revoking Facebook access prevents future logins but does not delete your existing HobbySwap PH data. To delete your data, send us an email as described above.
            </p>
          </div>

          <p className="text-xs text-slate-600 text-center">
            For more information, read our{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>.
          </p>

        </div>
      </main>

      <Footer />
    </div>
  );
}
