'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type FitnessProfile, type CoachClient } from '@/lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  ArrowLeft, Activity, Scale, Flame, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';

type ClientMetric = {
  id: string;
  client_id: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_kg: number | null;
  bmi: number | null;
  note: string | null;
};

type ActivityLog = {
  id: string;
  client_id: string;
  activity_type: 'workout' | 'meal' | 'check_in';
  logged_at: string;
  metadata: Record<string, unknown>;
};

type ClientDetail = CoachClient & {
  fitness_profiles: FitnessProfile;
};

// Traffic light: checks last 7 days of activity
function getClientStatus(activity: ActivityLog[]) {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const recent = activity.filter(a => new Date(a.logged_at) > threeDaysAgo);

  if (recent.length === 0) return { color: 'red', label: '超過3天無紀錄', icon: AlertTriangle };
  if (recent.length >= 3) return { color: 'green', label: '本週積極活躍', icon: CheckCircle2 };
  return { color: 'yellow', label: '活躍度偏低', icon: Clock };
}

const CHART_COLORS = { weight: '#a855f7', bodyFat: '#f97316' };

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [metrics, setMetrics] = useState<ClientMetric[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'weight' | 'bodyFat'>('weight');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }

      const [clientRes, metricsRes, activityRes] = await Promise.all([
        supabase
          .from('coach_clients')
          .select('*, fitness_profiles!client_id(*)')
          .eq('coach_id', session.user.id)
          .eq('client_id', clientId)
          .single(),
        supabase
          .from('client_metrics')
          .select('*')
          .eq('client_id', clientId)
          .order('recorded_at', { ascending: true })
          .limit(30),
        supabase
          .from('client_activity_log')
          .select('*')
          .eq('client_id', clientId)
          .order('logged_at', { ascending: false })
          .limit(20),
      ]);

      if (clientRes.data) setClient(clientRes.data as any);
      if (metricsRes.data) setMetrics(metricsRes.data);
      if (activityRes.data) setActivity(activityRes.data as any);
      setLoading(false);
    };
    load();
  }, [clientId, router]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
      <p className="text-gray-400">找不到學員資料</p>
      <button onClick={() => router.back()} className="mt-4 text-purple-400 underline text-sm">返回</button>
    </div>
  );

  const profile = client.fitness_profiles;
  const trafficLight = getClientStatus(activity);
  const TrafficIcon = trafficLight.icon;

  const chartData = metrics.map(m => ({
    date: new Date(m.recorded_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
    weight: m.weight_kg,
    bodyFat: m.body_fat_pct,
  }));

  const latestMetric = metrics[metrics.length - 1];

  const trafficColorMap = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  const activityIcons: Record<string, string> = {
    workout: '💪',
    meal: '🥗',
    check_in: '✅',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-bold text-white leading-tight">{profile?.name || '未命名'}</div>
            <div className="text-xs text-gray-400">{profile?.email}</div>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${trafficColorMap[trafficLight.color as keyof typeof trafficColorMap]}`}>
          <TrafficIcon size={12} />
          {trafficLight.label}
        </span>
      </div>

      <div className="p-4 space-y-5 max-w-xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '體重', value: latestMetric?.weight_kg ? `${latestMetric.weight_kg} kg` : '—', icon: <Scale size={16} />, color: 'text-purple-400' },
            { label: '體脂率', value: latestMetric?.body_fat_pct ? `${latestMetric.body_fat_pct}%` : '—', icon: <Flame size={16} />, color: 'text-orange-400' },
            { label: '本週活動', value: `${activity.filter(a => new Date(a.logged_at) > new Date(Date.now() - 7 * 86400000)).length} 次`, icon: <Activity size={16} />, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trend Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">趨勢圖表</h3>
            <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setActiveChart('weight')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${activeChart === 'weight' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                體重
              </button>
              <button
                onClick={() => setActiveChart('bodyFat')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${activeChart === 'bodyFat' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                體脂
              </button>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
              學員尚未記錄任何量測數據
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line
                  type="monotone"
                  dataKey={activeChart === 'weight' ? 'weight' : 'bodyFat'}
                  stroke={activeChart === 'weight' ? CHART_COLORS.weight : CHART_COLORS.bodyFat}
                  strokeWidth={2}
                  dot={{ fill: activeChart === 'weight' ? CHART_COLORS.weight : CHART_COLORS.bodyFat, r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-bold text-white text-sm">最近活動</h3>
          </div>
          {activity.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">暫無活動紀錄</div>
          ) : (
            <div className="divide-y divide-white/5">
              {activity.slice(0, 10).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-base">
                    {activityIcons[a.activity_type] || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white capitalize">
                      {a.activity_type === 'workout' ? '訓練' : a.activity_type === 'meal' ? '飲食' : '打卡'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(a.logged_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata from profile */}
        {profile?.metadata && Object.keys(profile.metadata).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="font-bold text-white text-sm mb-3">學員資料</h3>
            <div className="space-y-2">
              {Object.entries(profile.metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="text-white font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
