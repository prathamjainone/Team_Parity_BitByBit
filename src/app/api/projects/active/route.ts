import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const freelancerId = searchParams.get('freelancerId');

  if (!freelancerId) {
    return NextResponse.json({ projects: [] });
  }

  // Get ALL active projects for this freelancer
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, description, total_budget, escrow_balance, status')
    .eq('freelancer_id', freelancerId)
    .in('status', ['IN_PROGRESS', 'ACTIVE'])
    .order('created_at', { ascending: false });

  if (error || !projects?.length) {
    return NextResponse.json({ projects: [] });
  }

  // Fetch milestones for all projects in parallel
  const projectsWithMilestones = await Promise.all(
    projects.map(async (project) => {
      const { data: milestones } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });
      return { ...project, milestones: milestones ?? [] };
    })
  );

  return NextResponse.json({ projects: projectsWithMilestones });
}
