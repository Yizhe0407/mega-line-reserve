// 台灣現行車牌格式（含七代殘留、八代、八代二式一車一號）：
// 2英+3或4數、3英+2或3或4數、4數+2英、2數+3英
const LICENSE_PATTERNS = [
  /^[A-Z]{2}-?\d{3,4}$/,
  /^[A-Z]{3}-?\d{2,4}$/,
  /^\d{4}-?[A-Z]{2}$/,
  /^\d{2}-?[A-Z]{3}$/,
];

export const normalizeLicense = (license?: string): string => {
  return license?.trim().toUpperCase() ?? "";
};

export const isValidLicense = (license: string): boolean => {
  return LICENSE_PATTERNS.some((pattern) => pattern.test(license));
};
