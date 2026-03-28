"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Flame, CheckSquare, Plus, ChevronRight, Trophy } from 'lucide-react';
import styles from './Dashboard.module.css';
import WaterTracker from './nutrition/WaterTracker';
import AuthHeader from './ui/AuthHeader';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useUser } from '@/hooks/useUser';
import { supabase, todayISO, daysAgoISO } from '@/lib/supabase';

// ── Static config ─────────────────────────────────────────────────────────────
const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const MACRO_COLORS = { protein: '#c4856a', carbs: '#7a9e8e', fat: '#b8a07a' };

function buildLast7(): { date: string; label: string }[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
        return { date: iso, label };
    });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChartDay { day: string; vol: number }
interface MacroSlice { name: string; value: number; color: string; [key: string]: string | number }

export default function Dashboard() {
    const { user } = useUser();
    const todayIdx = (new Date().getDay() + 6) % 7;
    const [selectedDay, setSelectedDay] = useState(todayIdx);
    const [weekSchedule, setWeekSchedule] = useState<(string | null)[]>(Array(7).fill(null));
    const [showScheduleEditor, setShowScheduleEditor] = useState(false);
    const [availablePlans, setAvailablePlans] = useState<string[]>([]);

    // ── Real data state ───────────────────────────────────────────────────────
    const [statsLoading, setStatsLoading] = useState(true);
    const [todayVolume, setTodayVolume] = useState(0);
    const [todayCalories, setTodayCalories] = useState(0);
    const [todayCompletedSets, setTodayCompletedSets] = useState(0);
    const [weeklyActivity, setWeeklyActivity] = useState<ChartDay[]>(() =>
        buildLast7().map(d => ({ day: d.label, vol: 0 }))
    );
    const [todayMacros, setTodayMacros] = useState<MacroSlice[]>([
        { name: 'Protein', value: 0, color: MACRO_COLORS.protein },
        { name: 'Carbs',   value: 0, color: MACRO_COLORS.carbs },
        { name: 'Fat',     value: 0, color: MACRO_COLORS.fat },
    ]);

    // ── Fetch dashboard stats ─────────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        if (!user) { setStatsLoading(false); return; }

        const today = todayISO();
        const last7 = buildLast7();
        const weekStart = last7[0].date;

        const [workoutRes, nutritionRes] = await Promise.all([
            supabase
                .from('workout_logs')
                .select('weight, reps, sets, logged_date')
                .eq('user_id', user.id)
                .gte('logged_date', weekStart),
            supabase
                .from('nutrition_logs')
                .select('calories, protein, carbs, fat')
                .eq('user_id', user.id)
                .eq('logged_date', today),
        ]);

        // ── Workout stats ──────────────────────────────────────────────────
        const workoutRows = workoutRes.data ?? [];
        const todayWorkout = workoutRows.filter(r => r.logged_date === today);

        setTodayVolume(Math.round(
            todayWorkout.reduce((s, r) => s + r.weight * r.reps * r.sets, 0)
        ));
        setTodayCompletedSets(
            todayWorkout.reduce((s, r) => s + r.sets, 0)
        );

        // Group by date for weekly chart
        const volByDate: Record<string, number> = {};
        workoutRows.forEach(r => {
            volByDate[r.logged_date] = (volByDate[r.logged_date] ?? 0) + r.weight * r.reps * r.sets;
        });
        setWeeklyActivity(last7.map(d => ({
            day: d.label,
            vol: Math.round(volByDate[d.date] ?? 0),
        })));

        // ── Nutrition stats ────────────────────────────────────────────────
        const nutRows = nutritionRes.data ?? [];
        setTodayCalories(Math.round(nutRows.reduce((s, r) => s + r.calories, 0)));
        setTodayMacros([
            { name: 'Protein', value: Math.round(nutRows.reduce((s, r) => s + r.protein, 0)), color: MACRO_COLORS.protein },
            { name: 'Carbs',   value: Math.round(nutRows.reduce((s, r) => s + r.carbs, 0)),   color: MACRO_COLORS.carbs },
            { name: 'Fat',     value: Math.round(nutRows.reduce((s, r) => s + r.fat, 0)),     color: MACRO_COLORS.fat },
        ]);

        setStatsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // stable: don't recreate on TOKEN_REFRESHED

    useEffect(() => { loadStats(); }, [loadStats]);

    // ── Schedule & plans (Supabase for logged-in, localStorage for guest) ────
    useEffect(() => {
        async function loadScheduleAndPlans() {
            // Always read localStorage as migration source / guest fallback
            const lsSchedule = (() => {
                try { const s = localStorage.getItem('tf_week_schedule'); return s ? JSON.parse(s) as (string|null)[] : null; } catch { return null; }
            })();
            const lsPlans = (() => {
                try { const p = localStorage.getItem('tf_workout_plans'); if (p) { const a = JSON.parse(p) as string[]; if (Array.isArray(a) && a.length) return a; } } catch {} return null;
            })();
            const DEFAULT_PLANS = ['胸、肩、三頭肌專項', '背、二頭肌專項', '腿部專項', '全身訓練'];

            if (!user) {
                if (lsSchedule) setWeekSchedule(lsSchedule);
                setAvailablePlans(lsPlans ?? DEFAULT_PLANS);
                return;
            }

            // Logged-in: load from Supabase in parallel
            const [schedRes, plansRes] = await Promise.all([
                supabase.from('week_schedules').select('day_of_week, plan_name').eq('user_id', user.id),
                supabase.from('user_plans').select('plan_name').eq('user_id', user.id).order('created_at'),
            ]);

            // Week schedule
            if (schedRes.data && schedRes.data.length > 0) {
                const sched = Array(7).fill(null) as (string|null)[];
                schedRes.data.forEach(r => { sched[r.day_of_week] = r.plan_name; });
                setWeekSchedule(sched);
            } else if (lsSchedule) {
                // First login: migrate localStorage schedule
                const rows = lsSchedule
                    .map((plan_name, day_of_week) => plan_name ? { user_id: user.id, day_of_week, plan_name } : null)
                    .filter(Boolean) as { user_id: string; day_of_week: number; plan_name: string }[];
                if (rows.length) await supabase.from('week_schedules').upsert(rows, { onConflict: 'user_id,day_of_week' });
                setWeekSchedule(lsSchedule);
            }

            // Available plans
            if (plansRes.data && plansRes.data.length > 0) {
                setAvailablePlans(plansRes.data.map(p => p.plan_name as string));
            } else {
                setAvailablePlans(lsPlans ?? DEFAULT_PLANS);
            }
        }

        loadScheduleAndPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // re-run only when user actually changes (not on TOKEN_REFRESHED)

    // Keep tf_today_plan in sync (used by WorkoutLog to pre-select today's plan)
    useEffect(() => {
        const todayPlan = weekSchedule[todayIdx];
        if (todayPlan) localStorage.setItem('tf_today_plan', todayPlan);
        else localStorage.removeItem('tf_today_plan');
    }, [weekSchedule, todayIdx]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const fmt = (n: number) => n > 0 ? n.toLocaleString() : '--';
    const hasMacros = todayMacros.some(m => m.value > 0);

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
                    <span className={styles.statValue}>
                        {statsLoading ? '…' : `${fmt(todayVolume)} ${todayVolume > 0 ? 'kg' : ''}`}
                    </span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className={`card ${styles.statCard}`}>
                    <Flame className={styles.statIcon} style={{ color: '#c4856a' }} />
                    <span className={styles.statLabel}>今日攝取</span>
                    <span className={styles.statValue}>
                        {statsLoading ? '…' : `${fmt(todayCalories)} ${todayCalories > 0 ? 'kcal' : ''}`}
                    </span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className={`card ${styles.statCard}`}>
                    <CheckSquare className={styles.statIcon} style={{ color: '#7a9e8e' }} />
                    <span className={styles.statLabel}>完成組數</span>
                    <span className={styles.statValue}>
                        {statsLoading ? '…' : `${fmt(todayCompletedSets)} ${todayCompletedSets > 0 ? '組' : ''}`}
                    </span>
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
                    {hasMacros ? (
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie
                                        data={todayMacros}
                                        innerRadius={38}
                                        outerRadius={56}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {todayMacros.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1e1e1e', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(v: number | string | undefined) => [`${v ?? 0}g`]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className={styles.legend}>
                                {todayMacros.map(item => (
                                    <div key={item.name} className={styles.legendItem}>
                                        <span className={styles.dot} style={{ background: item.color }} />
                                        <span className={styles.legendText}>{item.name} {item.value}g</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[140px]">
                            <p className="text-zinc-500 text-xs text-center">今日尚無飲食記錄<br /><Link href="/nutrition" className="text-purple-400">前往記錄</Link></p>
                        </div>
                    )}
                </div>
            </section>

            {/* Activity Trend */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>訓練量趨勢（近 7 日）</h2>
                </div>
                <div className="card" style={{ height: '250px', padding: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyActivity}>
                            <defs>
                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="day" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#1e1e1e', border: 'none', borderRadius: '8px' }}
                                cursor={{ stroke: '#ffffff30' }}
                                formatter={(v: number | string | undefined) => [`${Number(v ?? 0).toLocaleString()} kg`, '訓練量']}
                            />
                            <Area type="monotone" dataKey="vol" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVol)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Today's Workout */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>今日訓練清單</h2>
                    <button className={styles.addButton} onClick={() => setShowScheduleEditor(true)}><Plus size={20} /></button>
                </div>

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

                {weekSchedule[selectedDay] ? (
                    <div className={styles.workoutCard}>
                        <div className={styles.workoutInfo}>
                            <h3>{weekSchedule[selectedDay]}</h3>
                            <p className={styles.workoutMeta}>點擊開始今日訓練</p>
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
                                            if (user) {
                                                supabase.from('week_schedules').upsert(
                                                    { user_id: user.id, day_of_week: i, plan_name: e.target.value || null },
                                                    { onConflict: 'user_id,day_of_week' }
                                                );
                                            } else {
                                                localStorage.setItem('tf_week_schedule', JSON.stringify(next));
                                            }
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

            {/* Community */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>社群進度</h2>
                    <Link href="/community/leaderboard" className={styles.seeAll}>查看排行 <ChevronRight size={14} /></Link>
                </div>
                <div className={`${styles.leaderboardPreview} card`}>
                    <div className={styles.rankItem}>
                        <Trophy size={16} className="text-yellow-500" />
                        <span className={styles.rankLabel}>目前排名</span>
                        <span className={styles.rankValue}>--</span>
                    </div>
                    <div className={styles.rankItem}>
                        <Flame size={16} className="text-orange-500" />
                        <span className={styles.rankLabel}>連續週數</span>
                        <span className={styles.rankValue}>--</span>
                    </div>
                </div>
            </section>

            <div style={{ height: '100px' }} />
        </div>
    );
}
