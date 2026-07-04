// 與後端 backend/src/utils/validators.ts 保持一致，供前端提前驗證避免送出失敗
// 台灣車牌格式很多（身障、外交、軍用、電動、拖車等），官方無完整清單，
// 嚴格白名單一定會漏漏誤擋合法客戶車牌，改用寬鬆 sanity check：
// 僅英數字加最多一個連字號、英數字部分 5-8 碼、至少各含一個英文字母與數字
const LICENSE_FORMAT = /^[A-Z0-9]+-?[A-Z0-9]+$/;

const PHONE_PATTERN = /^09\d{8}$/;

export const isValidPhone = (phone: string): boolean => {
  return PHONE_PATTERN.test(phone);
};

export const isValidLicense = (license: string): boolean => {
  const normalized = license.trim().toUpperCase();
  if (!LICENSE_FORMAT.test(normalized)) return false;

  const alnum = normalized.replace("-", "");
  if (alnum.length < 5 || alnum.length > 8) return false;

  return /[A-Z]/.test(alnum) && /[0-9]/.test(alnum);
};
