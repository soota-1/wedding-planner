export const colors = {
  // Backgrounds
  bg: '#FDFBF7', // Warm Ivory / Off-White
  cardBg: '#FFFFFF', // Pure White for clean contrast
  border: '#EFECE6', // Subtle warm border
  borderDark: '#DDD8CE',

  // Wedding Brand Accents (Earthy & Romantic)
  accent: '#C57B57', // Terracotta / Warm Rose Gold
  accentLight: '#FBECE7', // Soft blush background tint
  accentDark: '#9E5B3B',

  // Secondary Accents
  secondary: '#D4AF37', // Champagne Gold
  secondaryLight: '#FCF7E6',

  // Typography
  textPrimary: '#1A2238', // Deep Midnight Navy
  textSecondary: '#6B7280', // Muted Charcoal
  textMuted: '#9CA3AF',
  textLight: '#FFFFFF',

  // Semantic Status
  success: '#2E7D32', // Emerald Green (Sah / Selesai)
  successBg: '#E8F5E9',
  warning: '#D97706', // Warm Amber (Peringatan / Kedaluwarsa / Over-budget)
  warningBg: '#FEF3C7',
  danger: '#DC2626', // Ruby Red (Kritis / Overdue)
  dangerBg: '#FEE2E2',
  info: '#2563EB', // Royal Blue
  infoBg: '#EFF6FF',
  neutral: '#F3F4F6',
  neutralDark: '#E5E7EB',
};

export type ColorKey = keyof typeof colors;
