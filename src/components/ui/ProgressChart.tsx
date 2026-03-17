"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './ProgressChart.module.css';

const DATA_SETS = {
    volume: [
        { name: 'Mon', value: 4000 }, { name: 'Tue', value: 3000 }, { name: 'Wed', value: 6000 },
        { name: 'Thu', value: 4500 }, { name: 'Fri', value: 8000 }, { name: 'Sat', value: 5000 }, { name: 'Sun', value: 7500 },
    ],
    calories: [
        { name: 'Mon', value: 2100 }, { name: 'Tue', value: 2300 }, { name: 'Wed', value: 2000 },
        { name: 'Thu', value: 2400 }, { name: 'Fri', value: 1800 }, { name: 'Sat', value: 2800 }, { name: 'Sun', value: 2200 },
    ],
    time: [
        { name: 'Mon', value: 45 }, { name: 'Tue', value: 30 }, { name: 'Wed', value: 60 },
        { name: 'Thu', value: 50 }, { name: 'Fri', value: 90 }, { name: 'Sat', value: 40 }, { name: 'Sun', value: 60 },
    ]
};

type MetricType = 'volume' | 'calories' | 'time';

export default function ProgressChart() {
    const [metric, setMetric] = React.useState<MetricType>('volume');

    const config = {
        volume: { title: '每週訓練總量 (kg)', color: 'var(--primary)', unit: 'kg' },
        calories: { title: '每週熱量攝取 (kcal)', color: '#f59e0b', unit: 'kcal' },
        time: { title: '每週訓練時間 (min)', color: '#3b82f6', unit: 'min' }
    };

    return (
        <div className={styles.chartContainer}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={styles.chartTitle}>{config[metric].title}</h3>
                <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setMetric('volume')}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${metric === 'volume' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        KG
                    </button>
                    <button
                        onClick={() => setMetric('calories')}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${metric === 'calories' ? 'bg-yellow-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Cal
                    </button>
                    <button
                        onClick={() => setMetric('time')}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${metric === 'time' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Time
                    </button>
                </div>
            </div>

            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <AreaChart data={DATA_SETS[metric]}>
                        <defs>
                            <linearGradient id={`color${metric}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={config[metric].color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={config[metric].color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        />
                        <YAxis
                            hide
                            domain={['dataMin - 100', 'dataMax + 100']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: 'var(--foreground)' }}
                            formatter={(value: any) => [`${value} ${config[metric].unit}`, metric === 'volume' ? 'Volume' : metric === 'calories' ? 'Calories' : 'Time']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={config[metric].color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#color${metric})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
