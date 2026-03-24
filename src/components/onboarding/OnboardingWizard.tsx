'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Answers = {
  role?: string;
  goal?: string;
  weekly_frequency?: string;
  diet_mode?: string;
  coach_type?: string;
};

const STEPS = [
  {
    id: 'role' as const,
    title: '您的身分是？',
    subtitle: '幫助我們為您打造最適合的體驗',
    options: [
      { value: 'client', emoji: '🏋️', label: '學員 / 自由訓練', desc: '個人健身、訓練計畫追蹤' },
      { value: 'coach', emoji: '👨‍🏫', label: '我是教練', desc: '管理學員課表與排程' },
    ],
    skipIf: undefined as undefined | ((a: Answers) => boolean),
  },
  {
    id: 'goal' as const,
    title: '您的主要目標？',
    subtitle: '我們將為您客製化訓練與飲食計畫',
    options: [
      { value: 'fat_loss', emoji: '📉', label: '減脂', desc: '燃燒脂肪，雕塑體型' },
      { value: 'muscle_gain', emoji: '💪', label: '增肌', desc: '增加肌肉量，提升力量' },
      { value: 'maintenance', emoji: '🏃', label: '維持健康', desc: '保持體態，維持體能' },
      { value: 'sport', emoji: '🏆', label: '備賽', desc: '專項訓練，提升競技表現' },
    ],
    skipIf: (a: Answers) => a.role === 'coach',
  },
  {
    id: 'weekly_frequency' as const,
    title: '每週訓練幾天？',
    subtitle: '我們會根據頻率幫您安排合適的菜單',
    options: [
      { value: '1-2', emoji: '🌱', label: '1–2 天', desc: '輕鬆入門' },
      { value: '3-4', emoji: '🔥', label: '3–4 天', desc: '規律訓練' },
      { value: '5+', emoji: '⚡', label: '5 天以上', desc: '高強度衝刺' },
    ],
    skipIf: (a: Answers) => a.role === 'coach',
  },
  {
    id: 'diet_mode' as const,
    title: '飲食追蹤方式？',
    subtitle: '選擇最適合您的飲食管理模式',
    options: [
      { value: 'strict', emoji: '⚖️', label: '嚴格計算', desc: '追蹤卡路里與三大營養素' },
      { value: 'fasting', emoji: '⏱️', label: '間歇性斷食', desc: '168 斷食，不嚴格算卡' },
      { value: 'none', emoji: '🧘', label: '自由飲食', desc: '只專注訓練，不紀錄飲食' },
    ],
    skipIf: (a: Answers) => a.role === 'coach',
  },
  {
    id: 'coach_type' as const,
    title: '您的教學模式？',
    subtitle: '幫助我們設定您的後台功能',
    options: [
      { value: 'studio', emoji: '🏢', label: '工作室 / 複合館', desc: '固定場地教學' },
      { value: 'freelance', emoji: '🚗', label: '自由跑點', desc: '多地點移動教學' },
      { value: 'online', emoji: '💻', label: '純線上課表', desc: '遠距課表規劃' },
    ],
    skipIf: (a: Answers) => a.role !== 'coach',
  },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const visibleSteps = STEPS.filter(s => !s.skipIf || !s.skipIf(answers));
  const currentStep = visibleSteps[stepIndex];
  const totalSteps = visibleSteps.length;
  const isLast = stepIndex === totalSteps - 1;
  const progress = (stepIndex / totalSteps) * 100;
  const selected = currentStep ? answers[currentStep.id] : undefined;

  const handleSelect = (value: string) => {
    if (!currentStep) return;
    setAnswers(prev => ({ ...prev, [currentStep.id]: value }));
  };

  const handleNext = async () => {
    if (!selected) return;
    if (isLast) await save();
    else setStepIndex(i => i + 1);
  };

  const handleBack = () => setStepIndex(i => Math.max(0, i - 1));

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/'); return; }
    await supabase.from('fitness_profiles').update({
      role: answers.role === 'coach' ? 'coach' : 'client',
      goal: answers.goal || null,
      weekly_frequency: answers.weekly_frequency || null,
      diet_mode: answers.diet_mode || null,
      coach_type: answers.coach_type || null,
      onboarding_completed: true,
    }).eq('id', session.user.id);
    router.push(answers.role === 'coach' ? '/coach' : '/workout');
  };

  if (!currentStep) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-[#0a0a0c] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Brand */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
            TechFitness
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>步驟 {stepIndex + 1} / {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              animate={{ width: `${Math.max(progress, 5)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
          >
            {/* Frosted glass question card */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/8 rounded-3xl p-6 mb-5 shadow-xl">
              <h1 className="text-2xl font-bold text-white mb-1 leading-tight">{currentStep.title}</h1>
              <p className="text-zinc-400 text-sm">{currentStep.subtitle}</p>
            </div>

            {/* Options as pill/card buttons */}
            <div className="flex flex-col gap-3 mb-6">
              {currentStep.options.map(opt => {
                const isSelected = selected === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left w-full transition-all duration-150 ${
                      isSelected
                        ? 'border-purple-500/80 bg-purple-500/15 backdrop-blur-md shadow-lg shadow-purple-900/30'
                        : 'border-white/8 bg-zinc-800/60 backdrop-blur-sm hover:border-white/20'
                    }`}
                  >
                    <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-[17px] leading-snug ${isSelected ? 'text-purple-200' : 'text-zinc-100'}`}>
                        {opt.label}
                      </div>
                      <div className="text-zinc-400 text-sm mt-0.5 leading-snug">{opt.desc}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-purple-500 border-purple-500' : 'border-zinc-600'
                    }`}>
                      {isSelected && <Check size={13} className="text-white" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Nav buttons */}
            <div className="flex gap-3">
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center w-14 h-14 rounded-2xl border border-zinc-700/80 text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!selected || saving}
                className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-[16px] transition-all duration-150 ${
                  selected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40 hover:opacity-90 active:scale-[0.98]'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {saving ? '儲存中...' : isLast ? '完成設定 🚀' : '下一步'}
                {!saving && !isLast && <ChevronRight size={20} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
