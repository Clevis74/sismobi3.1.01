import { describe, it, expect } from 'vitest';
import { formatDate, formatInputDate, isValidDate } from '../safeDateFormatting';

describe('safeDateFormatting', () => {
  describe('formatDate', () => {
    it('deve formatar datas válidas corretamente', () => {
      const date = new Date('2024-03-15');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/15\/03\/2024/);
    });

    it('deve retornar fallback para datas inválidas', () => {
      expect(formatDate(null)).toBe('Data inválida');
      expect(formatDate(undefined)).toBe('Data inválida');
      expect(formatDate('data-inválida')).toBe('Data inválida');
      expect(formatDate(NaN)).toBe('Data inválida');
    });

    it('deve aceitar custom fallback', () => {
      const customFallback = 'Sem data';
      expect(formatDate(null, { fallback: customFallback })).toBe(customFallback);
    });

    it('deve validar limites de ano', () => {
      const dateMuitoAntiga = new Date('1800-01-01');
      const dateMuitoFutura = new Date('2200-01-01');
      
      expect(formatDate(dateMuitoAntiga)).toBe('Data inválida');
      expect(formatDate(dateMuitoFutura)).toBe('Data inválida');
    });

    it('deve usar cache para datas repetidas', () => {
      const date = new Date('2024-03-15');
      const result1 = formatDate(date);
      const result2 = formatDate(date);
      
      expect(result1).toBe(result2);
    });

    it('deve processar strings de data brasileira', () => {
      const result = formatDate('15/03/2024');
      expect(result).toMatch(/15\/03\/2024/);
    });

    it('deve processar números timestamp', () => {
      const timestamp = new Date('2024-03-15').getTime();
      const result = formatDate(timestamp);
      expect(result).toMatch(/15\/03\/2024/);
    });
  });

  describe('formatInputDate', () => {
    it('deve formatar para input HTML', () => {
      const date = new Date('2024-03-15');
      expect(formatInputDate(date)).toBe('2024-03-15');
    });

    it('deve retornar string vazia para valores inválidos', () => {
      expect(formatInputDate(null)).toBe('');
      expect(formatInputDate('data-inválida')).toBe('');
    });
  });

  describe('isValidDate', () => {
    it('deve validar datas corretamente', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-03-15'))).toBe(true);
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('2024-03-15')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });
});