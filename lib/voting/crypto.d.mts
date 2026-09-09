export function normalizeNim(input: unknown): string;
export function normalizeAccessCode(input: unknown): string;
export function hashNim(nim: unknown, secret: string): string;
export function hashAccessCode(code: unknown, secret: string): string;
export function generateAccessCode(): string;
