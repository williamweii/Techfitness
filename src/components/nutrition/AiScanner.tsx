"use client";

import React, { useState, useEffect } from 'react';
import { X, Camera, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AiScanner.module.css';

interface AiScannerProps {
    onClose: () => void;
    onScanComplete: (foodData: any) => void;
}

export default function AiScanner({ onClose, onScanComplete }: AiScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        // Auto start scanning simulation
        const timer = setTimeout(() => {
            setScanning(true);
            // Simulate scan duration
            setTimeout(() => {
                setScanning(false);
                setAnalyzing(true);
                // Simulate analysis duration
                setTimeout(() => {
                    setAnalyzing(false);
                    setResult({
                        name: "酪梨雞胸肉沙拉",
                        calories: 450,
                        protein: 35,
                        carbs: 20,
                        fat: 25,
                        confidence: 0.98
                    });
                }, 2000);
            }, 3000);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleConfirm = () => {
        onScanComplete(result);
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}><X /></button>

                {!result ? (
                    <div className={styles.cameraView}>
                        <div className={styles.viewfinder}>
                            {/* Mock Camera Feed could be an image or video element */}
                            <div className={styles.mockFeed}>
                                <p>將食物置於框內</p>
                            </div>
                            {scanning && <motion.div
                                className={styles.scanLine}
                                animate={{ top: ['0%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />}
                        </div>

                        <div className={styles.status}>
                            {analyzing ? (
                                <div className={styles.analyzing}>
                                    <Zap className={styles.pulseIcon} size={24} />
                                    <span>AI 分析中...</span>
                                </div>
                            ) : (
                                <span>正在尋找食物...</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.resultView}>
                        <div className={styles.checkIcon}><Check size={48} /></div>
                        <h2>識別成功！</h2>
                        <div className={styles.foodCard}>
                            <h3>{result.name}</h3>
                            <div className={styles.macros}>
                                <div className={styles.macro}>
                                    <span className={styles.label}>熱量</span>
                                    <span className={styles.value}>{result.calories}</span>
                                </div>
                                <div className={styles.macro}>
                                    <span className={styles.label}>蛋白質</span>
                                    <span className={styles.value}>{result.protein}g</span>
                                </div>
                                <div className={styles.macro}>
                                    <span className={styles.label}>碳水</span>
                                    <span className={styles.value}>{result.carbs}g</span>
                                </div>
                                <div className={styles.macro}>
                                    <span className={styles.label}>脂肪</span>
                                    <span className={styles.value}>{result.fat}g</span>
                                </div>
                            </div>
                        </div>
                        <button className={styles.confirmBtn} onClick={handleConfirm}>加入紀錄</button>
                        <button className={styles.retryBtn} onClick={() => setResult(null)}>重新掃描</button>
                    </div>
                )}
            </div>
        </div>
    );
}
