import { ValidationError } from '../types/errors';

export const parsePositiveIntParam = (value: string | string[], label: string): number => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!/^\d+$/.test(raw)) {
        throw new ValidationError(`無效的${label} ID`);
    }

    const id = Number(raw);
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ValidationError(`無效的${label} ID`);
    }

    return id;
};
