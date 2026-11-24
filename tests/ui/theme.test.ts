import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

describe('Design System Theme Tokens', () => {
  it('defines required wedding theme color tokens', () => {
    expect(colors.bg).toBe('#FDFBF7');
    expect(colors.accent).toBe('#C57B57');
    expect(colors.secondary).toBe('#D4AF37');
    expect(colors.textPrimary).toBe('#1A2238');
    expect(colors.cardBg).toBe('#FFFFFF');
    expect(colors.border).toBe('#EFECE6');
    expect(colors.success).toBe('#2E7D32');
    expect(colors.warning).toBe('#D97706');
    expect(colors.danger).toBe('#DC2626');
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
