import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Contact — HobbySwap PH',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar showSearch={false} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Get in Touch</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Contact Us</h1>
          <p className="text-sm text-slate-500">We&apos;d love to hear from you.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8 space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              Have a question, a trade dispute, or just want to say hi? Reach out directly to Jowel —
              the founder and developer of HobbySwap PH.
            </p>

            <a
              href="https://www.facebook.com/JowelCastaneda6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 hover:border-[#1877F2]/50 text-[#60a5fa] px-5 py-3 rounded-xl transition-all font-semibold text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Message on Facebook
            </a>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-white">Common Questions</h2>
            <div className="space-y-4 text-sm text-slate-400">
              <div>
                <p className="font-semibold text-slate-300 mb-1">How do I get an invite?</p>
                <p>HobbySwap PH is invite-only. Reach out on Facebook and we&apos;ll get you set up.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300 mb-1">I have a trade dispute. What do I do?</p>
                <p>Contact us on Facebook with the details and we&apos;ll help mediate.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300 mb-1">How does the escrow service work?</p>
                <p>Both parties send their items to a trusted middleman before the trade is confirmed. Message us to arrange.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
