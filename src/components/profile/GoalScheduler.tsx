'use client';

import React, { useState } from 'react';
import { Lock, Plus, Calendar, X, Check } from 'lucide-react';
import styles from './GoalScheduler.module.css';

type Goal = {
    id: string;
    title: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    type: 'default' | 'custom';
};

const DEFAULT_GOALS = [
    { title: '增肌期 (Bulking)', defaultWeeks: 12, color: 'from-orange-500 to-red-500' },
    { title: '減脂期 (Cutting)', defaultWeeks: 8, color: 'from-green-500 to-emerald-500' },
    { title: '維持期 (Maintenance)', defaultWeeks: 4, color: 'from-blue-500 to-cyan-500' },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number) => {
    const newD = new Date(d);
    newD.setDate(newD.getDate() + days);
    return newD;
};

const MOCK_GOALS: Goal[] = [
    { id: '1', title: '增肌期：高蛋白飲食', startDate: formatDate(today), endDate: formatDate(addDays(today, 5)), type: 'custom' },
    { id: '2', title: '大重量深蹲週', startDate: formatDate(addDays(today, 2)), endDate: formatDate(addDays(today, 6)), type: 'custom' },
];

export default function GoalScheduler() {
    const [isPremium, setIsPremium] = useState(false); // Mock toggle
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [viewStartDate, setViewStartDate] = useState(new Date());
    const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
    const [showPremiumAd, setShowPremiumAd] = useState(false);

    // Add Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    const [selectedDefault, setSelectedDefault] = useState<string | null>(null);

    const visibleDays = viewMode === 'week' ? 7 : 30;

    const handleModeChange = (mode: 'week' | 'month') => {
        if (mode === 'month' && !isPremium) {
            setShowPremiumAd(true);
            setTimeout(() => setShowPremiumAd(false), 3000);
            return;
        }
        setViewMode(mode);
    };

    const getDayLabel = (offset: number) => {
        const d = new Date(viewStartDate);
        d.setDate(d.getDate() + offset);
        return {
            date: d.getDate(),
            day: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
            fullDate: d.toISOString().split('T')[0]
        };
    };

    const togglePremium = () => setIsPremium(!isPremium);

    const handleAddGoal = () => {
        if (!newTitle && !selectedDefault) return;

        setGoals([...goals, {
            id: Date.now().toString(),
            title: newTitle || selectedDefault || 'New Goal',
            startDate,
            endDate,
            type: selectedDefault ? 'default' : 'custom'
        }]);

        // Reset
        setNewTitle('');
        setSelectedDefault(null);
        setShowAddForm(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>目標進度管理</h2>
                    <p className="text-xs text-gray-400 mt-1 cursor-pointer hover:text-purple-400" onClick={togglePremium}>
                        {isPremium ? '💎 Premium 會員' : '一般會員 (點擊模擬升級)'}
                    </p>
                </div>

                <div className={styles.controls}>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.active : ''}`}
                        onClick={() => handleModeChange('week')}
                    >
                        本週
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.active : ''}`}
                        onClick={() => handleModeChange('month')}
                    >
                        本月 {!isPremium && <Lock size={12} className={styles.premiumLock} />}
                    </button>

                    <div className="flex items-center ml-4 bg-white/5 rounded-lg px-2 border border-white/10">
                        <Calendar size={14} className="text-gray-400 mr-2" />
                        <span className="text-xs">{viewStartDate.toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {showPremiumAd && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm text-center animate-pulse">
                    升級 Premium 解鎖 30 天長程規劃！
                </div>
            )}

            <div className={styles.timelineContainer}>
                <div className={styles.timelineHeader} style={{ width: `${visibleDays * 70}px` }}>
                    {Array.from({ length: visibleDays }).map((_, i) => {
                        const { date, day } = getDayLabel(i);
                        return (
                            <div key={i} className={styles.dayColumn} style={{ width: '70px', minWidth: '70px' }}>
                                <span className={styles.dayName}>{day}</span>
                                <span className={styles.dayNumber}>{date}</span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ position: 'relative', width: `${visibleDays * 70}px`, minHeight: '100px' }}>
                    {goals.map(goal => {
                        const start = new Date(goal.startDate).getTime();
                        const end = new Date(goal.endDate).getTime();
                        const viewStart = new Date(viewStartDate);
                        viewStart.setHours(0, 0, 0, 0);

                        const dayMs = 86400000;
                        // Calculate offset (days from view start)
                        let startOffset = (start - viewStart.getTime()) / dayMs;
                        let duration = (end - start) / dayMs + 1;

                        // Only show if visible in current range
                        if (startOffset >= visibleDays) return null;
                        if (startOffset + duration < 0) return null;

                        return (
                            <div key={goal.id} className={styles.goalRow}>
                                <div
                                    className={styles.goalBar}
                                    style={{
                                        left: `${Math.max(0, startOffset) * 70}px`,
                                        width: `${Math.min(duration, visibleDays - startOffset) * 70}px`
                                    }}
                                    onClick={() => {
                                        const newTitle = prompt(`修改 "${goal.title}" 名稱`, goal.title);
                                        if (newTitle) setGoals(goals.map(g => g.id === goal.id ? { ...g, title: newTitle } : g));
                                    }}
                                >
                                    {goal.title}
                                    {isPremium && <div className={styles.resizeHandle} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showAddForm ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddForm(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">新增目標</h3>

                        <div className="mb-4">
                            <label className="text-sm text-gray-400 mb-2 block">目標類型</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    className={`p-3 rounded-lg border text-left ${selectedDefault ? 'bg-purple-600 border-purple-500' : 'bg-white/5 border-white/10'}`}
                                    onClick={() => setSelectedDefault(selectedDefault ? null : DEFAULT_GOALS[0].title)}
                                >
                                    <span className="block font-bold">💪 經典計畫</span>
                                </button>
                                <button
                                    className={`p-3 rounded-lg border text-left ${!selectedDefault ? 'bg-purple-600 border-purple-500' : 'bg-white/5 border-white/10'}`}
                                    onClick={() => setSelectedDefault(null)}
                                >
                                    <span className="block font-bold">✨ 自訂說明</span>
                                </button>
                            </div>
                        </div>

                        {selectedDefault ? (
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                {DEFAULT_GOALS.map(g => (
                                    <button
                                        key={g.title}
                                        className={`p-3 rounded-xl border text-left transition-all ${selectedDefault === g.title ? 'bg-gradient-to-r ' + g.color + ' text-white border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        onClick={() => setSelectedDefault(g.title)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">{g.title}</span>
                                            <span className="text-xs bg-black/20 px-2 py-1 rounded">{g.defaultWeeks} 週</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 mb-2 block">目標名稱</label>
                                <input
                                    type="text"
                                    placeholder="例如：準備馬拉松..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-purple-500"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">開始日期</label>
                                <input
                                    type="date"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">結束日期</label>
                                <input
                                    type="date"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-white/5 hover:bg-white/10 p-3 rounded-xl font-bold transition-colors" onClick={() => setShowAddForm(false)}>取消</button>
                            <button className="flex-1 bg-primary hover:bg-primary/90 p-3 rounded-xl font-bold transition-colors" onClick={handleAddGoal}>建立目標</button>
                        </div>
                    </div>
                </div>
            ) : (
                <button className={styles.addGoalBtn} onClick={() => setShowAddForm(true)}>
                    <Plus size={16} className="mx-auto mb-1" />
                    新增目標
                </button>
            )}
        </div>
    );
}
