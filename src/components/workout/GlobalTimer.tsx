"use client";

import React from 'react';
import { useWorkoutSession } from '@/lib/WorkoutSessionContext';
import { Play, Pause, Square, Timer } from 'lucide-react';
import styles from './GlobalTimer.module.css';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalTimer() {
    const { elapsedTime, isRunning, startSession, pauseSession, endSession, formatTime } = useWorkoutSession();

    // Only show if there is some activity (time > 0) or user explicitly started it.
    // We might want to allow starting it from here too.

    return (
        <div className={styles.container}>
            <AnimatePresence>
                {(elapsedTime > 0 || isRunning) && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className={styles.timerFloat}
                    >
                        <div className={styles.timeDisplay}>
                            <Timer size={16} className={styles.icon} />
                            <span>{formatTime(elapsedTime)}</span>
                        </div>
                        <div className={styles.controls}>
                            {!isRunning ? (
                                <button onClick={startSession} className={styles.controlBtn}><Play size={16} fill="currentColor" /></button>
                            ) : (
                                <button onClick={pauseSession} className={styles.controlBtn}><Pause size={16} fill="currentColor" /></button>
                            )}
                            <button onClick={endSession} className={`${styles.controlBtn} ${styles.stopBtn}`}><Square size={14} fill="currentColor" /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
