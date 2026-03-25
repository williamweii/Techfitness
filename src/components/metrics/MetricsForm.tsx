'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Scale, Flame, Dumbbell, Plus, Check, X } from 'lucide-react';

type Props = { clientId?: string };

export default function MetricsForm({ clientId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
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
      setTimeout(() => {
        setSaved(false);
        setIsOpen(false);
      }, 1000);
    }
  };

  const hasDragged = useRef(false);

  return (
    <>
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => { hasDragged.current = false; }}
        onDrag={() => { hasDragged.current = true; }}
        onClick={() => { if (!hasDragged.current) setIsOpen(true); }}
        className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(192,38,211,0.4)] z-[90] text-white cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.08 }}
      >
        <Plus size={26} />
      </motion.button>

      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-zinc-900 border-t sm:border border-white/10 w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            {/* Grabber for mobile feel */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden pointer-events-none" />
            
            {/* Decorative gradient blur */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative">
              <h3 className="font-bold text-white text-xl flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                  <Scale size={18} className="text-purple-400" />
                </div>
                快記：今日數據
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              {[
                { label: '體重 (kg)', val: weight, set: setWeight, icon: <Scale size={15} className="text-purple-400" />, ph: '例如: 70.5' },
                { label: '體脂率 (%)', val: bodyFat, set: setBodyFat, icon: <Flame size={15} className="text-orange-400" />, ph: '例如: 18.5' },
                { label: '肌肉量 (kg)', val: muscle, set: setMuscle, icon: <Dumbbell size={15} className="text-green-400" />, ph: '例如: 52.0' },
              ].map(f => (
                <div key={f.label} className="relative group flex items-center bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-1.5 transition-all focus-within:border-purple-500/50 focus-within:bg-purple-500/10 focus-within:ring-4 ring-purple-500/10">
                  <label className="text-sm text-zinc-400 flex items-center gap-2 w-1/3 flex-shrink-0 font-medium tracking-wide">
                    {f.icon}{f.label}
                  </label>
                  <input
                    type="number"
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    step="0.1"
                    className="w-full bg-transparent p-2 text-right text-lg font-bold text-white placeholder-zinc-600 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="relative group mb-6">
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="備註：例如 早上空腹、剛練完腿..."
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500/50 focus:bg-purple-500/10 transition-all"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || (!weight && !bodyFat && !muscle)}
              className="w-full relative group overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(192,38,211,0.2)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center gap-2">
                {saved ? <><Check size={18} /> 紀錄已儲存！</> : saving ? '儲存中...' : <><Check size={18} /> 確認送出</>}
              </span>
            </button>
            <div className="h-6 sm:h-0" /> {/* Extra bottom padding for mobile home bar */}
          </div>
        </div>
      )}
    </>
  );
}
