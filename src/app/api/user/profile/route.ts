import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .select('pfi_score, wallet_balance, email, role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ pfi_score: 500, wallet_balance: 0 });
  }

  return NextResponse.json(data);
}
