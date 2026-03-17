"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WorkoutSessionContextType {
    startTime: number | null;
    elapsedTime: number; // in seconds
    isRunning: boolean;
    startSession: () => void;
    pauseSession: () => void;
    endSession: () => void;
    formatTime: (seconds: number) => string;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextType | undefined>(undefined);

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning]);

    const startSession = () => {
        if (!isRunning) {
            setIsRunning(true);
            if (startTime === null) setStartTime(Date.now());
        }
    };

    const pauseSession = () => {
        setIsRunning(false);
    };

    const endSession = () => {
        setIsRunning(false);
        setStartTime(null);
        setElapsedTime(0);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <WorkoutSessionContext.Provider value={{ startTime, elapsedTime, isRunning, startSession, pauseSession, endSession, formatTime }}>
            {children}
        </WorkoutSessionContext.Provider>
    );
}

export function useWorkoutSession() {
    const context = useContext(WorkoutSessionContext);
    if (context === undefined) {
        throw new Error('useWorkoutSession must be used within a WorkoutSessionProvider');
    }
    return context;
}
