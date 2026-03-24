'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Bell, Shield, Smartphone, CreditCard,
  ChevronRight, HelpCircle, LogOut, RefreshCw
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

  return (
    <main className="min-h-screen text-white overflow-x-hidden pb-32 bg-[#0a0a0c]">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/8 px-4 py-4 flex items-center gap-3">
          <Link href="/profile" className="p-2 -ml-1 rounded-xl hover:bg-white/8 transition-colors">
            <ArrowLeft size={20} className="text-zinc-300" />
          </Link>
          <h1 className="text-xl font-bold tracking-wide">設定</h1>
        </div>

        <div className="p-4 space-y-5">

          {/* User card */}
          {profile && (
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {(profile.name || profile.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white text-lg truncate">{profile.name || '未設定名稱'}</div>
                <div className="text-zinc-400 text-sm truncate">{profile.email}</div>
                <div className="text-purple-400 text-xs mt-1 font-semibold">
                  {profile.role === 'coach' ? '👨‍🏫 教練' : profile.role === 'admin' ? '🛡️ 管理員' : '🏋️ 學員'}
                </div>
              </div>
            </div>
          )}

          {/* Onboarding Answers (editable) */}
          <Section title="設定引導回答">
            <SettingsRow
              icon={<RefreshCw size={18} />}
              label="重新進行引導設定"
              desc={profile ? `目標：${goalLabel(profile.goal)} · 飲食：${dietLabel(profile.diet_mode)}` : undefined}
              onClick={() => router.push('/onboarding')}
              accent
            />
          </Section>

          {/* Account */}
          <Section title="帳戶設定">
            <SettingsRow icon={<User size={18} />} label="個人資料" onClick={() => router.push('/profile')} hasBorder />
            <SettingsRow icon={<CreditCard size={18} />} label="訂閱管理" badge="Premium" onClick={() => alert('訂閱頁面即將開放')} hasBorder />
            <SettingsRow icon={<Shield size={18} />} label="隱私與安全性" onClick={() => alert('隱私頁面即將開放')} />
          </Section>

          {/* App */}
          <Section title="應用程式">
            <SettingsRow icon={<Bell size={18} />} label="通知設定" onClick={() => alert('通知設定即將開放')} hasBorder />
            <SettingsRow icon={<Smartphone size={18} />} label="外觀主題" badge="系統預設" onClick={() => alert('外觀設定即將開放')} hasBorder />
            <SettingsRow icon={<HelpCircle size={18} />} label="幫助與支援" onClick={() => alert('幫助中心即將開放')} />
          </Section>

          {/* Danger */}
          <Section>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-4 hover:bg-red-500/5 transition-colors text-red-400"
            >
              <div className="p-2 bg-red-500/10 rounded-xl">
                <LogOut size={18} />
              </div>
              <span className="font-semibold text-[15px]">登出帳號</span>
            </button>
          </Section>

          <div className="flex flex-col items-center justify-center pt-4 pb-2 opacity-40">
            <p className="text-xs font-semibold tracking-widest uppercase">TechFitness</p>
            <p className="text-[10px] mt-1">v2.1.0</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && (
        <h2 className="text-[11px] font-bold text-purple-400 uppercase tracking-widest mb-2 pl-1">{title}</h2>
      )}
      <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/8 rounded-2xl overflow-hidden">
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
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left ${hasBorder ? 'border-b border-white/6' : ''}`}
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${accent ? 'bg-purple-500/15 text-purple-400' : 'bg-white/6 text-zinc-400'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-[15px] ${accent ? 'text-purple-300' : 'text-zinc-100'}`}>{label}</div>
        {desc && <div className="text-xs text-zinc-500 mt-0.5 truncate">{desc}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge && <span className="text-xs text-zinc-500 font-medium">{badge}</span>}
        <ChevronRight size={16} className="text-zinc-600" />
      </div>
    </button>
  );
}
