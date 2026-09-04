import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../storage';

describe('Accessibility & Motion Compliance Suite', () => {
  const mockStorage = new Map<string, string>();

  beforeEach(() => {
    mockStorage.clear();
    globalThis.localStorage = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
      key: (i: number) => Array.from(mockStorage.keys())[i] ?? null,
      get length() {
        return mockStorage.size;
      },
    } as Storage;
  });

  it('supports user reduced motion preferences', () => {
    // Default system preference
    const defaultPref = StorageService.getPreferences();
    expect(['system', 'reduce', 'no-preference']).toContain(defaultPref.reducedMotion || 'system');

    // Change to reduce motion
    StorageService.savePreferences({ reducedMotion: 'reduce' });
    const updatedPref = StorageService.getPreferences();
    expect(updatedPref.reducedMotion).toBe('reduce');

    // Change to no-preference
    StorageService.savePreferences({ reducedMotion: 'no-preference' });
    expect(StorageService.getPreferences().reducedMotion).toBe('no-preference');
  });

  it('calculates WCAG color contrast ratios accurately', () => {
    // Relative luminance calculation for contrast
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const getContrastRatio = (lum1: number, lum2: number) => {
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    // White on Aqua dark background (#070d18 = rgb(7, 13, 24))
    const whiteLum = getLuminance(255, 255, 255);
    const darkBgLum = getLuminance(7, 13, 24);
    const contrastRatio = getContrastRatio(whiteLum, darkBgLum);

    // WCAG AA requires 4.5:1, AAA requires 7:1
    expect(contrastRatio).toBeGreaterThan(15.0); // High contrast ratio (>15:1)
  });
});
