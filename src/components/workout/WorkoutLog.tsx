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

export default function WorkoutLog() {
    const [exercises, setExercises] = useState<Exercise[]>([
        {
            id: '1',
            name: '啞鈴臥推',
            group: '胸',
            sets: [
                { id: '1-1', weight: 24, reps: 10, completed: true },
                { id: '1-2', weight: 24, reps: 8, completed: false },
            ]
        },
        {
            id: '2',
            name: '啞鈴上胸臥推',
            group: '胸',
            sets: [
                { id: '2-1', weight: 20, reps: 10, completed: false }
            ]
        }
    ]);

    const [showSummary, setShowSummary] = useState(false);

    // State for navigation and UI
    const [currentExIdx, setCurrentExIdx] = useState(0);
    const [currentSetIdx, setCurrentSetIdx] = useState(0);
    const [showPlanMenu, setShowPlanMenu] = useState(false);
    const [currentPlanName, setCurrentPlanName] = useState('推拉腿 (推日)');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseGroup, setNewExerciseGroup] = useState('胸');
    const [isPremium] = useState(false); // Mock

    // Constants and derived state
    const plans = ['推拉腿 (推日)', '推拉腿 (拉日)', '推拉腿 (腿日)', '全身訓練 A', '全身訓練 B'];
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
        setCurrentPlanName(plan);
        setShowPlanMenu(false);
        // In a real app, this would load different exercises
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
            {/* ... (Header and GlobalTimer) ... */}
            <div className={styles.globalTimerSection}>
                <GlobalTimer />
            </div>
            <header className={styles.header}>
                <div
                    className="flex items-center gap-2 mb-1 cursor-pointer relative"
                    onClick={() => setShowPlanMenu(!showPlanMenu)}
                >
                    <h1 className="gradient-text">{currentPlanName}</h1>
                    <ChevronDown size={18} className="text-gray-400" />

                    {showPlanMenu && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1f2937] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                            {plans.map(plan => (
                                <div
                                    key={plan}
                                    className="px-4 py-3 hover:bg-gray-800 text-sm text-gray-300 border-b border-gray-800 last:border-0 text-left"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        switchPlan(plan);
                                    }}
                                >
                                    {plan}
                                </div>
                            ))}
                            <div
                                className="px-4 py-3 bg-purple-900/20 text-purple-400 text-sm font-bold hover:bg-purple-900/40 text-left flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    alert('即將開放自訂計畫功能');
                                    setShowPlanMenu(false);
                                }}
                            >
                                <Plus size={14} /> 新增自訂計畫
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.meta}>
                    <span>2026年1月21日</span>
                    <span>下午 4:30</span>
                </div>
            </header>

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
                                <select value={newExerciseGroup} onChange={e => setNewExerciseGroup(e.target.value)}>
                                    <option value="胸">胸</option>
                                    <option value="背">背</option>
                                    <option value="腿">腿</option>
                                    <option value="肩">肩</option>
                                    <option value="手">手</option>
                                    <option value="核心">核心</option>
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
