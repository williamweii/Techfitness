'use client';

import React, { useState } from 'react';
import { Trophy, Flame, Dumbbell, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Leaderboard.module.css';

type UserRank = {
    id: string;
    name: string;
    avatar: string;
    level: string;
    volume: number; // Weekly volume (kg * reps)
    streak: number; // Consecutive weeks with 3+ workouts
    trend: 'up' | 'down' | 'stable';
};

const MOCK_DATA: UserRank[] = [
    { id: '1', name: 'David Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', level: '菁英教練', volume: 42500, streak: 12, trend: 'up' },
    { id: '2', name: 'Sarah Wu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', level: '高階訓練者', volume: 38200, streak: 8, trend: 'stable' },
    { id: '3', name: 'Mike Wang', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', level: '中階訓練者', volume: 35050, streak: 15, trend: 'up' },
    { id: '4', name: 'Felix Hsu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', level: '高階訓練者', volume: 32800, streak: 5, trend: 'down' }, // Current User
    { id: '5', name: 'Jessica Lin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica', level: '新手', volume: 28200, streak: 2, trend: 'up' },
];

export default function Leaderboard() {
    const [filter, setFilter] = useState<'volume' | 'streak'>('volume');

    const sortedData = [...MOCK_DATA].sort((a, b) => {
        if (filter === 'volume') return b.volume - a.volume;
        return b.streak - a.streak;
    });

    const currentUserRank = sortedData.findIndex(u => u.id === '4') + 1;
    const currentUserData = MOCK_DATA.find(u => u.id === '4')!;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="gradient-text text-2xl font-bold flex items-center justify-center gap-2">
                    <Trophy className="text-yellow-500" />
                    社群排行榜
                </h1>
                <p className={styles.description}>與社群夥伴互相激勵，突破自我極限</p>
            </header>

            <div className={styles.toggleContainer}>
                <button
                    className={`${styles.toggleBtn} ${filter === 'volume' ? styles.active : ''}`}
                    onClick={() => setFilter('volume')}
                >
                    <Dumbbell size={16} className="inline mr-1" />
                    本週排行
                </button>
                <button
                    className={`${styles.toggleBtn} ${filter === 'streak' ? styles.active : ''}`}
                    onClick={() => setFilter('streak')}
                >
                    <Flame size={16} className="inline mr-1" />
                    連續週數
                </button>
            </div>

            <div className="text-[10px] text-white/40 text-center mb-6 flex items-center justify-center gap-1 -mt-2">
                <Info size={10} />
                <span>連續週數定義：每週至少運動 3 天</span>
            </div>

            <div className={styles.leaderboardList}>
                {sortedData.map((user, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    const displayValue = filter === 'volume'
                        ? `${(user.volume / 1000).toFixed(1)}k`
                        : `${user.streak}`;
                    const displayLabel = filter === 'volume' ? 'kg' : '週';

                    return (
                        <motion.div
                            id={`rank-${user.id}`}
                            key={user.id}
                            className={`${styles.rankCard} ${isTop3 ? styles.top3 : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={`${styles.rank} ${rank === 1 ? styles.rank1 : rank === 2 ? styles.rank2 : rank === 3 ? styles.rank3 : ''}`}>
                                {rank}
                            </div>
                            <img src={user.avatar} className={styles.avatar} alt={user.name} />
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{user.name} {user.id === '4' && '(你)'}</span>
                                <span className={styles.userLevel}>{user.level}</span>
                            </div>
                            <div className={styles.score}>
                                <span className={styles.scoreValue}>{displayValue}</span>
                                <span className={styles.scoreLabel}>{displayLabel}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Sticky user rank */}
            <div
                className={`${styles.rankCard} ${styles.currentUserCard}`}
                onClick={() => {
                    const el = document.getElementById(`rank-${currentUserData.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
            >
                <div className={styles.rank}>{currentUserRank}</div>
                <img src={currentUserData.avatar} className={styles.avatar} alt="Me" />
                <div className={styles.userInfo}>
                    <div className="text-xs text-primary font-bold">你的排名 (點擊跳轉)</div>
                    <span className={styles.userName}>Felix Hsu</span>
                </div>
                <div className={styles.score}>
                    <span className={styles.scoreValue}>
                        {filter === 'volume'
                            ? `${(currentUserData.volume / 1000).toFixed(1)}k`
                            : `${currentUserData.streak}`}
                    </span>
                    <span className={styles.scoreLabel}>
                        {filter === 'volume' ? 'kg' : '週'}
                    </span>
                </div>
            </div>
        </div>
    );
}
