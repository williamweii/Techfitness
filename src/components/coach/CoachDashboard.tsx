'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type FitnessProfile, type CoachClient, type Invitation } from '@/lib/supabase';
import { Copy, Check, Link, Users, Clock, UserCheck, Plus, X, ChevronRight } from 'lucide-react';

type ClientWithProfile = CoachClient & { fitness_profiles: FitnessProfile };
type InviteWithUrl = Invitation & { invite_url?: string };

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active:  { label: '訓練中', color: 'bg-green-500/20 text-green-400' },
  pending: { label: '待確認', color: 'bg-yellow-500/20 text-yellow-400' },
  paused:  { label: '暫停中', color: 'bg-gray-500/20 text-gray-400' },
};

export default function CoachDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [invitations, setInvitations] = useState<InviteWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Invite form state
  const [isUniversal, setIsUniversal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [inviteNote, setInviteNote] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [clientsRes, invitesRes] = await Promise.all([
      supabase
        .from('coach_clients')
        .select('*, fitness_profiles!client_id(*)')
        .eq('coach_id', session.user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('invitations')
        .select('*')
        .eq('coach_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (clientsRes.data) setClients(clientsRes.data as any);
    if (invitesRes.data) {
      const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setInvitations(invitesRes.data.map(inv => ({
        ...inv,
        invite_url: `${base}/invite/${inv.token}`,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createInvite = async () => {
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch('/api/invitations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({
        email: isUniversal ? null : inviteEmail || null,
        is_universal: isUniversal,
        usage_limit: isUniversal && usageLimit ? Number(usageLimit) : null,
        note: inviteNote || null,
      }),
    });

    if (res.ok) {
      setShowInviteModal(false);
      setInviteEmail(''); setInviteNote(''); setUsageLimit(''); setIsUniversal(false);
      loadData();
    }
    setCreating(false);
  };

  const stats = {
    active: clients.filter(c => c.status === 'active').length,
    pending: clients.filter(c => c.status === 'pending').length,
    total: clients.length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '總學員', value: stats.total, icon: <Users size={20} />, color: 'text-purple-400' },
          { label: '訓練中', value: stats.active, icon: <UserCheck size={20} />, color: 'text-green-400' },
          { label: '待確認', value: stats.pending, icon: <Clock size={20} />, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Client List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-white">學員名單</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} /> 邀請學員
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">尚無學員，點「邀請學員」產生連結</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {clients.map(c => {
              const profile = c.fitness_profiles;
              const badge = STATUS_BADGE[c.status];
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/coach/clients/${c.client_id}`)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{profile?.name || '未命名'}</div>
                    <div className="text-xs text-gray-400 truncate">{profile?.email}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${badge.color}`}>
                    {badge.label}
                  </span>
                  <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Invite Links */}
      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-white flex items-center gap-2"><Link size={16} /> 有效邀請連結</h3>
          </div>
          <div className="divide-y divide-white/5">
            {invitations.filter(i => i.status === 'pending').map(inv => (
              <div key={inv.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.is_universal ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {inv.is_universal ? '通用連結' : '專屬連結'}
                      </span>
                      {inv.usage_limit && (
                        <span className="text-xs text-gray-400">{inv.usage_count}/{inv.usage_limit} 人</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{inv.invite_url}</p>
                    {inv.note && <p className="text-xs text-gray-400 mt-1 italic">備註：{inv.note}</p>}
                  </div>
                  <button
                    onClick={() => copyToClipboard(inv.invite_url!, inv.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    {copiedId === inv.id ? <><Check size={12} /> 已複製</> : <><Copy size={12} /> 複製</>}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  到期：{new Date(inv.expires_at).toLocaleDateString('zh-TW')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">建立邀請連結</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Universal vs Specific toggle */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                onClick={() => setIsUniversal(false)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${!isUniversal ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
              >
                🎯 專屬連結<br/>
                <span className="text-xs font-normal opacity-70">點了直接綁定</span>
              </button>
              <button
                onClick={() => setIsUniversal(true)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${isUniversal ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
              >
                🌐 通用連結<br/>
                <span className="text-xs font-normal opacity-70">放 IG 簡介用</span>
              </button>
            </div>

            {!isUniversal && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-1.5 block">學員 Email（選填）</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="student@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                />
              </div>
            )}

            {isUniversal && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-1.5 block">使用次數上限（選填，例如：10）</label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
                  placeholder="留空 = 無上限"
                  min={1}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-1.5 block">備註（選填）</label>
              <input
                type="text"
                value={inviteNote}
                onChange={e => setInviteNote(e.target.value)}
                placeholder="例如：IG 推廣活動"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={createInvite}
                disabled={creating}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                {creating ? '建立中...' : '產生連結'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
