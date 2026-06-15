import useSWR from "swr";
import liff from "@line/liff";
import { ensureLiffInit } from "@/lib/liff";
import { getMe } from "@/lib/api/endpoints/auth";
import { AUTH_TOKEN_ERROR_MESSAGE } from "@/constants/errors";

export function useAdminAuth() {
  const { data, error, isLoading } = useSWR(
    "admin-auth",
    async () => {
      await ensureLiffInit({ withLoginOnExternalBrowser: true });

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return { isAdmin: null as boolean | null, idToken: null as string | null };
      }

      const token = liff.getIDToken();
      if (!token) {
        throw new Error(AUTH_TOKEN_ERROR_MESSAGE);
      }

      const me = await getMe(token);
      return { isAdmin: me.user.role === "ADMIN", idToken: token };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  return {
    isAdmin: data?.isAdmin ?? null,
    idToken: data?.idToken ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
