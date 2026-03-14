'use client'

import { use, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, UserPlus, LogIn, ArrowRight } from 'lucide-react'
import { login, signup } from './actions'

export default function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = use(props.searchParams)
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState<'EMPLOYER' | 'FREELANCER'>('EMPLOYER')
  const [isLoading, setIsLoading] = useState(false)

  const toggleMode = () => setIsLogin(!isLogin)

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-neutral-800/80 rounded-[2rem] shadow-2xl overflow-hidden drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          
          {/* Header Area */}
          <div className="px-8 pt-10 pb-6 border-b border-neutral-800/50 bg-neutral-900/30 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Protocol'}
            </h1>
            <p className="text-sm text-neutral-400">
              {isLogin ? 'Enter your credentials to access the vault.' : 'Establish your identity to start transacting autonomously.'}
            </p>
          </div>

          <div className="p-8">
            {searchParams?.error && (
              <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm text-center">
                {searchParams.error}
              </div>
            )}

            <form className="space-y-5" action={isLogin ? login : signup}>
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label className="text-xs font-semibold tracking-widest uppercase text-neutral-400">Full Name</Label>
                    <Input 
                      name="name" 
                      placeholder="Jane Doe" 
                      required={!isLogin}
                      className="bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-emerald-500/50 transition-all text-white" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-widest uppercase text-neutral-400">Email Address</Label>
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="agent@parity.dev" 
                  required
                  className="bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-emerald-500/50 transition-all text-white" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-widest uppercase text-neutral-400">Password</Label>
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  className="bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-emerald-500/50 transition-all text-white" 
                />
              </div>

              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden pt-2"
                  >
                    <Label className="text-xs font-semibold tracking-widest uppercase text-neutral-400">Account Type</Label>
                    <input type="hidden" name="role" value={role} />
                    <div className="flex bg-neutral-950/50 p-1.5 rounded-xl border border-neutral-800 relative">
                      <div 
                        className={`absolute inset-y-1.5 w-[calc(50%-0.375rem)] bg-emerald-600/20 border border-emerald-500/30 rounded-lg transition-all duration-300 ease-in-out z-0
                          ${role === 'EMPLOYER' ? 'left-1.5' : 'left-[calc(50%+0.375rem)]'}
                        `} 
                      />
                      <button
                        type="button"
                        onClick={() => setRole('EMPLOYER')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${role === 'EMPLOYER' ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                      >
                        EMPLOYER
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('FREELANCER')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${role === 'FREELANCER' ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                      >
                        FREELANCER
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                type="submit" 
                className="w-full h-14 mt-6 text-base font-semibold tracking-wide bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] rounded-xl transition-all group"
              >
                {isLogin ? (
                  <><LogIn className="w-5 h-5 mr-2" /> Authenticate Session</>
                ) : (
                  <><UserPlus className="w-5 h-5 mr-2" /> Create Identity <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-neutral-800/50 pt-6">
              <p className="text-neutral-500 text-sm">
                {isLogin ? "Don't have an identity yet? " : "Already verified? "}
                <button 
                  onClick={toggleMode}
                  className="text-emerald-500 font-semibold hover:text-emerald-400 transition-colors focus:outline-none underline underline-offset-4 decoration-emerald-500/30"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
