import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { projectTitle, totalBudget, milestones } = await req.json();

    // Use ONLY the authenticated session client — the anon client cannot bypass RLS
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    
    if (!user) throw new Error("Unauthorized – please log in again");

    // Ensure user profile exists in public.users (fix for users who signed up before this schema)
    const { error: profileErr } = await db.from('users').upsert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Employer',
      role: (user.user_metadata?.role || 'employer').toLowerCase(), // DB expects lowercase
      wallet_balance: 10000,
      pfi_score: 750,
    }, { onConflict: 'id' });

    if (profileErr) {
      console.error('[lock-funds] profile upsert error:', profileErr);
      // Don't throw — profile may already exist, FK should be fine
    }

    // Create project as OPEN — freelancers will claim it from the marketplace
    const { data: project, error: projectError } = await db
      .from('projects')
      .insert({
        title: projectTitle,
        description: `AI-generated escrow contract for: ${projectTitle}`,
        employer_id: user.id,
        freelancer_id: null,
        escrow_balance: totalBudget,
        total_budget: totalBudget,
        status: 'OPEN',
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error('Failed to create project: ' + projectError?.message);
    }

    // 2. Bulk-insert milestones (without estimated_days as column may not exist)
    const milestoneRows = milestones.map((m: {
      title: string;
      description: string;
      deliverables: string[];
      estimatedDays: number;
      payoutAmount: number;
    }) => ({
      project_id: project.id,
      title: m.title,
      description: m.description,
      deliverables: m.deliverables,
      payout_amount: m.payoutAmount,
      status: 'PENDING',
    }));

    const { data: createdMilestones, error: msError } = await db
      .from('milestones')
      .insert(milestoneRows)
      .select();

    if (msError) throw new Error('Failed to create milestones: ' + msError.message);

    // 3. Deduct from employer wallet
    const { data: employer } = await db
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();

    if (employer) {
      await db
        .from('users')
        .update({ wallet_balance: Math.max(0, employer.wallet_balance - totalBudget) })
        .eq('id', user.id);
    }

    // 4. Log the FUND_LOCK transaction
    await db.from('transaction_ledger').insert({
      project_id: project.id,
      from_user_id: user.id,
      to_user_id: null,
      amount: totalBudget,
      type: 'FUND_LOCK',
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      milestoneIds: createdMilestones?.map((m: { id: string }) => m.id) ?? [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lock funds failed';
    console.error('[lock-funds]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
