import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type FitnessRole = 'coach' | 'client' | 'admin';
export type RelationshipStatus = 'pending' | 'active' | 'paused';
export type InviteType = 'universal' | 'specific';

export interface FitnessProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: FitnessRole;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CoachClient {
  id: string;
  coach_id: string;
  client_id: string;
  status: RelationshipStatus;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  coach_id: string;
  token: string;
  email: string | null;
  invite_type: InviteType;
  is_universal: boolean;
  usage_limit: number | null;
  usage_count: number;
  note: string | null;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
