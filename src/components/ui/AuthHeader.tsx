'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type FitnessProfile } from '@/lib/supabase';
import Link from 'next/link';
import { LogIn, UserCog, Dumbbell } from 'lucide-react';

export default function AuthHeader() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore existing session silently – NO redirect on normal page load
    const restore = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (!currentSession) { setLoading(false); return; }

      const { data } = await supabase
        .from('fitness_profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      if (data) setProfile(data);
      setLoading(false);
    };

    restore();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN') {
        setSession(newSession);
        if (!newSession) return;
        const { data } = await supabase
          .from('fitness_profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single();
        if (data) setProfile(data);
        setLoading(false);
        // Only redirect right after OAuth login
        if (window.location.pathname === '/') {
          const needsOnboarding = !data?.onboarding_completed;
          if (needsOnboarding) { router.push('/onboarding'); return; }
          const isCoach = data?.role === 'coach' || data?.role === 'admin';
          router.push(isCoach ? '/coach' : '/workout');
        }
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (loading) return null;

  if (!session) {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
      >
        <LogIn size={13} /> 登入
      </button>
    );
  }

  const userEmail = profile?.email || session.user.email;
  const userName = profile?.name || session.user.user_metadata?.name || userEmail;
  const isCoach = profile?.role === 'coach' || profile?.role === 'admin';
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
        title={`登出 (${userEmail})`}
      >
        {userName?.[0]?.toUpperCase() || '?'}
      </button>
    </div>
  );
}
