import { describe, expect, it } from 'vitest';
import { calculateCulturalScore, getMaturityBand, validateAnswers, validateParticipant } from '../src/domain/assessment.js';

describe('calculateCulturalScore', () => {
  it('returns appropriate maturity band descriptions', () => {
    expect(getMaturityBand(4.5, 'pt-BR').code).toBe('SOLID');
    expect(getMaturityBand(3.5, 'pt-BR').code).toBe('BUILDING');
    expect(getMaturityBand(2.5, 'pt-BR').code).toBe('RISK');
  });

  it('calculates perfect score (all 5s)', () => {
    const answers = Array(20).fill(5);
    const result = calculateCulturalScore(answers, 'pt-BR');
    expect(result.totalScore).toBe(100);
    expect(result.culturalIndex).toBe(5.0);
    expect(result.maturity.code).toBe('SOLID');
    expect(result.maturity.name).toBe('Cultura Sólida');
    expect(result.dimensions).toHaveLength(4);
    result.dimensions.forEach((d) => {
      expect(d.score).toBe(5.0);
      expect(d.percentage).toBe(100);
    });
  });

  it('calculates critical score (all 1s) as RISK', () => {
    const answers = Array(20).fill(1);
    const result = calculateCulturalScore(answers, 'pt-BR');
    expect(result.totalScore).toBe(20);
    expect(result.culturalIndex).toBe(1.0);
    expect(result.maturity.code).toBe('RISK');
    expect(result.maturity.name).toBe('Cultura em Risco');
  });

  it('calculates intermediate score (all 3s) as BUILDING', () => {
    const answers = Array(20).fill(3);
    const result = calculateCulturalScore(answers, 'pt-BR');
    expect(result.totalScore).toBe(60);
    expect(result.culturalIndex).toBe(3.0);
    expect(result.maturity.code).toBe('BUILDING');
    expect(result.maturity.name).toBe('Cultura em Construção');
  });

  it('provides Spanish translations when locale is es-PY', () => {
    const answers = Array(20).fill(4);
    const result = calculateCulturalScore(answers, 'es-PY');
    expect(result.maturity.name).toBe('Cultura Sólida');
    expect(result.dimensions[0].title).toBe('Identidad y Liderazgo');
  });

  it('rejects answers array with incorrect length', () => {
    expect(() => validateAnswers([1, 2, 3])).toThrow('exatamente 20 respostas');
  });

  it('rejects answers with ratings outside 1-5', () => {
    const invalid = Array(20).fill(3);
    invalid[5] = 6;
    expect(() => validateAnswers(invalid)).toThrow('deve ser de 1 a 5');
  });
});

describe('validateParticipant', () => {
  it('validates Brazilian participant correctly', () => {
    const valid = validateParticipant({
      name: 'João Silva',
      company: 'Dalet Importados',
      country: 'BR',
      phone: '(45) 99123-4567',
      consent: true
    });
    expect(valid.name).toBe('João Silva');
    expect(valid.company).toBe('Dalet Importados');
    expect(valid.phone.e164).toBe('+5545991234567');
  });

  it('rejects missing consent', () => {
    expect(() => validateParticipant({
      name: 'João Silva',
      company: 'Empresa',
      country: 'BR',
      phone: '45991234567',
      consent: false
    })).toThrow('obrigatório aceitar');
  });
});
