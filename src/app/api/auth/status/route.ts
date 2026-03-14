import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ user: null })
  }

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return NextResponse.json({ user: true, role: data?.role })
}
