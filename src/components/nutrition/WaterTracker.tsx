"use client";

import React, { useState } from 'react';
import { Plus, Minus, Droplets } from 'lucide-react';
import styles from './WaterTracker.module.css';

export default function WaterTracker() {
    const [intake, setIntake] = useState(1250); // ml
    const goal = 2500;

    const percentage = Math.min((intake / goal) * 100, 100);

    const addWater = (amount: number) => {
        setIntake(prev => prev + amount);
    };

    return (
        <div className={styles.container}>
            <div className={styles.info}>
                <div className={styles.label}>
                    <Droplets size={18} className={styles.icon} />
                    <span>水分攝取</span>
                </div>
                <div className={styles.value}>
                    {intake} <span className={styles.unit}>/ {goal} ml</span>
                </div>
            </div>

            <div className={styles.visual}>
                <div className={styles.cup}>
                    <div
                        className={styles.water}
                        style={{ height: `${percentage}%` }}
                    >
                        <div className={styles.wave}></div>
                    </div>
                </div>
            </div>

            <div className={styles.controls}>
                <div className="flex gap-2">
                    <button className={styles.btn} onClick={() => addWater(250)}>
                        <Plus size={14} /> 250
                    </button>
                    <button className={styles.btn} onClick={() => addWater(500)}>
                        <Plus size={14} /> 500
                    </button>
                    <button className={styles.btn} onClick={() => addWater(1000)}>
                        <Plus size={14} /> 1000
                    </button>
                </div>
            </div>
        </div>
    );
}
