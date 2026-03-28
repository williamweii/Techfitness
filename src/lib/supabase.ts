import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────────────────────────
// Enum types (mirror DB enums)
// ─────────────────────────────────────────────────────────────────────────────
export type FitnessRole = 'coach' | 'client' | 'admin';
export type RelationshipStatus = 'pending' | 'active' | 'paused';
export type InviteType = 'universal' | 'specific';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ─────────────────────────────────────────────────────────────────────────────
// Table row types
// ─────────────────────────────────────────────────────────────────────────────
export interface FitnessProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: FitnessRole;
  is_premium: boolean;
  onboarding_completed: boolean;
  goal: string | null;
  weekly_frequency: string | null;
  diet_mode: string | null;
  coach_type: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NutritionLog {
  id: number;
  user_id: string;
  food_name: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: MealType;
  logged_date: string; // ISO date string YYYY-MM-DD
  created_at: string;
}

export type NutritionLogInsert = Omit<NutritionLog, 'id' | 'created_at'>;

export interface WorkoutLog {
  id: number;
  user_id: string;
  exercise_name: string;
  exercise_group: string;
  weight: number;
  reps: number;
  sets: number;
  session_id: string;
  note: string | null;
  logged_date: string;
  created_at: string;
}

export type WorkoutLogInsert = Omit<WorkoutLog, 'id' | 'created_at'>;

export interface Schedule {
  id: number;
  user_id: string;
  day_of_week: number; // 0=Sun, 1=Mon … 6=Sat
  target_group: string;
  plan_name: string | null;
  remind_time: string | null;
  created_at: string;
}

export type ScheduleUpsert = Omit<Schedule, 'id' | 'created_at'>;

export interface BodyMetric {
  id: string;
  client_id: string;
  recorded_at: string; // ISO date YYYY-MM-DD
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_kg: number | null;
  bmi: number | null;
  note: string | null;
  created_at: string;
}

export type BodyMetricInsert = Omit<BodyMetric, 'id' | 'created_at'>;

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

// ─────────────────────────────────────────────────────────────────────────────
// Helper — today as YYYY-MM-DD in local time
// ─────────────────────────────────────────────────────────────────────────────
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — n days ago as YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
