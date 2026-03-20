'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type FitnessProfile } from '@/lib/supabase';
import Link from 'next/link';
import { LogIn, UserCog, Dumbbell } from 'lucide-react';

export default function AuthHeader() {
  const router = useRouter();
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from('fitness_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  if (loading) return null;

  if (!profile) {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
      >
        <LogIn size={13} /> 登入
      </button>
    );
  }

  const isCoach = profile.role === 'coach' || profile.role === 'admin';
  const dashboardHref = isCoach ? '/coach' : '/workout';
  const dashboardLabel = isCoach ? '教練後台' : '我的訓練';
  const DashIcon = isCoach ? UserCog : Dumbbell;

  return (
    <div className="flex items-center gap-2">
      {/* Role shortcut */}
      <Link
        href={dashboardHref}
        className="flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-500/30 transition-colors"
      >
        <DashIcon size={13} /> {dashboardLabel}
      </Link>
      {/* Avatar + sign out */}
      <button
        onClick={handleSignOut}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs hover:opacity-80 transition-opacity"
        title={`登出 (${profile.email})`}
      >
        {profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || '?'}
      </button>
    </div>
  );
}
