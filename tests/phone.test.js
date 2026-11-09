import { describe, expect, it } from 'vitest';
import { normalizePhone, PhoneValidationError } from '../src/domain/phone.js';

describe('normalizePhone', () => {
  it('normalizes valid Brazilian numbers with DDD', () => {
    const result = normalizePhone('(45) 99123-4567', 'BR');
    expect(result.e164).toBe('+5545991234567');
    expect(result.country).toBe('BR');
  });

  it('normalizes valid Brazilian numbers with country code', () => {
    const result = normalizePhone('+55 11 98765-4321', 'BR');
    expect(result.e164).toBe('+5511987654321');
  });

  it('normalizes valid Paraguayan numbers', () => {
    const result = normalizePhone('0981 123 456', 'PY');
    expect(result.e164).toBe('+595981123456');
    expect(result.country).toBe('PY');
  });

  it('normalizes valid Paraguayan numbers with country code', () => {
    const result = normalizePhone('+595 971 654321', 'PY');
    expect(result.e164).toBe('+595971654321');
  });

  it('rejects invalid country', () => {
    expect(() => normalizePhone('11999999999', 'AR')).toThrow(PhoneValidationError);
  });

  it('rejects empty input', () => {
    expect(() => normalizePhone('', 'BR')).toThrow(PhoneValidationError);
  });
});
