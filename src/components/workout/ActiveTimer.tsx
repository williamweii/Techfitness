"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import styles from './ActiveTimer.module.css';

interface ActiveTimerProps {
    initialSeconds?: number;
    label?: string;
    onComplete?: () => void;
    onWorkComplete?: (duration: number) => void;
    exerciseName?: string;
    setNumber?: number;
    totalSets?: number;
}

export default function ActiveTimer({ initialSeconds = 60, label = "組間休息", onComplete, onWorkComplete, exerciseName = "Chest Press", setNumber = 1, totalSets = 4 }: ActiveTimerProps) {
    const [mode, setMode] = useState<'rest' | 'work'>('rest');
    const [seconds, setSeconds] = useState(initialSeconds);
    const [workSeconds, setWorkSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(initialSeconds);

    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                if (mode === 'rest') {
                    if (seconds > 0) {
                        setSeconds(s => s - 1);
                    } else {
                        setIsActive(false);
                        if (onComplete) onComplete();
                    }
                } else {
                    setWorkSeconds(s => s + 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, mode, onComplete]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        if (mode === 'rest') {
            setSeconds(editValue);
        } else {
            setWorkSeconds(0);
        }
        setIsActive(false);
    };

    const startWork = () => {
        setMode('work');
        setWorkSeconds(0);
        setIsActive(true);
    };

    const stopWork = () => {
        setIsActive(false);
        if (onWorkComplete) onWorkComplete(workSeconds);
        // Automatically start rest
        setMode('rest');
        setSeconds(editValue);
        setIsActive(true);
    };

    const handleTimeClick = () => {
        if (!isActive) {
            setIsEditing(true);
            setEditValue(seconds);
        }
    };

    const handleSaveEdit = () => {
        setIsEditing(false);
        setSeconds(editValue);
    };

    const progress = (seconds / editValue) * 100; // Progress based on current max

    return (
        <div className={`${styles.timerContainer} glass`}>
            {isEditing ? (
                <div className="flex flex-col items-center gap-2 p-2">
                    <span className="text-xs text-gray-400">設定休息時間 (秒)</span>
                    <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        className="bg-transparent border-b border-purple-500 text-center text-xl font-bold w-20 focus:outline-none"
                        autoFocus
                    />
                    <button
                        onClick={handleSaveEdit}
                        className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full mt-1"
                    >
                        確認
                    </button>
                </div>
            ) : (
                <>
                    <div className={styles.topInfo}>
                        <h3 className={styles.exerciseName}>{exerciseName}</h3>
                        <span className={styles.setInfo}>Set {setNumber} / {totalSets}</span>
                    </div>

                    <div className={styles.labelGroup}>
                        <span className={styles.label}>{mode === 'rest' ? label : '訓練進行中...'}</span>
                        <div className="flex flex-col items-center">
                            {mode === 'rest' ? (
                                <span
                                    className={`${styles.time} cursor-pointer hover:text-purple-400 transition-colors`}
                                    onClick={handleTimeClick}
                                    title="點擊修改時間"
                                >
                                    {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
                                </span>
                            ) : (
                                <span className={`${styles.time} text-green-400`}>
                                    {Math.floor(workSeconds / 60)}:{(workSeconds % 60).toString().padStart(2, '0')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressBar}
                            style={{
                                width: `${mode === 'rest' ? progress : 100}%`,
                                background: mode === 'rest' ? 'var(--primary)' : '#22c55e'
                            }}
                        />
                    </div>

                    <div className={styles.controls}>
                        {mode === 'rest' && seconds === 0 ? (
                            <button onClick={startWork} className={`${styles.playButton} !w-auto !px-6 bg-green-600`}>
                                <Play size={20} fill="currentColor" className="mr-2" /> 開始此組
                            </button>
                        ) : mode === 'work' ? (
                            <button onClick={stopWork} className={styles.finishBtn}>
                                <div className="w-4 h-4 bg-white rounded-sm mr-2" /> 完成此組
                            </button>
                        ) : (
                            <div className={styles.restControls}>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSeconds(s => Math.max(0, s - 30))}
                                        className={styles.smallAdjustBtn}
                                    >
                                        -30s
                                    </button>
                                    <button
                                        onClick={() => setSeconds(s => s + 30)}
                                        className={styles.smallAdjustBtn}
                                    >
                                        +30s
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={reset} className={styles.iconButton}><RotateCcw size={20} /></button>
                                    <button onClick={toggle} className={styles.playButton}>
                                        {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    </button>
                                </div>
                                <button onClick={startWork} className={styles.skipBtn}>
                                    提前開始
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
