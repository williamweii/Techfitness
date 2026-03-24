'use client';

import { useState, useEffect } from 'react';
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
  },
  {
    id: 'goal' as const,
    title: '您的主要目標？',
    subtitle: '我們將為您客製化訓練與飲食計畫',
    options: [
      { value: 'fat_loss', emoji: '📉', label: '減脂', desc: '燃燒脂肪，雕塑體型' },
      { value: 'muscle_gain', emoji: '💪', label: '增肌', desc: '增加肌肉量，提升力量' },
      { value: 'maintenance', emoji: '🏃', label: '維持健康', desc: '保持體態，維持體能' },
      { value: 'sport', emoji: '🏆', label: '運動備賽', desc: '專項訓練，提升競技表現' },
    ],
    skipIf: (a: Answers) => a.role === 'coach',
  },
  {
    id: 'weekly_frequency' as const,
    title: '每週打算訓練幾天？',
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
      { value: 'studio', emoji: '🏢', label: '工作室 / 連鎖駐點', desc: '固定場地教學' },
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
  const progress = Math.round(((stepIndex) / totalSteps) * 100);
  const selected = currentStep ? answers[currentStep.id] : undefined;

  const handleSelect = (value: string) => {
    if (!currentStep) return;
    setAnswers(prev => ({ ...prev, [currentStep.id]: value }));
  };

  const handleNext = async () => {
    if (!selected) return;
    if (isLast) {
      await save();
    } else {
      setStepIndex(i => i + 1);
    }
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0c]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TechFitness
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>步驟 {stepIndex + 1} / {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              animate={{ width: `${Math.max(progress, 6)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h1>
              <p className="text-zinc-400 text-sm">{currentStep.subtitle}</p>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {currentStep.options.map(opt => {
                const isSelected = selected === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left w-full ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 active:border-zinc-500'
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-[15px]">{opt.label}</div>
                      <div className="text-zinc-400 text-sm mt-0.5">{opt.desc}</div>
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

            <div className="flex gap-3">
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!selected || saving}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[15px] transition-all ${
                  selected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 active:scale-[0.98]'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {saving ? '儲存中...' : isLast ? '完成設定 🚀' : '下一步'}
                {!saving && !isLast && <ChevronRight size={18} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
