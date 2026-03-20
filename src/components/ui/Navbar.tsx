"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Utensils, Trophy, PlayCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Navbar.module.css';

const navItems = [
    { icon: Dumbbell,   label: '訓練', href: '/workout' },
    { icon: Utensils,   label: '飲食', href: '/nutrition' },
    { icon: PlayCircle, label: '課程', href: '/videos' },
    { icon: Trophy,     label: '社群', href: '/community/leaderboard' },
    { icon: User,       label: '個人', href: '/profile' },
];

export default function Navbar() {
    const pathname = usePathname();

    // Hide bottom nav on coach/invite pages (they have their own back buttons)
    if (pathname.startsWith('/coach') || pathname.startsWith('/invite')) return null;

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href} className={styles.navLink}>
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={`${styles.iconContainer} ${isActive ? styles.active : ''}`}
                            >
                                <item.icon size={24} />
                                <span className={styles.label}>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className={styles.activeDot}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
