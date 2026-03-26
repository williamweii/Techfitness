"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Flame, Clock, Plus, ChevronRight, Droplets, Trophy } from 'lucide-react';
import styles from './Dashboard.module.css';
import WaterTracker from './nutrition/WaterTracker';
import AuthHeader from './ui/AuthHeader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ACTIVITY_DATA = [
    { day: 'Mon', kcal: 320 },
    { day: 'Tue', kcal: 450 },
    { day: 'Wed', kcal: 280 },
    { day: 'Thu', kcal: 500 },
    { day: 'Fri', kcal: 380 },
    { day: 'Sat', kcal: 600 },
    { day: 'Sun', kcal: 400 },
];

const DIET_DATA = [
    { name: 'Protein', value: 140, color: '#c4856a' },
    { name: 'Carbs', value: 180, color: '#7a9e8e' },
    { name: 'Fat', value: 55, color: '#b8a07a' },
];

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export default function Dashboard() {
    const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon..6=Sun
    const [selectedDay, setSelectedDay] = useState(todayIdx);
    const [weekSchedule, setWeekSchedule] = useState<(string | null)[]>(Array(7).fill(null));
    const [showScheduleEditor, setShowScheduleEditor] = useState(false);
    const [availablePlans, setAvailablePlans] = useState<string[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('tf_week_schedule');
            if (saved) setWeekSchedule(JSON.parse(saved));
        } catch {}
        try {
            const plans = localStorage.getItem('tf_workout_plans');
            if (plans) {
                const parsed = JSON.parse(plans);
                setAvailablePlans(parsed.map((p: { name: string }) => p.name));
            }
        } catch {}
        if (availablePlans.length === 0) {
            setAvailablePlans(['胸、肩、三頭肌專項', '背、二頭肌專項', '腿部專項', '全身訓練']);
        }
    }, []);
    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h1 className="gradient-text">TechFitness</h1>
                    <p className={styles.subtitle}>科學化健身訓練平台</p>
                </div>
                <AuthHeader />
            </header>

            {/* Main Stats */}
            <section className={styles.statsGrid}>
                <motion.div whileHover={{ scale: 1.02 }} className={`card ${styles.statCard}`}>
                    <Activity className={styles.statIcon} />
                    <span className={styles.statLabel}>今日訓練量</span>
                    <span className={styles.statValue}>2,450 kg</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className={`card ${styles.statCard}`}>
                    <Flame className={styles.statIcon} style={{ color: '#c4856a' }} />
                    <span className={styles.statLabel}>消耗熱量</span>
                    <span className={styles.statValue}>450 kcal</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className={`card ${styles.statCard}`}>
                    <Clock className={styles.statIcon} style={{ color: '#7a9e8e' }} />
                    <span className={styles.statLabel}>運動時間</span>
                    <span className={styles.statValue}>48 min</span>
                </motion.div>
            </section>

            {/* Split Row: Water & Diet */}
            <section className={styles.splitSection}>
                <div className={styles.halfCard}>
                    <WaterTracker />
                </div>
                <div className={`${styles.halfCard} card`} style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div className={styles.sectionHeader}>
                        <h3>營養比例</h3>
                        <Link href="/nutrition"><ChevronRight size={16} /></Link>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                                <Pie
                                    data={DIET_DATA}
                                    innerRadius={38}
                                    outerRadius={56}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {DIET_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1e1e1e', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className={styles.legend}>
                            {DIET_DATA.map(item => (
                                <div key={item.name} className={styles.legendItem}>
                                    <span className={styles.dot} style={{ background: item.color }} />
                                    <span className={styles.legendText}>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* Activity Trend */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>活動趨勢</h2>
                </div>
                <div className="card" style={{ height: '250px', padding: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ACTIVITY_DATA}>
                            <defs>
                                <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="day" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#1e1e1e', border: 'none', borderRadius: '8px' }}
                                cursor={{ stroke: '#ffffff30' }}
                            />
                            <Area type="monotone" dataKey="kcal" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorKcal)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>今日訓練清單</h2>
                    <button className={styles.addButton} onClick={() => setShowScheduleEditor(true)}><Plus size={20} /></button>
                </div>

                {/* Day pills */}
                <div className="flex gap-1.5 mb-4 overflow-x-auto">
                    {DAY_LABELS.map((d, i) => {
                        const isToday = i === todayIdx;
                        const hasPlan = !!weekSchedule[i];
                        return (
                            <button
                                key={d}
                                onClick={() => setSelectedDay(i)}
                                className={`flex-1 min-w-[2.5rem] py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                    selectedDay === i
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                        : isToday
                                            ? 'border-purple-500/30 bg-purple-500/8 text-zinc-300'
                                            : 'border-transparent bg-white/5 text-zinc-500'
                                }`}
                            >
                                <div>{d}</div>
                                {hasPlan && <div className="w-1 h-1 rounded-full bg-purple-400 mx-auto mt-1" />}
                            </button>
                        );
                    })}
                </div>

                {/* Today's workout card */}
                {weekSchedule[selectedDay] ? (
                    <div className={styles.workoutCard}>
                        <div className={styles.workoutInfo}>
                            <h3>{weekSchedule[selectedDay]}</h3>
                            <p className={styles.workoutMeta}><Clock size={14} /> 60 分鐘 • 12 組</p>
                        </div>
                        <Link href="/workout" className={styles.startButton}>開始</Link>
                    </div>
                ) : (
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p className="text-zinc-500 text-sm mb-2">今日尚未安排訓練</p>
                        <button
                            onClick={() => setShowScheduleEditor(true)}
                            className="text-purple-400 text-sm font-semibold hover:text-purple-300 transition-colors"
                        >+ 安排訓練計畫</button>
                    </div>
                )}
            </section>

            {/* Schedule Editor Modal */}
            {showScheduleEditor && (
                <div className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowScheduleEditor(false)}>
                    <div className="w-[min(100%,440px)] bg-zinc-900 border border-white/10 rounded-3xl p-6 max-h-[85dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-white">每週訓練排程</h3>
                            <button onClick={() => setShowScheduleEditor(false)} className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-zinc-400 text-lg">×</button>
                        </div>
                        <div className="space-y-3">
                            {DAY_LABELS.map((d, i) => (
                                <div key={d} className="flex items-center gap-3">
                                    <span className={`w-8 text-sm font-bold ${i === todayIdx ? 'text-purple-400' : 'text-zinc-400'}`}>{d}</span>
                                    <select
                                        value={weekSchedule[i] || ''}
                                        onChange={e => {
                                            const next = [...weekSchedule];
                                            next[i] = e.target.value || null;
                                            setWeekSchedule(next);
                                            localStorage.setItem('tf_week_schedule', JSON.stringify(next));
                                        }}
                                        className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-purple-500/50 transition-colors appearance-none"
                                    >
                                        <option value="">休息日</option>
                                        {availablePlans.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowScheduleEditor(false)} className="w-full mt-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors">完成</button>
                    </div>
                </div>
            )}

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>社群進度</h2>
                    <Link href="/community/leaderboard" className={styles.seeAll}>查看排行 <ChevronRight size={14} /></Link>
                </div>
                <div className={`${styles.leaderboardPreview} card`}>
                    <div className={styles.rankItem}>
                        <Trophy size={16} className="text-yellow-500" />
                        <span className={styles.rankLabel}>目前排名</span>
                        <span className={styles.rankValue}>#4</span>
                    </div>
                    <div className={styles.rankItem}>
                        <Flame size={16} className="text-orange-500" />
                        <span className={styles.rankLabel}>連續週數</span>
                        <span className={styles.rankValue}>12 週</span>
                    </div>
                </div>
            </section>

            <div style={{ height: '100px' }} />
        </div>
    );
}
