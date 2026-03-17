"use client";

import React, { useState } from 'react';
import { Play, Star, ShieldCheck, Users, TrendingUp, X, Check, CreditCard, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './VideoCatalog.module.css';

const courses = [
    { id: '1', title: '科學化減脂：從理論到實踐', coach: 'Dr. Kevin', rating: 4.9, pupils: '2.4k', price: '免費', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
    { id: '2', title: '大重量深蹲：生物力學優化', coach: 'Coach Mike', rating: 4.8, pupils: '1.1k', price: 'Premium', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80' },
    { id: '3', title: '胸肌維度：解剖學拉伸訓練', coach: 'Sara Fitness', rating: 4.7, pupils: '890', price: 'Premium', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
];

export default function VideoCatalog() {
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [gaveRating, setGaveRating] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const handleRating = () => {
        setGaveRating(true);
        setTimeout(() => {
            setGaveRating(false);
            setSelectedVideo(null);
        }, 2000);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="gradient-text">健身學院</h1>
                <p>由專業教練提供的科學化課程</p>
            </header>

            <section className={styles.subscriptionSection}>
                <div className={styles.pricingCard}>
                    <div className={styles.cardHeader}>
                        <ShieldCheck className={styles.premiumIcon} />
                        <h3>訂閱 Premium 會員</h3>
                    </div>
                    <div className={styles.plans}>
                        <div className={styles.plan}>
                            <span className={styles.planName}>月費</span>
                            <span className={styles.planPrice}>NT$ 90</span>
                        </div>
                        <div className={`${styles.plan} ${styles.bestValue}`}>
                            <div className={styles.badge}>最受歡迎</div>
                            <span className={styles.planName}>年費</span>
                            <span className={styles.planPrice}>NT$ 900</span>
                            <span className={styles.planSavings}>省下 2 個月</span>
                        </div>
                        <div className={styles.plan}>
                            <span className={styles.planName}>季費</span>
                            <span className={styles.planPrice}>NT$ 240</span>
                        </div>
                    </div>
                    <button className={styles.subscribeBtn} onClick={() => setIsPaymentModalOpen(true)}>立即升級，解鎖全部課程</button>
                </div>
            </section>

            <div className={styles.filterTabs}>
                <button className={`${styles.tab} ${styles.active}`}>熱門課程</button>
                <button className={styles.tab}>最新上架</button>
                <button className={styles.tab}>即將推出</button>
            </div>

            <section className={styles.courseList}>
                {courses.map((course) => (
                    <motion.div
                        whileHover={{ y: -5 }}
                        key={course.id}
                        className={`${styles.courseCard} card`}
                        onClick={() => setSelectedVideo(course)}
                    >
                        <div className={styles.thumbnailWrapper}>
                            <img src={course.image} alt={course.title} className={styles.thumbnail} />
                            <div className={styles.playOverlay}><Play fill="white" /></div>
                            {course.price === 'Premium' && <span className={styles.premiumLabel}>PREMIUM</span>}
                        </div>
                        <div className={styles.courseInfo}>
                            <h3>{course.title}</h3>
                            <div className={styles.coachLine}>
                                <span className={styles.coachName}>{course.coach}</span>
                                <span className={styles.rating}><Star size={12} fill="#fbbf24" stroke="#fbbf24" /> {course.rating}</span>
                            </div>
                            <div className={styles.metaLine}>
                                <span className={styles.pupils}><Users size={12} /> {course.pupils} 位學員</span>
                                <span className={styles.priceTag}>{course.price}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </section>

            {/* Payment Modal */}
            <AnimatePresence>
                {/* ... existing video modal ... */}
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.modalOverlay}
                        onClick={() => setSelectedVideo(null)}
                    >
                        {/* ... existing content ... */}
                        <motion.div
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 50, scale: 0.95 }}
                            className={styles.modalContent}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className={styles.closeBtn} onClick={() => setSelectedVideo(null)}><X /></button>
                            {gaveRating ? (
                                <div className={styles.thanksView}>
                                    <div className={styles.successIcon}><Check size={48} /></div>
                                    <h2>感謝您的評價！</h2>
                                    <p>您的反饋能讓教練提供更精確的內容。</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.videoPlaceholder}>
                                        <img src={selectedVideo.image} alt="Video" />
                                        <div className={styles.playBtnLarge}><Play size={48} fill="white" /></div>
                                    </div>
                                    <div className={styles.videoDetails}>
                                        <h2>{selectedVideo.title}</h2>
                                        <p className={styles.coachName}>由 {selectedVideo.coach} 主講</p>
                                        <div className={styles.ratingSystem}>
                                            <p>對這堂課滿意嗎？請給予評價：</p>
                                            <div className={styles.stars}>
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <button key={i} onClick={handleRating} className={styles.starBtn}>
                                                        <Star size={24} fill={i <= 4 ? "#fbbf24" : "none"} stroke="#fbbf24" />
                                                    </button>
                                                ))}
                                            </div>
                                            <p className={styles.ratingDisclaimer}>評價將影響課程排名，若評價過低將面臨下架。系統公平公正、絕不私偏。</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />

            <section className={styles.coachingTeaser}>
                <div className="card glass">
                    <div className={styles.teaserHeader}>
                        <TrendingUp className={styles.teaserIcon} />
                        <h3>1:1 科學化訓練菜單規劃</h3>
                    </div>
                    <p>專業教練為您量身打造飲食與訓練計畫，中後期即將開放教練入駐。</p>
                    <div className={styles.coachesPreview}>
                        {[1, 2, 3].map(i => (
                            <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} className={styles.miniAvatar} alt="Coach" />
                        ))}
                        <span className={styles.comingSoon}>即將開放...</span>
                    </div>
                </div>
            </section>

            <div style={{ height: '100px' }} />
        </div>
    );
}

function PaymentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 50, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 50, scale: 0.95 }}
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">選擇支付方式</h2>
                        <button onClick={onClose}><X /></button>
                    </div>

                    <div className="space-y-4">
                        <PaymentOption icon={<CreditCard />} label="信用卡 / 下載卡" sub="Visa, Mastercard, JCB" />
                        <PaymentOption icon={<Smartphone />} label="Line Pay" sub="快速結帳" />
                        <PaymentOption icon={<Smartphone />} label="Apple Pay" sub="FaceID 快速支付" />
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-700">
                        <div className="flex justify-between mb-4 text-sm">
                            <span className="text-gray-400">訂閱方案</span>
                            <span>Premium 年費</span>
                        </div>
                        <div className="flex justify-between mb-6 text-xl font-bold">
                            <span>總金額</span>
                            <span className="text-purple-400">NT$ 900</span>
                        </div>
                        <button className={`${styles.subscribeBtn} w-full`}>確認付款</button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function PaymentOption({ icon, label, sub }: { icon: any, label: string, sub: string }) {
    return (
        <div className="flex items-center p-4 rounded-xl border border-gray-700 hover:border-purple-500 hover:bg-white/5 cursor-pointer transition-colors group">
            <div className="p-2 bg-gray-800 rounded-lg mr-4 group-hover:text-purple-400 text-gray-400">
                {icon}
            </div>
            <div className="flex-1">
                <div className="font-bold">{label}</div>
                <div className="text-xs text-gray-400">{sub}</div>
            </div>
            <div className="w-5 h-5 rounded-full border border-gray-500 group-hover:border-purple-500 group-hover:bg-purple-500/20" />
        </div>
    );
}
