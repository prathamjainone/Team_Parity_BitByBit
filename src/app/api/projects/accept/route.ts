import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();
    const db = await createClient();

    const { data: { user } } = await db.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure freelancer profile exists
    await db.from('users').upsert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Freelancer',
      role: (user.user_metadata?.role || 'freelancer').toLowerCase(),
      wallet_balance: 0,
      pfi_score: 750,
    }, { onConflict: 'id' });

    // Claim the project by setting freelancer_id and updating status
    const { data, error } = await db
      .from('projects')
      .update({
        freelancer_id: user.id,
        status: 'IN_PROGRESS',
      })
      .eq('id', projectId)
      .is('freelancer_id', null) // only claim if still unassigned
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Could not claim project — it may already be taken.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, project: data });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
