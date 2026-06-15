// 與後端 backend/src/utils/validators.ts 保持一致，供前端提前驗證避免送出失敗
const LICENSE_PATTERNS = [
  /^[A-Z]{2,4}-?\d{4}$/,
  /^\d{4}-?[A-Z]{2}$/,
  /^[A-Z]\d{3}-?[A-Z]\d{1,2}$/,
];

const PHONE_PATTERN = /^09\d{8}$/;

export const isValidPhone = (phone: string): boolean => {
  return PHONE_PATTERN.test(phone);
};

export const isValidLicense = (license: string): boolean => {
  return LICENSE_PATTERNS.some((pattern) => pattern.test(license.trim().toUpperCase()));
};
