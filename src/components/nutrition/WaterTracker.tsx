"use client";

import React, { useState, useEffect } from 'react';
import { Droplets, Pencil, Check } from 'lucide-react';
import styles from './WaterTracker.module.css';

const STORAGE_GOAL_KEY = 'tf_water_goal';
const STORAGE_INTAKE_KEY = 'tf_water_intake';
const STORAGE_DATE_KEY = 'tf_water_date';

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function WaterTracker() {
    const [intake, setIntake] = useState(0);
    const [goal, setGoal] = useState(2500);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('2500');
    const [hydrated, setHydrated] = useState(false);

    // Load from localStorage on mount; reset intake if it's a new day
    useEffect(() => {
        const savedGoal = localStorage.getItem(STORAGE_GOAL_KEY);
        if (savedGoal) { const g = parseInt(savedGoal); if (g > 0) { setGoal(g); setGoalInput(String(g)); } }

        const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
        const today = todayStr();
        if (savedDate === today) {
            const savedIntake = localStorage.getItem(STORAGE_INTAKE_KEY);
            if (savedIntake) setIntake(parseInt(savedIntake) || 0);
        } else {
            // New day — reset intake
            localStorage.setItem(STORAGE_DATE_KEY, today);
            localStorage.setItem(STORAGE_INTAKE_KEY, '0');
            setIntake(0);
        }
        setHydrated(true);
    }, []);

    const percentage = Math.min(Math.round((intake / goal) * 100), 100);

    const addWater = (amount: number) => {
        setIntake(prev => {
            const next = Math.min(prev + amount, goal);
            localStorage.setItem(STORAGE_INTAKE_KEY, String(next));
            return next;
        });
    };

    const confirmGoal = () => {
        const val = parseInt(goalInput);
        if (!isNaN(val) && val > 0) {
            setGoal(val);
            localStorage.setItem(STORAGE_GOAL_KEY, String(val));
        }
        setEditingGoal(false);
    };

    if (!hydrated) return null;

    return (
        <div className={styles.container}>
            {/* Header row */}
            <div className={styles.header}>
                <Droplets size={14} className={styles.icon} />
                <span className={styles.titleText}>水分攝取</span>
            </div>

            {/* Progress value */}
            <div className={styles.valueRow}>
                <span className={styles.currentVal}>{intake}</span>
                <span className={styles.percentBadge}>{percentage}%</span>
                <span className={styles.separator}>/</span>
                {editingGoal ? (
                    <span className={styles.editGoalRow}>
                        <input
                            autoFocus
                            className={styles.goalInput}
                            value={goalInput}
                            onChange={e => setGoalInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmGoal()}
                            type="number"
                            min="100"
                            max="9999"
                        />
                        <button className={styles.confirmBtn} onClick={confirmGoal}>
                            <Check size={10} />
                        </button>
                    </span>
                ) : (
                    <button className={styles.goalBtn} onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}>
                        <span className={styles.goalVal}>{goal} ml</span>
                        <Pencil size={9} className={styles.pencilIcon} />
                    </button>
                )}
            </div>

            {/* Cup visual */}
            <div className={styles.visual}>
                <div className={styles.cup}>
                    <div className={styles.water} style={{ height: `${percentage}%` }}>
                        <div className={styles.wave} />
                    </div>
                </div>
            </div>

            {/* Compact buttons */}
            <div className={styles.controls}>
                <button className={styles.btn} onClick={() => addWater(250)}>+250</button>
                <button className={`${styles.btn} ${styles.btnAccent}`} onClick={() => addWater(500)}>+500</button>
            </div>
        </div>
    );
}
