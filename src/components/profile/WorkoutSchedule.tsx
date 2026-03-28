"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Bell, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './WorkoutSchedule.module.css';
import { supabase } from '@/lib/supabase';

const days = ['日', '一', '二', '三', '四', '五', '六'];

interface LocalSchedule {
    id: string;
    day: number;
    time: string;
    group: string;
}

const FALLBACK_SCHEDULES: LocalSchedule[] = [
    { id: 'f-1', day: 1, time: '18:00', group: '胸' },
    { id: 'f-2', day: 3, time: '07:30', group: '背' },
    { id: 'f-3', day: 5, time: '18:00', group: '腿' },
];

export default function WorkoutSchedule() {
    const [schedules, setSchedules] = useState<LocalSchedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setSchedules(FALLBACK_SCHEDULES);
                setLoading(false);
                return;
            }
            const { data } = await supabase
                .from('schedules')
                .select('*')
                .eq('user_id', session.user.id)
                .order('day_of_week');
            if (data && data.length > 0) {
                setSchedules(data.map(s => ({
                    id: String(s.id),
                    day: s.day_of_week,
                    time: s.remind_time ?? '18:00',
                    group: s.target_group,
                })));
            } else {
                setSchedules([]);
            }
            setLoading(false);
        }
        load();
    }, []);

    const removeSchedule = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !id.startsWith('f-')) {
            await supabase
                .from('schedules')
                .delete()
                .eq('id', parseInt(id))
                .eq('user_id', session.user.id);
        }
        setSchedules(s => s.filter(item => item.id !== id));
    };

    const addSchedule = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setSchedules(prev => [...prev, {
                id: Date.now().toString(),
                day: 1,
                time: '18:00',
                group: '核心',
            }]);
            return;
        }
        const { data } = await supabase
            .from('schedules')
            .insert({
                user_id: session.user.id,
                day_of_week: 1,
                target_group: '核心',
                remind_time: '18:00',
                plan_name: null,
            })
            .select()
            .single();
        if (data) {
            setSchedules(prev => [...prev, {
                id: String(data.id),
                day: data.day_of_week,
                time: data.remind_time ?? '18:00',
                group: data.target_group,
            }]);
        }
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
                {loading ? (
                    <div className="text-center text-zinc-500 py-8 text-sm">載入中…</div>
                ) : (
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
                )}
            </div>

            <button onClick={addSchedule} className={styles.addBtn}>
                <Plus size={20} /> 新增提醒排程
            </button>

            <div style={{ height: '100px' }} />
        </div>
    );
}
