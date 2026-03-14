'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Send, CheckCircle, Loader2, Lock, ShieldCheck, ArrowRight, User, Edit2, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardNav from '@/components/DashboardNav';

type Milestone = {
  title: string;
  description: string;
  deliverables: string[];
  estimatedDays: number;
  payoutAmount: number;
};

type RoadmapData = {
  projectTitle: string;
  totalBudget: number;
  milestones: Milestone[];
};

type LockResult = {
  projectId: string;
  milestoneIds: string[];
};

export default function EmployerDashboard() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [editableRoadmap, setEditableRoadmap] = useState<RoadmapData | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isLockingFunds, setIsLockingFunds] = useState(false);
  const [lockResult, setLockResult] = useState<LockResult | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Sync editable copy whenever roadmap changes
  useEffect(() => {
    if (roadmap) setEditableRoadmap(JSON.parse(JSON.stringify(roadmap)));
  }, [roadmap]);

  const recalcTotal = (milestones: Milestone[]) =>
    milestones.reduce((sum, m) => sum + (Number(m.payoutAmount) || 0), 0);

  const updateMilestoneAmount = (idx: number, val: string) => {
    if (!editableRoadmap) return;
    const updated = { ...editableRoadmap };
    updated.milestones = [...updated.milestones];
    updated.milestones[idx] = { ...updated.milestones[idx], payoutAmount: Number(val) || 0 };
    updated.totalBudget = recalcTotal(updated.milestones);
    setEditableRoadmap(updated);
  };

  const updateMilestoneDays = (idx: number, val: string) => {
    if (!editableRoadmap) return;
    const updated = { ...editableRoadmap };
    updated.milestones = [...updated.milestones];
    updated.milestones[idx] = { ...updated.milestones[idx], estimatedDays: Number(val) || 1 };
    setEditableRoadmap(updated);
  };

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    const transcript = messages.map(m => m.role + ': ' + m.content).join('\n');
    try {
      const res = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (res.ok && data.milestones) {
        setRoadmap(data);
        setLockError(null);
      } else {
        alert('AI failed to generate a valid roadmap. Try conversing more with the AI first.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Please try again.');
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleLockFunds = async () => {
    if (!editableRoadmap) return;
    setIsLockingFunds(true);
    setLockError(null);
    try {
      const res = await fetch('/api/escrow/lock-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: editableRoadmap.projectTitle,
          totalBudget: editableRoadmap.totalBudget,
          milestones: editableRoadmap.milestones,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLockResult({ projectId: data.projectId, milestoneIds: data.milestoneIds });
      } else {
        setLockError(data.error || 'Unknown error. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setLockError('Network error. Please try again.');
    } finally {
      setIsLockingFunds(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#030712] text-neutral-50 font-sans selection:bg-emerald-500/30 overflow-hidden">
      <DashboardNav role="employer" />
      <div className="flex flex-col h-full pt-14 p-4 overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Main Container */}
      <div className="flex w-full h-[calc(100vh-2rem-56px)] max-w-[1600px] mx-auto gap-6 bg-neutral-950/40 backdrop-blur-3xl rounded-[2rem] border border-neutral-800/50 shadow-2xl p-6 relative z-10 overflow-hidden">
        
        {/* Left Column: AI Intake Agent */}
        <div className="w-[35%] flex flex-col gap-4 h-full">
          <div className="flex flex-col flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] min-h-0">
            
            {/* Chat Header */}
            <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white tracking-tight">AI Project Architect</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={viewportRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
              <div className="flex flex-col gap-5 pb-4 min-h-full">
                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center text-neutral-500 mt-20 px-6">
                    <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <Bot className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="font-medium text-neutral-300">Describe your project vision.</p>
                    <p className="text-sm mt-2 leading-relaxed">I will ask clarifying questions to break it into a verifiable milestones roadmap with escrow.</p>
                  </motion.div>
                )}
                
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div 
                      key={m.id} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {m.role !== 'user' && (
                        <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-auto">
                          <Bot className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      
                       <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm break-words ${
                        m.role === 'user' 
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-2xl rounded-tr-sm' 
                          : 'bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-neutral-200 rounded-2xl rounded-tl-sm'
                      }`}>
                         <span className="whitespace-pre-wrap">{m.content}</span>
                      </div>

                      {m.role === 'user' && (
                        <div className="w-8 h-8 shrink-0 rounded-full bg-neutral-800 flex items-center justify-center mt-auto border border-neutral-700">
                          <User className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                       <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-auto">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="p-4 rounded-2xl rounded-tl-sm bg-neutral-900/80 border border-neutral-800 flex items-center gap-1.5 h-12">
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-neutral-500 rounded-full" />
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-neutral-500 rounded-full" />
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-neutral-500 rounded-full" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-neutral-900/50 backdrop-blur-xl border-t border-neutral-800 shrink-0">
              <div className="relative flex items-center">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Define your project requirements..."
                  className="bg-[#030712] border-neutral-800 text-white h-14 pl-5 pr-14 rounded-xl shadow-inner focus-visible:ring-1 focus-visible:ring-emerald-500/50 placeholder:text-neutral-600"
                />
                <Button 
                  size="icon" 
                  type="submit" 
                  disabled={isLoading || !input.trim()} 
                  className="absolute right-2 top-2 bottom-2 w-10 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40 disabled:hover:bg-emerald-600"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
            </form>
          </div>

          {/* Generate Button Area */}
          <AnimatePresence>
            {messages.length > 2 && !lockResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="shrink-0">
                <Button
                  onClick={handleGenerateRoadmap}
                  disabled={isGeneratingRoadmap}
                  className="w-full h-14 text-base font-semibold tracking-wide bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] rounded-xl transition-all"
                >
                  {isGeneratingRoadmap ? (
                    <><Loader2 className="w-5 h-5 mr-3 animate-spin" />Synthesizing Smart Contract...</>
                  ) : (
                    <>Generate AI Escrow Roadmap <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Editable Roadmap & Escrow */}
        <div className="flex-1 bg-[#0a0a0a] border border-neutral-800/80 rounded-2xl flex flex-col relative drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] h-full overflow-hidden">
          
          {/* Top Banner */}
          <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-400">Escrow Contract Preview</span>
            </div>
            {editableRoadmap && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 font-mono">✎ Click amounts to edit</span>
                <div className="flex border border-neutral-800 rounded-md overflow-hidden text-xs font-mono">
                  <div className="bg-neutral-950 text-neutral-500 px-3 py-1 border-r border-neutral-800">STATUS</div>
                  <div className="bg-[#0a0a0a] text-yellow-500 px-3 py-1 font-semibold">DRAFT</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {!editableRoadmap ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-neutral-500 mt-32 min-h-[400px]">
                <div className="w-48 h-48 border border-dashed border-neutral-800 rounded-full flex flex-col items-center justify-center mb-8 relative">
                   <Lock className="w-8 h-8 text-neutral-700 mb-2" />
                   <span className="text-[10px] tracking-widest uppercase font-semibold text-neutral-600">Awaiting Data</span>
                </div>
                <p className="font-medium text-neutral-400 text-lg">No Contract Generated Yet</p>
                <p className="text-sm mt-2 max-w-sm text-center">Chat with the Architect on the left, then click "Generate AI Escrow Roadmap".</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.6 }} className="space-y-10 pb-20 max-w-3xl mx-auto">
                
                {/* Contract Header */}
                <div className="flex justify-between items-start border-b border-neutral-800/50 pb-8">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-2 leading-tight">{editableRoadmap.projectTitle}</h1>
                    <div className="flex gap-2 items-center text-sm text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] uppercase">Auto-AQA Enabled</span>
                      • 
                      <span>Generated by Agent · Edit amounts below</span>
                    </div>
                  </div>
                  <div className="text-right bg-neutral-900/50 p-5 rounded-xl border border-neutral-800 shadow-inner min-w-[180px]">
                    <p className="text-xs text-neutral-500 tracking-widest uppercase font-bold mb-1">Total Vault Lock</p>
                    <p className="text-3xl lg:text-4xl font-mono font-bold text-emerald-400">${editableRoadmap.totalBudget.toLocaleString()}</p>
                    <p className="text-[10px] text-neutral-600 mt-1">Auto-recalculates from milestones</p>
                  </div>
                </div>

                {/* Editable Timeline */}
                <div className="space-y-6 relative ml-4">
                  <div className="absolute left-0 top-6 bottom-6 w-px bg-gradient-to-b from-emerald-500/50 via-neutral-800 to-neutral-800" />

                  {editableRoadmap.milestones.map((milestone, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 + 0.3 }}
                      className="relative pl-10"
                    >
                      <div className="absolute left-[-5px] top-6 w-3 h-3 bg-[#0a0a0a] border-2 border-neutral-600 rounded-full z-10" />
                      
                      <Card className="bg-neutral-900 border-neutral-800/80 hover:border-neutral-700 transition-colors shadow-lg overflow-hidden group">
                        <CardHeader className="pb-3 bg-neutral-950 flex flex-row justify-between items-start border-b border-neutral-800/50">
                          <div className="pr-4">
                            <p className="text-emerald-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 flex items-center gap-2">
                              Milestone {idx + 1}
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            </p>
                            <CardTitle className="text-xl text-neutral-100">{milestone.title}</CardTitle>
                          </div>
                          <div className="flex gap-3 items-center shrink-0">
                            {/* Editable Days */}
                            <div className="bg-amber-900/20 px-3 py-2 rounded border border-amber-800/30 text-right min-w-[110px]">
                              <p className="text-[10px] uppercase tracking-wider text-amber-500/70 font-semibold mb-1">Deadline</p>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={milestone.estimatedDays ?? 1}
                                  onChange={(e) => updateMilestoneDays(idx, e.target.value)}
                                  className="w-14 bg-transparent font-mono text-xl text-amber-400 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500/50 rounded px-1 text-right"
                                />
                                <span className="text-sm font-sans text-amber-400">Days</span>
                              </div>
                            </div>
                            {/* Editable Payout */}
                            <div className="bg-emerald-900/20 px-3 py-2 rounded border border-emerald-800/30 text-right min-w-[120px]">
                              <p className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-semibold mb-1">Payout</p>
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-400 font-mono text-xl font-bold">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={milestone.payoutAmount ?? 0}
                                  onChange={(e) => updateMilestoneAmount(idx, e.target.value)}
                                  className="w-20 bg-transparent font-mono text-xl text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded px-1 text-right"
                                />
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                          <p className="text-neutral-400 text-sm mb-6 leading-relaxed bg-[#0a0a0a] p-4 rounded-lg border border-neutral-800/50">{milestone.description}</p>
                          
                          <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verifiable Deliverables (AQA Logic)
                            </p>
                            <ul className="space-y-2">
                              {milestone.deliverables.map((del, dIdx) => (
                                <li key={dIdx} className="text-sm flex items-start gap-3 text-neutral-300">
                                  <div className="w-5 h-5 rounded border border-neutral-700 bg-neutral-950 flex items-center justify-center shrink-0 mt-0.5" />
                                  <span className="leading-snug">{del}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Fixed Action Bar */}
          {editableRoadmap && (
            <div className="bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800 flex flex-col px-8 py-4 shrink-0 gap-3">
              {lockResult ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 justify-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-bold text-lg tracking-tight">Vault Locked & Contract Deployed!</p>
                    <div className="flex items-center gap-2 mt-0.5 text-sm text-neutral-400">
                      <span>Ref ID: <span className="font-mono text-neutral-300">{lockResult.projectId.slice(0, 12)}...</span></span>
                      <span>•</span>
                      <span>{lockResult.milestoneIds.length} milestones active</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {lockError && (
                    <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{lockError}</span>
                    </div>
                  )}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white tracking-wide">Ready to initialize smart contract?</p>
                      <p className="text-xs text-neutral-400 mt-0.5">This will lock <span className="text-emerald-400 font-mono font-bold">${editableRoadmap.totalBudget.toLocaleString()}</span> into the autonomous escrow vault.</p>
                    </div>
                    <Button
                      onClick={handleLockFunds}
                      disabled={isLockingFunds || editableRoadmap.totalBudget <= 0}
                      className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isLockingFunds ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-2" />Locking Vault...</>
                      ) : (
                        <><Lock className="w-5 h-5 mr-2" />Approve & Lock ${editableRoadmap.totalBudget.toLocaleString()}</>
                      )}
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
