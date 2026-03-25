"use client";

import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './WorkoutLog.module.css';
import ActiveTimer from './ActiveTimer';
import RollingInput from '../ui/RollingInput';
import GlobalTimer from './GlobalTimer';

interface ExerciseSet {
    id: string;
    weight: number;
    reps: number;
    completed: boolean;
    duration?: number; // Duration in seconds
}

interface Exercise {
    id: string;
    name: string;
    group: string;
    sets: ExerciseSet[];
}

// ─── Default exercises per plan ──────────────────────────────────────────────
const DEFAULT_PLAN_EXERCISES: Record<string, Exercise[]> = {
    '推拉腿 (推日)': [
        { id: 'p-1', name: '啞鈴臥推', group: '胸', sets: [{ id: 'p-1-1', weight: 24, reps: 10, completed: false }, { id: 'p-1-2', weight: 24, reps: 8, completed: false }] },
        { id: 'p-2', name: '啞鈴上胸臥推', group: '胸', sets: [{ id: 'p-2-1', weight: 20, reps: 10, completed: false }] },
    ],
    '推拉腿 (拉日)': [
        { id: 'q-1', name: '滑輪下拉', group: '背', sets: [{ id: 'q-1-1', weight: 55, reps: 10, completed: false }] },
        { id: 'q-2', name: '啞鈴划船', group: '背', sets: [{ id: 'q-2-1', weight: 22, reps: 12, completed: false }] },
    ],
    '推拉腿 (腿日)': [
        { id: 'r-1', name: '深蹲', group: '腿', sets: [{ id: 'r-1-1', weight: 60, reps: 10, completed: false }] },
    ],
};

const STORAGE_PLANS_KEY = 'tf_workout_plans';
const STORAGE_EXERCISES_KEY = 'tf_plan_exercises';
const FREE_EXERCISE_LIMIT = 5;

function loadPlans(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_PLANS_KEY);
        return raw ? JSON.parse(raw) : ['推拉腿 (推日)', '推拉腿 (拉日)', '推拉腿 (腿日)', '全身訓練 A', '全身訓練 B'];
    } catch { return ['推拉腿 (推日)', '推拉腿 (拉日)', '推拉腿 (腿日)', '全身訓練 A', '全身訓練 B']; }
}

function loadPlanExercises(planName: string): Exercise[] {
    try {
        const raw = localStorage.getItem(STORAGE_EXERCISES_KEY);
        const map: Record<string, Exercise[]> = raw ? JSON.parse(raw) : {};
        return map[planName] ?? DEFAULT_PLAN_EXERCISES[planName] ?? [];
    } catch { return DEFAULT_PLAN_EXERCISES[planName] ?? []; }
}

function savePlanExercises(planName: string, exercises: Exercise[]) {
    try {
        const raw = localStorage.getItem(STORAGE_EXERCISES_KEY);
        const map: Record<string, Exercise[]> = raw ? JSON.parse(raw) : {};
        map[planName] = exercises;
        localStorage.setItem(STORAGE_EXERCISES_KEY, JSON.stringify(map));
    } catch { /* noop */ }
}

export default function WorkoutLog() {
    const [plans, setPlans] = useState<string[]>(() => loadPlans());
    const [currentPlanName, setCurrentPlanName] = useState<string>(() => loadPlans()[0]);
    const [exercises, setExercises] = useState<Exercise[]>(() => loadPlanExercises(loadPlans()[0]));

    // Persist plans list
    React.useEffect(() => {
        localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(plans));
    }, [plans]);

    // Persist exercises for current plan on change
    React.useEffect(() => {
        savePlanExercises(currentPlanName, exercises);
    }, [exercises, currentPlanName]);

    // Remaining UI state
    const [showSummary, setShowSummary] = useState(false);
    const [currentExIdx, setCurrentExIdx] = useState(0);
    const [currentSetIdx, setCurrentSetIdx] = useState(0);
    const [showPlanMenu, setShowPlanMenu] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addTab, setAddTab] = useState<'existing' | 'new'>('existing');
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseGroup, setNewExerciseGroup] = useState('胸');
    const [isPremium] = useState(false);
    const [renamingPlan, setRenamingPlan] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    // Constants and derived state
    const customCount = exercises.filter(e => parseInt(e.id) > 100).length;

    // All exercises in all plans (for picker)
    const allKnownExercises: Exercise[] = React.useMemo(() => {
        try {
            const raw = localStorage.getItem(STORAGE_EXERCISES_KEY);
            const map: Record<string, Exercise[]> = raw ? JSON.parse(raw) : {};
            const all = Object.values(DEFAULT_PLAN_EXERCISES).flat();
            Object.values(map).forEach(exs => all.push(...exs));
            // Deduplicate by name
            const seen = new Set<string>();
            return all.filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; });
        } catch { return Object.values(DEFAULT_PLAN_EXERCISES).flat(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAddModal]);

    const handleWorkComplete = (duration: number) => {
        let updatedExercises = [...exercises];
        const currentEx = { ...updatedExercises[currentExIdx] };
        currentEx.sets = currentEx.sets.map((s, j) => {
            if (j !== currentSetIdx) return s;
            return { ...s, duration, completed: true };
        });
        updatedExercises[currentExIdx] = currentEx;

        setExercises(updatedExercises);

        // Auto-advance logic: Find first incomplete set in current exercise
        const nextIncompleteSetIdx = currentEx.sets.findIndex(s => !s.completed);

        if (nextIncompleteSetIdx !== -1) {
            setCurrentSetIdx(nextIncompleteSetIdx);
        } else {
            // If all sets in current exercise are done, move to next exercise
            const nextExIdx = currentExIdx + 1;
            if (nextExIdx < updatedExercises.length) {
                setCurrentExIdx(nextExIdx);
                setCurrentSetIdx(0);
            }
        }
    };

    const switchPlan = (plan: string) => {
        // Save current plan before switching
        savePlanExercises(currentPlanName, exercises);
        setCurrentPlanName(plan);
        setExercises(loadPlanExercises(plan));
        setCurrentExIdx(0);
        setCurrentSetIdx(0);
        setShowPlanMenu(false);
        setRenamingPlan(null);
    };

    const handleRename = (oldName: string) => {
        if (!renameValue.trim()) { setRenamingPlan(null); return; }
        const newName = renameValue.trim();
        // Migrate stored exercises to new name
        const savedExs = loadPlanExercises(oldName);
        savePlanExercises(newName, savedExs);
        setPlans(prev => prev.map(p => p === oldName ? newName : p));
        if (currentPlanName === oldName) setCurrentPlanName(newName);
        setRenamingPlan(null);
        setRenameValue('');
    };

    const toggleSet = (exId: string, setId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;
            return {
                ...ex,
                sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
            };
        }));
    };

    const addSet = (exId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet: ExerciseSet = {
                id: `${ex.id}-${ex.sets.length + 1}`,
                weight: lastSet ? lastSet.weight : 20,
                reps: lastSet ? lastSet.reps : 10,
                completed: false
            };
            return { ...ex, sets: [...ex.sets, newSet] };
        }));
    };

    const handleAddExercise = () => {
        if (!newExerciseName) return;
        if (!isPremium && exercises.length >= FREE_EXERCISE_LIMIT) return;
        const newEx: Exercise = {
            id: String(Date.now()),
            name: newExerciseName,
            group: newExerciseGroup,
            sets: [{ id: `${Date.now()}-1`, weight: 20, reps: 10, completed: false }]
        };
        setExercises(prev => [...prev, newEx]);
        setShowAddModal(false);
        setNewExerciseName('');
    };

    const handlePickExercise = (ex: Exercise) => {
        if (!isPremium && exercises.length >= FREE_EXERCISE_LIMIT) return;
        // Avoid duplicates
        if (exercises.some(e => e.name === ex.name)) { setShowAddModal(false); return; }
        const copy: Exercise = {
            ...ex,
            id: String(Date.now()),
            sets: ex.sets.map((s, i) => ({ ...s, id: `${Date.now()}-${i}`, completed: false }))
        };
        setExercises(prev => [...prev, copy]);
        setShowAddModal(false);
    };

    const getTotalVolume = () => {
        return exercises.reduce((acc, ex) => {
            return acc + ex.sets.reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0);
        }, 0);
    };

    const getCompletedSets = () => {
        return exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    };

    return (
        <div className={styles.container}>
            {/* Header and GlobalTimer */}
            <div className={styles.globalTimerSection}>
                <GlobalTimer />
            </div>
            <header className={styles.header}>
                <div
                    className="flex items-center gap-2 mb-1 cursor-pointer"
                    onClick={() => setShowPlanMenu(true)}
                >
                    <h1 className="gradient-text">{currentPlanName}</h1>
                    <ChevronDown size={18} className="text-gray-400" />
                </div>
                <div className={styles.meta}>
                    <span>2026年1月21日</span>
                    <span>下午 4:30</span>
                </div>
            </header>

            {/* Plan Picker Bottom Sheet */}
            <AnimatePresence>
                {showPlanMenu && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => { setShowPlanMenu(false); setRenamingPlan(null); }}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="w-[min(100%,480px)] bg-zinc-900 border border-white/10 border-b-0 rounded-t-3xl overflow-hidden" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mt-3 mb-4" />
                            <div className="px-5 pb-2">
                                <h2 className="text-lg font-bold text-white">選擇訓練計畫</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">長按或點擊鉛筆圖示可重新命名</p>
                            </div>

                            <div className="max-h-[50vh] overflow-y-auto pb-20">
                                {plans.map(plan => (
                                    <div key={plan} className={`flex items-center gap-3 px-5 border-b border-white/6 ${currentPlanName === plan ? 'bg-purple-500/10' : ''}`}>
                                        {renamingPlan === plan ? (
                                            <div className="flex-1 flex items-center gap-2 py-3">
                                                <input
                                                    autoFocus
                                                    className="flex-1 bg-zinc-800 border border-purple-500/50 text-white px-3 py-2 rounded-xl text-sm outline-none"
                                                    value={renameValue}
                                                    onChange={e => setRenameValue(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleRename(plan); if (e.key === 'Escape') setRenamingPlan(null); }}
                                                    placeholder="新名稱"
                                                />
                                                <button onClick={() => handleRename(plan)} className="px-3 py-2 bg-purple-600 text-white text-xs rounded-xl font-bold">儲存</button>
                                                <button onClick={() => setRenamingPlan(null)} className="px-3 py-2 bg-zinc-700 text-zinc-300 text-xs rounded-xl">取消</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    className="flex-1 py-4 text-left"
                                                    onClick={() => switchPlan(plan)}
                                                >
                                                    <div className={`font-semibold text-[15px] ${currentPlanName === plan ? 'text-purple-300' : 'text-zinc-100'}`}>{plan}</div>
                                                </button>
                                                <button
                                                    onClick={() => { setRenamingPlan(plan); setRenameValue(plan); }}
                                                    className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                                    title="重新命名"
                                                >
                                                    ✏️
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                                <button
                                    className="w-full px-5 py-4 flex items-center gap-3 text-purple-400 font-bold hover:bg-purple-500/10 transition-colors"
                                    onClick={() => {
                                        const name = `自訂計畫 ${plans.length + 1}`;
                                        setPlans(prev => [...prev, name]);
                                        setRenamingPlan(name);
                                        setRenameValue(name);
                                    }}
                                >
                                    <Plus size={18} /> 新增計畫
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            <ActiveTimer
                initialSeconds={90}
                label="組間休息倒數"
                onWorkComplete={handleWorkComplete}
                exerciseName={exercises[currentExIdx]?.name}
                setNumber={currentSetIdx + 1}
                totalSets={exercises[currentExIdx]?.sets.length}
            />

            <div className={styles.exerciseList}>
                {exercises.map((ex, exIndex) => (
                    <div key={ex.id} className={`${styles.exerciseCard} card`}>
                        <div className={styles.exerciseHeader}>
                            <div className={styles.titleGroup}>
                                <span className={styles.exerciseGroup}>{ex.group}</span>
                                <h3>{ex.name}</h3>
                            </div>
                            <div className={styles.headerActions}>
                                <History size={18} className={styles.historyIcon} />
                                <ChevronDown size={20} />
                            </div>
                        </div>

                        <div className={styles.setsHeader}>
                            <span>組數</span>
                            <span>重量 (kg)</span>
                            <span>次數</span>
                            <span>時間</span>
                            <span>狀態</span>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {ex.sets.map((set, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={set.id}
                                    className={`${styles.setRow} ${set.completed ? styles.setCompleted : ''} ${currentExIdx === exIndex && currentSetIdx === index ? 'border border-primary/30 rounded-lg bg-primary/5' : ''}`}
                                >
                                    <span className={styles.setNumber}>{index + 1}</span>
                                    <div className="w-20">
                                        <RollingInput
                                            value={set.weight}
                                            onChange={(val) => {
                                                setExercises(prev => prev.map(pe => pe.id === ex.id ? {
                                                    ...pe, sets: pe.sets.map(s => s.id === set.id ? { ...s, weight: val } : s)
                                                } : pe));
                                            }}
                                            step={2.5}
                                            min={0}
                                            max={200}
                                        />
                                    </div>
                                    <div className="w-16">
                                        <RollingInput
                                            value={set.reps}
                                            onChange={(val) => {
                                                setExercises(prev => prev.map(pe => pe.id === ex.id ? {
                                                    ...pe, sets: pe.sets.map(s => s.id === set.id ? { ...s, reps: val } : s)
                                                } : pe));
                                            }}
                                            step={1}
                                            min={1}
                                            max={50}
                                        />
                                    </div>
                                    <div className="w-12 text-xs text-gray-400 font-mono text-center">
                                        {set.duration ? `${set.duration}s` : '--'}
                                    </div>
                                    <button
                                        onClick={() => {
                                            toggleSet(ex.id, set.id);
                                            setCurrentExIdx(exIndex);
                                            setCurrentSetIdx(index);
                                        }}
                                        className={`${styles.checkButton} ${set.completed ? styles.checked : ''}`}
                                    >
                                        {set.completed ? '✓' : ''}
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button onClick={() => addSet(ex.id)} className={styles.addSetButton}>
                            <Plus size={16} /> 新增一組
                        </button>
                    </div>
                ))}
            </div>

            <button
                className={styles.addExerciseBtn}
                onClick={() => { setShowAddModal(true); setAddTab('existing'); }}
                disabled={!isPremium && exercises.length >= FREE_EXERCISE_LIMIT}
                title={!isPremium && exercises.length >= FREE_EXERCISE_LIMIT ? '免費版最多 5 個動作，升級 Pro 解鎖無限' : undefined}
            >
                <Plus size={20} />
                新增動作 ({exercises.length}/{isPremium ? '∞' : FREE_EXERCISE_LIMIT})
                {!isPremium && exercises.length >= FREE_EXERCISE_LIMIT && <span className="text-xs ml-1 text-amber-400">升級解鎖</span>}
            </button>

            <button className={styles.finishButton} onClick={() => setShowSummary(true)}>完成訓練</button>

            {/* Add Exercise Modal — bottom sheet */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="w-[min(100%,520px)] bg-zinc-900 border border-white/10 border-b-0 rounded-t-3xl overflow-hidden"
                            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mt-3 mb-3" />

                            {/* Header */}
                            <div className="px-5 mb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">新增動作</h3>
                                    {!isPremium && (
                                        <p className="text-xs text-zinc-500">
                                            已使用 <span className={exercises.length >= FREE_EXERCISE_LIMIT ? 'text-amber-400 font-bold' : 'text-purple-400 font-bold'}>{exercises.length}/{FREE_EXERCISE_LIMIT}</span>
                                            {exercises.length >= FREE_EXERCISE_LIMIT && ' · 升級 Pro 解鎖無限'}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-zinc-400 text-lg">×</button>
                            </div>

                            {/* Tab switcher */}
                            <div className="flex gap-2 px-5 mb-4">
                                {(['existing', 'new'] as const).map(t => (
                                    <button key={t}
                                        onClick={() => setAddTab(t)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                                            addTab === t
                                                ? 'border-purple-500 bg-purple-500/15 text-purple-300'
                                                : 'border-transparent bg-white/5 text-zinc-500'
                                        }`}
                                    >
                                        {t === 'existing' ? '從現有動作選' : '建立新動作'}
                                    </button>
                                ))}
                            </div>

                            {addTab === 'existing' ? (
                                /* Pick from existing */
                                <div className="max-h-[45vh] overflow-y-auto px-2 pb-2">
                                    {allKnownExercises.length === 0 ? (
                                        <p className="text-center text-zinc-500 text-sm py-8">尚無已建立的動作</p>
                                    ) : (
                                        allKnownExercises.map(ex => {
                                            const alreadyIn = exercises.some(e => e.name === ex.name);
                                            const atLimit = !isPremium && exercises.length >= FREE_EXERCISE_LIMIT;
                                            return (
                                                <button
                                                    key={ex.id}
                                                    onClick={() => handlePickExercise(ex)}
                                                    disabled={alreadyIn || atLimit}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-left transition-all ${
                                                        alreadyIn ? 'opacity-40 cursor-default bg-white/3' :
                                                        atLimit ? 'opacity-40 cursor-not-allowed bg-white/3' :
                                                        'bg-white/5 hover:bg-purple-500/15 active:bg-purple-500/25'
                                                    }`}
                                                >
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/10 text-zinc-400 w-10 text-center shrink-0">{ex.group}</span>
                                                    <span className="text-sm font-semibold text-zinc-100 flex-1">{ex.name}</span>
                                                    {alreadyIn && <span className="text-[10px] text-zinc-500">已加入</span>}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                /* Create new */
                                <div className="px-5 space-y-3 pb-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400 font-medium">動作名稱</label>
                                        <input
                                            type="text"
                                            value={newExerciseName}
                                            onChange={e => setNewExerciseName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAddExercise(); }}
                                            placeholder="例如：槓鈴深蹲"
                                            className="w-full bg-zinc-800 border border-white/10 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-purple-500/60 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400 font-medium">肌群分類</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['胸','背','腿','肩','手','核心'].map(g => (
                                                <button
                                                    key={g}
                                                    onClick={() => setNewExerciseGroup(g)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                                                        newExerciseGroup === g
                                                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                                            : 'border-transparent bg-white/6 text-zinc-400 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl bg-white/8 text-zinc-300 font-semibold text-sm">取消</button>
                                        <button
                                            onClick={handleAddExercise}
                                            disabled={!newExerciseName || (!isPremium && exercises.length >= FREE_EXERCISE_LIMIT)}
                                            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold text-sm transition-all"
                                        >
                                            新增
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary Modal */}
            <AnimatePresence>
                {showSummary && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 w-full max-w-sm text-center relative overflow-hidden"
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8 }}
                        >
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent animate-pulse" />
                            </div>

                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                                className="text-6xl mb-4"
                            >
                                🎉
                            </motion.div>

                            <h2 className="text-2xl font-bold text-white mb-2">恭喜完成訓練！</h2>
                            <p className="text-gray-400 text-sm mb-6">今天的你比昨天更強大了 💪</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <div className="text-xs text-gray-400">總訓練量</div>
                                    <div className="text-xl font-bold text-primary">{getTotalVolume()} <span className="text-xs">kg</span></div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <div className="text-xs text-gray-400">完成組數</div>
                                    <div className="text-xl font-bold text-blue-400">{getCompletedSets()} <span className="text-xs">組</span></div>
                                </div>
                            </div>

                            <button
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all"
                                onClick={() => setShowSummary(false)}
                            >
                                太棒了！
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ height: '100px' }} />
        </div>
    );
}
