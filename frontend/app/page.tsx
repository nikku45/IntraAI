import Link from 'next/link';
import { ArrowRight, LifeBuoy, Zap, Shield, Globe, Cpu, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans">
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LifeBuoy className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">IntraAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-blue-500 transition-colors">
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-500/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32">
        {/* --- HERO SECTION --- */}
        <section className="max-w-7xl mx-auto px-6 text-center py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">New: Gemini 1.5 Pro Support</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 leading-tight">
            Chat with your <br /> Company Intelligence.
          </h1>
          
          <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed">
            The multi-tenant RAG platform that turns your company documents into a 
            secure, searchable knowledge base using local embeddings and Google Gemini.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link 
              href="/register"
              className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group text-lg shadow-2xl shadow-blue-600/30"
            >
              Join Private Beta
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-lg backdrop-blur-sm">
              Schedule Demo
            </button>
          </div>

          {/* SaaS Dashboard Preview (Placeholder) */}
          <div className="mt-24 relative p-4 bg-white/5 border border-white/10 rounded-[32px] overflow-hidden max-w-5xl mx-auto backdrop-blur-3xl shadow-2xl">
             <div className="bg-[#111] w-full aspect-video rounded-2xl flex items-center justify-center text-gray-700 border border-white/5">
                <LayoutPreview />
             </div>
             {/* Decorative side lights */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[120px] -z-10" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-[120px] -z-10" />
          </div>
        </section>

        {/* --- TRUSTED BY --- */}
        <section className="py-20 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-gray-500 text-sm font-bold uppercase tracking-widest mb-12">Trusted by fast-growing startups</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
               <span className="text-2xl font-black">STRIKE</span>
               <span className="text-2xl font-black">SOLAR</span>
               <span className="text-2xl font-black">VELOCITY</span>
               <span className="text-2xl font-black">QUANTUM</span>
            </div>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for Serious Scaling</h2>
             <p className="text-gray-400 text-lg">Everything you need to ship a production-ready AI strategy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-blue-500" />}
              title="Hyper-Fast RAG"
              desc="Optimized indexing pipeline that processes 100+ page documents in seconds using local workers."
            />
            <FeatureCard 
              icon={<Shield className="text-purple-500" />}
              title="Multi-Tenant Isolation"
              desc="Every company gets their own vector partition. Your data never leaks between tenants."
            />
            <FeatureCard 
              icon={<Globe className="text-emerald-500" />}
              title="Hybrid Context"
              desc="We combine keyword search with semantic embeddings for the most accurate answers."
            />
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <LifeBuoy className="text-blue-500 w-8 h-8" />
              <span className="text-2xl font-bold">IntraAI</span>
            </div>
            <p className="text-gray-500 max-w-xs mb-6">
              Empowering organizations to talk to their data securely and intelligently.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="text-gray-500 space-y-4 text-sm">
              <li><a href="#">Changelog</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="text-gray-500 space-y-4 text-sm">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[24px] hover:border-blue-500/30 transition-all group">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:ring-blue-500/50 transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function LayoutPreview() {
  return (
    <div className="w-full h-full p-8 flex gap-6 overflow-hidden">
       {/* Mock Sidebar */}
       <div className="w-1/4 space-y-4 opacity-20">
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-3/4 bg-white/10 rounded" />
          <div className="h-4 w-5/6 bg-white/10 rounded" />
       </div>
       {/* Mock Content */}
       <div className="flex-1 space-y-6">
          <div className="h-10 w-1/3 bg-white/5 rounded-xl border border-white/5" />
          <div className="grid grid-cols-2 gap-4">
             <div className="h-32 bg-white/5 rounded-2xl border border-white/5" />
             <div className="h-32 bg-white/5 rounded-2xl border border-white/5" />
          </div>
          <div className="h-48 w-full bg-blue-500/5 rounded-2xl border border-blue-500/10" />
       </div>
    </div>
  );
}
