"use client";

import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Bell, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './WorkoutSchedule.module.css';

const days = ['日', '一', '二', '三', '四', '五', '六'];
const muscleGroups = ['胸', '背', '腿', '肩', '手臂', '核心', '全身'];

interface Schedule {
    id: string;
    day: number;
    time: string;
    group: string;
}

export default function WorkoutSchedule() {
    const [schedules, setSchedules] = useState<Schedule[]>([
        { id: '1', day: 1, time: '18:00', group: '胸' },
        { id: '2', day: 3, time: '07:30', group: '背' },
        { id: '3', day: 5, time: '18:00', group: '腿' },
    ]);

    const removeSchedule = (id: string) => {
        setSchedules(s => s.filter(item => item.id !== id));
    };

    const addSchedule = () => {
        const newSchedule: Schedule = {
            id: Date.now().toString(),
            day: 1,
            time: '18:00',
            group: '核心'
        };
        setSchedules([...schedules, newSchedule]);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <a href="/profile" className={styles.backBtn}><ChevronLeft size={24} /></a>
                <h1 className="gradient-text">訓練排程計畫</h1>
            </header>

            <section className={styles.intro}>
                <div className="card glass">
                    <div className={styles.introHeader}>
                        <Bell className={styles.icon} />
                        <h3>定時提醒</h3>
                    </div>
                    <p>設定您的每週訓練節奏，系統將在指定時間提醒您開啟科學化訓練紀錄。</p>
                </div>
            </section>

            <div className={styles.scheduleList}>
                <AnimatePresence>
                    {schedules.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={item.id}
                            className={`${styles.item} card`}
                        >
                            <div className={styles.itemMain}>
                                <div className={styles.daySelector}>
                                    {days.map((d, i) => (
                                        <span key={i} className={`${styles.day} ${item.day === i ? styles.activeDay : ''}`}>
                                            {d}
                                        </span>
                                    ))}
                                </div>
                                <div className={styles.details}>
                                    <div className={styles.timeGroup}>
                                        <Clock size={16} />
                                        <span>{item.time}</span>
                                    </div>
                                    <div className={styles.muscleBadge}>{item.group}</div>
                                </div>
                            </div>
                            <button onClick={() => removeSchedule(item.id)} className={styles.deleteBtn}>
                                <Trash2 size={18} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <button onClick={addSchedule} className={styles.addBtn}>
                <Plus size={20} /> 新增提醒排程
            </button>

            <div style={{ height: '100px' }} />
        </div>
    );
}
