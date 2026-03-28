'use client';

/**
 * UserContext — single source of truth for auth across the entire app.
 *
 * WHY a context and not a per-component hook:
 *  - Hooks re-initialize on every page navigation (user briefly = null → "logged out" flash)
 *  - Multiple concurrent onAuthStateChange subscriptions can race
 *  - UserProvider lives in the root layout and NEVER unmounts, so auth state is stable
 *
 * Pattern: use onAuthStateChange as the ONLY auth source (Supabase v2 recommended).
 * INITIAL_SESSION fires immediately with the stored session, so loading resolves fast.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, type FitnessProfile } from './supabase';

export interface UserContextValue {
    user: User | null;
    profile: FitnessProfile | null;
    isPremium: boolean;
    isCoach: boolean;
    loading: boolean;
}

const UserContext = createContext<UserContextValue>({
    user: null,
    profile: null,
    isPremium: false,
    isCoach: false,
    loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<FitnessProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadProfile(userId: string) {
            try {
                const { data } = await supabase
                    .from('fitness_profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                if (mounted) setProfile(data ?? null);
            } catch {
                // Network error — profile stays null; auth still works
            }
        }

        // onAuthStateChange fires INITIAL_SESSION synchronously with the stored session.
        // This resolves auth state in the same JS tick — no async gap, no null flash.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            const u = session?.user ?? null;
            // Only update user reference if the ID actually changed (avoids TOKEN_REFRESHED churn)
            setUser(prev => (prev?.id === u?.id ? prev : u));

            if (u) {
                loadProfile(u.id);
            } else {
                setProfile(null);
            }

            // INITIAL_SESSION = first event on mount; signals auth state is known
            if (event === 'INITIAL_SESSION') {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <UserContext.Provider value={{
            user,
            profile,
            isPremium: profile?.is_premium ?? false,
            isCoach: profile?.role === 'coach',
            loading,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserFromContext(): UserContextValue {
    return useContext(UserContext);
}
