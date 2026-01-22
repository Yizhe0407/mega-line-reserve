import { useState, useEffect } from "react";
import liff from "@line/liff";
import { ensureLiffInit } from "@/lib/liff";
import { auth } from "@/lib/api";

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await ensureLiffInit({ withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const token = liff.getIDToken();
        if (!token) {
          setError("無法取得 ID token");
          return;
        }

        setIdToken(token);
        const me = await auth.getMe(token);
        setIsAdmin(me.user.role === "ADMIN");
      } catch (err) {
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return { isAdmin, isLoading, error, idToken };
}
