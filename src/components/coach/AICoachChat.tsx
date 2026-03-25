'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AICoachChat.module.css';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

const SUGGESTIONS = [
    "如何增加深蹲重量？",
    "分析我的訓練量",
    "背部訓練動作推薦",
    "減脂期的飲食建議"
];

export default function AICoachChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: '嗨！我是你的 AI 健身教練。今天想聊聊什麼訓練計畫？' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(() => {
            const aiResponses = [
                "這是一個很好的問題！根據你的訓練記錄，我建議...",
                "深蹲是下肢力量的基礎。試著注意你的髖關節啟動...",
                "為了達到最佳增肌效果，每週至少需要 10-20 組的有效容量。",
                "別忘了休息也是變強的一部分！"
            ];
            const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: randomResponse
            }]);
            setIsTyping(false);
        }, 1500);
    };

    const hasDragged = useRef(false);

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        drag
                        dragMomentum={false}
                        dragElastic={0.08}
                        onDragStart={() => { hasDragged.current = false; }}
                        onDrag={() => { hasDragged.current = true; }}
                        onClick={() => { if (!hasDragged.current) setIsOpen(true); }}
                        className={styles.toggleBtn}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ touchAction: 'none' }}
                    >
                        <Bot size={28} />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.chatContainer}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    >
                        <header className={styles.header}>
                            <div className={styles.headerTitle}>
                                <Sparkles size={18} />
                                <span>AI Coach</span>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </header>

                        <div className={styles.messages}>
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                            {isTyping && <div className={styles.typing}>Coach 正在輸入...</div>}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className={styles.suggestions}>
                            {SUGGESTIONS.map(s => (
                                <button key={s} className={styles.chip} onClick={() => handleSend(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className={styles.inputArea}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="問問教練..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <button className={styles.sendBtn} onClick={() => handleSend()}>
                                <Send size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
