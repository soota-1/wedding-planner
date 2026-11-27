import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { useWeddingStore } from '../src/stores/useWeddingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideItem {
  key: string;
  kicker: string;
  title: string;
  description: string;
  badgeText: string;
  image?: any;
  isEditorialGraphic?: boolean;
}

const SLIDES: SlideItem[] = [
  {
    key: 'canonical',
    kicker: 'SAKRAL & TERATUR',
    title: 'Sakramen & Berkas Kanonik',
    description:
      'Pantau jadwal KPP, penyelidikan kanonik, berkas Disdukcapil N1–N4, dan batas masa berlaku Surat Baptis 180 hari tanpa terlewat.',
    badgeText: 'H-180 • KHK 1066',
    image: require('../assets/images/onboarding-1.jpg'),
  },
  {
    key: 'budget',
    kicker: 'TRANSPARAN & PRESISI',
    title: 'Anggaran & Vendor Terkontrol',
    description:
      'Pisahkan kas terbayar riil dan komitmen kontrak vendor. Deteksi over-budget sejak dini serta catat kontribusi Octa, Jenesia, dan keluarga.',
    badgeText: 'Anti Double-Counting',
    isEditorialGraphic: true,
  },
  {
    key: 'couple',
    kicker: 'KOLABORASI REAL-TIME',
    title: 'Tamu, Angpau & Sinkronisasi',
    description:
      'Hitung pax katering pasti dari RSVP tamu, catat buku besar angpau, dan sinkronkan seluruh progres berdua secara real-time.',
    badgeText: 'Octa ↔ Jenesia',
    image: require('../assets/images/onboarding-3.jpg'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const setHasSeenOnboarding = useWeddingStore((s) => s.setHasSeenOnboarding);

  const finishOnboarding = () => {
    setHasSeenOnboarding(true);
    router.replace('/login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIdx * SCREEN_WIDTH, animated: true });
      setCurrentIndex(nextIdx);
    } else {
      finishOnboarding();
    }
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Skip Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <Ionicons name="heart" size={14} color={colors.accent} />
          <Text style={styles.brandText}>Wedding Tracker</Text>
        </View>
        <TouchableOpacity onPress={finishOnboarding} activeOpacity={0.7} style={styles.skipButton}>
          <Text style={styles.skipText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* Paged Animated Carousel */}
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
      >
        {SLIDES.map((slide, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.88, 1, 0.88],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [18, 0, 18],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <Animated.View
                style={[
                  styles.visualFrame,
                  {
                    opacity,
                    transform: [{ scale }, { translateY }],
                  },
                ]}
              >
                {slide.image ? (
                  <Image source={slide.image} style={styles.illustration} resizeMode="cover" />
                ) : (
                  /* Editorial Financial Visual Card for Slide 2 */
                  <View style={styles.editorialGraphicCard}>
                    <View style={styles.graphicTopRow}>
                      <View style={styles.graphicIconCircle}>
                        <Ionicons name="wallet-outline" size={26} color={colors.accent} />
                      </View>
                      <View style={styles.graphicPill}>
                        <Text style={styles.graphicPillText}>Live Ledger</Text>
                      </View>
                    </View>
                    <Text style={styles.graphicAmount}>Rp 150.000.000</Text>
                    <Text style={styles.graphicCaption}>Target Anggaran Terencana</Text>
                    <View style={styles.graphicProgressTrack}>
                      <View style={styles.graphicProgressFill} />
                    </View>
                    <View style={styles.graphicLegendRow}>
                      <View style={styles.legendDotRow}>
                        <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                        <Text style={styles.legendLabel}>Octa</Text>
                      </View>
                      <View style={styles.legendDotRow}>
                        <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                        <Text style={styles.legendLabel}>Jenesia</Text>
                      </View>
                      <View style={styles.legendDotRow}>
                        <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                        <Text style={styles.legendLabel}>Keluarga</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.floatingBadge}>
                  <Ionicons name="sparkles" size={12} color={colors.accent} />
                  <Text style={styles.floatingBadgeText}>{slide.badgeText}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.textSection, { opacity }]}>
                <Text style={styles.kicker}>{slide.kicker}</Text>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Bottom Controls: Animated Dots & CTA */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((s, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
              outputRange: [8, 26, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={s.key}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={styles.ctaButton}>
          <Text style={styles.ctaText}>
            {currentIndex === SLIDES.length - 1 ? 'Mulai Persiapan' : 'Lanjut'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={18}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slide: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualFrame: {
    width: Math.min(SCREEN_WIDTH - 64, 310),
    height: Math.min(SCREEN_WIDTH - 64, 310),
    borderRadius: 28,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: spacing.xl,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  editorialGraphicCard: {
    width: '86%',
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  graphicTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  graphicIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphicPill: {
    backgroundColor: colors.accentLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  graphicPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  graphicAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  graphicCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  graphicProgressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  graphicProgressFill: {
    width: '68%',
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  graphicLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  floatingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.accent,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 999,
    gap: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
});
