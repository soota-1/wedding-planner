import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const MIN_PHOTO_ZOOM = 1;
export const MAX_PHOTO_ZOOM = 4;
export const DOUBLE_TAP_ZOOM = 2.5;
export const ZOOM_BUTTON_STEP = 0.75;

export interface FullScreenPhotoTarget {
  uri: string;
  title: string;
}

export interface FullScreenPhotoModalProps {
  photo: FullScreenPhotoTarget | null;
  onClose: () => void;
}

interface TouchPoint {
  pageX: number;
  pageY: number;
}

interface ResponderTouchEvent {
  nativeEvent: {
    touches?: ReadonlyArray<TouchPoint>;
  };
}

interface ViewLayoutEvent {
  nativeEvent: {
    layout: {
      width: number;
      height: number;
    };
  };
}

/** Clamps zoom scale within supported [1x, 4x] bounds. */
export function clampZoomScale(scale: number): number {
  if (!Number.isFinite(scale)) return MIN_PHOTO_ZOOM;
  return Math.min(MAX_PHOTO_ZOOM, Math.max(MIN_PHOTO_ZOOM, scale));
}

/** Clamps pan offset so zoomed photo stays within the visible viewport. */
export function clampPanOffset(offset: number, scale: number, viewportSize: number): number {
  if (scale <= 1.01 || viewportSize <= 0 || !Number.isFinite(offset)) return 0;
  const maxOffset = ((scale - 1) * viewportSize) / 2;
  return Math.min(maxOffset, Math.max(-maxOffset, offset));
}

/** Returns Euclidean distance between the first two touch points for pinch gestures. */
export function getTouchDistance(touches: ReadonlyArray<TouchPoint>): number {
  if (touches.length < 2) return 0;
  return Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
}

/**
 * Full-screen dark lightbox modal with pinch-to-zoom, double-tap zoom, pan when zoomed,
 * and explicit zoom buttons. Tapping the photo never dismisses the modal accidentally.
 */
export function FullScreenPhotoModal({ photo, onClose }: FullScreenPhotoModalProps) {
  const initialWindow = Dimensions.get('window');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef({
    width: initialWindow.width - 24,
    height: initialWindow.height * 0.68,
  });

  const gestureStartScaleRef = useRef(1);
  const pinchStartDistRef = useRef(0);
  const wasPinchingRef = useRef(false);
  const panStartPosRef = useRef({ x: 0, y: 0 });
  const touchAnchorRef = useRef({ x: 0, y: 0 });
  const movedSinceDownRef = useRef(false);
  const lastTapRef = useRef(0);

  const [displayScale, setDisplayScale] = useState(1);

  const applyImmediateTransform = (nextScale: number, nextX: number, nextY: number) => {
    scaleRef.current = nextScale;
    panRef.current = { x: nextX, y: nextY };
    scaleAnim.setValue(nextScale);
    panXAnim.setValue(nextX);
    panYAnim.setValue(nextY);
  };

  const animateToZoom = (targetScale: number) => {
    const clampedScale = clampZoomScale(targetScale);
    const nextX =
      clampedScale <= 1.01
        ? 0
        : clampPanOffset(panRef.current.x, clampedScale, viewportRef.current.width);
    const nextY =
      clampedScale <= 1.01
        ? 0
        : clampPanOffset(panRef.current.y, clampedScale, viewportRef.current.height);

    scaleRef.current = clampedScale;
    panRef.current = { x: nextX, y: nextY };
    setDisplayScale(Number(clampedScale.toFixed(2)));

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: clampedScale,
        useNativeDriver: true,
        speed: 22,
        bounciness: 3,
      }),
      Animated.spring(panXAnim, {
        toValue: nextX,
        useNativeDriver: true,
        speed: 22,
        bounciness: 3,
      }),
      Animated.spring(panYAnim, {
        toValue: nextY,
        useNativeDriver: true,
        speed: 22,
        bounciness: 3,
      }),
    ]).start();
  };

  useEffect(() => {
    applyImmediateTransform(1, 0, 0);
    setDisplayScale(1);
    lastTapRef.current = 0;
  }, [photo?.uri]);

  const handleResponderGrant = (evt: ResponderTouchEvent) => {
    const touches = evt.nativeEvent.touches || [];
    movedSinceDownRef.current = false;

    if (touches.length >= 2) {
      wasPinchingRef.current = true;
      pinchStartDistRef.current = getTouchDistance(touches);
      gestureStartScaleRef.current = scaleRef.current;
    } else if (touches.length === 1) {
      wasPinchingRef.current = false;
      touchAnchorRef.current = { x: touches[0].pageX, y: touches[0].pageY };
      panStartPosRef.current = { ...panRef.current };
    }
  };

  const handleResponderMove = (evt: ResponderTouchEvent) => {
    const touches = evt.nativeEvent.touches || [];

    if (touches.length >= 2) {
      movedSinceDownRef.current = true;
      const dist = getTouchDistance(touches);
      if (!wasPinchingRef.current || pinchStartDistRef.current <= 0) {
        wasPinchingRef.current = true;
        pinchStartDistRef.current = dist;
        gestureStartScaleRef.current = scaleRef.current;
        return;
      }

      const ratio = dist / pinchStartDistRef.current;
      const nextScale = clampZoomScale(gestureStartScaleRef.current * ratio);
      const nextX = clampPanOffset(panRef.current.x, nextScale, viewportRef.current.width);
      const nextY = clampPanOffset(panRef.current.y, nextScale, viewportRef.current.height);
      applyImmediateTransform(nextScale, nextX, nextY);
      return;
    }

    if (touches.length === 1) {
      if (wasPinchingRef.current) {
        wasPinchingRef.current = false;
        touchAnchorRef.current = { x: touches[0].pageX, y: touches[0].pageY };
        panStartPosRef.current = { ...panRef.current };
        return;
      }

      const dx = touches[0].pageX - touchAnchorRef.current.x;
      const dy = touches[0].pageY - touchAnchorRef.current.y;
      if (Math.hypot(dx, dy) > 8) {
        movedSinceDownRef.current = true;
      }

      if (scaleRef.current > 1.02) {
        const nextX = clampPanOffset(
          panStartPosRef.current.x + dx,
          scaleRef.current,
          viewportRef.current.width
        );
        const nextY = clampPanOffset(
          panStartPosRef.current.y + dy,
          scaleRef.current,
          viewportRef.current.height
        );
        applyImmediateTransform(scaleRef.current, nextX, nextY);
      }
    }
  };

  const handleResponderRelease = () => {
    if (scaleRef.current < 1.05) {
      animateToZoom(1);
    } else {
      setDisplayScale(Number(scaleRef.current.toFixed(2)));
    }

    // Only handle double-tap to zoom; a single tap on the photo does nothing (never closes).
    if (!movedSinceDownRef.current) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        lastTapRef.current = 0;
        animateToZoom(scaleRef.current > 1.05 ? MIN_PHOTO_ZOOM : DOUBLE_TAP_ZOOM);
      } else {
        lastTapRef.current = now;
      }
    }
  };

  const isZoomedOut = displayScale <= MIN_PHOTO_ZOOM + 0.02;
  const isZoomedMax = displayScale >= MAX_PHOTO_ZOOM - 0.02;

  return (
    <Modal visible={!!photo} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {photo?.title || ''}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Tutup pratinjau foto"
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View
            style={styles.viewport}
            onLayout={(e: ViewLayoutEvent) => {
              const { width, height } = e.nativeEvent.layout;
              viewportRef.current = { width, height };
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={handleResponderGrant}
            onResponderMove={handleResponderMove}
            onResponderRelease={handleResponderRelease}
          >
            {photo ? (
              <Animated.View
                style={[
                  styles.animatedImageWrap,
                  {
                    transform: [
                      { translateX: panXAnim },
                      { translateY: panYAnim },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.hintText}>
              Cubit atau ketuk 2× untuk zoom • Geser saat diperbesar
            </Text>
            <View style={styles.controlsBar}>
              <TouchableOpacity
                onPress={() => animateToZoom(scaleRef.current - ZOOM_BUTTON_STEP)}
                disabled={isZoomedOut}
                activeOpacity={0.75}
                style={[styles.controlBtn, isZoomedOut && styles.controlBtnDisabled]}
                accessibilityLabel="Perkecil foto"
              >
                <Ionicons name="remove" size={20} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => animateToZoom(MIN_PHOTO_ZOOM)}
                disabled={isZoomedOut}
                activeOpacity={0.75}
                style={styles.scalePill}
                accessibilityLabel="Reset ukuran zoom"
              >
                <Text style={styles.scaleText}>{`${displayScale.toFixed(1)}x`}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => animateToZoom(scaleRef.current + ZOOM_BUTTON_STEP)}
                disabled={isZoomedMax}
                activeOpacity={0.75}
                style={[styles.controlBtn, isZoomedMax && styles.controlBtnDisabled]}
                accessibilityLabel="Perbesar foto"
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.86)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 6,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  animatedImageWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    zIndex: 10,
  },
  hintText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(25, 27, 32, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.35,
  },
  scalePill: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
