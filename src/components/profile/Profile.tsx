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
                {/* Today's activity rings */}
                <div className="mb-10">
                    <HeroRings />
                </div>

                <ProgressChart />

                <GoalScheduler />

                {/* FAB for daily stats */}
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

// ─────────────────────────────────────────────────────────
// My Data Section
// ─────────────────────────────────────────────────────────
const BODY_TABS = [
    { id: 'weight', label: '體重', unit: 'kg', color: '#c4856a' },
    { id: 'fat',    label: '體脂', unit: '%',  color: '#a855f7' },
    { id: 'muscle', label: '骨骼肌', unit: 'kg', color: '#22c55e' },
] as const;

type BodyTabId = typeof BODY_TABS[number]['id'];
type BodyLog = { date: string; weight: number; fat: number; muscle: number };

const INITIAL_LOGS: BodyLog[] = [
    { date: '3/1',  weight: 75.2, fat: 18.2, muscle: 34.1 },
    { date: '3/8',  weight: 74.8, fat: 17.8, muscle: 34.3 },
    { date: '3/15', weight: 74.3, fat: 17.5, muscle: 34.6 },
    { date: '3/22', weight: 73.9, fat: 17.1, muscle: 34.9 },
];

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

// ─── InBody scanner modal ───────────────────────────────
function BodyEntryModal({ onClose, onSave }: { onClose: () => void; onSave: (log: BodyLog) => void }) {
    const today = new Date();
    const dateLabel = `${today.getMonth() + 1}/${today.getDate()}`;

    const [weight, setWeight] = React.useState('');
    const [fat, setFat] = React.useState('');
    const [muscle, setMuscle] = React.useState('');
    const [mode, setMode] = React.useState<'manual' | 'photo'>('manual');
    const [photoMsg, setPhotoMsg] = React.useState('');

    // Photo scan pipeline
    const [photoStage, setPhotoStage] = React.useState<'idle' | 'preview' | 'scanning' | 'analyzing' | 'done'>('idle');
    const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
    const [scanResult, setScanResult] = React.useState<{ weight: string; fat: string; muscle: string } | null>(null);
    const fileRef = React.useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (!weight) return;
        onSave({ date: dateLabel, weight: +weight, fat: fat ? +fat : 0, muscle: muscle ? +muscle : 0 });
        onClose();
    };

    const handleConfirmScan = () => {
        if (!scanResult) return;
        setWeight(scanResult.weight);
        setFat(scanResult.fat);
        setMuscle(scanResult.muscle);
        setMode('manual');
        setPhotoMsg('✅ 數值已填入，確認後儲存');
        setPhotoStage('idle');
        setScanResult(null);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
        setPhotoStage('preview');
    };

    const startScan = async () => {
        setPhotoStage('scanning');
        await new Promise(r => setTimeout(r, 2500));
        setPhotoStage('analyzing');
        await new Promise(r => setTimeout(r, 1800));
        // ↓ Replace with real OCR API call: await fetch('/api/inbody-ocr', { method:'POST', body: formData })
        setScanResult({ weight: '73.5', fat: '16.8', muscle: '35.1' });
        setPhotoStage('done');
    };

    return (
        <div className="fixed inset-0 z-[1200] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="w-[min(100%,420px)] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden max-h-[90dvh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/8">
                    <div>
                        <h3 className="text-lg font-bold text-white">記錄身體數據</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{dateLabel}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-zinc-400 hover:bg-white/15 transition-colors text-lg"
                    >×</button>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-3 px-6 pt-5 mb-4">
                    {(['manual', 'photo'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                                mode === m
                                    ? 'border-purple-500 bg-purple-500/15 text-purple-300'
                                    : 'border-transparent bg-white/5 text-zinc-500'
                            }`}
                        >
                            {m === 'manual' ? '✏️ 手動輸入' : '📸 InBody 拍照'}
                        </button>
                    ))}
                </div>

                {/* ─── Photo scanner ─── */}
                {mode === 'photo' && (
                    <div className="px-6 pb-6">
                        {/* Inject keyframes */}
                        <style>{`@keyframes inbodyScan { 0%{top:2%} 50%{top:96%} 100%{top:2%} }`}</style>

                        {photoStage === 'idle' && (
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full py-10 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col items-center gap-3 text-zinc-400"
                                >
                                    <span className="text-5xl">📸</span>
                                    <span className="text-sm font-medium">點擊上傳 InBody 報告照片</span>
                                    <span className="text-xs text-zinc-600">支援 JPG / PNG・可拍照</span>
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handlePhotoSelect}
                                />
                            </div>
                        )}

                        {photoStage === 'preview' && photoPreview && (
                            <div className="flex flex-col gap-4">
                                <div className="relative rounded-2xl overflow-hidden bg-black" style={{ height: 220 }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photoPreview} alt="InBody report" className="w-full h-full object-contain" />
                                    <div className="absolute inset-4 pointer-events-none">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br-lg" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setPhotoPreview(null); setPhotoStage('idle'); }}
                                        className="flex-1 py-3 rounded-2xl bg-white/8 text-zinc-400 text-sm font-semibold"
                                    >重選照片</button>
                                    <button
                                        onClick={startScan}
                                        className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-bold"
                                    >開始掃描</button>
                                </div>
                            </div>
                        )}

                        {(photoStage === 'scanning' || photoStage === 'analyzing') && photoPreview && (
                            <div className="flex flex-col gap-4">
                                <div className="relative rounded-2xl overflow-hidden bg-black" style={{ height: 220 }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photoPreview} alt="InBody report" className="w-full h-full object-contain opacity-60" />
                                    {photoStage === 'scanning' && (
                                        <div
                                            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                                            style={{
                                                animation: 'inbodyScan 1.8s ease-in-out infinite',
                                                boxShadow: '0 0 12px rgba(168,85,247,0.9)',
                                            }}
                                        />
                                    )}
                                    <div className="absolute inset-4 pointer-events-none">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br-lg" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-purple-300 text-sm py-1">
                                    <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                    {photoStage === 'scanning' ? '掃描中…' : 'AI 分析 InBody 數值中…'}
                                </div>
                            </div>
                        )}

                        {photoStage === 'done' && scanResult && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                                    <span>✅</span>
                                    <span>識別成功！請確認數值</span>
                                </div>
                                <div className="bg-zinc-800/80 border border-white/12 rounded-2xl p-5 flex flex-col gap-4">
                                    {[
                                        { label: '體重',   val: scanResult.weight, unit: 'kg', color: '#c4856a' },
                                        { label: '體脂肪', val: scanResult.fat,    unit: '%',  color: '#a855f7' },
                                        { label: '骨骼肌', val: scanResult.muscle, unit: 'kg', color: '#22c55e' },
                                    ].map(f => (
                                        <div key={f.label} className="flex justify-between items-center">
                                            <span className="text-zinc-400 text-sm">{f.label}</span>
                                            <span className="text-lg font-black" style={{ color: f.color }}>
                                                {f.val} <span className="text-xs font-normal text-zinc-500">{f.unit}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setScanResult(null); setPhotoStage('idle'); setPhotoPreview(null); }}
                                        className="flex-1 py-3 rounded-2xl bg-white/8 text-zinc-400 text-sm font-semibold"
                                    >重新掃描</button>
                                    <button
                                        onClick={handleConfirmScan}
                                        className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold"
                                    >確認填入</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Manual input ─── */}
                {mode === 'manual' && (
                    <div className="px-6 pb-6 flex flex-col gap-4">
                        {photoMsg && <p className="text-sm text-emerald-400 text-center py-1">{photoMsg}</p>}
                        {[
                            { label: '體重',   unit: 'kg', val: weight, setVal: setWeight, placeholder: '例：73.5' },
                            { label: '體脂肪', unit: '%',  val: fat,    setVal: setFat,    placeholder: '例：17.2' },
                            { label: '骨骼肌', unit: 'kg', val: muscle, setVal: setMuscle, placeholder: '例：34.8' },
                        ].map(f => (
                            <div key={f.label}>
                                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">{f.label}</label>
                                <div className="flex items-center gap-2 bg-zinc-800 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500/50 transition-colors">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder={f.placeholder}
                                        value={f.val}
                                        onChange={e => f.setVal(e.target.value)}
                                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-600"
                                    />
                                    <span className="text-zinc-500 text-xs font-medium">{f.unit}</span>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={handleSave}
                            disabled={!weight}
                            className="w-full mt-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-purple-500 hover:to-violet-500 active:scale-95"
                        >
                            儲存數據
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── MyDataSection ──────────────────────────────────────
function MyDataSection({ isPremium }: { isPremium: boolean }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<BodyTabId>('weight');
    const [logs, setLogs] = useState<BodyLog[]>(INITIAL_LOGS);
    const [showEntry, setShowEntry] = useState(false);

    const activeTab = BODY_TABS.find(t => t.id === tab)!;
    const data = logs.map(l => ({ date: l.date, value: l[tab] }));
    const latest = data[data.length - 1].value;
    const delta = +(data[data.length - 1].value - data[0].value).toFixed(1);

    const handleSaveLog = (log: BodyLog) => {
        setLogs(prev => {
            const idx = prev.findIndex(l => l.date === log.date);
            if (idx >= 0) { const next = [...prev]; next[idx] = log; return next; }
            return [...prev, log];
        });
    };

    return (
        <>
            <div className={styles.menuSection}>
                <h2 className={styles.sectionTitle}>數據分析</h2>
                <div className={styles.menuList}>
                    <button onClick={() => setOpen(true)} className={`${styles.menuItem} w-full text-left`}>
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
                            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-4 mb-6" />

                            {/* Header */}
                            <div className="px-6 mb-5 flex justify-between items-center">
                                <h2 className="text-xl font-bold">我的數據</h2>
                                <div className="flex items-center gap-2">
                                    {!isPremium && (
                                        <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                            <Lock size={10} />Premium 功能
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setShowEntry(true)}
                                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                                    >
                                        + 記錄
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 px-6 mb-5">
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

                            {/* ── flex col gap-6 same treatment as NutritionTracker ── */}
                            <div className="px-6 flex flex-col gap-6 pb-10">

                                {/* Chart card */}
                                <div className="bg-zinc-800/80 border border-white/12 rounded-2xl p-6 relative overflow-hidden">
                                    {!isPremium && (
                                        <div className="absolute inset-0 rounded-2xl backdrop-blur-md bg-black/50 z-10 flex flex-col items-center justify-center gap-2">
                                            <Lock size={22} className="text-purple-400" />
                                            <p className="text-sm text-zinc-300 font-medium">升級 Premium 解鎖完整圖表</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-2xl font-black" style={{ color: activeTab.color }}>
                                                {latest} <span className="text-sm font-medium text-zinc-400">{activeTab.unit}</span>
                                            </div>
                                            <div className={`text-xs font-semibold mt-1 ${delta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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

                                {/* Performance cards */}
                                <div className="grid grid-cols-2 gap-5">
                                    {[
                                        { label: '運動表現', emoji: '⚡', desc: '最大力量、體能趨勢' },
                                        { label: '飲食表現', emoji: '🥗', desc: '熱量達成率、宏量統計' },
                                    ].map(card => (
                                        <div key={card.label} className="bg-zinc-800/80 border border-white/12 rounded-2xl p-6 flex flex-col gap-3">
                                            <div className="text-2xl">{card.emoji}</div>
                                            <div className="text-sm font-bold text-zinc-200">{card.label}</div>
                                            <div className="text-[11px] text-zinc-500 leading-relaxed">{card.desc}</div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showEntry && <BodyEntryModal onClose={() => setShowEntry(false)} onSave={handleSaveLog} />}
        </>
    );
}
