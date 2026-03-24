'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Bell, Shield, Smartphone, CreditCard,
  ChevronRight, HelpCircle, LogOut, RefreshCw, Dumbbell, Palette
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase.from('fitness_profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const goalLabel = (g: string | null) => {
    const map: Record<string, string> = {
      fat_loss: '減脂', muscle_gain: '增肌', maintenance: '維持健康', sport: '備賽',
    };
    return g ? (map[g] || g) : '未設定';
  };

  const dietLabel = (d: string | null) => {
    const map: Record<string, string> = {
      strict: '嚴格計算', fasting: '間歇性斷食', none: '自由飲食',
    };
    return d ? (map[d] || d) : '未設定';
  };

  const isCoach = profile?.role === 'coach';

  return (
    <main className="min-h-screen text-white overflow-x-hidden bg-[#0a0a0c]">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative pb-32">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-5 py-4 flex items-center gap-3">
          <Link href="/profile" className="p-2 -ml-1 rounded-xl hover:bg-white/8 transition-colors">
            <ArrowLeft size={20} className="text-zinc-300" />
          </Link>
          <h1 className="text-xl font-bold tracking-wide flex-1">設定</h1>
          {isCoach && (
            <button
              onClick={() => router.push('/workout')}
              className="flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-purple-500/25 transition-colors"
            >
              <Dumbbell size={13} />
              學員模式
            </button>
          )}
        </div>

        <div className="p-5 space-y-6">

          {/* Hero Profile Card */}
          {profile && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-white/10 p-5 backdrop-blur-xl shadow-xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                    {(profile.name || profile.email || '?')[0].toUpperCase()}
                  </div>
                  {isCoach && (
                    <span className="absolute -bottom-1 -right-1 text-sm">👨‍🏫</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-lg truncate">{profile.name || '未設定名稱'}</div>
                  <div className="text-zinc-400 text-sm truncate">{profile.email}</div>
                  <div className={`text-xs mt-1.5 font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${isCoach ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'bg-purple-500/15 text-purple-300 border border-purple-500/25'}`}>
                    {isCoach ? '👨‍🏫 教練帳號' : profile.role === 'admin' ? '🛡️ 管理員' : '🏋️ 學員'}
                  </div>
                </div>
              </div>

              {/* Onboarding answers quick summary */}
              <div className="relative mt-4 pt-4 border-t border-white/8 grid grid-cols-2 gap-3">
                <InfoTile label="目標" value={goalLabel(profile.goal)} color="text-amber-300" />
                <InfoTile label="飲食模式" value={dietLabel(profile.diet_mode)} color="text-emerald-300" />
                <InfoTile label="訓練頻率" value={profile.weekly_frequency ? `${profile.weekly_frequency}天/週` : '未設定'} color="text-sky-300" />
                <InfoTile label="身分" value={isCoach ? '教練' : '學員'} color="text-purple-300" />
              </div>
            </div>
          )}

          {/* Coach Mode Banner (if coach) */}
          {isCoach && (
            <div
              className="flex items-center gap-3 bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-500/25 rounded-2xl p-4 cursor-pointer hover:border-amber-500/40 transition-colors"
              onClick={() => router.push('/workout')}
            >
              <div className="p-2.5 bg-amber-500/15 rounded-xl">
                <Dumbbell size={20} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-amber-200">切換至學員模式</div>
                <div className="text-xs text-zinc-500 mt-0.5">使用飲食追蹤、訓練記錄等一般功能</div>
              </div>
              <ChevronRight size={16} className="text-zinc-500" />
            </div>
          )}

          {/* Onboarding */}
          <Section title="引導設定">
            <SettingsRow
              icon={<RefreshCw size={17} />}
              label="重新進行引導設定"
              desc={profile ? `目標：${goalLabel(profile.goal)} · 飲食：${dietLabel(profile.diet_mode)}` : undefined}
              onClick={() => router.push('/onboarding')}
              accent
            />
          </Section>

          {/* Account */}
          <Section title="帳戶">
            <SettingsRow icon={<User size={17} />} label="個人資料" onClick={() => router.push('/profile')} hasBorder />
            <SettingsRow icon={<CreditCard size={17} />} label="訂閱管理" badge="Premium" onClick={() => alert('訂閱頁面即將開放')} hasBorder />
            <SettingsRow icon={<Shield size={17} />} label="隱私與安全性" onClick={() => alert('隱私頁面即將開放')} />
          </Section>

          {/* App */}
          <Section title="應用程式">
            <SettingsRow icon={<Bell size={17} />} label="通知設定" onClick={() => alert('通知設定即將開放')} hasBorder />
            <SettingsRow icon={<Palette size={17} />} label="外觀主題" badge="系統預設" onClick={() => alert('外觀設定即將開放')} hasBorder />
            <SettingsRow icon={<HelpCircle size={17} />} label="幫助與支援" onClick={() => alert('幫助中心即將開放')} />
          </Section>

          {/* Danger zone */}
          <Section>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-500/8 active:bg-red-500/15 transition-colors text-left rounded-2xl"
            >
              <div className="p-2 bg-red-500/12 rounded-xl text-red-400">
                <LogOut size={17} />
              </div>
              <span className="font-semibold text-[15px] text-red-400">登出帳號</span>
            </button>
          </Section>

          <div className="flex flex-col items-center justify-center pt-2 pb-4 opacity-30">
            <p className="text-xs font-bold tracking-widest uppercase">TechFitness</p>
            <p className="text-[10px] mt-0.5">v2.1.0</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/4 rounded-xl px-3 py-2">
      <div className="text-[10px] text-zinc-500 font-medium mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color} truncate`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && (
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 pl-1">{title}</h2>
      )}
      <div className="bg-zinc-900/70 backdrop-blur-sm border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/6">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  icon, label, desc, badge, onClick, hasBorder, accent,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  badge?: string;
  onClick?: () => void;
  hasBorder?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${accent ? 'bg-purple-500/15 text-purple-400' : 'bg-white/6 text-zinc-400'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-[15px] ${accent ? 'text-purple-300' : 'text-zinc-100'}`}>{label}</div>
        {desc && <div className="text-xs text-zinc-500 mt-0.5 truncate">{desc}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge && <span className="text-xs text-zinc-500 font-medium bg-white/5 px-2 py-0.5 rounded-full">{badge}</span>}
        <ChevronRight size={15} className="text-zinc-600" />
      </div>
    </button>
  );
}
