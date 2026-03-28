"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Lock, ScanLine } from 'lucide-react';
import styles from './NutritionPage.module.css';
import FastingTimer from './FastingTimer';
import AiScanner from './AiScanner';
import FoodSearch from './FoodSearch';
import { AnimatePresence } from 'framer-motion';
import { supabase, todayISO, daysAgoISO, type NutritionLog, type MealType } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';

// ─── local shape used by UI (superset of DB row) ─────────────────────────────
interface UILog {
    id: number | null; // null while optimistically inserting
    dbId?: number;     // the real DB id once confirmed
    name: string;
    meal_type: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    micronutrients?: Record<string, number>;
}

const TARGETS = { calories: 2400, protein: 180, carbs: 250, fat: 70 };

const MICRONUTRIENT_TARGETS = {
    vitA: 900, vitC: 90, vitD: 20,
    iron: 18, calcium: 1000, magnesium: 400,
};

function dbRowToUI(row: NutritionLog): UILog {
    return {
        id: row.id,
        dbId: row.id,
        name: row.food_name ?? '未命名食物',
        meal_type: row.meal_type as MealType,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
    };
}

export default function NutritionTracker() {
    const { user, isPremium } = useUser();

    const [showScanner, setShowScanner] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [editingFood, setEditingFood] = useState<UILog | null>(null);
    const [logs, setLogs] = useState<UILog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [activeTab, setActiveTab] = useState<'log' | 'analytics'>('log');

    // Analytics data from DB
    const [weekCalories, setWeekCalories] = useState<Record<string, number>>({});

    // ── Load today's logs ──────────────────────────────────────────────────
    const loadTodayLogs = useCallback(async () => {
        if (!user) { setLoadingLogs(false); return; }
        setLoadingLogs(true);
        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('logged_date', todayISO())
            .order('created_at', { ascending: true });
        if (!error && data) setLogs(data.map(dbRowToUI));
        setLoadingLogs(false);
    }, [user]);

    // ── Load week analytics ────────────────────────────────────────────────
    const loadWeekAnalytics = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('nutrition_logs')
            .select('logged_date, calories')
            .eq('user_id', user.id)
            .gte('logged_date', daysAgoISO(6))
            .order('logged_date', { ascending: true });
        if (data) {
            const map: Record<string, number> = {};
            data.forEach(r => {
                map[r.logged_date] = (map[r.logged_date] ?? 0) + r.calories;
            });
            setWeekCalories(map);
        }
    }, [user]);

    useEffect(() => { loadTodayLogs(); }, [loadTodayLogs]);
    useEffect(() => { if (activeTab === 'analytics') loadWeekAnalytics(); }, [activeTab, loadWeekAnalytics]);

    // ── Add / update food (optimistic) ────────────────────────────────────
    const handleAddFood = async (food: any) => {
        if (!user) return;

        const mealType: MealType = food.meal_type ?? 'snack';
        const today = todayISO();

        // Determine if we're updating an existing log
        const existingLog = editingFood?.dbId
            ? logs.find(l => l.dbId === editingFood.dbId)
            : null;

        if (existingLog?.dbId) {
            // ── UPDATE ─────────────────────────────────────────────────────
            const updates = {
                food_name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                meal_type: mealType,
            };
            // Optimistic
            setLogs(prev => prev.map(l => l.dbId === existingLog.dbId ? { ...l, ...updates, name: food.name } : l));
            await supabase.from('nutrition_logs').update(updates).eq('id', existingLog.dbId);
        } else {
            // ── INSERT ─────────────────────────────────────────────────────
            const tempId = Date.now();
            const uiRow: UILog = {
                id: tempId,
                name: food.name,
                meal_type: mealType,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                micronutrients: food.micronutrients,
            };
            // Optimistic
            setLogs(prev => [...prev, uiRow]);

            const { data, error } = await supabase.from('nutrition_logs').insert({
                user_id: user.id,
                food_name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                meal_type: mealType,
                logged_date: today,
            }).select().single();

            if (error) {
                // Rollback optimistic update
                setLogs(prev => prev.filter(l => l.id !== tempId));
                return;
            }
            if (data) {
                // Replace temp row with real DB id
                setLogs(prev => prev.map(l => l.id === tempId ? { ...dbRowToUI(data), micronutrients: food.micronutrients } : l));
            }
        }

        setShowSearch(false);
        setShowScanner(false);
        setEditingFood(null);
    };

    // ── Delete food ────────────────────────────────────────────────────────
    const handleDeleteFood = async (log: UILog) => {
        setLogs(prev => prev.filter(l => l.id !== log.id)); // optimistic
        if (log.dbId) {
            await supabase.from('nutrition_logs').delete().eq('id', log.dbId);
        }
    };

    // ── Computed totals ────────────────────────────────────────────────────
    const totals = logs.reduce((acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        vitA: acc.vitA + (item.micronutrients?.vitA || 0),
        vitC: acc.vitC + (item.micronutrients?.vitC || 0),
        vitD: acc.vitD + (item.micronutrients?.vitD || 0),
        iron: acc.iron + (item.micronutrients?.iron || 0),
        calcium: acc.calcium + (item.micronutrients?.calcium || 0),
        magnesium: acc.magnesium + (item.micronutrients?.magnesium || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, vitA: 0, vitC: 0, vitD: 0, iron: 0, calcium: 0, magnesium: 0 });

    // ── Build 7-day bar chart data ─────────────────────────────────────────
    const weekBars = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayLabel = ['日','一','二','三','四','五','六'][d.getDay()];
        const isToday = i === 6;
        const cal = isToday ? totals.calories : (weekCalories[iso] ?? 0);
        return { label: dayLabel, cal, isToday };
    });

    const barMax = Math.max(...weekBars.map(b => b.cal), TARGETS.calories);
    const weekAvg = weekBars.filter(b => b.cal > 0).length > 0
        ? Math.round(weekBars.reduce((s, b) => s + b.cal, 0) / weekBars.filter(b => b.cal > 0).length)
        : 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="gradient-text">科學化飲食</h1>
                <p>精準掌控宏量營養素，達成您的目標</p>
            </header>

            {/* Tab bar */}
            <div className="flex gap-2 px-4 mb-4">
                {(['log', 'analytics'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                            activeTab === t
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-white/6 text-zinc-400 hover:bg-white/10'
                        }`}
                    >
                        {t === 'log' ? '📋 紀錄' : '📊 分析'}
                    </button>
                ))}
            </div>

            {activeTab === 'log' ? (
                <>
                    {/* Macro summary */}
                    <section className={styles.macroSummary}>
                        <div className="card glass">
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>剩餘預算</span>
                                    <span className={styles.value}>{TARGETS.calories - totals.calories}</span>
                                    <span className={styles.unit}>kcal</span>
                                </div>
                                <div className={styles.summaryDivider} />
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>已攝取</span>
                                    <span className={styles.value}>{totals.calories}</span>
                                    <span className={styles.unit}>kcal</span>
                                </div>
                            </div>
                            <div className={styles.detailBars}>
                                <MacroBar label="蛋白質" current={totals.protein} target={TARGETS.protein} color="#c026d3" />
                                <MacroBar label="碳水化合物" current={totals.carbs} target={TARGETS.carbs} color="#7c3aed" />
                                <MacroBar label="脂肪" current={totals.fat} target={TARGETS.fat} color="#ec4899" />
                            </div>
                        </div>
                    </section>

                    {/* Quick actions */}
                    <div className={styles.actionGrid}>
                        <button className={styles.actionBtn} onClick={() => setShowSearch(true)}>
                            <Search size={20} />
                            <span>搜尋食物</span>
                        </button>
                        <button className={`${styles.actionBtn} ${styles.scanBtn}`} onClick={() => setShowScanner(true)}>
                            <ScanLine size={20} />
                            <span>AI 掃描</span>
                        </button>
                    </div>

                    {/* Food log */}
                    <div className={styles.foodList}>
                        <h3>今日紀錄</h3>
                        {loadingLogs ? (
                            <p className={styles.emptyText}>載入中…</p>
                        ) : logs.length === 0 ? (
                            <p className={styles.emptyText}>尚未新增食物</p>
                        ) : (
                            logs.map(log => (
                                <div
                                    key={log.id}
                                    className={styles.logItem}
                                    onClick={() => { setEditingFood(log); setShowSearch(true); }}
                                    title="點擊修改"
                                >
                                    <div>
                                        <div className={styles.logName}>{log.name}</div>
                                        <div className={styles.logSub}>{log.calories} kcal · {log.meal_type}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={styles.logMacros}>P{log.protein} C{log.carbs} F{log.fat}</div>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDeleteFood(log); }}
                                            className="text-zinc-600 hover:text-rose-400 transition-colors text-xs px-2 py-1"
                                        >✕</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <FastingTimer />

                    {/* Micronutrients */}
                    <section className={styles.premiumSection}>
                        <div className={styles.premiumHeader}>
                            <h3>微量營養素 (維生素、礦物質)</h3>
                            <span className={styles.premiumBadge}>PREMIUM</span>
                        </div>
                        <div className="card glass p-4 relative overflow-hidden">
                            <div className={`${styles.microGrid} ${!isPremium ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
                                <MacroBar label="維生素 A" current={totals.vitA} target={MICRONUTRIENT_TARGETS.vitA} color="#f59e0b" unit="mcg" />
                                <MacroBar label="維生素 C" current={totals.vitC} target={MICRONUTRIENT_TARGETS.vitC} color="#fbbf24" unit="mg" />
                                <MacroBar label="維生素 D" current={totals.vitD} target={MICRONUTRIENT_TARGETS.vitD} color="#ea580c" unit="mcg" />
                                <MacroBar label="鐵" current={totals.iron} target={MICRONUTRIENT_TARGETS.iron} color="#ef4444" unit="mg" />
                                <MacroBar label="鈣" current={totals.calcium} target={MICRONUTRIENT_TARGETS.calcium} color="#3b82f6" unit="mg" />
                                <MacroBar label="鎂" current={totals.magnesium} target={MICRONUTRIENT_TARGETS.magnesium} color="#6366f1" unit="mg" />
                            </div>
                            {!isPremium && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <Lock className="text-white mb-2" size={24} />
                                    <p className="text-white font-bold text-sm">升級 Premium 解鎖微量元素分析</p>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            ) : (
                /* ── ANALYTICS TAB ── */
                <div className="px-4 pb-32 flex flex-col gap-6 overflow-x-hidden pt-2">

                    {/* Macro stat cards */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: '蛋白質', val: totals.protein, target: TARGETS.protein, color: '#c026d3' },
                            { label: '碳水', val: totals.carbs, target: TARGETS.carbs, color: '#7c3aed' },
                            { label: '脂肪', val: totals.fat, target: TARGETS.fat, color: '#ec4899' },
                        ].map(({ label, val, target, color }) => {
                            const pct = Math.min(Math.round((val / target) * 100), 100);
                            const r = 18, circ = 2 * Math.PI * r;
                            return (
                                <div key={label} className="rounded-2xl bg-zinc-800/80 border border-white/12 p-4 pb-3 flex flex-col items-center gap-1.5 min-w-0">
                                    <svg width="52" height="52" className="-rotate-90">
                                        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                                        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
                                            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                                            strokeLinecap="round" />
                                    </svg>
                                    <div className="text-center w-full">
                                        <div className="text-white font-bold text-sm">{pct}%</div>
                                        <div className="text-zinc-400 text-[10px] truncate">{label}</div>
                                        <div className="text-zinc-500 text-[9px] truncate">{val}g / {target}g</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Calorie trend — real DB data */}
                    <div className="rounded-2xl bg-zinc-800/80 border border-white/12 p-6">
                        <div className="flex justify-between items-baseline mb-4">
                            <h3 className="text-sm font-semibold text-zinc-200">本週熱量趨勢</h3>
                            <span className="text-[11px] text-zinc-500">均 {weekAvg.toLocaleString()} kcal</span>
                        </div>
                        <div className="relative">
                            <div className="absolute left-0 right-0 border-t border-dashed border-purple-500/40 pointer-events-none"
                                style={{ bottom: `${(TARGETS.calories / barMax) * 100}px` }}>
                                <span className="absolute -top-4 right-0 text-[9px] text-purple-400">目標</span>
                            </div>
                            <div className="flex items-end gap-1.5 h-[100px]">
                                {weekBars.map(({ label, cal, isToday }) => {
                                    const h = barMax > 0 ? Math.max(Math.round((cal / barMax) * 100), cal > 0 ? 4 : 0) : 0;
                                    return (
                                        <div key={label} className="flex-1 flex flex-col items-center gap-1">
                                            <div className="w-full rounded-lg transition-all relative overflow-hidden"
                                                style={{ height: `${h}px`, background: isToday ? 'linear-gradient(to top, #c026d3, #7c3aed)' : 'rgba(255,255,255,0.1)' }}>
                                                {isToday && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-lg" />}
                                            </div>
                                            <span className={`text-[9px] font-medium ${isToday ? 'text-purple-400' : 'text-zinc-600'}`}>{label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Weekly summary — real DB data aggregated */}
                    <div className="rounded-2xl bg-zinc-800/80 border border-white/12 p-6">
                        <h3 className="text-sm font-semibold text-zinc-200 mb-3">本週攝取總結</h3>
                        <div className="space-y-3">
                            {[
                                { label: '卡路里', val: totals.calories, target: TARGETS.calories, unit: 'kcal', color: '#c026d3' },
                                { label: '蛋白質', val: totals.protein, target: TARGETS.protein, unit: 'g', color: '#7c3aed' },
                                { label: '碳水化合物', val: totals.carbs, target: TARGETS.carbs, unit: 'g', color: '#6366f1' },
                                { label: '脂肪', val: totals.fat, target: TARGETS.fat, unit: 'g', color: '#ec4899' },
                            ].map(r => {
                                const rate = Math.min(Math.round((r.val / r.target) * 100), 100);
                                const good = rate >= 70 && rate <= 115;
                                return (
                                    <div key={r.label} className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                                        <div className="flex-1 text-xs text-zinc-300 truncate">{r.label}</div>
                                        <div className="text-xs text-zinc-500 whitespace-nowrap">{r.val}{r.unit}</div>
                                        <div className="w-16 sm:w-20 flex-shrink-0">
                                            <div className="h-1.5 rounded-full bg-white/10">
                                                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: r.color }} />
                                            </div>
                                        </div>
                                        <div className={`text-xs font-bold w-9 text-right ${good ? 'text-emerald-400' : 'text-amber-400'}`}>{rate}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Diet performance — Premium gated */}
                    <div className="rounded-2xl border border-white/12 p-6 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))' }}>
                        <div className={!isPremium ? 'blur-sm opacity-40 pointer-events-none select-none' : ''}>
                            <h3 className="text-sm font-semibold text-zinc-200 mb-4">飲食表現評分</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: '熱量達成率', score: Math.min(Math.round((totals.calories / TARGETS.calories) * 100), 100), color: '#4ade80' },
                                    { label: '蛋白質充足度', score: Math.min(Math.round((totals.protein / TARGETS.protein) * 100), 100), color: '#fbbf24' },
                                    { label: '飲食多樣性', score: Math.min(logs.length * 15, 100), color: '#fbbf24' },
                                    { label: '三餐規律性', score: Math.min([...new Set(logs.map(l => l.meal_type))].length * 30, 100), color: '#4ade80' },
                                ].map(({ label, score, color }) => {
                                    const r = 22, circ = 2 * Math.PI * r;
                                    return (
                                        <div key={label} className="rounded-xl bg-white/5 p-3 flex flex-col items-center gap-2">
                                            <svg width="60" height="60" className="-rotate-90">
                                                <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                                                <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5"
                                                    strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
                                                    strokeLinecap="round" />
                                            </svg>
                                            <div className="text-center -mt-1">
                                                <div className="font-black text-lg" style={{ color }}>{score}</div>
                                                <div className="text-zinc-400 text-[10px] leading-tight">{label}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {!isPremium && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-2">
                                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                    <Lock className="text-purple-300" size={20} />
                                </div>
                                <p className="text-white font-bold text-sm">升級 Premium 解鎖</p>
                                <p className="text-zinc-400 text-xs">飲食評分 · AI 建議 · 詳細分析</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ height: '100px' }} />

            <AnimatePresence>
                {showScanner && <AiScanner onClose={() => setShowScanner(false)} onScanComplete={handleAddFood} />}
            </AnimatePresence>

            {showSearch && (
                <div className={styles.modalOverlay} onClick={() => { setShowSearch(false); setEditingFood(null); }}>
                    <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
                        <FoodSearch
                            onClose={() => { setShowSearch(false); setEditingFood(null); }}
                            onAddFood={handleAddFood}
                            initialFood={editingFood}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function MacroBar({ label, current, target, color, unit = 'g' }: any) {
    const percent = Math.min((current / target) * 100, 100);
    return (
        <div className={styles.macroBar}>
            <div className={styles.barHeader}>
                <span className={styles.barLabel}>{label}</span>
                <span className={styles.barValue}>{current}{unit} / {target}{unit}</span>
            </div>
            <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${percent}%`, background: color }} />
            </div>
        </div>
    );
}
