import MoodboardScreen from '../../app/moodboard';
import { useWeddingStore } from '../../src/stores/useWeddingStore';
import { useAuthStore } from '../../src/stores/useAuthStore';

describe('MoodboardScreen (Task 6)', () => {
  beforeEach(() => {
    useWeddingStore.getState().resetAllData();
    useAuthStore.getState().reset();
  });

  it('exports a valid React component and renders empty state with CTA cleanly', () => {
    expect(MoodboardScreen).toBeDefined();
    expect(typeof MoodboardScreen).toBe('function');

    const tree = MoodboardScreen();
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('Moodboard & Referensi');
    expect(serialized).toContain('Tambah Inspirasi Pertama');
    expect(serialized).toContain('Nyalakan data seluler atau Wi-Fi');
  });

  it('renders populated moodboard cards, Final badge, vendor name, and Ekspor Brief PDF', () => {
    useWeddingStore.setState({
      moodboardItems: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Pelaminan Putih Minimalis',
          category: 'decor',
          imageUrl: 'https://cdn.example.com/decor.jpg',
          colorPalette: ['#F8F7F4', '#9E5A47'],
          vendorId: 'v1',
          isFinal: true,
          createdAt: '2026-11-25T10:00:00Z',
        },
      ],
    });

    const tree = MoodboardScreen();
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('Pelaminan Putih Minimalis');
    expect(serialized).toContain('Ekspor Brief PDF');
    expect(serialized).toContain('Gedung Paroki St. Perawan Maria');
  });
});
