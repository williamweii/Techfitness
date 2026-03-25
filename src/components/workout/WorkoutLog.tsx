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
const FREE_EXERCISE_LIMIT = 10;

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
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseGroup, setNewExerciseGroup] = useState('胸');
    const [isPremium] = useState(false);
    const [renamingPlan, setRenamingPlan] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    // Constants and derived state
    const customCount = exercises.filter(e => parseInt(e.id) > 100).length;

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
        // Free tier limit: max 10 unique exercises
        if (!isPremium && exercises.length >= FREE_EXERCISE_LIMIT) return;
        const newEx: Exercise = {
            id: String(Date.now()),
            name: newExerciseName,
            group: newExerciseGroup,
            sets: [{ id: `${Date.now()}-1`, weight: 20, reps: 10, completed: false }]
        };
        setExercises([...exercises, newEx]);
        setShowAddModal(false);
        setNewExerciseName('');
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
                            className="w-[min(100%,480px)] bg-zinc-900 border border-white/10 border-b-0 rounded-t-3xl pb-8 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mt-3 mb-4" />
                            <div className="px-5 pb-2">
                                <h2 className="text-lg font-bold text-white">選擇訓練計畫</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">長按或點擊鉛筆圖示可重新命名</p>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto">
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

            <button className={styles.addExerciseBtn} onClick={() => setShowAddModal(true)}>
                <Plus size={20} /> 新增動作 ({customCount}/10)
            </button>

            <button className={styles.finishButton} onClick={() => setShowSummary(true)}>完成訓練</button>

            {/* Custom Exercise Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={styles.modalOverlay}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className={styles.modalContent}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3>新增自訂動作</h3>
                            {!isPremium && <p className={styles.limitWarning}>免費版額度: {customCount}/10</p>}

                            <div className={styles.inputGroup}>
                                <label>動作名稱</label>
                                <input
                                    type="text"
                                    value={newExerciseName}
                                    onChange={e => setNewExerciseName(e.target.value)}
                                    placeholder="例如：槓鈴深蹲"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>肌群分類</label>
                                <select value={newExerciseGroup} onChange={e => setNewExerciseGroup(e.target.value)} className="bg-zinc-800 text-white border-white/20">
                                    <option className="bg-zinc-900 text-white" value="胸">胸</option>
                                    <option className="bg-zinc-900 text-white" value="背">背</option>
                                    <option className="bg-zinc-900 text-white" value="腿">腿</option>
                                    <option className="bg-zinc-900 text-white" value="肩">肩</option>
                                    <option className="bg-zinc-900 text-white" value="手">手</option>
                                    <option className="bg-zinc-900 text-white" value="核心">核心</option>
                                </select>
                            </div>

                            <div className={styles.modalActions}>
                                <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>取消</button>
                                <button className={styles.confirmBtn} onClick={handleAddExercise}>新增</button>
                            </div>
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
