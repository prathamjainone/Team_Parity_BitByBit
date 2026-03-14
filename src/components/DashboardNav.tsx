'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signout } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Briefcase, Building2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardNav({ role }: { role: 'employer' | 'freelancer' }) {
  const [email, setEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email || '');
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role?.toLowerCase() || null);
    });
  }, []);

  const isEmployer = userRole === 'employer';
  const isFreelancer = userRole === 'freelancer';

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-2xl border-b border-neutral-800/80 shadow-2xl shadow-black/50'
          : 'bg-[#030712]/80 backdrop-blur-xl border-b border-neutral-800/40'
      }`}
    >
      <div className="max-w-[1600px] mx-auto h-full flex items-center px-6 gap-6">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-black tracking-tight text-lg">
            <span className="text-emerald-400">Parity</span>
          </span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-neutral-800 shrink-0" />

        {/* Portal Tabs */}
        <nav className="flex items-center gap-1 flex-1">
          {/* Employer Tab */}
          <AnimatePresence mode="wait">
            {(isEmployer || userRole === null) && (
              <Link href="/dashboard/employer">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    role === 'employer'
                      ? 'text-emerald-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {role === 'employer' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Building2 className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Employer</span>
                </motion.div>
              </Link>
            )}
          </AnimatePresence>

          {/* Freelancer Tab */}
          <AnimatePresence mode="wait">
            {(isFreelancer || userRole === null) && (
              <Link href="/dashboard/freelancer">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    role === 'freelancer'
                      ? 'text-blue-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {role === 'freelancer' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Briefcase className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Freelancer</span>
                </motion.div>
              </Link>
            )}
          </AnimatePresence>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Role pill */}
          {userRole && (
            <div className={`hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
              isEmployer
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/8 border-blue-500/20 text-blue-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isEmployer ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse`} />
              {userRole}
            </div>
          )}

          {/* Email */}
          {email && (
            <span className="hidden lg:block text-xs text-neutral-600 font-mono max-w-[160px] truncate">
              {email}
            </span>
          )}

          {/* Sign out */}
          <form action={signout}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 hover:bg-rose-500/5 px-3 py-1.5 rounded-lg transition-all font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign Out</span>
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
