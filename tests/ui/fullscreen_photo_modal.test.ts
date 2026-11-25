import {
  FullScreenPhotoModal,
  clampZoomScale,
  clampPanOffset,
  getTouchDistance,
  MIN_PHOTO_ZOOM,
  MAX_PHOTO_ZOOM,
} from '../../src/components/common/FullScreenPhotoModal';

function findElements(node: any, predicate: (el: any) => boolean): any[] {
  if (!node || typeof node !== 'object') return [];
  const results: any[] = [];
  if (predicate(node)) results.push(node);
  const children = node.props?.children;
  if (Array.isArray(children)) {
    children.forEach((child) => results.push(...findElements(child, predicate)));
  } else if (children) {
    results.push(...findElements(children, predicate));
  }
  return results;
}

describe('FullScreenPhotoModal zoom & lightbox UX', () => {
  it('clamps zoom scale cleanly between 1x and 4x', () => {
    expect(clampZoomScale(0.4)).toBe(MIN_PHOTO_ZOOM);
    expect(clampZoomScale(2.5)).toBe(2.5);
    expect(clampZoomScale(7)).toBe(MAX_PHOTO_ZOOM);
    expect(clampZoomScale(Number.NaN)).toBe(MIN_PHOTO_ZOOM);
  });

  it('clamps pan offset within zoomed viewport bounds and resets at 1x', () => {
    expect(clampPanOffset(120, 1, 400)).toBe(0);
    expect(clampPanOffset(150, 2, 400)).toBe(150);
    expect(clampPanOffset(300, 2, 400)).toBe(200);
    expect(clampPanOffset(-350, 2, 400)).toBe(-200);
  });

  it('computes pinch distance between two touches', () => {
    expect(getTouchDistance([{ pageX: 0, pageY: 0 }])).toBe(0);
    expect(
      getTouchDistance([
        { pageX: 0, pageY: 0 },
        { pageX: 30, pageY: 40 },
      ])
    ).toBe(50);
  });

  it('renders dark overlay with zoom controls and does NOT close when photo viewport is tapped', () => {
    const onClose = jest.fn();
    const tree = FullScreenPhotoModal({
      photo: { uri: 'https://cdn.example.com/photo.jpg', title: 'Dekorasi Pelaminan' },
      onClose,
    });
    const serialized = JSON.stringify(tree);

    expect(serialized).toContain('rgba(0, 0, 0, 0.86)');
    expect(serialized).toContain('Dekorasi Pelaminan');
    expect(serialized).toContain('1.0x');
    expect(serialized).toContain('Perbesar foto');
    expect(serialized).toContain('Perkecil foto');

    // Simulate single tap & pinch gesture on the photo canvas -> must NEVER trigger onClose
    const viewportView = findElements(
      tree,
      (el) => typeof el.props?.onResponderRelease === 'function'
    )[0];
    expect(viewportView).toBeDefined();
    viewportView.props.onResponderGrant({
      nativeEvent: { touches: [{ pageX: 200, pageY: 300 }] },
    });
    viewportView.props.onResponderRelease();
    expect(onClose).not.toHaveBeenCalled();

    // Simulate two-finger pinch -> must NEVER trigger onClose
    viewportView.props.onResponderGrant({
      nativeEvent: {
        touches: [
          { pageX: 150, pageY: 300 },
          { pageX: 250, pageY: 300 },
        ],
      },
    });
    viewportView.props.onResponderMove({
      nativeEvent: {
        touches: [
          { pageX: 100, pageY: 300 },
          { pageX: 300, pageY: 300 },
        ],
      },
    });
    viewportView.props.onResponderRelease();
    expect(onClose).not.toHaveBeenCalled();

    // Pressing the close button MUST trigger onClose
    const closeBtn = findElements(
      tree,
      (el) => el.props?.accessibilityLabel === 'Tutup pratinjau foto'
    )[0];
    expect(closeBtn).toBeDefined();
    closeBtn.props.onPress();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
