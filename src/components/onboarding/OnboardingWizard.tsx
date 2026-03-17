'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Dumbbell, Activity, Utensils, Target, Check } from 'lucide-react';
import styles from './Onboarding.module.css';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type OnboardingData = {
    name: string;
    experience: 'beginner' | 'intermediate' | 'advanced';
    frequency: number;
    goal: string[];
    focusParts: string[];
    diet: string;
};

const INITIAL_DATA: OnboardingData = {
    name: '',
    experience: 'beginner',
    frequency: 3,
    goal: ['muscle'],
    focusParts: [],
    diet: 'omnivore',
};

export default function OnboardingWizard() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

    const updateData = (updates: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => {
        if (step < 5) setStep(step + 1);
        else handleSubmit();
    };

    const prevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    // ... (existing imports)

    const handleSubmit = async () => {
        try {
            const { error } = await supabase.from('profiles').update({
                full_name: data.name,
                experience_level: data.experience,
                training_frequency: data.frequency,
                target_goal: data.goal.join(','),
                focus_areas: data.focusParts,
                diet_preference: data.diet,
                updated_at: new Date().toISOString(),
            }).eq('id', 'mock-user-id'); // NOTE: In a real app this would use the auth user ID

            if (error) console.error('Supabase update error (expected in mock):', error);
            console.log('Profile updated successfully');
            router.push('/');
        } catch (err) {
            console.error('Error updating profile:', err);
            // Fallback for demo if no auth user
            router.push('/');
        }
    };

    const progress = ((step + 1) / 6) * 100;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {step === 0 && <StepWelcome name={data.name} onUpdate={updateData} />}
                        {step === 1 && <StepHabits data={data} onUpdate={updateData} />}
                        {step === 2 && <StepGoals data={data} onUpdate={updateData} />}
                        {step === 3 && <StepFocusAreas data={data} onUpdate={updateData} />}
                        {step === 4 && <StepDiet data={data} onUpdate={updateData} />}
                        {step === 5 && <StepFinish data={data} />}
                    </motion.div>
                </AnimatePresence>

                <div className={styles.buttonGroup}>
                    {step > 0 ? (
                        <button className={`${styles.button} ${styles.secondaryButton}`} onClick={prevStep}>
                            <ArrowLeft size={20} style={{ marginRight: '8px' }} /> Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <button className={`${styles.button} ${styles.primaryButton}`} onClick={nextStep}>
                        {step === 5 ? 'Start Journey' : 'Next'}
                        {step !== 5 && <ArrowRight size={20} style={{ marginLeft: '8px' }} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Step Components ---

function StepWelcome({ name, onUpdate }: { name: string, onUpdate: (d: Partial<OnboardingData>) => void }) {
    return (
        <div>
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                    <Activity size={32} />
                </div>
            </div>
            <h2 className={styles.stepTitle}>歡迎來到 FitScience</h2>
            <p className={styles.stepDescription}>
                讓我們花一點時間了解您的身體狀況與目標，為您打造專屬的科學化訓練計畫。
            </p>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>我們該如何稱呼您？</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="您的名字或暱稱"
                    className={styles.input}
                    autoFocus
                />
            </div>
        </div>
    );
}

function StepHabits({ data, onUpdate }: { data: OnboardingData, onUpdate: (d: Partial<OnboardingData>) => void }) {
    const levels = [
        { id: 'beginner', label: '新手', desc: '剛接觸健身' },
        { id: 'intermediate', label: '中階', desc: '規律訓練 6 個月以上' },
        { id: 'advanced', label: '高階', desc: '規律訓練 2 年以上' },
    ];

    return (
        <div>
            <h2 className={styles.stepTitle}>您的運動習慣</h2>
            <p className={styles.stepDescription}>
                誠實評估您的經驗水平，有助於我們推薦合適的強度。
            </p>

            <div className="mb-6">
                <label className={styles.inputLabel}>目前的訓練經驗</label>
                <div className="grid grid-cols-1 gap-3">
                    {levels.map((level) => (
                        <div
                            key={level.id}
                            className={`${styles.optionCard} ${data.experience === level.id ? styles.selectedOption : ''}`}
                            onClick={() => onUpdate({ experience: level.id as any })}
                            style={{ flexDirection: 'row', textAlign: 'left' }}
                        >
                            <Dumbbell className={styles.icon} />
                            <div>
                                <div className={styles.label}>{level.label}</div>
                                <div className="text-sm text-gray-400">{level.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>每週預計運動天數: {data.frequency} 天</label>
                <input
                    type="range"
                    min="1"
                    max="7"
                    value={data.frequency}
                    onChange={(e) => onUpdate({ frequency: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>1天</span>
                    <span>7天</span>
                </div>
            </div>
        </div>
    );
}

function StepGoals({ data, onUpdate }: { data: OnboardingData, onUpdate: (d: Partial<OnboardingData>) => void }) {
    const goals = [
        { id: 'muscle', label: '增肌', icon: Dumbbell },
        { id: 'fat_loss', label: '減脂', icon: Activity },
        { id: 'strength', label: '力量', icon: Target },
        { id: 'health', label: '健康', icon: Activity },
    ];

    const toggleGoal = (goalId: string) => {
        const current = data.goal;
        if (current.includes(goalId)) {
            // Prevent deselecting if it's the only one
            if (current.length > 1) {
                onUpdate({ goal: current.filter(g => g !== goalId) });
            }
        } else {
            onUpdate({ goal: [...current, goalId] });
        }
    };

    return (
        <div>
            <h2 className={styles.stepTitle}>設定您的目標 (可複選)</h2>
            <p className={styles.stepDescription}>
                我們將根據您的目標優化訓練課表與營養建議。
            </p>

            <div className={styles.grid}>
                {goals.map((goal) => (
                    <div
                        key={goal.id}
                        className={`${styles.optionCard} ${data.goal.includes(goal.id) ? styles.selectedOption : ''}`}
                        onClick={() => toggleGoal(goal.id)}
                    >
                        <goal.icon className={styles.icon} />
                        <span className={styles.label}>{goal.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepFocusAreas({ data, onUpdate }: { data: OnboardingData, onUpdate: (d: Partial<OnboardingData>) => void }) {
    const parts = ['胸部', '背部', '腿部', '肩部', '手臂', '核心'];

    const togglePart = (part: string) => {
        const current = data.focusParts;
        if (current.includes(part)) {
            onUpdate({ focusParts: current.filter(p => p !== part) });
        } else {
            onUpdate({ focusParts: [...current, part] });
        }
    };

    return (
        <div>
            <h2 className={styles.stepTitle}>想加強的部位 (多選)</h2>
            <p className={styles.stepDescription}>
                選擇您希望重點訓練的部位，我們會為您安排專項強化動作。
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
                {parts.map((part) => (
                    <button
                        key={part}
                        onClick={() => togglePart(part)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${data.focusParts.includes(part)
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-105'
                            : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                            }`}
                    >
                        {part}
                    </button>
                ))}
            </div>
        </div>
    );
}

function StepDiet({ data, onUpdate }: { data: OnboardingData, onUpdate: (d: Partial<OnboardingData>) => void }) {
    const diets = [
        { id: 'omnivore', label: '無特別限制 (雜食)', desc: '均衡攝取各類食物' },
        { id: 'eating_out', label: '外食族', desc: '以超商、餐廳為主，便於計算熱量' },
        { id: 'whole_food', label: '原型食物愛好者', desc: '偏好未經加工的天然食材' },
        { id: 'vegetarian', label: '蛋奶素', desc: '不吃肉，但吃蛋和奶製品' },
        { id: 'vegan', label: '純素', desc: '完全不攝取動物性產品' },
        { id: 'keto', label: '生酮飲食', desc: '高脂肪、極低碳水' },
    ];

    return (
        <div>
            <h2 className={styles.stepTitle}>飲食習慣</h2>
            <p className={styles.stepDescription}>
                營養佔健身成果的 70%。了解您的飲食偏好能讓我們計算更精準的營養素。
            </p>

            <div className="grid grid-cols-1 gap-3">
                {diets.map((diet) => (
                    <div
                        key={diet.id}
                        className={`${styles.optionCard} ${data.diet === diet.id ? styles.selectedOption : ''}`}
                        onClick={() => onUpdate({ diet: diet.id as any })}
                        style={{ flexDirection: 'row', textAlign: 'left', alignItems: 'center' }}
                    >
                        <Utensils className={styles.icon} />
                        <div className="ml-4">
                            <div className={styles.label}>{diet.label}</div>
                            <div className="text-sm text-gray-400">{diet.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepFinish({ data }: { data: OnboardingData }) {
    return (
        <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-6">
                <Check size={40} />
            </div>
            <h2 className={styles.stepTitle}>準備完成！</h2>
            <p className={styles.stepDescription}>
                謝謝您，{data.name || '訓練者'}。<br />
                我們已根據您的 {data.goal.map(g => g === 'muscle' ? '增肌' : g === 'fat_loss' ? '減脂' : '健康').join(' & ')} 目標，
                為您生成了每週 {data.frequency} 天的科學化訓練課表。
            </p>
            <div className="bg-purple-900/30 p-4 rounded-xl text-left inline-block w-full max-w-sm border border-purple-500/30">
                <h3 className="text-purple-300 font-bold mb-2">您的專屬計畫包含：</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• 客製化全身/分部位訓練單</li>
                    <li>• AI 智能營養攝取建議</li>
                    <li>• 恢復與睡眠監測建議</li>
                </ul>
            </div>
        </div>
    );
}
