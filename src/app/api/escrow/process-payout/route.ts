import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { milestoneId, projectId, freelancerId, payoutAmount } = await req.json();

    // 1. evaluate-work already updated the status, so we skip setting it blindly to COMPLETED_FULL here.

    // 2. Deduct payout from project escrow balance
    const { data: projectData } = await supabase
      .from('projects')
      .select('escrow_balance, total_budget')
      .eq('id', projectId)
      .single();

    if (projectData) {
      await supabase
        .from('projects')
        .update({ escrow_balance: Math.max(0, projectData.escrow_balance - payoutAmount) })
        .eq('id', projectId);
    }

    // 3. Add payout to freelancer wallet
    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', freelancerId)
      .single();

    if (userData) {
      await supabase
        .from('users')
        .update({ wallet_balance: userData.wallet_balance + payoutAmount })
        .eq('id', freelancerId);
    }

    // 4. Record MICRO_PAYOUT in ledger
    await supabase.from('transaction_ledger').insert({
      project_id: projectId,
      from_user_id: null,
      to_user_id: freelancerId,
      amount: payoutAmount,
      type: 'MICRO_PAYOUT',
    });

    // 5. Check if ALL milestones are resolved (not PENDING) → trigger SUCCESS_FEE
    const { data: allMilestones } = await supabase
      .from('milestones')
      .select('status')
      .eq('project_id', projectId);

    const allDone =
      allMilestones &&
      allMilestones.length > 0 &&
      allMilestones.every((m: { status: string }) => m.status !== 'PENDING');

    if (allDone && projectData) {
      const successFee = projectData.total_budget * 0.05;

      // Log the success fee transaction
      await supabase.from('transaction_ledger').insert({
        project_id: projectId,
        from_user_id: null,
        to_user_id: freelancerId,
        amount: successFee,
        type: 'SUCCESS_FEE',
      });

      // Credit success fee to freelancer wallet
      const { data: freshUser } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', freelancerId)
        .single();

      if (freshUser) {
        await supabase
          .from('users')
          .update({ wallet_balance: freshUser.wallet_balance + successFee })
          .eq('id', freelancerId);
      }

      // Mark project as fully DELIVERED
      await supabase
        .from('projects')
        .update({ status: 'DELIVERED' })
        .eq('id', projectId);

      return NextResponse.json({
        success: true,
        message: 'Final payout + success fee executed. Project DELIVERED.',
        successFee,
        projectDelivered: true,
      });
    }

    return NextResponse.json({ success: true, message: 'Milestone payout executed successfully' });
  } catch (error) {
    console.error('[process-payout]', error);
    return NextResponse.json({ error: 'Escrow transaction failed' }, { status: 500 });
  }
}
