"use client";

import React, { useState } from 'react';
import { Settings, LogOut, ChevronRight, MapPin, CreditCard, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Profile.module.css';
import ProgressChart from '@/components/ui/ProgressChart';
import GoalScheduler from './GoalScheduler';
import MetricsForm from '@/components/metrics/MetricsForm';

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
                    <button className={styles.iconBtn}><Settings size={20} /></button>
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

                <div className={styles.quickStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{user.workouts}</span>
                        <span className={styles.statLabel}>總訓練數</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{user.streak}</span>
                        <span className={styles.statLabel}>週連勝</span>
                    </div>
                </div>
            </header>

            <section className={styles.content}>
                <ProgressChart />

                <GoalScheduler />

                {/* Integrated Metrics Form ensures it sits correctly in the layout without being pushed away */}
                <div className="mb-8">
                    <MetricsForm />
                </div>

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
