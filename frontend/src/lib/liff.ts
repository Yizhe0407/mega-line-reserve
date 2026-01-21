import liff from '@line/liff';

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';

let initPromise: Promise<void> | null = null;

/**
 * 初始化 LIFF SDK
 */
export const initLiff = async (): Promise<void> => {
    return ensureLiffInit();
};

export const ensureLiffInit = async (options?: { withLoginOnExternalBrowser?: boolean }): Promise<void> => {
    if (!LIFF_ID) {
        console.error('LIFF ID is not set. Please set NEXT_PUBLIC_LIFF_ID environment variable.');
        return;
    }

    if (!initPromise) {
        initPromise = liff
            .init({
                liffId: LIFF_ID,
                ...(options?.withLoginOnExternalBrowser !== undefined
                    ? { withLoginOnExternalBrowser: options.withLoginOnExternalBrowser }
                    : {}),
            })
            .then(() => {
                console.log('LIFF initialized successfully');
            })
            .catch((error) => {
                initPromise = null;
                console.error('LIFF initialization failed:', error);
                throw error;
            });
    }

    return initPromise;
};

/**
 * 取得 access token
 */
export const getAccessToken = (): string | null => {
    if (!liff.isLoggedIn()) {
        return null;
    }
    return liff.getAccessToken();
};

/**
 * 登入
 */
export const liffLogin = (): void => {
    if (!liff.isLoggedIn()) {
        liff.login();
    }
};

/**
 * 登出
 */
export const liffLogout = (): void => {
    if (liff.isLoggedIn()) {
        liff.logout();
        window.location.reload();
    }
};

/**
 * 取得用戶 profile
 */
export const getLiffProfile = async () => {
    if (!liff.isLoggedIn()) {
        return null;
    }
    return liff.getProfile();
};
