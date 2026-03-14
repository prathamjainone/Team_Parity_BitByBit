'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UploadCloud, TrendingUp, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Wallet, Activity, Briefcase, ArrowRight, RefreshCw,
  DollarSign, ChevronDown, ChevronUp, Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardNav from '@/components/DashboardNav';
import { createClient } from '@/lib/supabase/client';

type Milestone = {
  id: string; title: string; description: string;
  deliverables: string[]; payout_amount: number; status: string;
  ai_evaluation?: { reasoning: string; confidence: number; pfiImpact: number; };
};

type Project = {
  id: string; title: string; description: string;
  total_budget: number; escrow_balance: number; status: string;
  milestones: Milestone[];
};

type OpenProject = {
  id: string; title: string; description: string;
  total_budget: number; escrow_balance: number; status: string;
};

type Verdict = {
  status: 'COMPLETED_FULL' | 'COMPLETED_PARTIAL' | 'UNMET';
  reasoning: string; confidenceScore: number; pfiImpact: number;
};

export default function FreelancerDashboard() {
  const [pfiScore, setPfiScore] = useState(750);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, projectRes, openRes] = await Promise.all([
        fetch(`/api/user/profile?userId=${user.id}`),
        fetch(`/api/projects/active?freelancerId=${user.id}`),
        fetch(`/api/projects/open`),
      ]);
      const profile = await profileRes.json();
      const projectData = await projectRes.json();
      const openData = await openRes.json();

      setPfiScore(profile.pfi_score ?? 750);
      setWalletBalance(profile.wallet_balance ?? 0);
      
      const projects: Project[] = projectData.projects ?? [];
      setActiveProjects(projects);
      
      // Auto-expand all newly loaded projects
      if (projects.length > 0) {
        setExpandedProjects(new Set(projects.map((p: Project) => p.id)));
      }
      
      setOpenProjects(openData.projects ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleClaimProject = async (projectId: string) => {
    setClaimingId(projectId);
    try {
      const res = await fetch('/api/projects/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.success) await fetchData();
      else alert(data.error || 'Failed to claim project');
    } catch (e) { console.error(e); }
    finally { setClaimingId(null); }
  };

  const handleSubmitWork = async (projectId: string, milestone: Milestone) => {
    const key = `${projectId}:${milestone.id}`;
    const url = submissionUrls[key] || '';
    if (!url.trim()) return;
    setSubmittingId(milestone.id);
    try {
      const res = await fetch('/api/ai/evaluate-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId: milestone.id, submissionData: url }),
      });
      const data = await res.json();
      if (data.evaluation) {
        setVerdicts(prev => ({ ...prev, [milestone.id]: data.evaluation }));
        setTimeout(fetchData, 800);
      }
    } catch (e) { console.error(e); }
    finally { setSubmittingId(null); }
  };

  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    COMPLETED_FULL: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-900', label: '✓ APPROVED' },
    COMPLETED_PARTIAL: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-900', label: '⚠ PARTIAL' },
    UNMET: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-900', label: '✕ UNMET' },
    PENDING: { icon: Activity, color: 'text-neutral-400', bg: 'bg-neutral-900 border-neutral-800', label: 'PENDING' },
  };

  const getPfiColor = (score: number) => {
    if (score >= 700) return 'text-emerald-400';
    if (score >= 500) return 'text-blue-400';
    if (score >= 300) return 'text-amber-400';
    return 'text-rose-400';
  };

  const pendingMilestones = activeProjects.reduce((acc, p) =>
    acc + p.milestones.filter(m => m.status === 'PENDING').length, 0);

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-50 font-sans selection:bg-blue-500/30 relative">
      <DashboardNav role="freelancer" />

      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/8 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed left-[-10%] bottom-[-20%] w-[50%] h-[50%] bg-teal-600/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10 pt-20 px-6 pb-12 md:px-12">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-neutral-800/50 pb-8">
          <div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-3 py-1 mb-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 tracking-widest uppercase font-bold">
              Freelancer Hub
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Your Workspace</h1>
            <p className="text-neutral-400 font-light">Manage multiple contracts, submit work, earn instantly.</p>
          </div>

          <div className="flex gap-3">
            <Card className="bg-[#0a0a0a]/80 border border-neutral-800 hover:border-emerald-500/30 transition-colors">
              <div className="p-5 min-w-[145px]">
                <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-medium mb-2"><Wallet className="w-3.5 h-3.5" />Wallet</div>
                <p className="text-2xl font-bold text-emerald-400 font-mono">${walletBalance.toLocaleString()}</p>
              </div>
            </Card>
            <Card className="bg-[#0a0a0a]/80 border border-neutral-800 hover:border-blue-500/30 transition-colors">
              <div className="p-5 min-w-[130px]">
                <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-medium mb-2"><TrendingUp className="w-3.5 h-3.5" />PFI Score</div>
                <p className={`text-2xl font-bold font-mono ${getPfiColor(pfiScore)}`}>{pfiScore}</p>
              </div>
            </Card>
            <Card className="bg-[#0a0a0a]/80 border border-neutral-800 hover:border-purple-500/30 transition-colors">
              <div className="p-5 min-w-[130px]">
                <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-medium mb-2"><Code2 className="w-3.5 h-3.5" />Active Jobs</div>
                <p className="text-2xl font-bold text-purple-400 font-mono">{activeProjects.length}</p>
              </div>
            </Card>
          </div>
        </header>

        {isLoadingData ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="space-y-12">

            {/* ─── ACTIVE PROJECTS ─── */}
            {activeProjects.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Active Contracts</h2>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">{activeProjects.length} project{activeProjects.length > 1 ? 's' : ''}</Badge>
                  {pendingMilestones > 0 && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">{pendingMilestones} pending</Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {activeProjects.map((project, pIdx) => {
                    const isExpanded = expandedProjects.has(project.id);
                    const pendingCount = project.milestones.filter(m => m.status === 'PENDING').length;
                    const doneCount = project.milestones.filter(m => m.status !== 'PENDING' && m.status !== 'SUBMITTED').length;

                    return (
                      <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pIdx * 0.06 }}>
                        <Card className="bg-[#0a0a0a] border border-neutral-800 hover:border-emerald-500/25 transition-all shadow-xl overflow-hidden">
                          {/* Project header row — click to expand/collapse */}
                          <button
                            onClick={() => toggleExpand(project.id)}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-neutral-900/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-blue-400 uppercase tracking-widest font-bold mb-0.5">Contract #{pIdx + 1}</p>
                                <h3 className="text-lg font-bold text-white truncate">{project.title}</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 ml-4">
                              <div className="hidden md:flex gap-3 text-sm">
                                <span className="bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 font-mono text-emerald-400 font-bold">${Number(project.escrow_balance).toLocaleString()}</span>
                                {pendingCount > 0 && <span className="bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-800/30 text-amber-400 text-xs font-medium">{pendingCount} to submit</span>}
                                {doneCount > 0 && <span className="bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-800/30 text-emerald-400 text-xs font-medium">{doneCount} done</span>}
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                            </div>
                          </button>

                          {/* Milestones */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-neutral-800 divide-y divide-neutral-800/50">
                                  {project.milestones.map((ms, mIdx) => {
                                    const verdict = verdicts[ms.id];
                                    const cfg = statusConfig[verdict?.status || ms.status] || statusConfig.PENDING;
                                    const Icon = cfg.icon;
                                    const isSubmitting = submittingId === ms.id;
                                    const isDone = ['COMPLETED_FULL', 'COMPLETED_PARTIAL', 'UNMET'].includes(verdict?.status || ms.status);
                                    const subKey = `${project.id}:${ms.id}`;

                                    return (
                                      <div key={ms.id} className="p-5 hover:bg-neutral-900/20 transition-colors">
                                        <div className="flex items-start justify-between mb-3 gap-3">
                                          <div>
                                            <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold mb-1">Milestone {mIdx + 1}</p>
                                            <p className="font-semibold text-white">{ms.title}</p>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0">
                                            <span className="font-mono font-bold text-emerald-400">${Number(ms.payout_amount).toLocaleString()}</span>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.color}`}>
                                              <Icon className="w-3 h-3" />{cfg.label}
                                            </div>
                                          </div>
                                        </div>

                                        <p className="text-sm text-neutral-500 mb-3">{ms.description}</p>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                          {ms.deliverables?.map((d, i) => (
                                            <span key={i} className="text-xs bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400">▸ {d}</span>
                                          ))}
                                        </div>

                                        {!isDone && (
                                          <div className="flex gap-2 pt-1">
                                            <Input
                                              value={submissionUrls[subKey] || ''}
                                              onChange={e => setSubmissionUrls(p => ({ ...p, [subKey]: e.target.value }))}
                                              placeholder="GitHub PR / deployed URL..."
                                              className="bg-[#030712] border-neutral-700 text-white h-10 text-sm"
                                            />
                                            <Button
                                              onClick={() => handleSubmitWork(project.id, ms)}
                                              disabled={isSubmitting || !submissionUrls[subKey]?.trim()}
                                              className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm shrink-0"
                                            >
                                              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UploadCloud className="w-4 h-4 mr-1.5" />Submit</>}
                                            </Button>
                                          </div>
                                        )}

                                        {verdict && (
                                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-3 p-3 rounded-lg border text-sm ${cfg.bg}`}>
                                            <p className={`font-semibold ${cfg.color} mb-1`}>{cfg.label}</p>
                                            <p className="text-neutral-300 text-xs">{verdict.reasoning}</p>
                                            <div className="flex gap-4 mt-2 text-xs font-mono text-neutral-500">
                                              <span>Confidence: <span className="text-white">{verdict.confidenceScore}%</span></span>
                                              <span className={verdict.pfiImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                PFI: {verdict.pfiImpact >= 0 ? '+' : ''}{verdict.pfiImpact}
                                              </span>
                                            </div>
                                          </motion.div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ─── OPEN MARKETPLACE ─── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Open Project Marketplace</h2>
                    <p className="text-xs text-neutral-500">Accept new projects alongside existing ones</p>
                  </div>
                  {openProjects.length > 0 && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{openProjects.length} available</Badge>
                  )}
                </div>
                <Button onClick={fetchData} variant="ghost" size="sm" className="text-neutral-500 hover:text-white border border-neutral-800 h-8 gap-1.5 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
              </div>

              {openProjects.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/30">
                  <Briefcase className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400 font-medium">No open projects right now</p>
                  <p className="text-neutral-600 text-sm mt-1">Employers need to lock new projects first</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {openProjects.map((proj, idx) => (
                    <motion.div key={proj.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                      <Card className="bg-[#0a0a0a] border border-neutral-800 hover:border-blue-500/40 transition-all shadow-lg h-full flex flex-col">
                        <CardHeader className="pb-3 border-b border-neutral-800/50">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-base font-bold text-white leading-snug">{proj.title}</CardTitle>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] shrink-0">OPEN</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex flex-col flex-1 gap-4">
                          <p className="text-sm text-neutral-500 flex-1 line-clamp-3">{proj.description || 'AI-generated escrow contract'}</p>
                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/50">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            <span className="font-mono font-bold text-emerald-400">${Number(proj.total_budget).toLocaleString()}</span>
                            <span className="text-neutral-600 text-xs">in escrow</span>
                          </div>
                          <Button
                            onClick={() => handleClaimProject(proj.id)}
                            disabled={claimingId === proj.id}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg h-10"
                          >
                            {claimingId === proj.id ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Claiming...</> : <><ArrowRight className="w-4 h-4 mr-2" />Accept Project</>}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
