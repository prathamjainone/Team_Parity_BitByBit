import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { milestoneId, projectId, employerId, refundAmount } = await req.json();

    // 1. evaluate-work already updated the status, so we skip setting it blindly to UNMET here.

    // 2. Deduct refund from project escrow balance
    const { data: projectData } = await supabase
      .from('projects')
      .select('escrow_balance')
      .eq('id', projectId)
      .single();

    if (projectData) {
      await supabase
        .from('projects')
        .update({ escrow_balance: Math.max(0, projectData.escrow_balance - refundAmount) })
        .eq('id', projectId);
    }

    // 3. Credit the refund to the employer's wallet
    const { data: employer } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', employerId)
      .single();

    if (employer) {
      await supabase
        .from('users')
        .update({ wallet_balance: employer.wallet_balance + refundAmount })
        .eq('id', employerId);
    }

    // 4. Log REFUND transaction in the ledger
    await supabase.from('transaction_ledger').insert({
      project_id: projectId,
      from_user_id: null,
      to_user_id: employerId,
      amount: refundAmount,
      type: 'REFUND',
    });

    return NextResponse.json({ success: true, message: 'Refund processed successfully' });
  } catch (error) {
    console.error('[refund]', error);
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
  }
}
