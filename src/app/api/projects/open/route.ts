import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = await createClient();

  const { data: projects, error } = await db
    .from('projects')
    .select(`
      id, title, description, total_budget, escrow_balance, status, created_at,
      users!projects_employer_id_fkey(name, email)
    `)
    .eq('status', 'OPEN')
    .is('freelancer_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ projects: [] });
  }

  return NextResponse.json({ projects: projects ?? [] });
}
