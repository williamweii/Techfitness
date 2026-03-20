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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
      <h3 className="font-bold text-white text-sm flex items-center gap-2">
        <Scale size={15} className="text-purple-400" /> 今日量測紀錄
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '體重 (kg)', val: weight, set: setWeight, icon: <Scale size={14} className="text-purple-400" />, ph: '70.5' },
          { label: '體脂率 (%)', val: bodyFat, set: setBodyFat, icon: <Flame size={14} className="text-orange-400" />, ph: '18.5' },
          { label: '肌肉量 (kg)', val: muscle, set: setMuscle, icon: <Dumbbell size={14} className="text-green-400" />, ph: '52.0' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs text-gray-400 flex items-center gap-1 mb-1.5">{f.icon}{f.label}</label>
            <input
              type="number"
              value={f.val}
              onChange={e => f.set(e.target.value)}
              placeholder={f.ph}
              step="0.1"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">備註（選填）</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="例如：早上空腹量測"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || (!weight && !bodyFat && !muscle)}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
      >
        {saved ? <><Check size={15} /> 已儲存！</> : saving ? '儲存中...' : <><Plus size={15} /> 記錄今日數據</>}
      </button>
    </div>
  );
}
