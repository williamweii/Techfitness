import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side client using service role for trusted writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Verify user is a coach
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can create invitations' }, { status: 403 });
    }

    const body = await req.json();
    const {
      email = null,          // null = universal link
      is_universal = false,
      usage_limit = null,    // e.g. 10 for promo links
      note = null,
      expires_in_days = 7,
    } = body;

    const invite_type = is_universal ? 'universal' : 'specific';

    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .insert({
        coach_id: user.id,
        email,
        invite_type,
        is_universal,
        usage_limit,
        note,
        expires_at: new Date(Date.now() + expires_in_days * 86400000).toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invite_url = `${baseUrl}/invite/${invitation.token}`;

    return NextResponse.json({ invitation, invite_url }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
