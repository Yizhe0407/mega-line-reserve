'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import liff from '@line/liff';
import { initLiff, getAccessToken, liffLogin, liffLogout } from '@/lib/liff';

interface LiffContextType {
    liff: typeof liff | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    error: Error | null;
    accessToken: string | null;
    login: () => void;
    logout: () => void;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

interface LiffProviderProps {
    children: ReactNode;
}

export function LiffProvider({ children }: LiffProviderProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                await initLiff();
                const loggedIn = liff.isLoggedIn();
                setIsLoggedIn(loggedIn);
                
                if (loggedIn) {
                    setAccessToken(getAccessToken());
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('LIFF initialization failed'));
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    const login = () => {
        liffLogin();
    };

    const logout = () => {
        liffLogout();
        setIsLoggedIn(false);
        setAccessToken(null);
    };

    const value: LiffContextType = {
        liff: isLoading ? null : liff,
        isLoggedIn,
        isLoading,
        error,
        accessToken,
        login,
        logout,
    };

    return (
        <LiffContext.Provider value={value}>
            {children}
        </LiffContext.Provider>
    );
}

export function useLiff(): LiffContextType {
    const context = useContext(LiffContext);
    if (context === undefined) {
        throw new Error('useLiff must be used within a LiffProvider');
    }
    return context;
}
