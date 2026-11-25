import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, format } from 'date-fns';
import { CloudSyncService } from '../services/cloudSyncService';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type TaskCategory = 'canonical' | 'civil' | 'liturgy' | 'vendor';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskPic = 'groom' | 'bride' | 'both';

export interface ChecklistItem {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  offsetDays: number;
  priority: TaskPriority;
  pic: TaskPic;
  completed: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  allocated: number;
  committed: number;
}

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contractValue: number;
  status: 'researching' | 'shortlisted' | 'booked' | 'completed';
  contactPerson: string;
}

export interface TransactionItem {
  id: string;
  vendorName: string;
  amount: number;
  paidBy: 'groom' | 'bride' | 'family';
  status: 'paid' | 'pending';
  date: string;
  notes: string;
}

export interface GuestItem {
  id: string;
  name: string;
  side: 'groom' | 'bride' | 'both';
  groupTag: string;
  estimatedPax: number;
  actualPax: number;
  rsvpStatus: 'attending' | 'declined' | 'tentative' | 'pending';
}

export interface GiftItem {
  id: string;
  senderName: string;
  giftType: 'cash' | 'transfer' | 'physical_gift';
  amount: number;
  giftDescription?: string;
  receivedBy: 'groom' | 'bride' | 'both' | 'family_groom' | 'family_bride';
  thankYouSent: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  documentType: string;
  category: 'church_canonical' | 'civil_disdukcapil';
  owner: 'groom' | 'bride' | 'both';
  issueDate?: string;
  ageDays?: number;
  status: 'verified' | 'pending' | 'expired';
  notes?: string;
}

export interface WeddingProfile {
  groomName: string;
  brideName: string;
  weddingDate: string; // ISO string e.g. '2027-10-10T00:00:00.000Z'
  parishName: string;
}

const DEFAULT_PROFILE: WeddingProfile = {
  groomName: 'Octa',
  brideName: 'Jenesia',
  weddingDate: '2027-10-10T00:00:00.000Z',
  parishName: 'Paroki St. Perawan Maria',
};

const initialTasks: ChecklistItem[] = [
  { id: '1', title: 'Kursus Persiapan Perkawinan (KPP)', category: 'canonical', dueDate: '13 Apr 2027', offsetDays: -180, priority: 'critical', pic: 'both', completed: true },
  { id: '2', title: 'Pengurusan Surat Baptis Terbaru', category: 'canonical', dueDate: '13 Mei 2027', offsetDays: -150, priority: 'high', pic: 'both', completed: false },
  { id: '3', title: 'Penyelidikan Kanonik Pastor Paroki', category: 'canonical', dueDate: '12 Jul 2027', offsetDays: -90, priority: 'critical', pic: 'both', completed: false },
  { id: '4', title: 'Berkas Disdukcapil & Formulir N1-N4', category: 'civil', dueDate: '11 Agu 2027', offsetDays: -60, priority: 'high', pic: 'both', completed: false },
  { id: '5', title: 'Penentuan Saksi Nikah Resmi Gereja', category: 'canonical', dueDate: '11 Agu 2027', offsetDays: -60, priority: 'medium', pic: 'both', completed: false },
  { id: '6', title: 'Teks Liturgi & Buku Panduan Misa', category: 'liturgy', dueDate: '10 Sep 2027', offsetDays: -30, priority: 'medium', pic: 'groom', completed: false },
  { id: '7', title: 'Finalisasi Porsi Katering & Rundown', category: 'vendor', dueDate: '26 Sep 2027', offsetDays: -14, priority: 'high', pic: 'bride', completed: false },
  { id: '8', title: 'Gladi Bersih Liturgi Gereja', category: 'liturgy', dueDate: '05 Okt 2027', offsetDays: -5, priority: 'high', pic: 'both', completed: false },
  { id: '9', title: 'Sakramen Tobat Calon Mempelai', category: 'canonical', dueDate: '08 Okt 2027', offsetDays: -2, priority: 'critical', pic: 'both', completed: false },
];

const initialCategories: CategoryItem[] = [
  { id: '1', name: 'Venue & Gedung Resepsi', allocated: 50000000, committed: 50000000 },
  { id: '2', name: 'Katering Mawar (800 Porsi)', allocated: 70000000, committed: 80000000 },
  { id: '3', name: 'Dokumentasi Foto & Video', allocated: 20000000, committed: 28000000 },
  { id: '4', name: 'Busana Pengantin & MUA', allocated: 10000000, committed: 0 },
];

const initialVendors: VendorItem[] = [
  { id: 'v1', name: 'Gedung Paroki St. Perawan Maria', category: 'Venue', contractValue: 50000000, status: 'booked', contactPerson: 'Ibu Marta' },
  { id: 'v2', name: 'Katering Selera Nusantara', category: 'Katering', contractValue: 80000000, status: 'booked', contactPerson: 'Pak Hendra' },
  { id: 'v3', name: 'Atelier Wedding Photography', category: 'Dokumentasi', contractValue: 28000000, status: 'booked', contactPerson: 'David' },
  { id: 'v4', name: 'Sanggar Rias & Gaun Pengantin', category: 'Busana', contractValue: 15000000, status: 'shortlisted', contactPerson: 'Cindy' },
];

const initialTransactions: TransactionItem[] = [
  { id: 'tx1', vendorName: 'Gedung Paroki St. Perawan Maria', amount: 10000000, paidBy: 'groom', status: 'paid', date: '10 Feb 2027', notes: 'Booking Fee Gedung' },
  { id: 'tx2', vendorName: 'Katering Selera Nusantara', amount: 20000000, paidBy: 'bride', status: 'paid', date: '01 Mar 2027', notes: 'DP 25% Prasmanan' },
  { id: 'tx3', vendorName: 'Atelier Wedding Photography', amount: 5000000, paidBy: 'family', status: 'paid', date: '15 Mar 2027', notes: 'DP Liputan Misa' },
  { id: 'tx4', vendorName: 'Katering Selera Nusantara', amount: 30000000, paidBy: 'bride', status: 'pending', date: '01 Sep 2027', notes: 'Termin Cicilan 2' },
];

const initialGuests: GuestItem[] = [
  { id: 'g1', name: 'Budi Santoso & Pasangan', side: 'groom', groupTag: 'Keluarga Inti', estimatedPax: 2, actualPax: 2, rsvpStatus: 'attending' },
  { id: 'g2', name: 'Siti Rahma', side: 'groom', groupTag: 'Rekan Kerja', estimatedPax: 1, actualPax: 1, rsvpStatus: 'attending' },
  { id: 'g3', name: 'Kel. Besar Hartono', side: 'bride', groupTag: 'VIP Keluarga', estimatedPax: 4, actualPax: 4, rsvpStatus: 'attending' },
  { id: 'g4', name: 'Kevin & Fiona', side: 'bride', groupTag: 'Sahabat Kuliah', estimatedPax: 2, actualPax: 0, rsvpStatus: 'tentative' },
  { id: 'g5', name: 'Joko Widodo', side: 'groom', groupTag: 'Kolega', estimatedPax: 1, actualPax: 0, rsvpStatus: 'declined' },
  { id: 'g6', name: 'Alumni SMA Sanur', side: 'both', groupTag: 'Sahabat', estimatedPax: 5, actualPax: 0, rsvpStatus: 'pending' },
];

const initialGifts: GiftItem[] = [
  { id: 'gf1', senderName: 'Om Anton', giftType: 'cash', amount: 5000000, receivedBy: 'groom', thankYouSent: true },
  { id: 'gf2', senderName: 'Tante Rina', giftType: 'transfer', amount: 7500000, receivedBy: 'bride', thankYouSent: true },
  { id: 'gf3', senderName: 'Direksi Perusahaan Octa', giftType: 'transfer', amount: 10000000, receivedBy: 'both', thankYouSent: false },
  { id: 'gf4', senderName: 'Sahabat Kampus Jenesia', giftType: 'physical_gift', amount: 0, giftDescription: 'Espresso Coffee Machine DeLonghi', receivedBy: 'both', thankYouSent: true },
  { id: 'gf5', senderName: 'Tetangga Komplek Solo', giftType: 'cash', amount: 1000000, receivedBy: 'family_groom', thankYouSent: false },
];

const initialDocuments: DocumentItem[] = [
  {
    id: 'd1',
    title: 'Surat Baptis Octa',
    documentType: 'Surat Baptis Katolik',
    category: 'church_canonical',
    owner: 'groom',
    issueDate: '12 Jul 2027',
    ageDays: 90,
    status: 'verified',
    notes: 'Umur berkas 90 hari (memenuhi syarat maks. 180 hari).',
  },
  {
    id: 'd2',
    title: 'Surat Baptis Jenesia',
    documentType: 'Surat Baptis Katolik',
    category: 'church_canonical',
    owner: 'bride',
    issueDate: '10 Jan 2027',
    ageDays: 273,
    status: 'expired',
    notes: 'Berusia 273 hari (>180 hari). Mohon cetak ulang di paroki asal.',
  },
  {
    id: 'd3',
    title: 'Sertifikat KPP',
    documentType: 'Kursus Perkawinan',
    category: 'church_canonical',
    owner: 'both',
    status: 'verified',
    notes: 'Komisi Kerasulan Keluarga Dekenat (berlaku seumur hidup).',
  },
  {
    id: 'd4',
    title: 'Formulir N1 - N4 Kelurahan',
    documentType: 'Dokumen Sipil',
    category: 'civil_disdukcapil',
    owner: 'both',
    status: 'verified',
    notes: 'Surat pengantar RT/RW dan Kelurahan untuk Disdukcapil.',
  },
  {
    id: 'd5',
    title: 'KTP & Kartu Keluarga',
    documentType: 'Identitas Kependudukan',
    category: 'civil_disdukcapil',
    owner: 'both',
    status: 'verified',
    notes: 'Scan legalisir dan arsip digital kedua mempelai.',
  },
];

export interface WeddingState {
  profile: WeddingProfile;
  tasks: ChecklistItem[];
  categories: CategoryItem[];
  vendors: VendorItem[];
  transactions: TransactionItem[];
  guests: GuestItem[];
  gifts: GiftItem[];
  documents: DocumentItem[];

  // Profile actions
  updateProfile: (patch: Partial<WeddingProfile>) => void;

  // Task actions
  toggleTask: (id: string) => void;
  addTask: (task: Omit<ChecklistItem, 'id'>) => void;
  updateTask: (id: string, patch: Partial<ChecklistItem>) => void;
  deleteTask: (id: string) => void;

  // Budget & Vendor actions
  addCategory: (cat: Omit<CategoryItem, 'id'>) => void;
  updateCategory: (id: string, patch: Partial<CategoryItem>) => void;
  deleteCategory: (id: string) => void;
  addVendor: (vendor: Omit<VendorItem, 'id'>) => void;
  updateVendor: (id: string, patch: Partial<VendorItem>) => void;
  deleteVendor: (id: string) => void;
  addTransaction: (tx: Omit<TransactionItem, 'id'>) => void;
  updateTransaction: (id: string, patch: Partial<TransactionItem>) => void;
  deleteTransaction: (id: string) => void;

  // Guest & Gift actions
  cycleGuestRsvp: (id: string) => void;
  addGuest: (guest: Omit<GuestItem, 'id'>) => void;
  updateGuest: (id: string, patch: Partial<GuestItem>) => void;
  deleteGuest: (id: string) => void;
  toggleGiftThankYou: (id: string) => void;
  addGift: (gift: Omit<GiftItem, 'id'>) => void;
  updateGift: (id: string, patch: Partial<GiftItem>) => void;
  deleteGift: (id: string) => void;

  // Document actions
  cycleDocumentStatus: (id: string) => void;
  addDocument: (doc: Omit<DocumentItem, 'id'>) => void;
  updateDocument: (id: string, patch: Partial<DocumentItem>) => void;
  deleteDocument: (id: string) => void;

  // Cloud Hydration & Reset
  hydrateFromCloud: (snapshot: {
    workspace?: { wedding_date?: string } | null;
    tasks?: ChecklistItem[];
    categories?: CategoryItem[];
    vendors?: VendorItem[];
    transactions?: TransactionItem[];
    guests?: GuestItem[];
    gifts?: GiftItem[];
    documents?: DocumentItem[];
  }) => void;
  resetAllData: () => void;
}

export const useWeddingStore = create<WeddingState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      tasks: initialTasks,
      categories: initialCategories,
      vendors: initialVendors,
      transactions: initialTransactions,
      guests: initialGuests,
      gifts: initialGifts,
      documents: initialDocuments,

      updateProfile: (patch) =>
        set((state) => {
          const nextProfile = { ...state.profile, ...patch };
          // Dynamic Date Shifting: if weddingDate changes, shift uncompleted tasks' dueDate
          let nextTasks = state.tasks;
          if (patch.weddingDate && patch.weddingDate !== state.profile.weddingDate) {
            const parsedDate = new Date(patch.weddingDate);
            if (!isNaN(parsedDate.getTime())) {
              nextTasks = state.tasks.map((t) => {
                if (t.completed) return t;
                const shifted = subDays(parsedDate, Math.abs(t.offsetDays));
                return { ...t, dueDate: format(shifted, 'dd MMM yyyy') };
              });
            }
            CloudSyncService.updateWorkspaceWeddingDate(patch.weddingDate).catch(() => {});
          }
          return { profile: nextProfile, tasks: nextTasks };
        }),

      // Tasks
      toggleTask: (id) =>
        set((state) => {
          const nextTasks = state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          );
          const updated = nextTasks.find((t) => t.id === id);
          if (updated) CloudSyncService.pushTask(updated).catch(() => {});
          return { tasks: nextTasks };
        }),
      addTask: (task) =>
        set((state) => {
          const created: ChecklistItem = { ...task, id: generateUuid() };
          CloudSyncService.pushTask(created).catch(() => {});
          return { tasks: [created, ...state.tasks] };
        }),
      updateTask: (id, patch) =>
        set((state) => {
          const nextTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
          const updated = nextTasks.find((t) => t.id === id);
          if (updated) CloudSyncService.pushTask(updated).catch(() => {});
          return { tasks: nextTasks };
        }),
      deleteTask: (id) =>
        set((state) => {
          CloudSyncService.deleteTask(id).catch(() => {});
          return { tasks: state.tasks.filter((t) => t.id !== id) };
        }),

      // Categories
      addCategory: (cat) =>
        set((state) => {
          const created: CategoryItem = { ...cat, id: generateUuid() };
          CloudSyncService.pushCategory(created).catch(() => {});
          return { categories: [...state.categories, created] };
        }),
      updateCategory: (id, patch) =>
        set((state) => {
          const next = state.categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
          const updated = next.find((c) => c.id === id);
          if (updated) CloudSyncService.pushCategory(updated).catch(() => {});
          return { categories: next };
        }),
      deleteCategory: (id) =>
        set((state) => {
          CloudSyncService.deleteCategory(id).catch(() => {});
          return { categories: state.categories.filter((c) => c.id !== id) };
        }),

      // Vendors
      addVendor: (vendor) =>
        set((state) => {
          const created: VendorItem = { ...vendor, id: generateUuid() };
          CloudSyncService.pushVendor(created).catch(() => {});
          return { vendors: [...state.vendors, created] };
        }),
      updateVendor: (id, patch) =>
        set((state) => {
          const next = state.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v));
          const updated = next.find((v) => v.id === id);
          if (updated) CloudSyncService.pushVendor(updated).catch(() => {});
          return { vendors: next };
        }),
      deleteVendor: (id) =>
        set((state) => {
          CloudSyncService.deleteVendor(id).catch(() => {});
          return { vendors: state.vendors.filter((v) => v.id !== id) };
        }),

      // Transactions
      addTransaction: (tx) =>
        set((state) => {
          const created: TransactionItem = { ...tx, id: generateUuid() };
          CloudSyncService.pushTransaction(created).catch(() => {});
          return { transactions: [created, ...state.transactions] };
        }),
      updateTransaction: (id, patch) =>
        set((state) => {
          const next = state.transactions.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx));
          const updated = next.find((tx) => tx.id === id);
          if (updated) CloudSyncService.pushTransaction(updated).catch(() => {});
          return { transactions: next };
        }),
      deleteTransaction: (id) =>
        set((state) => {
          CloudSyncService.deleteTransaction(id).catch(() => {});
          return { transactions: state.transactions.filter((tx) => tx.id !== id) };
        }),

      // Guests
      cycleGuestRsvp: (id) =>
        set((state) => {
          const next = state.guests.map((g) => {
            if (g.id !== id) return g;
            const order: GuestItem['rsvpStatus'][] = ['attending', 'tentative', 'declined', 'pending'];
            const nextStatus = order[(order.indexOf(g.rsvpStatus) + 1) % order.length];
            return {
              ...g,
              rsvpStatus: nextStatus,
              actualPax: nextStatus === 'attending' ? g.estimatedPax : 0,
            };
          });
          const updated = next.find((g) => g.id === id);
          if (updated) CloudSyncService.pushGuest(updated).catch(() => {});
          return { guests: next };
        }),
      addGuest: (guest) =>
        set((state) => {
          const created: GuestItem = { ...guest, id: generateUuid() };
          CloudSyncService.pushGuest(created).catch(() => {});
          return { guests: [created, ...state.guests] };
        }),
      updateGuest: (id, patch) =>
        set((state) => {
          const next = state.guests.map((g) => (g.id === id ? { ...g, ...patch } : g));
          const updated = next.find((g) => g.id === id);
          if (updated) CloudSyncService.pushGuest(updated).catch(() => {});
          return { guests: next };
        }),
      deleteGuest: (id) =>
        set((state) => {
          CloudSyncService.deleteGuest(id).catch(() => {});
          return { guests: state.guests.filter((g) => g.id !== id) };
        }),

      // Gifts
      toggleGiftThankYou: (id) =>
        set((state) => {
          const next = state.gifts.map((gf) =>
            gf.id === id ? { ...gf, thankYouSent: !gf.thankYouSent } : gf
          );
          const updated = next.find((gf) => gf.id === id);
          if (updated) CloudSyncService.pushGift(updated).catch(() => {});
          return { gifts: next };
        }),
      addGift: (gift) =>
        set((state) => {
          const created: GiftItem = { ...gift, id: generateUuid() };
          CloudSyncService.pushGift(created).catch(() => {});
          return { gifts: [created, ...state.gifts] };
        }),
      updateGift: (id, patch) =>
        set((state) => {
          const next = state.gifts.map((gf) => (gf.id === id ? { ...gf, ...patch } : gf));
          const updated = next.find((gf) => gf.id === id);
          if (updated) CloudSyncService.pushGift(updated).catch(() => {});
          return { gifts: next };
        }),
      deleteGift: (id) =>
        set((state) => {
          CloudSyncService.deleteGift(id).catch(() => {});
          return { gifts: state.gifts.filter((gf) => gf.id !== id) };
        }),

      // Documents
      cycleDocumentStatus: (id) =>
        set((state) => {
          const next = state.documents.map((d) => {
            if (d.id !== id) return d;
            const order: DocumentItem['status'][] = ['verified', 'pending', 'expired'];
            const nextStatus = order[(order.indexOf(d.status) + 1) % order.length];
            return { ...d, status: nextStatus };
          });
          const updated = next.find((d) => d.id === id);
          if (updated) CloudSyncService.pushDocument(updated).catch(() => {});
          return { documents: next };
        }),
      addDocument: (doc) =>
        set((state) => {
          const created: DocumentItem = { ...doc, id: generateUuid() };
          CloudSyncService.pushDocument(created).catch(() => {});
          return { documents: [created, ...state.documents] };
        }),
      updateDocument: (id, patch) =>
        set((state) => {
          const next = state.documents.map((d) => (d.id === id ? { ...d, ...patch } : d));
          const updated = next.find((d) => d.id === id);
          if (updated) CloudSyncService.pushDocument(updated).catch(() => {});
          return { documents: next };
        }),
      deleteDocument: (id) =>
        set((state) => {
          CloudSyncService.deleteDocument(id).catch(() => {});
          return { documents: state.documents.filter((d) => d.id !== id) };
        }),

      // Cloud Hydration (updates store from Supabase without re-triggering push)
      hydrateFromCloud: (snapshot) =>
        set((state) => ({
          profile: snapshot.workspace?.wedding_date
            ? { ...state.profile, weddingDate: `${snapshot.workspace.wedding_date.slice(0, 10)}T00:00:00.000Z` }
            : state.profile,
          tasks: snapshot.tasks && snapshot.tasks.length > 0 ? snapshot.tasks : state.tasks,
          categories: snapshot.categories && snapshot.categories.length > 0 ? snapshot.categories : state.categories,
          vendors: snapshot.vendors && snapshot.vendors.length > 0 ? snapshot.vendors : state.vendors,
          transactions: snapshot.transactions && snapshot.transactions.length > 0 ? snapshot.transactions : state.transactions,
          guests: snapshot.guests && snapshot.guests.length > 0 ? snapshot.guests : state.guests,
          gifts: snapshot.gifts && snapshot.gifts.length > 0 ? snapshot.gifts : state.gifts,
          documents: snapshot.documents && snapshot.documents.length > 0 ? snapshot.documents : state.documents,
        })),

      // Reset
      resetAllData: () =>
        set({
          profile: DEFAULT_PROFILE,
          tasks: initialTasks,
          categories: initialCategories,
          vendors: initialVendors,
          transactions: initialTransactions,
          guests: initialGuests,
          gifts: initialGifts,
          documents: initialDocuments,
        }),
    }),
    {
      name: 'wedding-tracker-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
