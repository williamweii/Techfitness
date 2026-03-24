"use client";

import React, { useState } from 'react';
import { Droplets } from 'lucide-react';
import styles from './WaterTracker.module.css';

export default function WaterTracker() {
    const [intake, setIntake] = useState(1250); // ml
    const goal = 2500;
    const percentage = Math.min((intake / goal) * 100, 100);

    const addWater = (amount: number) => {
        setIntake(prev => Math.min(prev + amount, goal));
    };

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
                <span className={styles.separator}>/</span>
                <span className={styles.goalVal}>{goal} ml</span>
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
