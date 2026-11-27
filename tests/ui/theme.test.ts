import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

describe('Design System Theme Tokens', () => {
  it('keeps text and primary actions readable on their intended surfaces', () => {
    const pairs = [
      [colors.textPrimary, colors.bg],
      [colors.textSecondary, colors.surfaceMuted],
      [colors.textMuted, colors.bg],
      [colors.accent, colors.accentLight],
      [colors.textLight, colors.accent],
      [colors.success, colors.successBg],
      [colors.warning, colors.warningBg],
      [colors.danger, colors.dangerBg],
    ];

    for (const [foreground, background] of pairs) {
      const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('defines standard spacing and border radius', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
    expect(spacing.borderRadius).toBe(12);
  });
});

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
