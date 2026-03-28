"use client";

import React, { useState, useRef } from 'react';
import { ChevronDown, Plus, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './WorkoutLog.module.css';
import ActiveTimer from './ActiveTimer';
import RollingInput from '../ui/RollingInput';
import GlobalTimer from './GlobalTimer';
import { useUser } from '@/hooks/useUser';
import { supabase, WorkoutLogInsert, todayISO, UserPlan } from '@/lib/supabase';

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
const DEFAULT_PLAN_NAMES = ['推拉腿 (推日)', '推拉腿 (拉日)', '推拉腿 (腿日)', '全身訓練 A', '全身訓練 B'];

// ─── Guest-mode localStorage helpers (still used for non-logged-in users) ─────
function loadPlans(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_PLANS_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_PLAN_NAMES;
    } catch { return DEFAULT_PLAN_NAMES; }
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
    const { user, isPremium } = useUser();
    const [plans, setPlans] = useState<string[]>(DEFAULT_PLAN_NAMES);
    const [currentPlanName, setCurrentPlanName] = useState<string>(DEFAULT_PLAN_NAMES[0]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [plansLoaded, setPlansLoaded] = useState(false);
    const [allPlansData, setAllPlansData] = useState<Record<string, Exercise[]>>({});
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Load plans from Supabase (or localStorage for guests) ─────────────────
    React.useEffect(() => {
        async function loadData() {
            const guestPlans = loadPlans();
            const guestCache: Record<string, Exercise[]> = {};
            guestPlans.forEach(p => { guestCache[p] = loadPlanExercises(p); });
            const todayPlan = typeof window !== 'undefined' ? localStorage.getItem('tf_today_plan') : null;

            if (!user) {
                setAllPlansData(guestCache);
                setPlans(guestPlans);
                const initPlan = (todayPlan && guestPlans.includes(todayPlan)) ? todayPlan : guestPlans[0];
                setCurrentPlanName(initPlan);
                setExercises(guestCache[initPlan] ?? []);
                setPlansLoaded(true);
                return;
            }

            const { data } = await supabase
                .from('user_plans')
                .select('plan_name, exercises')
                .eq('user_id', user.id)
                .order('created_at');

            if (data && data.length > 0) {
                const cache: Record<string, Exercise[]> = {};
                const names = (data as Pick<UserPlan, 'plan_name' | 'exercises'>[]).map(r => {
                    cache[r.plan_name] = r.exercises as Exercise[];
                    return r.plan_name;
                });
                setAllPlansData(cache);
                setPlans(names);
                const initPlan = (todayPlan && names.includes(todayPlan)) ? todayPlan : names[0];
                setCurrentPlanName(initPlan);
                setExercises(cache[initPlan] ?? []);
            } else {
                // First login: migrate localStorage → Supabase
                const rows = guestPlans.map(plan_name => ({
                    user_id: user.id,
                    plan_name,
                    exercises: guestCache[plan_name],
                }));
                await supabase.from('user_plans').upsert(rows, { onConflict: 'user_id,plan_name' });
                setAllPlansData(guestCache);
                setPlans(guestPlans);
                const initPlan = (todayPlan && guestPlans.includes(todayPlan)) ? todayPlan : guestPlans[0];
                setCurrentPlanName(initPlan);
                setExercises(guestCache[initPlan] ?? []);
            }
            setPlansLoaded(true);
        }
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // ─── Debounced auto-save exercises for current plan ──────────────────────
    React.useEffect(() => {
        if (!plansLoaded) return;
        if (!user) {
            savePlanExercises(currentPlanName, exercises);
            return;
        }
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            supabase.from('user_plans')
                .upsert({ user_id: user.id, plan_name: currentPlanName, exercises }, { onConflict: 'user_id,plan_name' });
            setAllPlansData(prev => ({ ...prev, [currentPlanName]: exercises }));
        }, 600);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercises, currentPlanName, plansLoaded]);

    // Remaining UI state
    const [showSummary, setShowSummary] = useState(false);
    const [currentExIdx, setCurrentExIdx] = useState(0);
    const [currentSetIdx, setCurrentSetIdx] = useState(0);
    const [showPlanMenu, setShowPlanMenu] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addTab, setAddTab] = useState<'existing' | 'new'>('existing');
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseGroup, setNewExerciseGroup] = useState('胸');
    const [saving, setSaving] = useState(false);
    const [renamingPlan, setRenamingPlan] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deletingPlan, setDeletingPlan] = useState<string | null>(null);
    const [renamingExercise, setRenamingExercise] = useState<string | null>(null); // exercise id
    const [renameExerciseValue, setRenameExerciseValue] = useState('');
    const [deletingExercise, setDeletingExercise] = useState<string | null>(null); // exercise id

    // Constants and derived state
    const customCount = exercises.filter(e => parseInt(e.id) > 100).length;

    // All exercises in all plans (for picker)
    const allKnownExercises: Exercise[] = React.useMemo(() => {
        const all = Object.values(DEFAULT_PLAN_EXERCISES).flat();
        Object.values(allPlansData).forEach(exs => all.push(...exs));
        const seen = new Set<string>();
        return all.filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; });
    }, [allPlansData, showAddModal]);

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
        // Cache current exercises before switching
        setAllPlansData(prev => ({ ...prev, [currentPlanName]: exercises }));
        if (!user) savePlanExercises(currentPlanName, exercises);
        setCurrentPlanName(plan);
        setExercises(allPlansData[plan] ?? DEFAULT_PLAN_EXERCISES[plan] ?? []);
        setCurrentExIdx(0);
        setCurrentSetIdx(0);
        setShowPlanMenu(false);
        setRenamingPlan(null);
    };

    const handleRename = async (oldName: string) => {
        if (!renameValue.trim()) { setRenamingPlan(null); return; }
        const newName = renameValue.trim();
        const savedExs = allPlansData[oldName] ?? (oldName === currentPlanName ? exercises : []);
        if (user) {
            await supabase.from('user_plans').upsert(
                { user_id: user.id, plan_name: newName, exercises: savedExs },
                { onConflict: 'user_id,plan_name' }
            );
            await supabase.from('user_plans').delete().eq('user_id', user.id).eq('plan_name', oldName);
        } else {
            savePlanExercises(newName, savedExs);
        }
        setAllPlansData(prev => {
            const next = { ...prev, [newName]: savedExs };
            delete next[oldName];
            return next;
        });
        setPlans(prev => prev.map(p => p === oldName ? newName : p));
        if (currentPlanName === oldName) setCurrentPlanName(newName);
        setRenamingPlan(null);
        setRenameValue('');
    };

    function handleDeletePlan(plan: string) {
        const updated = plans.filter(p => p !== plan);
        if (user) {
            supabase.from('user_plans').delete().eq('user_id', user.id).eq('plan_name', plan);
        }
        setAllPlansData(prev => {
            const next = { ...prev };
            delete next[plan];
            return next;
        });
        setPlans(updated);
        if (currentPlanName === plan) {
            const next = updated[0] || '預設計畫';
            setCurrentPlanName(next);
            setExercises(allPlansData[next] ?? DEFAULT_PLAN_EXERCISES[next] ?? []);
        }
        setDeletingPlan(null);
    }

    const handleRenameExercise = (exId: string) => {
        if (!renameExerciseValue.trim()) { setRenamingExercise(null); return; }
        setExercises(prev => prev.map(ex =>
            ex.id === exId ? { ...ex, name: renameExerciseValue.trim() } : ex
        ));
        setRenamingExercise(null);
        setRenameExerciseValue('');
    };

    const handleDeleteExercise = (exId: string) => {
        setExercises(prev => prev.filter(ex => ex.id !== exId));
        setDeletingExercise(null);
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

    const saveWorkoutToSupabase = async () => {
        if (!user) return;
        const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const loggedDate = todayISO();

        const rows: WorkoutLogInsert[] = exercises.flatMap(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            if (completedSets.length === 0) return [];
            // Use the last completed set's weight/reps as representative values
            const last = completedSets[completedSets.length - 1];
            return [{
                user_id: user.id,
                exercise_name: ex.name,
                exercise_group: ex.group,
                weight: last.weight,
                reps: last.reps,
                sets: completedSets.length,
                session_id: sessionId,
                note: null,
                logged_date: loggedDate,
            }];
        });

        if (rows.length === 0) return;

        setSaving(true);
        await supabase.from('workout_logs').insert(rows);
        setSaving(false);
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
                    <span>{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>{new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </header>

            {/* Plan Picker Bottom Sheet */}
            <AnimatePresence>
                {showPlanMenu && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => { setShowPlanMenu(false); setRenamingPlan(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="w-[min(100%,480px)] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden max-h-[85dvh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 pt-6 pb-4">
                                <h2 className="text-xl font-bold text-white">選擇訓練計畫</h2>
                                <p className="text-sm text-zinc-500 mt-1.5">點擊鉛筆重新命名・點擊垃圾桶刪除</p>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {plans.map(plan => (
                                    <div key={plan} className={`flex items-center gap-3 px-6 border-b border-white/6 ${currentPlanName === plan ? 'bg-purple-500/10' : ''}`}>
                                        {deletingPlan === plan ? (
                                            /* ── Delete confirm row ── */
                                            <div className="flex-1 flex items-center gap-2 py-4">
                                                <span className="flex-1 text-sm text-zinc-300">確定刪除「{plan}」？</span>
                                                <button onClick={() => handleDeletePlan(plan)} className="px-3 py-2 bg-red-600 text-white text-xs rounded-xl font-bold">刪除</button>
                                                <button onClick={() => setDeletingPlan(null)} className="px-3 py-2 bg-zinc-700 text-zinc-300 text-xs rounded-xl">取消</button>
                                            </div>
                                        ) : renamingPlan === plan ? (
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
                                                <button
                                                    onClick={() => setDeletingPlan(plan)}
                                                    className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                                                    title="刪除"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                                <button
                                    className="w-full px-5 py-4 flex items-center gap-3 text-purple-400 font-bold hover:bg-purple-500/10 transition-colors"
                                    onClick={async () => {
                                        const name = `自訂計畫 ${plans.length + 1}`;
                                        if (user) {
                                            await supabase.from('user_plans').upsert(
                                                { user_id: user.id, plan_name: name, exercises: [] },
                                                { onConflict: 'user_id,plan_name' }
                                            );
                                        }
                                        setAllPlansData(prev => ({ ...prev, [name]: [] }));
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
                            {deletingExercise === ex.id ? (
                                /* ── Delete confirm ── */
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="flex-1 text-sm text-zinc-300">確定刪除「{ex.name}」？</span>
                                    <button onClick={() => handleDeleteExercise(ex.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-xl font-bold">刪除</button>
                                    <button onClick={() => setDeletingExercise(null)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs rounded-xl">取消</button>
                                </div>
                            ) : renamingExercise === ex.id ? (
                                /* ── Rename inline ── */
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        autoFocus
                                        className="flex-1 bg-zinc-800 border border-purple-500/50 text-white px-3 py-1.5 rounded-xl text-sm outline-none"
                                        value={renameExerciseValue}
                                        onChange={e => setRenameExerciseValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleRenameExercise(ex.id); if (e.key === 'Escape') setRenamingExercise(null); }}
                                        placeholder="動作名稱"
                                    />
                                    <button onClick={() => handleRenameExercise(ex.id)} className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-xl font-bold">儲存</button>
                                    <button onClick={() => setRenamingExercise(null)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs rounded-xl">取消</button>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.titleGroup}>
                                        <span className={styles.exerciseGroup}>{ex.group}</span>
                                        <h3>{ex.name}</h3>
                                    </div>
                                    <div className={styles.headerActions}>
                                        <button
                                            onClick={() => { setRenamingExercise(ex.id); setRenameExerciseValue(ex.name); }}
                                            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            title="重新命名"
                                        >✏️</button>
                                        <button
                                            onClick={() => setDeletingExercise(ex.id)}
                                            className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                                            title="刪除動作"
                                        >🗑️</button>
                                        <History size={18} className={styles.historyIcon} />
                                        <ChevronDown size={20} />
                                    </div>
                                </>
                            )}
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
                        className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="w-[min(100%,480px)] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden max-h-[85dvh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >

                            {/* Header */}
                            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">新增動作</h3>
                                    {!isPremium && (
                                        <p className="text-sm text-zinc-500 mt-1">
                                            已使用 <span className={exercises.length >= FREE_EXERCISE_LIMIT ? 'text-amber-400 font-bold' : 'text-purple-400 font-bold'}>{exercises.length}/{FREE_EXERCISE_LIMIT}</span>
                                            {exercises.length >= FREE_EXERCISE_LIMIT && ' · 升級 Pro 解鎖無限'}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-zinc-400 text-xl hover:bg-white/15 transition-colors">×</button>
                            </div>

                            {/* Tab switcher */}
                            <div className="flex gap-3 px-5 mb-4">
                                {(['existing', 'new'] as const).map(t => (
                                    <button key={t}
                                        onClick={() => setAddTab(t)}
                                        className={`flex-1 py-3 rounded-xl text-base font-semibold transition-all border-2 ${
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
                                <div className="flex-1 overflow-y-auto px-4 pb-4">
                                    {allKnownExercises.length === 0 ? (
                                        <p className="text-center text-zinc-500 text-base py-10">尚無已建立的動作</p>
                                    ) : (
                                        allKnownExercises.map(ex => {
                                            const alreadyIn = exercises.some(e => e.name === ex.name);
                                            const atLimit = !isPremium && exercises.length >= FREE_EXERCISE_LIMIT;
                                            return (
                                                <button
                                                    key={ex.id}
                                                    onClick={() => handlePickExercise(ex)}
                                                    disabled={alreadyIn || atLimit}
                                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl mb-2 text-left transition-all ${
                                                        alreadyIn ? 'opacity-40 cursor-default bg-white/3' :
                                                        atLimit ? 'opacity-40 cursor-not-allowed bg-white/3' :
                                                        'bg-white/5 hover:bg-purple-500/15 active:bg-purple-500/25'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-white/10 text-zinc-300 min-w-[3rem] text-center shrink-0">{ex.group}</span>
                                                    <span className="text-base font-semibold text-zinc-100 flex-1">{ex.name}</span>
                                                    {alreadyIn && <span className="text-xs text-zinc-500">已加入</span>}
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
                        className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
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
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60"
                                disabled={saving}
                                onClick={async () => {
                                    await saveWorkoutToSupabase();
                                    setShowSummary(false);
                                }}
                            >
                                {saving ? '儲存中…' : '太棒了！'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ height: '100px' }} />
        </div>
    );
}
