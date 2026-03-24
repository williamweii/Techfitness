'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Scale, Flame, Dumbbell, Plus, Check } from 'lucide-react';

type Props = { clientId?: string };

export default function MetricsForm({ clientId }: Props) {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const uid = clientId || session.user.id;
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('client_metrics')
      .upsert({
        client_id: uid,
        recorded_at: today,
        weight_kg:    weight   ? parseFloat(weight)   : null,
        body_fat_pct: bodyFat  ? parseFloat(bodyFat)  : null,
        muscle_kg:    muscle   ? parseFloat(muscle)   : null,
        note:         note     || null,
      }, { onConflict: 'client_id,recorded_at' });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-5 space-y-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
        <div className="p-1.5 bg-purple-500/20 rounded-lg">
          <Scale size={16} className="text-purple-400" />
        </div>
        今日量測紀錄
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: '體重 (kg)', val: weight, set: setWeight, icon: <Scale size={14} className="text-purple-400" />, ph: '70.5' },
          { label: '體脂率 (%)', val: bodyFat, set: setBodyFat, icon: <Flame size={14} className="text-orange-400" />, ph: '18.5' },
          { label: '肌肉量 (kg)', val: muscle, set: setMuscle, icon: <Dumbbell size={14} className="text-green-400" />, ph: '52.0' },
        ].map(f => (
          <div key={f.label} className="relative group">
            <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5 pl-1 font-medium tracking-wide">
              {f.icon}{f.label}
            </label>
            <input
              type="number"
              value={f.val}
              onChange={e => f.set(e.target.value)}
              placeholder={f.ph}
              step="0.1"
              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 focus:bg-purple-500/10 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
            />
          </div>
        ))}
      </div>

      <div className="relative group">
        <label className="text-xs text-zinc-400 mb-1.5 pl-1 block font-medium tracking-wide">備註（選填）</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="例如：早上空腹量測、重訓後量測"
          className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 focus:bg-purple-500/10 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || (!weight && !bodyFat && !muscle)}
        className="w-full relative group overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(192,38,211,0.2)] hover:shadow-[0_0_25px_rgba(192,38,211,0.4)]"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        <span className="relative flex items-center gap-2">
          {saved ? <><Check size={16} /> 已儲存成功！</> : saving ? '儲存中...' : <><Plus size={16} /> 記錄今日數據</>}
        </span>
      </button>
    </div>
  );
}
