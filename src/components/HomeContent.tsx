'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Code2, Coins, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function HomeContent() {
  const [authState, setAuthState] = useState<{ loading: boolean, user: boolean, role: string | null }>({
    loading: true,
    user: false,
    role: null
  });

  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => {
        setAuthState({
          loading: false,
          user: data.user,
          role: data.role
        });
      })
      .catch(() => setAuthState({ loading: false, user: false, role: null }));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#030712] text-neutral-50 overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] max-w-6xl mx-auto px-6 text-center pt-20">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/50 border border-neutral-800 backdrop-blur-md text-sm text-neutral-300 mb-8 shadow-2xl"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          Autonomous Protocol v1.0 Active
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-tight"
        >
          The End of the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Trust Gap.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-2xl text-neutral-400 max-w-3xl mx-auto leading-relaxed font-light mb-12"
        >
          We use AI to objectively define scope, autonomously verify code, and programmatically unlock escrow funds via micro-payouts. Freeing employers and freelancers to just build.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto h-16"
        >
          {authState.loading ? (
            <div className="w-48 flex items-center justify-center text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : authState.user ? (
            <Link href={`/dashboard/${authState.role === 'EMPLOYER' ? 'employer' : 'freelancer'}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-16 px-10 rounded-2xl text-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:scale-105 group">
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-16 px-10 rounded-2xl text-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:scale-105 group">
                  Sign In / Register
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </main>

      {/* 3 Pillar Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 pb-32">
        {[
          { icon: Bot, title: 'Intelligent Intake', desc: 'Vague descriptions are instantly turned into strict, verifiable milestones by our AI Agent.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Code2, title: 'Automated QA', desc: 'Code and design submissions are graded objectively by LLMs against the agreed deliverables.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { icon: Coins, title: 'Immutable Escrow', desc: 'Funds flow securely via programmatic micro-transactions as soon as the AQA Agent approves work.', color: 'text-teal-400', bg: 'bg-teal-500/10' }
        ].map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-neutral-800 hover:border-neutral-700 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
            <div className={`w-14 h-14 rounded-2xl ${feature.bg} border border-neutral-800 flex items-center justify-center mb-6`}>
              <feature.icon className={`w-7 h-7 ${feature.color}`} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-neutral-400 leading-relaxed font-light">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
