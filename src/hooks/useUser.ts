'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, FitnessProfile } from '@/lib/supabase';

export interface UseUserReturn {
  user: User | null;
  profile: FitnessProfile | null;
  isPremium: boolean;
  isCoach: boolean;
  loading: boolean;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load(userId: string) {
      const { data } = await supabase
        .from('fitness_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (mounted) setProfile(data ?? null);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) load(u.id).finally(() => { if (mounted) setLoading(false); });
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) load(u.id);
      else setProfile(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    isPremium: profile?.is_premium ?? false,
    isCoach: profile?.role === 'coach',
    loading,
  };
}
