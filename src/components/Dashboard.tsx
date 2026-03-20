"use client";

import React from 'react';
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
    { name: 'Protein', value: 140, color: '#c026d3' },
    { name: 'Carbs', value: 180, color: '#7c3aed' },
    { name: 'Fat', value: 55, color: '#ec4899' },
];

export default function Dashboard() {
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
                <motion.div whileHover={{ scale: 1.02 }} className="card">
                    <Activity className={styles.statIcon} />
                    <span className={styles.statLabel}>今日訓練量</span>
                    <span className={styles.statValue}>2,450 kg</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="card">
                    <Flame className={styles.statIcon} style={{ color: '#ef4444' }} />
                    <span className={styles.statLabel}>預估消耗熱量</span>
                    <span className={styles.statValue}>450 kcal</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="card">
                    <Clock className={styles.statIcon} style={{ color: '#3b82f6' }} />
                    <span className={styles.statLabel}>運動時間</span>
                    <span className={styles.statValue}>48 min</span>
                </motion.div>
            </section>

            {/* Split Row: Water & Diet */}
            <section className={styles.splitSection}>
                <div className={styles.halfCard}>
                    <WaterTracker />
                </div>
                <div className={`${styles.halfCard} card`}>
                    <div className={styles.sectionHeader}>
                        <h3>營養比例</h3>
                        <Link href="/nutrition"><ChevronRight size={16} /></Link>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={DIET_DATA}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
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
                    <button className={styles.addButton}><Plus size={20} /></button>
                </div>
                <div className={styles.workoutCard}>
                    <div className={styles.workoutInfo}>
                        <h3>胸、肩、三頭肌專項</h3>
                        <p className={styles.workoutMeta}><Clock size={14} /> 60 分鐘 • 12 組</p>
                    </div>
                    <Link href="/workout" className={styles.startButton}>開始</Link>
                </div>
            </section>

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
