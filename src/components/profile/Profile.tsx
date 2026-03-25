"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings, LogOut, ChevronRight, MapPin, CreditCard, ShieldCheck, BarChart2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Profile.module.css';
import ProgressChart from '@/components/ui/ProgressChart';
import GoalScheduler from './GoalScheduler';
import MetricsForm from '@/components/metrics/MetricsForm';
import HeroRings from './HeroRings';

export default function Profile() {
    const [user] = useState({
        name: "Felix Hsu",
        level: "高級訓練者",
        status: "premium",
        joined: "2025年6月",
        workouts: 142,
        streak: 12
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.topActions}>
                    <Link href="/settings" className={styles.iconBtn}><Settings size={20} /></Link>
                    <button className={styles.iconBtn}><LogOut size={20} /></button>
                </div>

                <div className={styles.userSection}>
                    <div className={styles.avatarWrapper}>
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className={styles.avatar} />
                        {user.status === 'premium' && <div className={styles.premiumBadge}><ShieldCheck size={12} fill="white" /></div>}
                    </div>
                    <h1 className={styles.userName}>{user.name}</h1>
                    <p className={styles.userLevel}>{user.level}</p>
                </div>
            </header>

            <section className={styles.content}>
                {/* Today's activity rings — full width, same as cards below */}
                <div className="mb-10">
                    <HeroRings />
                </div>

                <ProgressChart />

                <GoalScheduler />

                {/* Fixed FAB interaction for daily stats */}
                <MetricsForm />

                {/* My Data */}
                <MyDataSection isPremium={user.status === 'premium'} />

                <div className={styles.menuSection}>
                    <h2 className={styles.sectionTitle}>帳戶管理</h2>
                    <div className={styles.menuList}>
                        <MenuLink icon={<CreditCard size={18} />} label="訂閱計畫" badge="Premium" href="/videos" />
                        <MenuLink icon={<MapPin size={18} />} label="我的運動館" href="#" />
                    </div>
                </div>

                <div className={styles.menuSection}>
                    <h2 className={styles.sectionTitle}>目標與設定</h2>
                    <div className={styles.menuList}>
                        <div className={styles.settingItem}>
                            <div className={styles.settingLabel}>
                                <h3>每日熱量目標</h3>
                                <p>根據您的 TDEE 計算</p>
                            </div>
                            <span className={styles.settingValue}>2,450 kcal</span>
                        </div>
                    </div>
                </div>
            </section>
            
            <div className="h-24 w-full" />
        </div>
    );
}

function MenuLink({ icon, label, badge, href }: any) {
    return (
        <a href={href} className={styles.menuItem}>
            <div className={styles.menuLeft}>
                <div className={styles.menuIcon}>{icon}</div>
                <span>{label}</span>
            </div>
            <div className={styles.menuRight}>
                {badge && <span className={styles.menuBadge}>{badge}</span>}
                <ChevronRight size={16} />
            </div>
        </a>
    );
}

// ---- My Data Section ----
const BODY_TABS = [
    { id: 'weight', label: '體重', unit: 'kg', color: '#c4856a' },
    { id: 'fat', label: '體脂', unit: '%', color: '#a855f7' },
    { id: 'muscle', label: '骨骼肌', unit: 'kg', color: '#22c55e' },
] as const;

type BodyTabId = typeof BODY_TABS[number]['id'];

const MOCK_DATA: Record<BodyTabId, { date: string; value: number }[]> = {
    weight: [
        { date: '3/1', value: 75.2 }, { date: '3/8', value: 74.8 },
        { date: '3/15', value: 74.3 }, { date: '3/22', value: 73.9 },
    ],
    fat: [
        { date: '3/1', value: 18.2 }, { date: '3/8', value: 17.8 },
        { date: '3/15', value: 17.5 }, { date: '3/22', value: 17.1 },
    ],
    muscle: [
        { date: '3/1', value: 34.1 }, { date: '3/8', value: 34.3 },
        { date: '3/15', value: 34.6 }, { date: '3/22', value: 34.9 },
    ],
};

function MiniSparkline({ data, color }: { data: { value: number }[]; color: string }) {
    if (data.length < 2) return null;
    const vals = data.map(d => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const W = 200; const H = 52;
    const pts = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - min) / range) * (H - 10) - 5;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 52 }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {vals.map((v, i) => {
                const x = (i / (vals.length - 1)) * W;
                const y = H - ((v - min) / range) * (H - 10) - 5;
                return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
            })}
        </svg>
    );
}

function MyDataSection({ isPremium }: { isPremium: boolean }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<BodyTabId>('weight');
    const activeTab = BODY_TABS.find(t => t.id === tab)!;
    const data = MOCK_DATA[tab];
    const latest = data[data.length - 1].value;
    const delta = +(data[data.length - 1].value - data[0].value).toFixed(1);

    return (
        <>
            <div className={styles.menuSection}>
                <h2 className={styles.sectionTitle}>數據分析</h2>
                <div className={styles.menuList}>
                    <button
                        onClick={() => setOpen(true)}
                        className={`${styles.menuItem} w-full text-left`}
                    >
                        <div className={styles.menuLeft}>
                            <div className={styles.menuIcon}><BarChart2 size={18} /></div>
                            <span>我的數據</span>
                        </div>
                        <div className={styles.menuRight}>
                            {!isPremium && <span className={styles.menuBadge}>Premium</span>}
                            <ChevronRight size={16} />
                        </div>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-black/80 flex items-end justify-center"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className="w-[min(100%,580px)] bg-zinc-900 border border-white/10 rounded-t-3xl pb-12 min-h-[72dvh] max-h-[95dvh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-4" />
                            <div className="px-5 mb-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold">我的數據</h2>
                                {!isPremium && (
                                    <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                        <Lock size={10} />Premium 功能
                                    </span>
                                )}
                            </div>

                            {/* Body tabs */}
                            <div className="flex gap-2 px-5 mb-5">
                                {BODY_TABS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2"
                                        style={tab === t.id
                                            ? { borderColor: t.color, background: `${t.color}18`, color: t.color }
                                            : { borderColor: 'transparent', background: 'rgba(255,255,255,0.05)', color: '#71717a' }
                                        }
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Chart card */}
                            <div className="mx-5 bg-zinc-800/50 border border-white/8 rounded-2xl p-5 mb-4 relative overflow-hidden">
                                {!isPremium && (
                                    <div className="absolute inset-0 rounded-2xl backdrop-blur-md bg-black/50 z-10 flex flex-col items-center justify-center gap-2">
                                        <Lock size={22} className="text-purple-400" />
                                        <p className="text-sm text-zinc-300 font-medium">升級 Premium 解鎖完整圖表</p>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-2xl font-black" style={{ color: activeTab.color }}>
                                            {latest} <span className="text-sm font-medium text-zinc-400">{activeTab.unit}</span>
                                        </div>
                                        <div className={`text-xs font-semibold mt-0.5 ${delta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} {activeTab.unit}（本月）
                                        </div>
                                    </div>
                                    <div className="flex gap-3 overflow-hidden flex-nowrap">
                                        {data.map((d, i) => (
                                            <div key={i} className="text-center">
                                                <div className="text-xs font-bold text-zinc-300">{d.value}</div>
                                                <div className="text-[9px] text-zinc-500">{d.date}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <MiniSparkline data={data} color={activeTab.color} />
                            </div>

                            {/* Performance placeholders */}
                            <div className="px-5 grid grid-cols-2 gap-3 pb-6">
                                {[
                                    { label: '運動表現', emoji: '⚡', desc: '最大力量、體能趨勢', locked: !isPremium },
                                    { label: '飲食表現', emoji: '🥗', desc: '熱量達成率、宏量統計', locked: !isPremium },
                                ].map(card => (
                                    <div key={card.label} className="relative bg-zinc-800/50 border border-white/8 rounded-2xl p-4 overflow-hidden">
                                        {card.locked && (
                                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                                                <Lock size={16} className="text-zinc-400" />
                                            </div>
                                        )}
                                        <div className="text-xl mb-1">{card.emoji}</div>
                                        <div className="text-sm font-bold text-zinc-200">{card.label}</div>
                                        <div className="text-[11px] text-zinc-500 mt-0.5">{card.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
