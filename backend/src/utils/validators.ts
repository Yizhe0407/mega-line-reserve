const LICENSE_PATTERNS = [
  /^[A-Z]{2,4}-?\d{4}$/,
  /^\d{4}-?[A-Z]{2}$/,
  /^[A-Z]\d{3}-?[A-Z]\d{1,2}$/,
];

export const normalizeLicense = (license?: string): string => {
  return license?.trim().toUpperCase() ?? "";
};

export const isValidLicense = (license: string): boolean => {
  return LICENSE_PATTERNS.some((pattern) => pattern.test(license));
};
