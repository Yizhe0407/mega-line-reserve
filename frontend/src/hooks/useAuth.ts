'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiff } from '@/providers/LiffProvider';
import { auth, FetchError } from '@/lib/api';
import { User } from '@/types/user';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  login: (phone?: string, license?: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { isLoggedIn: isLiffLoggedIn, isLoading: isLiffLoading, accessToken, login: liffLogin, logout: liffLogout } = useLiff();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await auth.getMe(accessToken);
      setUser(data.user);
      setError(null);
    } catch (err) {
      if (err instanceof FetchError && err.status === 401) {
        // 用戶尚未註冊
        setUser(null);
      } else {
        console.error('Failed to fetch user:', err);
        setError('無法取得用戶資訊');
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLiffLoading && isLiffLoggedIn) {
      fetchUser();
    } else if (!isLiffLoading) {
      setIsLoading(false);
    }
  }, [isLiffLoading, isLiffLoggedIn, fetchUser]);

  const login = async (phone?: string, license?: string) => {
    if (!isLiffLoggedIn) {
      liffLogin();
      return;
    }

    if (!accessToken) {
      setError('無法取得 access token');
      return;
    }

    try {
      setIsLoading(true);
      const data = await auth.login({ phone, license }, accessToken);
      setUser(data.user);
      setError(null);
    } catch (err) {
      if (err instanceof FetchError) {
        if (err.message.includes('手機號碼')) {
          setError('請提供手機號碼完成註冊');
        } else {
          setError(err.message);
        }
      } else {
        console.error('Login failed:', err);
        setError('登入過程發生錯誤');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    liffLogout();
    setUser(null);
  };

  return {
    user,
    isLoading: isLoading || isLiffLoading,
    isLoggedIn: isLiffLoggedIn && user !== null,
    error,
    login,
    logout,
    refetchUser: fetchUser,
  };
}
