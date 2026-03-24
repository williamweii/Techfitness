'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Dumbbell, Activity } from 'lucide-react';

export default function HeroRings() {
  const rings = [
    { label: '活動大卡', value: 450, max: 600, color: '#f97316', icon: <Flame size={14} className="text-orange-500" /> },
    { label: '訓練時長', value: 45, max: 60, color: '#a855f7', icon: <Dumbbell size={14} className="text-purple-500" /> },
    { label: '步數目標', value: 6500, max: 10000, color: '#22c55e', icon: <Activity size={14} className="text-green-500" /> },
  ];

  return (
    <div className="w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-orange-500/8 pointer-events-none" />

      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-base tracking-wide">今日活動</h3>
        <span className="text-[10px] text-zinc-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">更新於 1 分鐘前</span>
      </div>

      {/* 3 cols, each col takes equal 1fr */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {rings.map((ring, idx) => {
          const radius = 36;
          const circumference = 2 * Math.PI * radius;
          const progress = Math.min(ring.value / ring.max, 1);
          const strokeDashoffset = circumference - progress * circumference;

          return (
            <div key={idx} className="flex flex-col items-center gap-2 min-w-0">
              {/* SVG ring — sized to fill column, capped at 80px */}
              <div className="relative w-full max-w-[80px] aspect-square mx-auto">
                <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" strokeLinecap="round" />
                  <motion.circle
                    cx="44" cy="44" r={radius}
                    stroke={ring.color} strokeWidth="7" fill="none" strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: idx * 0.2 }}
                    strokeDasharray={circumference}
                    style={{ filter: `drop-shadow(0 0 5px ${ring.color}88)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/30 p-1 rounded-full border border-white/5">
                    {ring.icon}
                  </div>
                </div>
              </div>

              {/* Value + label below ring */}
              <div className="text-center min-w-0 w-full">
                <div className="text-white font-bold text-base leading-none truncate">{ring.value.toLocaleString()}</div>
                <div className="text-zinc-500 text-[10px] font-medium mt-0.5 truncate">{ring.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
