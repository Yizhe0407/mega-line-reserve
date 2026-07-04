// 台灣車牌格式很多（身障、外交、軍用、電動、拖車等），官方無完整清單，
// 嚴格白名單一定會漏漏誤擋合法客戶車牌，改用寬鬆 sanity check：
// 僅英數字加最多一個連字號、英數字部分 5-8 碼、至少各含一個英文字母與數字
const LICENSE_FORMAT = /^[A-Z0-9]+-?[A-Z0-9]+$/;

export const normalizeLicense = (license?: string): string => {
  return license?.trim().toUpperCase() ?? "";
};

export const isValidLicense = (license: string): boolean => {
  if (!LICENSE_FORMAT.test(license)) return false;

  const alnum = license.replace("-", "");
  if (alnum.length < 5 || alnum.length > 8) return false;

  return /[A-Z]/.test(alnum) && /[0-9]/.test(alnum);
};
