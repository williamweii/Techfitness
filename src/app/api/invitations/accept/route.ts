import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Missing invite token' }, { status: 400 });

    // Fetch the invitation (RLS allows reading pending/non-expired invites)
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .select('*, fitness_profiles!coach_id(name, avatar_url)')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invite not found, expired, or already used' }, { status: 404 });
    }

    // Check usage limit for universal invites
    if (invitation.usage_limit !== null && invitation.usage_count >= invitation.usage_limit) {
      return NextResponse.json({ error: 'This invite link has reached its usage limit' }, { status: 410 });
    }

    // Ensure client has a fitness_profile
    const { data: clientProfile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!clientProfile) {
      // Auto-create profile as client if not exists
      await supabaseAdmin.from('fitness_profiles').insert({
        id: user.id,
        name: user.email?.split('@')[0],
        email: user.email,
        role: 'client',
      });
    }

    // Check if relationship already exists
    const { data: existing } = await supabaseAdmin
      .from('coach_clients')
      .select('id, status')
      .eq('coach_id', invitation.coach_id)
      .eq('client_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Already connected to this coach', relationship: existing });
    }

    // Create coach_client relationship
    const { data: relationship, error: relError } = await supabaseAdmin
      .from('coach_clients')
      .insert({
        coach_id: invitation.coach_id,
        client_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (relError) return NextResponse.json({ error: relError.message }, { status: 500 });

    // Update invitation: increment usage_count, mark as accepted if specific
    const updateData: any = { usage_count: invitation.usage_count + 1 };
    if (!invitation.is_universal) {
      updateData.status = 'accepted';
    }

    await supabaseAdmin.from('invitations').update(updateData).eq('id', invitation.id);

    return NextResponse.json({
      message: 'Successfully connected to coach!',
      coach: invitation.fitness_profiles,
      relationship,
    }, { status: 200 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
