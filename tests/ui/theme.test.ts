import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

describe('Design System Theme Tokens', () => {
  it('defines refined minimalist editorial color tokens', () => {
    expect(colors.bg).toBe('#F8F7F4');
    expect(colors.accent).toBe('#9E5A47');
    expect(colors.secondary).toBe('#B89242');
    expect(colors.textPrimary).toBe('#111318');
    expect(colors.cardBg).toBe('#FFFFFF');
    expect(colors.border).toBe('#E9E6DF');
    expect(colors.success).toBe('#236B48');
    expect(colors.warning).toBe('#9A6012');
    expect(colors.danger).toBe('#A83232');
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
