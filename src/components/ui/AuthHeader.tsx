'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { LogIn, UserCog, Dumbbell } from 'lucide-react';

export default function AuthHeader() {
  const router = useRouter();
  const { user, profile, loading } = useUser();

  // Narrow subscription: only for post-OAuth redirect.
  // SIGNED_IN fires only on fresh login (not on INITIAL_SESSION / page reload),
  // so this never triggers on normal navigation — only after Google OAuth completes.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN') return;
      if (window.location.pathname !== '/') return;
      if (!session) return;

      // Load fresh profile to check onboarding status
      const { data } = await supabase
        .from('fitness_profiles')
        .select('onboarding_completed, role')
        .eq('id', session.user.id)
        .single();

      if (!data?.onboarding_completed) {
        router.push('/onboarding');
      } else {
        const isCoach = data?.role === 'coach' || data?.role === 'admin';
        router.push(isCoach ? '/coach' : '/workout');
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
    router.push('/');
  };

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
      >
        <LogIn size={13} /> 登入
      </button>
    );
  }

  const userEmail = profile?.email || user.email;
  const userName = profile?.name || user.user_metadata?.name || userEmail;
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
