import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const evaluationSchema = z.object({
  status: z.enum(['COMPLETED_FULL', 'COMPLETED_PARTIAL', 'UNMET']).describe(
    'The final verdict based on the submitted work.'
  ),
  reasoning: z.string().describe(
    'A professional, transparent explanation of why this verdict was reached, referencing specific deliverables.'
  ),
  confidenceScore: z.number().min(0).max(100).describe(
    'How confident the Agent is in this assessment (0-100).'
  ),
  pfiImpact: z.number().describe(
    'Points to add or subtract from the freelancer\'s PFI score. (-50 to +20)'
  ),
  proRatedPercentage: z.number().min(0).max(100).describe(
    'If COMPLETED_PARTIAL, the percentage of the milestone payout to release (0-100). If COMPLETED_FULL, 100. If UNMET, 0.'
  ),
});

export async function POST(req: Request) {
  try {
    const { milestoneId, submissionData } = await req.json();

    // 1. Fetch milestone + project so we know the context
    const { data: milestone, error: msError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();

    if (msError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // 2. AI Evaluation
    const evaluation = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: evaluationSchema,
      prompt: `You are the Autonomous Quality Assurance (AQA) Agent. Strictly evaluate freelancer submissions against agreed technical criteria.

MILESTONE TITLE: ${milestone.title}
MILESTONE DESCRIPTION: ${milestone.description}
DEADLINE (For Deadline Adherence Check): ${milestone.estimated_days} days
REQUIRED DELIVERABLES (Definition of Done):
${(milestone.deliverables as string[]).map((d: string) => '- ' + d).join('\n')}

SUBMITTED WORK (Context/URL/Code):
${submissionData}

Evaluate objectively and rigorously. Look for verifiable proofs (e.g., working URLs, valid code snippets, exact requirements met) rather than vague claims.
- COMPLETED_FULL: All deliverables are definitively met with verifiable proof.
- COMPLETED_PARTIAL: Some deliverables are met, but key parts are missing or unverified. Determine a fair proRatedPercentage based on work done.
- UNMET: Fails core requirements, no verifiable proof, or is entirely irrelevant.`,
    });

    const result = evaluation.object as z.infer<typeof evaluationSchema>;

    // 3. Update milestone status & attach AI feedback
    await supabase
      .from('milestones')
      .update({
        status: result.status,
        ai_evaluation: {
          reasoning: result.reasoning,
          confidence: result.confidenceScore,
          pfiImpact: result.pfiImpact,
        },
      })
      .eq('id', milestoneId);

    // 4. Fetch project (to get employer_id, freelancer_id, payout_amount)
    const { data: project } = await supabase
      .from('projects')
      .select('id, freelancer_id, employer_id, total_budget')
      .eq('id', milestone.project_id)
      .single();

    // 5. Update Freelancer PFI score
    if (project?.freelancer_id) {
      const { data: user } = await supabase
        .from('users')
        .select('pfi_score')
        .eq('id', project.freelancer_id)
        .single();

      if (user) {
        const newScore = Math.max(0, Math.min(1000, (user.pfi_score as number) + result.pfiImpact));
        await supabase
          .from('users')
          .update({ pfi_score: newScore })
          .eq('id', project.freelancer_id);
      }
    }

    // 6. Auto-trigger payout if COMPLETED_FULL or COMPLETED_PARTIAL
    if ((result.status === 'COMPLETED_FULL' || result.status === 'COMPLETED_PARTIAL') && project?.freelancer_id) {
      const payoutPercentage = result.status === 'COMPLETED_FULL' ? 100 : result.proRatedPercentage;
      const amountToPay = (milestone.payout_amount * payoutPercentage) / 100;

      if (amountToPay > 0) {
        await fetch(new URL('/api/escrow/process-payout', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            milestoneId,
            projectId: project.id,
            freelancerId: project.freelancer_id,
            payoutAmount: amountToPay,
            isPartial: result.status === 'COMPLETED_PARTIAL'
          }),
        });
      }

      // If partial, auto-trigger refund for the remaining amount to employer
      if (result.status === 'COMPLETED_PARTIAL' && project?.employer_id) {
        const amountToRefund = milestone.payout_amount - amountToPay;
        if (amountToRefund > 0) {
          await fetch(new URL('/api/escrow/refund', req.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              milestoneId,
              projectId: project.id,
              employerId: project.employer_id,
              refundAmount: amountToRefund,
              isPartial: true
            }),
          });
        }
      }
    }

    // 7. Auto-trigger full refund if UNMET
    if (result.status === 'UNMET' && project?.employer_id) {
      await fetch(new URL('/api/escrow/refund', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          projectId: project.id,
          employerId: project.employer_id,
          refundAmount: milestone.payout_amount,
        }),
      });
    }

    return NextResponse.json({ success: true, evaluation: result });
  } catch (error) {
    console.error('[evaluate-work]', error);
    return NextResponse.json({ error: 'AI Evaluation failed' }, { status: 500 });
  }
}
