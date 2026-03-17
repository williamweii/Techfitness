"use client";

import React, { useState, useEffect } from 'react';
import { Timer, Zap, Coffee, CheckCircle2, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './FastingTimer.module.css';

export default function FastingTimer() {
    const [targetHours, setTargetHours] = useState(16);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isFasting, setIsFasting] = useState(false);
    const [streakDays, setStreakDays] = useState(5);
    const weeklyStatus = [true, true, true, true, true, false, false]; // Mock data Sun-Sat

    useEffect(() => {
        let interval: any = null;
        if (isFasting) {
            interval = setInterval(() => {
                setElapsedSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isFasting]);

    const toggleFasting = () => {
        setIsFasting(!isFasting);
    };

    const progress = Math.min((elapsedSeconds / (targetHours * 3600)) * 100, 100);
    const remainingSeconds = Math.max((targetHours * 3600) - elapsedSeconds, 0);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`${styles.card} card glass`}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Timer className={styles.icon} />
                    <div>
                        <h3>{targetHours}/{24 - targetHours} 斷食計時</h3>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Flame size={12} className="text-orange-500" />
                            已連續 {streakDays} 天
                        </div>
                    </div>
                </div>
                <div className={styles.statusBadge}>
                    {isFasting ? '斷食中' : '進食中'}
                </div>
            </div>

            <div className={styles.visualContainer}>
                <svg className={styles.progressCircle} viewBox="0 0 100 100">
                    <circle className={styles.bg} cx="50" cy="50" r="45" />
                    <motion.circle
                        className={styles.indicator}
                        cx="50" cy="50" r="45"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * progress) / 100}
                        animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                    />
                </svg>
                <div className={styles.timeDisplay}>
                    <span className={styles.timeLabel}>{isFasting ? '剩餘時間' : '累計時間'}</span>
                    <span className={styles.timeValue}>{formatTime(isFasting ? remainingSeconds : elapsedSeconds)}</span>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    onClick={toggleFasting}
                    className={`${styles.mainBtn} ${isFasting ? styles.stopBtn : styles.startBtn}`}
                >
                    {isFasting ? '結束斷食' : '開始斷食'}
                </button>
            </div>

            <div className={styles.weeklyContainer}>
                <span className={styles.weeklyTitle}>本週達成率</span>
                <div className={styles.weeklyGrid}>
                    {['日', '一', '二', '三', '四', '五', '六'].map((day, i) => (
                        <div key={i} className={styles.weeklyDay}>
                            <span className={styles.dayLabel}>{day}</span>
                            <div className={`${styles.statusDot} ${weeklyStatus[i] ? styles.statusActive : styles.statusInactive}`}>
                                {weeklyStatus[i] ? <CheckCircle2 size={10} /> : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
