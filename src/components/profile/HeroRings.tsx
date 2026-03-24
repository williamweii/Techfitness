'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Dumbbell, Activity } from 'lucide-react';

export default function HeroRings() {
  const rings = [
    { label: '活動大卡', value: 450, max: 600, color: '#f97316', icon: <Flame size={14} className="text-orange-500" /> }, // Orange
    { label: '訓練時長', value: 45, max: 60, color: '#a855f7', icon: <Dumbbell size={14} className="text-purple-500" /> }, // Purple
    { label: '步數目標', value: 6500, max: 10000, color: '#22c55e', icon: <Activity size={14} className="text-green-500" /> }, // Green
  ];

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center mb-6">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-orange-500/10 pointer-events-none" />
      
      <div className="w-full flex justify-between items-center mb-6">
        <h3 className="font-bold text-white text-lg tracking-wide">今日活動</h3>
        <span className="text-xs text-zinc-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">更新於 1 分鐘前</span>
      </div>

      <div className="flex gap-8 items-center justify-center relative w-full pb-4">
        {rings.map((ring, idx) => {
          const radius = 42;
          const circumference = 2 * Math.PI * radius;
          const progress = Math.min(ring.value / ring.max, 1);
          const strokeDashoffset = circumference - progress * circumference;

          return (
            <div key={idx} className="relative flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Progress Ring */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={ring.color}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.2 }}
                    strokeDasharray={circumference}
                    style={{ filter: `drop-shadow(0 0 6px ${ring.color}80)` }}
                  />
                </svg>
                {/* Inner Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="bg-black/30 p-1.5 rounded-full mb-0.5 border border-white/5 backdrop-blur-sm">
                    {ring.icon}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-lg leading-none mb-1">{ring.value}</div>
                <div className="text-zinc-400 text-xs font-medium tracking-wider">{ring.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
