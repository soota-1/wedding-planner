import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { Card } from '../src/components/common/Card';
import { Badge } from '../src/components/common/Badge';
import { FilterChipBar } from '../src/components/common/FilterChipBar';
import { FadeInView } from '../src/components/common/FadeInView';
import {
  useWeddingStore,
  MoodboardCategory,
  MoodboardItem,
} from '../src/stores/useWeddingStore';
import { useAuthStore } from '../src/stores/useAuthStore';
import { isSupabaseConfigured, isValidUuid } from '../src/services/cloudSyncService';
import {
  exportMoodboardBriefPdf,
  shareSingleMoodboardItem,
} from '../src/services/moodboardShareService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_TABS: { key: 'all' | MoodboardCategory; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'decor', label: 'Dekorasi' },
  { key: 'attire', label: 'Busana' },
  { key: 'makeup', label: 'MUA' },
  { key: 'photo', label: 'Foto' },
  { key: 'other', label: 'Lainnya' },
];

const PRESET_SWATCHES = [
  '#F8F7F4',
  '#FFFFFF',
  '#9E5A47',
  '#B89242',
  '#236B48',
  '#111318',
  '#D6C2B8',
  '#7A8B7B',
];

function getCategoryLabel(cat: MoodboardCategory): string {
  return CATEGORY_TABS.find((t) => t.key === cat)?.label || 'Lainnya';
}

export default function MoodboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vendorId?: string }>();

  const moodboardItems = useWeddingStore((s) => s.moodboardItems);
  const vendors = useWeddingStore((s) => s.vendors);
  const profile = useWeddingStore((s) => s.profile);
  const addMoodboardItemOnline = useWeddingStore((s) => s.addMoodboardItemOnline);
  const updateMoodboardItemOnline = useWeddingStore((s) => s.updateMoodboardItemOnline);
  const toggleMoodboardFinalOnline = useWeddingStore((s) => s.toggleMoodboardFinalOnline);
  const deleteMoodboardItemOnline = useWeddingStore((s) => s.deleteMoodboardItemOnline);

  const authUser = useAuthStore((s) => s.user);
  const activeWorkspace = useAuthStore((s) => s.activeWorkspace);
  const isCloudReady = isSupabaseConfigured() && !!authUser && !!activeWorkspace?.id;

  // Filters
  const rawVendorParam = Array.isArray(params?.vendorId) ? params.vendorId[0] : params?.vendorId;
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [onlyFinal, setOnlyFinal] = useState(false);
  const [filterVendorId, setFilterVendorId] = useState<string | null>(
    typeof rawVendorParam === 'string' && rawVendorParam ? rawVendorParam : null
  );

  useEffect(() => {
    setFilterVendorId(typeof rawVendorParam === 'string' && rawVendorParam ? rawVendorParam : null);
  }, [rawVendorParam]);

  // Form Modal State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MoodboardItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MoodboardCategory>('decor');
  const [formLocalImageUri, setFormLocalImageUri] = useState<string | undefined>(undefined);
  const [formExistingImageUrl, setFormExistingImageUrl] = useState<string | undefined>(undefined);
  const [formClearExistingPhoto, setFormClearExistingPhoto] = useState(false);
  const [formRefUrl, setFormRefUrl] = useState('');
  const [formVendorId, setFormVendorId] = useState<string | undefined>(undefined);
  const [formPalette, setFormPalette] = useState<string[]>(['#F8F7F4', '#9E5A47']);
  const [customHexInput, setCustomHexInput] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsFinal, setFormIsFinal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Detail Modal State (always derive live item from store)
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const detailItem = detailItemId
    ? moodboardItems.find((m) => m.id === detailItemId) ?? null
    : null;
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const selectableVendors = isCloudReady
    ? vendors.filter((v) => isValidUuid(v.id))
    : vendors;

  const activeCategoryKey = CATEGORY_TABS[selectedCategoryIndex]?.key || 'all';
  const scopedBaseItems = moodboardItems.filter((item) => {
    const matchCat = activeCategoryKey === 'all' || item.category === activeCategoryKey;
    const matchVendor = !filterVendorId || item.vendorId === filterVendorId;
    return matchCat && matchVendor;
  });
  const scopedFinalCount = scopedBaseItems.filter((i) => i.isFinal).length;
  const filteredItems = onlyFinal
    ? scopedBaseItems.filter((i) => i.isFinal)
    : scopedBaseItems;

  const activeFilterVendor = filterVendorId
    ? vendors.find((v) => v.id === filterVendorId)
    : undefined;

  const ensureOnlineAlert = () => {
    Alert.alert(
      'Koneksi Online Diperlukan',
      'Nyalakan data seluler atau Wi-Fi dan pastikan akun sudah masuk untuk menyimpan atau menyinkronkan moodboard online.'
    );
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory(activeCategoryKey === 'all' ? 'decor' : activeCategoryKey);
    setFormLocalImageUri(undefined);
    setFormExistingImageUrl(undefined);
    setFormClearExistingPhoto(false);
    setFormRefUrl('');
    setFormVendorId(
      filterVendorId && (!isCloudReady || isValidUuid(filterVendorId)) ? filterVendorId : undefined
    );
    setFormPalette(['#F8F7F4', '#9E5A47']);
    setCustomHexInput('');
    setFormNotes('');
    setFormIsFinal(false);
    setFormModalVisible(true);
  };

  const openEditModal = (item: MoodboardItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormLocalImageUri(undefined);
    setFormExistingImageUrl(item.imageUrl);
    setFormClearExistingPhoto(false);
    setFormRefUrl(item.referenceUrl || '');
    setFormVendorId(item.vendorId);
    setFormPalette(item.colorPalette || []);
    setCustomHexInput('');
    setFormNotes(item.notes || '');
    setFormIsFinal(item.isFinal);
    setDetailItemId(null);
    setFormModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Izin Galeri Diperlukan', 'Izinkan akses galeri foto untuk memilih inspirasi.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setFormLocalImageUri(result.assets[0].uri);
        setFormClearExistingPhoto(false);
      }
    } catch {
      Alert.alert('Gagal Membuka Galeri', 'Tidak dapat memilih foto dari galeri saat ini.');
    }
  };

  const toggleSwatch = (hex: string) => {
    setFormPalette((prev) => {
      if (prev.includes(hex)) {
        return prev.filter((c) => c !== hex);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), hex];
      }
      return [...prev, hex];
    });
  };

  const handleAddCustomHex = () => {
    const raw = customHexInput.trim().toUpperCase();
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    if (!/^#[0-9A-F]{6}$/.test(normalized)) {
      Alert.alert('Format Warna Salah', 'Masukkan kode hex 6 digit, misal: #9E5A47');
      return;
    }
    if (!formPalette.includes(normalized)) {
      setFormPalette((prev) => (prev.length >= 4 ? [...prev.slice(1), normalized] : [...prev, normalized]));
    }
    setCustomHexInput('');
  };

  const handleSaveForm = async () => {
    const trimmedTitle = formTitle.trim();
    const trimmedRef = formRefUrl.trim();
    if (!trimmedTitle) {
      Alert.alert('Judul Kosong', 'Isi judul inspirasi terlebih dahulu.');
      return;
    }
    if (!formLocalImageUri && !formExistingImageUrl && !trimmedRef) {
      Alert.alert(
        'Foto atau Link Diperlukan',
        'Lampirkan minimal Foto dari Galeri atau Link Referensi (Pinterest/Instagram).'
      );
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        const updatePatch: Partial<MoodboardItem> = {
          title: trimmedTitle,
          category: formCategory,
          referenceUrl: trimmedRef || undefined,
          vendorId: formVendorId,
          colorPalette: formPalette,
          notes: formNotes.trim() || undefined,
          isFinal: formIsFinal,
        };
        if (formClearExistingPhoto && !formLocalImageUri) {
          updatePatch.imageUrl = undefined;
          updatePatch.storagePath = undefined;
        }
        await updateMoodboardItemOnline(editingItem.id, updatePatch, formLocalImageUri);
      } else {
        await addMoodboardItemOnline(
          {
            title: trimmedTitle,
            category: formCategory,
            referenceUrl: trimmedRef || undefined,
            vendorId: formVendorId,
            colorPalette: formPalette,
            notes: formNotes.trim() || undefined,
            isFinal: formIsFinal,
          },
          formLocalImageUri
        );
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFormModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        'Gagal Menyimpan Online',
        err?.message ||
          'Nyalakan data seluler atau Wi-Fi untuk menyimpan & menyinkronkan moodboard online.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFinal = async (item: MoodboardItem) => {
    setIsSaving(true);
    try {
      await toggleMoodboardFinalOnline(item.id);
    } catch (err: any) {
      Alert.alert(
        'Gagal Memperbarui Status',
        err?.message || 'Nyalakan data seluler atau Wi-Fi untuk memperbarui status Final.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (item: MoodboardItem) => {
    Alert.alert('Hapus Referensi?', `Hapus "${item.title}" dari Moodboard pasangan?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Hapus',
        style: 'destructive',
        onPress: async () => {
          setIsSaving(true);
          try {
            await deleteMoodboardItemOnline(item.id);
            setDetailItemId(null);
          } catch (err: any) {
            Alert.alert(
              'Gagal Menghapus',
              err?.message || 'Nyalakan data seluler atau Wi-Fi untuk menghapus data online.'
            );
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  };

  const handleQuickShare = async (item: MoodboardItem) => {
    setIsSharing(true);
    setShareFeedback(null);
    try {
      const linkedVendor = item.vendorId ? vendors.find((v) => v.id === item.vendorId) : undefined;
      if (item.imageUrl) {
        setShareFeedback('Catatan & link disalin ke clipboard — tinggal Paste di chat vendor.');
      }
      const res = await shareSingleMoodboardItem(item, linkedVendor);
      if (!res.ok) {
        setShareFeedback(null);
        Alert.alert('Gagal Membagikan', res.message);
      } else {
        setShareFeedback(res.message);
      }
    } catch {
      setShareFeedback(null);
      Alert.alert('Gagal Membagikan', 'Tidak dapat membagikan referensi saat ini.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportBriefPdf = async () => {
    setIsSharing(true);
    try {
      const scopeTitle = activeFilterVendor
        ? activeFilterVendor.name
        : activeCategoryKey === 'all'
        ? 'Semua Referensi Pernikahan'
        : `Referensi ${getCategoryLabel(activeCategoryKey)}`;

      const res = await exportMoodboardBriefPdf({
        items: filteredItems,
        scopeTitle,
        profile,
        vendor: activeFilterVendor,
      });

      if (!res.ok) {
        Alert.alert('Info Ekspor PDF', res.message);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.75}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>INSPIRASI VISUAL</Text>
            <Text style={styles.heading}>Moodboard & Referensi</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (!isCloudReady) {
                ensureOnlineAlert();
                return;
              }
              openAddModal();
            }}
            activeOpacity={0.8}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={18} color={colors.textLight} />
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Online Sync Warning Banner if Offline / Unauthenticated */}
        {!isCloudReady ? (
          <FadeInView delay={20}>
            <Card style={styles.offlineBanner}>
              <View style={styles.offlineBannerRow}>
                <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
                <Text style={styles.offlineBannerText}>
                  Koneksi online diperlukan. Nyalakan data seluler atau Wi-Fi dan masuk ke akun pasangan untuk menyimpan serta menyinkronkan moodboard.
                </Text>
              </View>
            </Card>
          </FadeInView>
        ) : null}

        {/* Active Vendor Filter Banner */}
        {activeFilterVendor ? (
          <View style={styles.vendorFilterBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="storefront-outline" size={15} color={colors.accent} />
              <Text style={styles.vendorFilterText} numberOfLines={1}>
                Vendor: {activeFilterVendor.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setFilterVendorId(null)}>
              <Text style={styles.vendorFilterClear}>Tampilkan Semua</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Category Filter Chips */}
        <FilterChipBar
          options={CATEGORY_TABS.map((c) => c.label)}
          selectedIndex={selectedCategoryIndex}
          onChange={setSelectedCategoryIndex}
        />

        {/* Action Row: Final Toggle & Export Brief PDF */}
        <View style={styles.actionToolbar}>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setOnlyFinal((v) => !v);
            }}
            activeOpacity={0.75}
            style={[styles.finalFilterPill, onlyFinal && styles.finalFilterPillActive]}
          >
            <Ionicons
              name={onlyFinal ? 'star' : 'star-outline'}
              size={14}
              color={onlyFinal ? colors.textLight : colors.secondary}
            />
            <Text style={[styles.finalFilterText, onlyFinal && { color: colors.textLight }]}>
              Hanya Final ({scopedFinalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportBriefPdf}
            disabled={isSharing}
            activeOpacity={0.8}
            style={styles.exportPdfBtn}
          >
            <Ionicons name="document-attach-outline" size={15} color={colors.accent} />
            <Text style={styles.exportPdfText}>Ekspor Brief PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Visual Moodboard Grid or Empty State */}
        {filteredItems.length === 0 ? (
          <FadeInView delay={60}>
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="images-outline" size={28} color={colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Referensi Visual</Text>
              <Text style={styles.emptySubtitle}>
                Simpan foto dekorasi, kebaya/jas, makeup, atau tautan Pinterest/Instagram agar mudah disepakati dan dibagikan ke vendor.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isCloudReady) {
                    ensureOnlineAlert();
                    return;
                  }
                  openAddModal();
                }}
                activeOpacity={0.85}
                style={styles.emptyCtaBtn}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.textLight} />
                <Text style={styles.emptyCtaText}>Tambah Inspirasi Pertama</Text>
              </TouchableOpacity>
            </Card>
          </FadeInView>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item, idx) => {
              const linkedVendor = item.vendorId
                ? vendors.find((v) => v.id === item.vendorId)
                : undefined;

              return (
                <View key={item.id} style={styles.gridCell}>
                  <FadeInView delay={Math.min(idx * 40, 200)}>
                    <Card style={styles.moodCard}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setShareFeedback(null);
                          setDetailItemId(item.id);
                        }}
                      >
                        {item.imageUrl ? (
                          <View style={styles.thumbWrap}>
                            <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} />
                            {item.isFinal ? (
                              <View style={styles.finalCornerBadge}>
                                <Ionicons name="star" size={11} color="#FFF" />
                                <Text style={styles.finalCornerText}>Final</Text>
                              </View>
                            ) : null}
                          </View>
                        ) : (
                          <View style={styles.linkPlaceholder}>
                            <Ionicons name="link-outline" size={26} color={colors.accent} />
                            <Text style={styles.linkPlaceholderLabel}>Tautan Referensi</Text>
                            {item.isFinal ? (
                              <View style={styles.finalCornerBadge}>
                                <Ionicons name="star" size={11} color="#FFF" />
                                <Text style={styles.finalCornerText}>Final</Text>
                              </View>
                            ) : null}
                          </View>
                        )}

                        <View style={styles.cardBody}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.cardCategory} numberOfLines={1}>
                            {getCategoryLabel(item.category)}
                            {linkedVendor ? ` • ${linkedVendor.name}` : ''}
                          </Text>

                          {item.colorPalette && item.colorPalette.length > 0 ? (
                            <View style={styles.swatchDotsRow}>
                              {item.colorPalette.slice(0, 4).map((hex, hexIdx) => (
                                <View
                                  key={`${hex}-${hexIdx}`}
                                  style={[styles.swatchDot, { backgroundColor: hex }]}
                                />
                              ))}
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    </Card>
                  </FadeInView>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Moodboard Item Modal */}
      <Modal
        visible={formModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSaving) setFormModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              if (!isSaving) setFormModalVisible(false);
            }}
          />
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Referensi' : 'Tambah Inspirasi Baru'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isSaving) setFormModalVisible(false);
                }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Photo Upload Picker */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>Foto dari Galeri HP (Opsional jika ada Link)</Text>
                {(formLocalImageUri || (formExistingImageUrl && !formClearExistingPhoto)) ? (
                  <TouchableOpacity
                    onPress={() => {
                      setFormLocalImageUri(undefined);
                      setFormExistingImageUrl(undefined);
                      setFormClearExistingPhoto(true);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.danger }}>
                      Hapus Foto
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.8}
                style={styles.photoPickerBox}
              >
                {(formLocalImageUri || (formExistingImageUrl && !formClearExistingPhoto)) ? (
                  <Image
                    source={{ uri: formLocalImageUri || formExistingImageUrl }}
                    style={styles.photoPreview}
                  />
                ) : (
                  <View style={styles.photoPickerEmpty}>
                    <Ionicons name="image-outline" size={26} color={colors.accent} />
                    <Text style={styles.photoPickerText}>Ketuk untuk Pilih Foto dari Galeri</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Link Referensi (Pinterest / IG / Web)</Text>
              <TextInput
                placeholder="https://pinterest.com/pin/..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                value={formRefUrl}
                onChangeText={setFormRefUrl}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Judul Inspirasi *</Text>
              <TextInput
                placeholder="Misal: Pelaminan Minimalis Bunga Putih"
                placeholderTextColor={colors.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.chipsWrap}>
                {CATEGORY_TABS.filter((c) => c.key !== 'all').map((cat) => {
                  const active = formCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setFormCategory(cat.key as MoodboardCategory)}
                      style={[styles.selectChip, active && styles.selectChipActive]}
                    >
                      <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Kaitkan ke Vendor (Opsional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                <TouchableOpacity
                  onPress={() => setFormVendorId(undefined)}
                  style={[styles.selectChip, !formVendorId && styles.selectChipActive]}
                >
                  <Text style={[styles.selectChipText, !formVendorId && styles.selectChipTextActive]}>
                    Tanpa Vendor
                  </Text>
                </TouchableOpacity>
                {selectableVendors.map((v) => {
                  const active = formVendorId === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => setFormVendorId(v.id)}
                      style={[styles.selectChip, active && styles.selectChipActive]}
                    >
                      <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Palet Warna Tema (maks 4)</Text>
              <View style={styles.palettePickerRow}>
                {PRESET_SWATCHES.map((hex) => {
                  const selected = formPalette.includes(hex);
                  return (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => toggleSwatch(hex)}
                      style={[
                        styles.swatchOption,
                        { backgroundColor: hex },
                        selected && styles.swatchOptionSelected,
                      ]}
                    >
                      {selected ? (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={hex === '#FFFFFF' || hex === '#F8F7F4' ? '#111318' : '#FFF'}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.hexInputRow}>
                <TextInput
                  placeholder="Tambah hex custom (misal: #C8A27C)"
                  placeholderTextColor={colors.textMuted}
                  value={customHexInput}
                  onChangeText={setCustomHexInput}
                  autoCapitalize="characters"
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                />
                <TouchableOpacity onPress={handleAddCustomHex} style={styles.hexAddBtn}>
                  <Text style={styles.hexAddBtnText}>Pilih</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Catatan Konsep untuk Vendor</Text>
              <TextInput
                placeholder="Misal: Minta tinggi backdrop max 3m, warna bunga dominan ivory & sage"
                placeholderTextColor={colors.textMuted}
                multiline
                value={formNotes}
                onChangeText={setFormNotes}
                style={[styles.input, { height: 74, textAlignVertical: 'top' }]}
              />

              <TouchableOpacity
                onPress={() => setFormIsFinal((v) => !v)}
                activeOpacity={0.75}
                style={styles.finalToggleBox}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons
                    name={formIsFinal ? 'star' : 'star-outline'}
                    size={18}
                    color={formIsFinal ? colors.secondary : colors.textMuted}
                  />
                  <Text style={styles.finalToggleLabel}>Tandai sebagai Pilihan Final Berdua</Text>
                </View>
                <Badge
                  label={formIsFinal ? 'Final ★' : 'Draft'}
                  variant={formIsFinal ? 'warning' : 'neutral'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveForm}
                disabled={isSaving}
                activeOpacity={0.85}
                style={[styles.saveBtn, isSaving && { opacity: 0.65 }]}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.textLight} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Simpan Perubahan Online' : 'Simpan & Sinkronkan Online'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Item Detail Modal */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailItemId(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDetailItemId(null)}
          />
          {detailItem ? (
            <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.modalHeaderRow}>
                <Badge
                  label={`${detailItem.isFinal ? '★ Final • ' : ''}${getCategoryLabel(
                    detailItem.category
                  )}`}
                  variant={detailItem.isFinal ? 'warning' : 'neutral'}
                />
                <TouchableOpacity onPress={() => setDetailItemId(null)}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {detailItem.imageUrl ? (
                  <Image source={{ uri: detailItem.imageUrl }} style={styles.detailImage} />
                ) : null}

                <Text style={styles.detailTitle}>{detailItem.title}</Text>

                {detailItem.vendorId ? (
                  <Text style={styles.detailVendorText}>
                    Vendor: {vendors.find((v) => v.id === detailItem.vendorId)?.name || 'Vendor'}
                  </Text>
                ) : null}

                {detailItem.colorPalette && detailItem.colorPalette.length > 0 ? (
                  <View style={styles.detailSwatchesWrap}>
                    {detailItem.colorPalette.map((hex, hexIdx) => (
                      <View key={`${hex}-${hexIdx}`} style={styles.detailSwatchChip}>
                        <View style={[styles.swatchDot, { backgroundColor: hex }]} />
                        <Text style={styles.detailSwatchHex}>{hex}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {detailItem.notes ? (
                  <Text style={styles.detailNotes}>{detailItem.notes}</Text>
                ) : null}

                {detailItem.referenceUrl ? (
                  <TouchableOpacity
                    onPress={() => {
                      const raw = detailItem.referenceUrl!.trim();
                      const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
                      if (!/^https?:\/\//i.test(normalized)) {
                        Alert.alert('Link Tidak Valid', 'Gunakan link berawalan http:// atau https://');
                        return;
                      }
                      Linking.openURL(normalized).catch(() => {
                        Alert.alert('Gagal Membuka Link', 'Pastikan link referensi valid.');
                      });
                    }}
                    style={styles.detailLinkBox}
                  >
                    <Ionicons name="open-outline" size={16} color={colors.accent} />
                    <Text style={styles.detailLinkText} numberOfLines={1}>
                      {detailItem.referenceUrl}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {shareFeedback ? (
                  <View style={styles.shareFeedbackBanner}>
                    <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
                    <Text style={styles.shareFeedbackText}>{shareFeedback}</Text>
                  </View>
                ) : null}

                {/* Quick Actions */}
                <TouchableOpacity
                  onPress={() => handleQuickShare(detailItem)}
                  disabled={isSharing}
                  activeOpacity={0.85}
                  style={styles.quickShareBtn}
                >
                  <Ionicons name="share-social-outline" size={18} color="#FFF" />
                  <Text style={styles.quickShareText}>Bagikan Cepat ke Vendor</Text>
                </TouchableOpacity>

                <View style={styles.detailSecondaryActions}>
                  <TouchableOpacity
                    onPress={() => handleToggleFinal(detailItem)}
                    disabled={isSaving}
                    style={styles.secondaryActionBtn}
                  >
                    <Ionicons
                      name={detailItem.isFinal ? 'star' : 'star-outline'}
                      size={16}
                      color={colors.secondary}
                    />
                    <Text style={styles.secondaryActionText}>
                      {detailItem.isFinal ? 'Batal Final' : 'Tandai Final'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openEditModal(detailItem)}
                    style={styles.secondaryActionBtn}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.accent} />
                    <Text style={styles.secondaryActionText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteItem(detailItem)}
                    disabled={isSaving}
                    style={[styles.secondaryActionBtn, { borderColor: colors.danger }]}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[styles.secondaryActionText, { color: colors.danger }]}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.accent,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    gap: 4,
  },
  addBtnText: { fontSize: 12, fontWeight: '600', color: colors.textLight },
  offlineBanner: {
    backgroundColor: colors.warningBg,
    borderColor: `${colors.warning}40`,
    marginBottom: 10,
    padding: 12,
  },
  offlineBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offlineBannerText: { flex: 1, fontSize: 12, color: colors.warning, lineHeight: 17 },
  vendorFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  vendorFilterText: { fontSize: 12, fontWeight: '600', color: colors.accent, flex: 1 },
  vendorFilterClear: { fontSize: 11, fontWeight: '700', color: colors.accentDark },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  finalFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  finalFilterPillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  finalFilterText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  exportPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.accentLight,
  },
  exportPdfText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyCtaText: { fontSize: 13, fontWeight: '600', color: colors.textLight },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridCell: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  moodCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 0,
  },
  thumbWrap: { position: 'relative' },
  thumbImage: { width: '100%', height: 148, backgroundColor: colors.surfaceMuted },
  linkPlaceholder: {
    width: '100%',
    height: 148,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  linkPlaceholderLabel: { fontSize: 11, fontWeight: '600', color: colors.accent },
  finalCornerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.secondary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  finalCornerText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 18 },
  cardCategory: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  swatchDotsRow: { flexDirection: 'row', gap: 5, marginTop: 8 },
  swatchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalBackdrop: { flex: 1 },
  modalSheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: colors.borderDark,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  photoPickerBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  photoPickerEmpty: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoPickerText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  photoPreview: { width: '100%', height: 160, resizeMode: 'cover' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  selectChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  selectChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  selectChipTextActive: { color: colors.textLight },
  palettePickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  swatchOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchOptionSelected: { borderWidth: 2, borderColor: colors.accent },
  hexInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  hexAddBtn: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hexAddBtnText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  finalToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  finalToggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.textLight },
  detailImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 14,
  },
  detailTitle: { fontSize: 19, fontWeight: '700', color: colors.textPrimary },
  detailVendorText: { fontSize: 13, fontWeight: '600', color: colors.accent, marginTop: 4 },
  detailSwatchesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  detailSwatchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  detailSwatchHex: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
  detailNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  detailLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentLight,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  detailLinkText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.accent },
  quickShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    height: 46,
    borderRadius: 12,
    marginTop: 18,
  },
  shareFeedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successBg,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  shareFeedbackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    lineHeight: 17,
  },
  quickShareText: { fontSize: 14, fontWeight: '700', color: colors.textLight },
  detailSecondaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  secondaryActionText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
});
