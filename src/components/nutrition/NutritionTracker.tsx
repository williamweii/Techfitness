"use client";

import React, { useState } from 'react';
import { Search, Info, Lock, Target, Plus, Camera, ScanLine } from 'lucide-react';
import styles from './NutritionPage.module.css';
import FastingTimer from './FastingTimer';
import AiScanner from './AiScanner';
import FoodSearch from './FoodSearch';
import { motion, AnimatePresence } from 'framer-motion';

export default function NutritionTracker() {
    const [showScanner, setShowScanner] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [editingFood, setEditingFood] = useState<any>(null);
    const [isPremium] = useState(false); // Mock premium status

    // Mock user daily goal
    const TARGETS = { calories: 2400, protein: 180, carbs: 250, fat: 70 };

    const [logs, setLogs] = useState<any[]>([
        { id: 99, name: '早餐燕麥', calories: 450, protein: 20, carbs: 80, fat: 12 },
    ]);

    const MICRONUTRIENT_TARGETS = {
        vitA: 900, vitC: 90, vitD: 20,
        iron: 18, calcium: 1000, magnesium: 400
    };

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
    }), {
        calories: 0, protein: 0, carbs: 0, fat: 0,
        vitA: 0, vitC: 0, vitD: 0, iron: 0, calcium: 0, magnesium: 0
    });

    const handleAddFood = (food: any) => {
        setLogs(prev => {
            const existing = prev.find(l => l.id === food.id);
            if (existing) {
                return prev.map(l => l.id === food.id ? food : l);
            }
            return [...prev, { ...food, id: food.id || Date.now() }];
        });
        setShowSearch(false);
        setShowScanner(false);
        setEditingFood(null);
    };

    const [activeTab, setActiveTab] = useState<'log' | 'analytics'>('log');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="gradient-text">科學化飲食</h1>
                <p>精準掌控宏量營養素，達成您的目標</p>
            </header>

            {/* Top tab bar */}
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

                    {/* Quick Actions */}
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

                    {/* Food Log List */}
                    <div className={styles.foodList}>
                        <h3>今日紀錄</h3>
                        {logs.length === 0 ? (
                            <p className={styles.emptyText}>尚未新增食物</p>
                        ) : (
                            logs.map(log => (
                                <div
                                    key={log.id}
                                    className={styles.logItem}
                                    onClick={() => {
                                        setEditingFood(log);
                                        setShowSearch(true);
                                    }}
                                    title="點擊修改"
                                >
                                    <div>
                                        <div className={styles.logName}>{log.name}</div>
                                        <div className={styles.logSub}>{log.calories} kcal</div>
                                    </div>
                                    <div className={styles.logMacros}>
                                        P{log.protein} C{log.carbs} F{log.fat}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <FastingTimer />

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
                <div className="px-4 space-y-5 pb-28">
                    {/* Macro distribution */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3">今日宏量分佈</h3>
                        {[
                            { label: '蛋白質', val: totals.protein, target: TARGETS.protein, color: '#c026d3', unit: 'g' },
                            { label: '碳水化合物', val: totals.carbs, target: TARGETS.carbs, color: '#7c3aed', unit: 'g' },
                            { label: '脂肪', val: totals.fat, target: TARGETS.fat, color: '#ec4899', unit: 'g' },
                        ].map(({ label, val, target, color, unit }) => {
                            const pct = Math.min(Math.round((val / target) * 100), 100);
                            return (
                                <div key={label} className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span style={{ color }}>{label}</span>
                                        <span className="text-zinc-400">{val}{unit} / {target}{unit} <span className="text-white font-bold">{pct}%</span></span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-white/10">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Calorie trend (mock 7 days) */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3">本週熱量趨勢</h3>
                        {(() => {
                            const days = ['一','二','三','四','五','六','日'];
                            const cals = [2100, 1850, 2300, 1950, 2150, 2400, totals.calories || 450];
                            const max = Math.max(...cals);
                            return (
                                <div className="flex items-end gap-2 h-20">
                                    {days.map((d, i) => (
                                        <div key={d} className="flex-1 flex flex-col items-center gap-1">
                                            <div className="w-full rounded-md transition-all"
                                                style={{ height: `${(cals[i] / max) * 64}px`, background: i === 6 ? '#c026d3' : 'rgba(255,255,255,0.15)' }} />
                                            <span className="text-[10px] text-zinc-500">{d}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                        <p className="text-xs text-zinc-500 mt-2 text-right">平均 2,107 kcal／天</p>
                    </div>

                    {/* Weekly summary table */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3">本週攝取總結</h3>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-zinc-500 border-b border-white/10">
                                    <th className="text-left pb-2">指標</th>
                                    <th className="text-right pb-2">本週均值</th>
                                    <th className="text-right pb-2">目標</th>
                                    <th className="text-right pb-2">達成率</th>
                                </tr>
                            </thead>
                            <tbody className="text-zinc-300 space-y-1">
                                {[
                                    { label: '卡路里', avg: 2107, target: TARGETS.calories, unit: 'kcal' },
                                    { label: '蛋白質', avg: 142, target: TARGETS.protein, unit: 'g' },
                                    { label: '碳水化合物', avg: 220, target: TARGETS.carbs, unit: 'g' },
                                    { label: '脂肪', avg: 58, target: TARGETS.fat, unit: 'g' },
                                ].map(r => {
                                    const rate = Math.round((r.avg / r.target) * 100);
                                    return (
                                        <tr key={r.label} className="border-b border-white/5">
                                            <td className="py-2">{r.label}</td>
                                            <td className="text-right">{r.avg}{r.unit}</td>
                                            <td className="text-right text-zinc-500">{r.target}{r.unit}</td>
                                            <td className={`text-right font-semibold ${rate >= 80 ? 'text-green-400' : 'text-amber-400'}`}>{rate}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Diet performance — Premium gated */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 relative overflow-hidden">
                        <div className={`${!isPremium ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
                            <h3 className="text-sm font-semibold text-zinc-300 mb-2">飲食表現評分</h3>
                            {[
                                { label: '熱量達成率', score: 88 },
                                { label: '蛋白質充足度', score: 79 },
                                { label: '飲食多樣性', score: 65 },
                                { label: '三餐規律性', score: 91 },
                            ].map(({ label, score }) => (
                                <div key={label} className="mb-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>{label}</span>
                                        <span className={score >= 80 ? 'text-green-400' : 'text-amber-400'}>{score}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/10">
                                        <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 80 ? '#4ade80' : '#fbbf24' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!isPremium && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <Lock className="text-white mb-2" size={22} />
                                <p className="text-white font-bold text-sm">升級 Premium 解鎖飲食分析</p>
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
                <div className={styles.modalOverlay} onClick={() => {
                    setShowSearch(false);
                    setEditingFood(null);
                }}>
                    <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
                        <FoodSearch
                            onClose={() => {
                                setShowSearch(false);
                                setEditingFood(null);
                            }}
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
                <div
                    className={styles.fill}
                    style={{ width: `${percent}%`, background: color }}
                />
            </div>
        </div>
    );
}
